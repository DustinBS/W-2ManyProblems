"""
Tests for scrape_irs_limits.py parsing and validation functions.

Run with:
    python -m pytest scripts/test_scrape_irs_limits.py -v
"""

import os
import sys

# Allow importing sibling module from scripts/
sys.path.insert(0, os.path.dirname(__file__))

from scrape_irs_limits import (
    _parse_dollar,
    merge_limits,
    parse_cola_page,
    parse_newsroom,
    parse_pub969_hsa,
    validate_limits,
)

# ---------------------------------------------------------------------------
# HTML fixtures
# ---------------------------------------------------------------------------

COLA_HTML = """\
<html><body>
<h1>COLA Increases for Dollar Limitations on Benefits and Contributions</h1>

<!-- 401(k) / 403(b) table -->
<table>
  <tr>
    <th>Type of Limitation</th>
    <th>2025</th>
    <th>2026</th>
  </tr>
  <tr>
    <td>Elective Deferrals (401(k), 403(b), etc.)</td>
    <td>$23,500</td>
    <td>$24,500</td>
  </tr>
  <tr>
    <td>Catch-Up Contribution Limit</td>
    <td>$7,500</td>
    <td>$8,000</td>
  </tr>
  <tr>
    <td>Defined Contribution Limit (415(c))</td>
    <td>$70,000</td>
    <td>$73,500</td>
  </tr>
</table>

<!-- IRA table -->
<table>
  <tr>
    <th>Type of Limitation</th>
    <th>2025</th>
    <th>2026</th>
  </tr>
  <tr>
    <td>IRA Contribution Limit</td>
    <td>$7,000</td>
    <td>$7,500</td>
  </tr>
  <tr>
    <td>IRA Catch-Up Contributions (Age 50+)</td>
    <td>$1,000</td>
    <td>$1,100</td>
  </tr>
</table>

<p>** For 2025 and 2026, this higher catch-up contribution limit is
$11,250 instead of the normal limit for these plans.</p>
</body></html>
"""

PUB969_HTML = """\
<html><body>
<h1>Publication 969 — Health Savings Accounts</h1>
<p>For 2026, if you have self-only HDHP coverage, you can contribute
up to $4,400. If you have family HDHP coverage, you can contribute
up to $8,750.</p>
<p>For 2025, if you have self-only HDHP coverage, you can contribute
up to $4,300. If you have family HDHP coverage, you can contribute
up to $8,550.</p>
</body></html>
"""

NEWSROOM_HTML = """\
<html><body>
<h1>IRS Announces Retirement Plan Contribution Limits for 2026</h1>

<p>The annual contribution limit for employees who participate in 401(k),
403(b), governmental 457 plans, and the federal government's Thrift Savings
Plan is increased to $24,500 from $23,500.</p>

<p>The limit on annual contributions to an IRA is increased to $7,500 from
$7,000.</p>

<p>The IRA catch-up contribution limit for individuals aged 50 and over was
amended under the SECURE 2.0 Act of 2022 to include an annual cost-of-living
adjustment but is increased to $1,100 for 2026.</p>

<p>The catch-up contribution limit that generally applies for employees aged
50 and over who participate in most 401(k) plans is increased to $8,000 from
$7,500.</p>

<p>Under SECURE 2.0 Act, the higher catch-up contribution limit for
individuals who have attained ages 60, 61, 62, or 63 remains $11,250.</p>
</body></html>
"""


# ===================================================================
# _parse_dollar
# ===================================================================


class TestParseDollar:
    def test_with_symbol(self):
        assert _parse_dollar("$23,000") == 23000

    def test_with_footnote(self):
        assert _parse_dollar("$8,000**") == 8000

    def test_no_symbol(self):
        assert _parse_dollar("1,000") == 1000

    def test_invalid_returns_none(self):
        assert _parse_dollar("N/A") is None

    def test_plain_number(self):
        assert _parse_dollar("$70000") == 70000

    def test_whitespace_and_footnotes(self):
        assert _parse_dollar(" $11,250 † ") == 11250

    def test_empty_string(self):
        assert _parse_dollar("") is None


