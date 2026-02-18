"""
Generate IRS contribution limits JSON from authoritative sources.

Since the IRS does not provide a machine-readable API for contribution limits,
this script is a maintained source-of-truth scaffold. Update the LIMITS dict
whenever new IRS notices are published (typically Oct-Nov each year).

Sources:
  - IRS Notice 2023-75 (2024)
  - IRS Notice 2024-80 (2025)
  - IRS Rev. Proc. 2025-19, IRS Notice 2025-23 (2026)
"""

import json
import os

# ──────────────────────────────────────────────────────────
# Authoritative IRS contribution limits per tax year.
# Update this dict when new IRS Notices are published.
# ──────────────────────────────────────────────────────────
LIMITS = {
    "2024": {
        "electiveDeferralLimit": 23000,
        "catchUpContribution": 7500,
        "superCatchUp": 11250,
        "totalAnnualLimit": 69000,
        "hsaIndividual": 4150,
        "hsaFamily": 8300,
        "rothIRA": 7000,
        "rothIRACatchUp": 1000,
    },
    "2025": {
        "electiveDeferralLimit": 23500,
        "catchUpContribution": 7500,
        "superCatchUp": 11250,
        "totalAnnualLimit": 70000,
        "hsaIndividual": 4300,
        "hsaFamily": 8550,
        "rothIRA": 7000,
        "rothIRACatchUp": 1000,
    },
    "2026": {
        "electiveDeferralLimit": 24500,
        "catchUpContribution": 8000,
        "superCatchUp": 11250,
        "totalAnnualLimit": 72000,
        "hsaIndividual": 4400,
        "hsaFamily": 8750,
        "rothIRA": 7500,
        "rothIRACatchUp": 1100,
    },
}


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    output_dir = os.path.join(project_root, "src", "data")
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, "irs_limits.json")
    with open(output_path, "w") as f:
        json.dump(LIMITS, f, indent=2)
        f.write("\n")

    print(f"Generated IRS limits for years {list(LIMITS.keys())} -> {output_path}")


if __name__ == "__main__":
    main()
