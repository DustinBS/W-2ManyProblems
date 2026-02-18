#!/usr/bin/env python3
"""
scrape_irs_limits.py — Fetch IRS contribution limits from official IRS web pages
and update src/data/irs_limits.json.

Sources:
  1. IRS COLA page (401k, 403b, IRA limits)
  2. IRS Pub 969 (HSA limits)

Dependencies: requests, beautifulsoup4
    pip install requests beautifulsoup4
"""

import json
import re
import sys
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("ERROR: Missing dependencies. Install them with:")
    print("  pip install requests beautifulsoup4")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

COLA_URL = (
    "https://www.irs.gov/retirement-plans/"
    "cola-increases-for-dollar-limitations-on-benefits-and-contributions"
)
PUB969_URL = "https://www.irs.gov/publications/p969"

# The COLA page links to the annual IRS newsroom announcement, which is the
# definitive source for the latest year's limits.  We discover the link
# dynamically so no URL needs to be hard-coded.
IRS_NEWSROOM_BASE = "https://www.irs.gov"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; W2ManyProblems-bot/1.0; +https://github.com)"
}
TIMEOUT = 30  # seconds

# Path to the JSON file (relative to this script's location in scripts/)
IRS_LIMITS_PATH = Path(__file__).resolve().parent.parent / "src" / "data" / "irs_limits.json"

# Validation ranges: (min, max) inclusive
VALID_RANGES = {
    "electiveDeferralLimit": (15_000, 50_000),
    "catchUpContribution":   (1_000,  20_000),
    "superCatchUp":          (1_000,  25_000),
    "totalAnnualLimit":      (40_000, 150_000),
    "hsaIndividual":         (1_000,  10_000),
    "hsaFamily":             (2_000,  20_000),
    "rothIRA":               (3_000,  15_000),
    "rothIRACatchUp":        (500,    5_000),
}


# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------