# ===================================================================
# parse_cola_page
# ===================================================================


class TestParseColaPage:
    def test_extracts_401k_limits(self):
        result = parse_cola_page(COLA_HTML)
        assert result["2026"]["electiveDeferralLimit"] == 24500
        assert result["2025"]["electiveDeferralLimit"] == 23500
        assert result["2026"]["catchUpContribution"] == 8000
        assert result["2025"]["catchUpContribution"] == 7500
        assert result["2026"]["totalAnnualLimit"] == 73500
        assert result["2025"]["totalAnnualLimit"] == 70000

    def test_extracts_ira_limits(self):
        result = parse_cola_page(COLA_HTML)
        assert result["2026"]["rothIRA"] == 7500
        assert result["2025"]["rothIRA"] == 7000
        assert result["2026"]["rothIRACatchUp"] == 1100
        assert result["2025"]["rothIRACatchUp"] == 1000

    def test_extracts_super_catchup(self):
        result = parse_cola_page(COLA_HTML)
        assert result["2025"]["superCatchUp"] == 11250
        assert result["2026"]["superCatchUp"] == 11250

    def test_empty_html_returns_empty(self):
        result = parse_cola_page("<html><body></body></html>")
        assert result == {}

    def test_table_without_years_ignored(self):
        html = """
        <html><body>
        <table>
          <tr><th>Description</th><th>Value</th></tr>
          <tr><td>Something</td><td>123</td></tr>
        </table>
        </body></html>
        """
        result = parse_cola_page(html)
        assert result == {}


# ===================================================================
# parse_pub969_hsa
# ===================================================================


class TestParsePub969Hsa:
    def test_extracts_hsa_limits(self):
        result = parse_pub969_hsa(PUB969_HTML)
        assert result["2026"]["hsaIndividual"] == 4400
        assert result["2026"]["hsaFamily"] == 8750
        assert result["2025"]["hsaIndividual"] == 4300
        assert result["2025"]["hsaFamily"] == 8550

    def test_empty_html_returns_empty(self):
        result = parse_pub969_hsa("<html><body><p>No HSA info here.</p></body></html>")
        assert result == {}

    def test_single_year(self):
        html = """\
        <html><body>
        <p>For 2027, if you have self-only HDHP coverage, you can contribute
        up to $4,600. If you have family HDHP coverage, you can contribute
        up to $9,200.</p>
        </body></html>
        """
        result = parse_pub969_hsa(html)
        assert result["2027"]["hsaIndividual"] == 4600
        assert result["2027"]["hsaFamily"] == 9200


# ===================================================================
# parse_newsroom
# ===================================================================


class TestParseNewsroom:
    def test_extracts_all_fields(self):
        result = parse_newsroom(NEWSROOM_HTML)
        data = result["2026"]
        assert data["electiveDeferralLimit"] == 24500
        assert data["rothIRA"] == 7500
        assert data["rothIRACatchUp"] == 1100
        assert data["catchUpContribution"] == 8000
        assert data["superCatchUp"] == 11250

    def test_no_title_year_returns_empty(self):
        html = "<html><body><h1>Some Random Page</h1><p>No year here.</p></body></html>"
        result = parse_newsroom(html)
        assert result == {}

    def test_partial_data_still_returned(self):
        html = """\
        <html><body>
        <h1>IRS Announces Changes for 2027</h1>
        <p>The annual contribution limit for employees who participate in 401(k)
        plans is increased to $25,000.</p>
        </body></html>
        """
        result = parse_newsroom(html)
        assert result["2027"]["electiveDeferralLimit"] == 25000
        assert "rothIRA" not in result["2027"]


# ===================================================================
# validate_limits
# ===================================================================