def fetch_page(url: str) -> str | None:
    """Fetch a web page and return its HTML, or None on failure."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.text
    except requests.RequestException as exc:
        print(f"  WARNING: Failed to fetch {url}: {exc}")
        return None


# ---------------------------------------------------------------------------
# Parsers
# ---------------------------------------------------------------------------

def _parse_dollar(text: str) -> int | None:
    """Parse a dollar string like '$23,000' or '$23,000**' into an int."""
    # Strip footnote markers (**, *, etc.) and whitespace
    cleaned = re.sub(r'[*†‡\s]', '', text)
    m = re.search(r'\$?([\d,]+)', cleaned)
    if m:
        return int(m.group(1).replace(',', ''))
    return None


def parse_cola_page(html: str) -> dict:
    """
    Parse the IRS COLA page HTML and return scraped limits.

    Returns:
        {year_str: {field: value, ...}, ...}
        e.g. {"2026": {"electiveDeferralLimit": 24500, ...}, "2025": {...}}
    """
    soup = BeautifulSoup(html, "html.parser")
    results: dict[str, dict[str, int]] = {}

    # --- Parse tables ---
    # The page has multiple tables. We look for tables that contain relevant
    # row labels and year-column headers.
    tables = soup.find_all("table")

    for table in tables:
        # Identify year columns from the header row
        header_row = table.find("tr")
        if not header_row:
            continue

        headers = [th.get_text(strip=True) for th in header_row.find_all(["th", "td"])]

        # Find which column indices correspond to years (4-digit numbers)
        year_cols: list[tuple[int, str]] = []
        for idx, h in enumerate(headers):
            year_match = re.search(r'(20\d{2})', h)
            if year_match:
                year_cols.append((idx, year_match.group(1)))

        if not year_cols:
            continue

        # Map of row-label patterns to JSON field names.
        # Order matters: more-specific patterns must come before broader
        # ones so that "IRA catch-up" does not get swallowed by the
        # generic "catch-up" pattern.
        row_mappings = [
            (r'ira\s+catch.?up\s+contribution', 'rothIRACatchUp'),
            (r'ira\s+contribution\s+limit', 'rothIRA'),
            (r'elective\s+deferral', 'electiveDeferralLimit'),
            (r'(?<!ira\s)catch.?up\s+contribution', 'catchUpContribution'),
            (r'defined\s+contribution\s+limit', 'totalAnnualLimit'),
        ]

        rows = table.find_all("tr")[1:]  # skip header
        for row in rows:
            cells = row.find_all(["th", "td"])
            if not cells:
                continue

            row_label = cells[0].get_text(strip=True).lower()

            for pattern, field in row_mappings:
                if re.search(pattern, row_label, re.IGNORECASE):
                    for col_idx, year_str in year_cols:
                        if col_idx < len(cells):
                            val = _parse_dollar(cells[col_idx].get_text())
                            if val is not None:
                                results.setdefault(year_str, {})[field] = val
                    break  # matched this row, move on

    # --- Parse super catch-up from footnotes / body text ---
    # The page has two footnotes about "higher catch-up" limits:
    #   *  SIMPLE plans  -> $5,250 (we don't need this)
    #   ** 401(k)/403(b) -> $11,250 (this is superCatchUp)
    # We specifically look for the ** footnote which mentions phrases
    # like "these plans" or "instead of" (referring to 401k/403b).
    full_text = soup.get_text()

    # Try the ** footnote first (contains "instead of" or "these plans")
    super_match = re.search(
        r'\*\*.*?higher\s+catch.?up\s+contribution\s+limit\s+is\s+'
        r'\$([\d,]+).*?(?:instead\s+of|these\s+plans)',
        full_text,
        re.IGNORECASE | re.DOTALL
    )
    if super_match:
        amount = int(super_match.group(1).replace(',', ''))
        # Find the year references near the ** footnote
        # Get a wider context window around the match
        start = max(0, super_match.start() - 10)
        end = min(len(full_text), super_match.end() + 50)
        context = full_text[start:end]
        years_found = re.findall(r'(20\d{2})', context)
        for y in set(years_found):
            results.setdefault(y, {})['superCatchUp'] = amount
    else:
        # Fallback: look for any mention of higher catch-up with amounts
        # above $10,000 (to distinguish from SIMPLE plans)
        for m in re.finditer(
            r'For\s+([\d,\s]+(?:and\s+)?\d{4}),\s*this\s+higher\s+'
            r'catch.?up\s+contribution\s+limit\s+is\s+\$([\d,]+)',
            full_text,
            re.IGNORECASE
        ):
            amount = int(m.group(2).replace(',', ''))
            if amount >= 10_000:  # Filter out SIMPLE plan values
                year_text = m.group(1)
                years_in_match = re.findall(r'(20\d{2})', year_text)
                for y in years_in_match:
                    results.setdefault(y, {})['superCatchUp'] = amount

    if results:
        years_found = sorted(results.keys())
        print(f"  COLA page: scraped years {', '.join(years_found)}")
        for y in years_found:
            fields = ', '.join(sorted(results[y].keys()))
            print(f"    {y}: {fields}")
    else:
        print("  COLA page: no data extracted (page layout may have changed)")

    return results


def parse_pub969_hsa(html: str) -> dict:
    """
    Parse IRS Pub 969 HTML for HSA contribution limits.

    Returns:
        {year_str: {"hsaIndividual": ..., "hsaFamily": ...}, ...}
    """
    soup = BeautifulSoup(html, "html.parser")
    full_text = soup.get_text()

    results: dict[str, dict[str, int]] = {}

    # Pattern: "For YYYY, if you have self-only HDHP coverage, you can
    # contribute up to $X,XXX. If you have family HDHP coverage, you can
    # contribute up to $X,XXX."
    pattern = (
        r'For\s+(20\d{2}),\s*if\s+you\s+have\s+self.only.*?'
        r'contribute\s+up\s+to\s+\$([\d,]+).*?'
        r'family.*?contribute\s+up\s+to\s+\$([\d,]+)'
    )
    for m in re.finditer(pattern, full_text, re.IGNORECASE | re.DOTALL):
        year = m.group(1)
        individual = int(m.group(2).replace(',', ''))
        family = int(m.group(3).replace(',', ''))
        results[year] = {
            "hsaIndividual": individual,
            "hsaFamily": family,
        }

    if results:
        years_found = sorted(results.keys())
        print(f"  Pub 969:   scraped HSA limits for years {', '.join(years_found)}")
        for y in years_found:
            print(f"    {y}: individual=${results[y]['hsaIndividual']:,}, "
                  f"family=${results[y]['hsaFamily']:,}")
    else:
        print("  Pub 969:   no HSA data extracted (page layout may have changed)")

    return results


def find_newsroom_link(cola_html: str) -> str | None:
    """
    Find the annual IRS newsroom announcement link on the COLA page.

    The COLA page contains a link like:
        "2026 cost-of-living adjustments ... (IR-2025-111)"
    pointing to the newsroom article.  Return the full URL or None.
    """
    soup = BeautifulSoup(cola_html, "html.parser")
    for a in soup.find_all("a", href=True):
        href = a["href"]
        text = a.get_text(strip=True).lower()
        if "cost-of-living" in text and "newsroom" in href:
            if href.startswith("/"):
                return IRS_NEWSROOM_BASE + href
            return href
    return None


def parse_newsroom(html: str) -> dict:
    """
    Parse the IRS newsroom annual COLA announcement.

    These articles contain definitive sentences like:
      - "The annual contribution limit ... is increased to $24,500"
      - "The limit on annual contributions to an IRA is increased to $7,500"
      - "The IRA catch-up contribution limit ... is increased to $1,100"
      - "catch-up contribution limit ... is increased to $8,000"
      - "higher catch-up contribution limit ... $11,250"

    Returns:
        {year_str: {field: value, ...}}
    """
    soup = BeautifulSoup(html, "html.parser")
    full_text = soup.get_text()
    results: dict[str, dict[str, int]] = {}

    # Determine the year from the title (e.g. "... for 2026 ...")
    title_tag = soup.find("h1")
    title_text = title_tag.get_text() if title_tag else ""
    year_match = re.search(r'for\s+(20\d{2})', title_text, re.IGNORECASE)
    if not year_match:
        year_match = re.search(r'(20\d{2})', title_text)
    if not year_match:
        print("  Newsroom: could not determine year from title")
        return results

    year = year_match.group(1)
    data: dict[str, int] = {}

    # 401k elective deferral: "participate in 401(k)... increased to $24,500"
    m = re.search(r'participate\s+in\s+401\(k\).*?(?:increased?\s+to|is)\s+\$([\d,]+)',
                  full_text, re.IGNORECASE | re.DOTALL)
    if m:
        data['electiveDeferralLimit'] = int(m.group(1).replace(',', ''))

    # IRA contribution limit: "contributions to an IRA is increased to $7,500"
    m = re.search(r'contributions?\s+to\s+an\s+IRA\s+is\s+increased?\s+to\s+\$([\d,]+)',
                  full_text, re.IGNORECASE)
    if m:
        data['rothIRA'] = int(m.group(1).replace(',', ''))

    # IRA catch-up: "IRA catch-up contribution limit ... increased to $1,100"
    m = re.search(r'IRA\s+catch.?up\s+contribution\s+limit.*?increased?\s+to\s+\$([\d,]+)',
                  full_text, re.IGNORECASE | re.DOTALL)
    if m:
        data['rothIRACatchUp'] = int(m.group(1).replace(',', ''))

    # 401k catch-up: "catch-up contribution limit that generally applies...
    #                  increased to $8,000"
    m = re.search(
        r'catch.?up\s+contribution\s+limit\s+that\s+generally\s+applies.*?'
        r'increased?\s+to\s+\$([\d,]+)',
        full_text, re.IGNORECASE | re.DOTALL
    )
    if m:
        data['catchUpContribution'] = int(m.group(1).replace(',', ''))

    # Super catch-up: "higher catch-up contribution limit ... $11,250"
    m = re.search(
        r'higher\s+catch.?up\s+contribution\s+limit.*?'
        r'(?:remains?|is)\s+\$([\d,]+)',
        full_text, re.IGNORECASE | re.DOTALL
    )
    if m:
        val = int(m.group(1).replace(',', ''))
        if val >= 10_000:  # Exclude SIMPLE plan values
            data['superCatchUp'] = val

    if data:
        results[year] = data
        fields = ', '.join(f"{k}=${v:,}" for k, v in sorted(data.items()))
        print(f"  Newsroom: scraped {year}: {fields}")
    else:
        print("  Newsroom: no data extracted")

    return results


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate_limits(scraped: dict) -> dict:
    """
    Validate scraped limits against sane ranges.
    Removes invalid values and prints warnings.
    Also warns (but doesn't block) if values decrease year-over-year.

    Args:
        scraped: {year_str: {field: value, ...}, ...}

    Returns:
        Cleaned dict with invalid entries removed.
    """
    cleaned: dict[str, dict[str, int]] = {}

    for year in sorted(scraped.keys()):
        year_data = scraped[year]
        valid_data: dict[str, int] = {}

        for field, value in year_data.items():
            if field not in VALID_RANGES:
                print(f"  WARNING: Unknown field '{field}' for {year}, skipping")
                continue

            lo, hi = VALID_RANGES[field]
            if not (lo <= value <= hi):
                print(f"  WARNING: {year}.{field} = {value} outside range "
                      f"[{lo:,}–{hi:,}], skipping")
                continue

            valid_data[field] = value

        if valid_data:
            cleaned[year] = valid_data

    # Year-over-year sanity check (warn only)
    years = sorted(cleaned.keys())
    for i in range(1, len(years)):
        prev_year, curr_year = years[i - 1], years[i]
        for field in cleaned[curr_year]:
            if field in cleaned.get(prev_year, {}):
                prev_val = cleaned[prev_year][field]
                curr_val = cleaned[curr_year][field]
                if curr_val < prev_val:
                    print(f"  NOTICE: {field} decreased from {prev_year} "
                          f"(${prev_val:,}) to {curr_year} (${curr_val:,})")

    return cleaned


# ---------------------------------------------------------------------------
# Merge logic
# ---------------------------------------------------------------------------

def merge_limits(existing: dict, scraped: dict) -> tuple[dict, bool]:
    """
    Deep-merge scraped limits into existing data.
    Never deletes existing years — only adds or updates fields.

    Returns:
        (merged_dict, has_changes)
    """
    merged = json.loads(json.dumps(existing))  # deep copy
    has_changes = False

    for year, fields in scraped.items():
        if year not in merged:
            merged[year] = {}
            has_changes = True

        for field, value in fields.items():
            if merged[year].get(field) != value:
                old = merged[year].get(field)
                merged[year][field] = value
                has_changes = True
                if old is not None:
                    print(f"  UPDATE {year}.{field}: {old:,} -> {value:,}")
                else:
                    print(f"  NEW    {year}.{field}: {value:,}")

    # Sort by year key for consistent output
    merged = dict(sorted(merged.items()))

    return merged, has_changes


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    """Orchestrate scraping, validation, merging, and writing."""
    print("=" * 60)
    print("IRS Limits Scraper — W-2ManyProblems")
    print("=" * 60)

    all_scraped: dict[str, dict[str, int]] = {}

    # --- Source 1: COLA page ---
    print(f"\n[1/3] Fetching COLA page...")
    cola_html = fetch_page(COLA_URL)
    if cola_html:
        try:
            cola_data = parse_cola_page(cola_html)
            for year, fields in cola_data.items():
                all_scraped.setdefault(year, {}).update(fields)
        except Exception as exc:
            print(f"  WARNING: Error parsing COLA page: {exc}")
    else:
        print("  Skipping COLA page (fetch failed)")

    # --- Source 2: IRS newsroom announcement (overrides COLA for latest year) ---
    print(f"\n[2/3] Fetching IRS newsroom announcement...")
    if cola_html:
        newsroom_url = find_newsroom_link(cola_html)
        if newsroom_url:
            print(f"  Found link: {newsroom_url}")
            newsroom_html = fetch_page(newsroom_url)
            if newsroom_html:
                try:
                    newsroom_data = parse_newsroom(newsroom_html)
                    # Newsroom is more authoritative — it overrides COLA values
                    for year, fields in newsroom_data.items():
                        all_scraped.setdefault(year, {}).update(fields)
                except Exception as exc:
                    print(f"  WARNING: Error parsing newsroom: {exc}")
            else:
                print("  Skipping newsroom (fetch failed)")
        else:
            print("  No newsroom link found on COLA page")
    else:
        print("  Skipping newsroom (COLA page was not fetched)")

    # --- Source 3: Pub 969 ---
    print(f"\n[3/3] Fetching Pub 969...")
    pub969_html = fetch_page(PUB969_URL)
    if pub969_html:
        try:
            hsa_data = parse_pub969_hsa(pub969_html)
            for year, fields in hsa_data.items():
                all_scraped.setdefault(year, {}).update(fields)
        except Exception as exc:
            print(f"  WARNING: Error parsing Pub 969: {exc}")
    else:
        print("  Skipping Pub 969 (fetch failed)")

    # --- Check if we got anything ---
    if not all_scraped:
        print("\nNo data scraped from any source. Existing JSON is unchanged.")
        sys.exit(0)

    # --- Validate ---
    print("\nValidating scraped values...")
    validated = validate_limits(all_scraped)

    if not validated:
        print("No valid data after validation. Existing JSON is unchanged.")
        sys.exit(0)

    # --- Read existing file ---
    print(f"\nReading existing file: {IRS_LIMITS_PATH}")
    existing: dict = {}
    if IRS_LIMITS_PATH.exists():
        try:
            existing = json.loads(IRS_LIMITS_PATH.read_text(encoding="utf-8"))
            print(f"  Found existing data for years: {', '.join(sorted(existing.keys()))}")
        except (json.JSONDecodeError, OSError) as exc:
            print(f"  WARNING: Could not read existing file: {exc}")
            print("  Will create a new file.")
    else:
        print("  File does not exist yet — will create it.")

    # --- Merge ---
    print("\nMerging scraped data...")
    merged, has_changes = merge_limits(existing, validated)

    # --- Write if changed ---
    if has_changes:
        IRS_LIMITS_PATH.parent.mkdir(parents=True, exist_ok=True)
        IRS_LIMITS_PATH.write_text(
            json.dumps(merged, indent=2) + "\n",
            encoding="utf-8"
        )
        print(f"\nWrote updated limits to {IRS_LIMITS_PATH}")
    else:
        print("\nNo changes detected — file is already up to date.")

    # --- Summary ---
    print("\n" + "=" * 60)
    print("Summary of final data:")
    print("=" * 60)
    for year in sorted(merged.keys()):
        fields = merged[year]
        print(f"\n  {year}:")
        for field in sorted(fields.keys()):
            print(f"    {field}: ${fields[field]:,}")

    print()


if __name__ == "__main__":
    main()