class TestValidateLimits:
    def test_removes_out_of_range(self):
        scraped = {
            "2026": {
                "electiveDeferralLimit": 999,   # below min 15000
                "catchUpContribution": 8000,    # valid
            }
        }
        result = validate_limits(scraped)
        assert "electiveDeferralLimit" not in result["2026"]
        assert result["2026"]["catchUpContribution"] == 8000

    def test_passes_valid_data(self):
        scraped = {
            "2026": {
                "electiveDeferralLimit": 24500,
                "catchUpContribution": 8000,
                "superCatchUp": 11250,
                "totalAnnualLimit": 73500,
                "hsaIndividual": 4400,
                "hsaFamily": 8750,
                "rothIRA": 7500,
                "rothIRACatchUp": 1100,
            }
        }
        result = validate_limits(scraped)
        assert result == scraped

    def test_removes_above_range(self):
        scraped = {
            "2026": {
                "rothIRA": 999999,  # above max 15000
            }
        }
        result = validate_limits(scraped)
        assert "2026" not in result  # year entirely removed since no valid fields

    def test_removes_unknown_field(self):
        scraped = {
            "2026": {
                "electiveDeferralLimit": 24500,
                "unknownField": 42,
            }
        }
        result = validate_limits(scraped)
        assert "unknownField" not in result["2026"]
        assert result["2026"]["electiveDeferralLimit"] == 24500

    def test_empty_input(self):
        assert validate_limits({}) == {}

    def test_boundary_values_inclusive(self):
        scraped = {
            "2026": {
                "electiveDeferralLimit": 15000,   # exactly at min
                "catchUpContribution": 20000,     # exactly at max
            }
        }
        result = validate_limits(scraped)
        assert result["2026"]["electiveDeferralLimit"] == 15000
        assert result["2026"]["catchUpContribution"] == 20000


# ===================================================================
# merge_limits
# ===================================================================


class TestMergeLimits:
    def test_adds_new_year(self):
        existing = {"2025": {"rothIRA": 7000}}
        scraped = {"2026": {"rothIRA": 7500}}
        merged, changed = merge_limits(existing, scraped)
        assert "2026" in merged
        assert "2025" in merged
        assert changed is True

    def test_updates_existing(self):
        existing = {"2026": {"rothIRA": 7000}}
        scraped = {"2026": {"rothIRA": 7500}}
        merged, changed = merge_limits(existing, scraped)
        assert merged["2026"]["rothIRA"] == 7500
        assert changed is True

    def test_preserves_unscraped(self):
        existing = {"2024": {"rothIRA": 7000, "hsaFamily": 8300}}
        scraped = {"2024": {"rothIRA": 7000}}
        merged, changed = merge_limits(existing, scraped)
        assert merged["2024"]["hsaFamily"] == 8300
        assert merged["2024"]["rothIRA"] == 7000

    def test_no_changes_returns_false(self):
        existing = {"2026": {"rothIRA": 7500}}
        scraped = {"2026": {"rothIRA": 7500}}
        merged, changed = merge_limits(existing, scraped)
        assert changed is False

    def test_never_deletes_existing_years(self):
        existing = {"2024": {"rothIRA": 7000}, "2025": {"rothIRA": 7500}}
        scraped = {"2025": {"rothIRA": 7500}}
        merged, changed = merge_limits(existing, scraped)
        assert "2024" in merged
        assert "2025" in merged

    def test_merge_empty_scraped(self):
        existing = {"2025": {"rothIRA": 7000}}
        scraped = {}
        merged, changed = merge_limits(existing, scraped)
        assert merged == existing
        assert changed is False

    def test_merge_into_empty_existing(self):
        existing = {}
        scraped = {"2026": {"electiveDeferralLimit": 24500}}
        merged, changed = merge_limits(existing, scraped)
        assert merged["2026"]["electiveDeferralLimit"] == 24500
        assert changed is True

    def test_sorted_by_year(self):
        existing = {"2026": {"rothIRA": 7500}}
        scraped = {"2024": {"rothIRA": 7000}}
        merged, _ = merge_limits(existing, scraped)
        keys = list(merged.keys())
        assert keys == sorted(keys)
