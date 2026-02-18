import taxcalc
import pandas as pd
import numpy as np
import json

def inspect_policy():
    # Initialize Policy
    pol = taxcalc.Policy()
    print("Taxcalc version:", taxcalc.__version__)
    
    # 2024, 2025, 2026
    years = [2024, 2025, 2026]
    
    final_data = {}

    def extract_val(val):
        if hasattr(val, 'tolist'):
            val = val.tolist()
        if isinstance(val, list) and len(val) > 0 and isinstance(val[0], list):
             val = val[0]
        # Use simple check for lists
        if isinstance(val, (list, tuple)):
            # Handle mixed types if necessary, but taxcalc usually uses floats
            return [float(x) for x in val]
        return float(val)

    for year in years:
        print(f"--- {year} ---")
        pol.set_year(year)
        
        # Standard Deduction
        # Returns [single, married_joint, married_separate, head_household, widow]
        std = extract_val(pol.STD)

        # Tax Brackets
        # Collect all brk and rt
        brackets = []
        rates = []
        
        # Marginal Rates (Ordinary Income)
        # II_brk1 to II_brk7 usually
        i = 1
        while hasattr(pol, f"II_brk{i}"):
            val = getattr(pol, f"II_brk{i}")
            brackets.append(extract_val(val))
            i += 1
            
        i = 1
        while hasattr(pol, f"II_rt{i}"):
            val = getattr(pol, f"II_rt{i}")
            rates.append(extract_val(val))
            i += 1
            
        # FICA
        # Social Security Wage Base
        ss_cap = extract_val(pol.SS_Earnings_c)
        if isinstance(ss_cap, list):
             # Usually scalar or same for all filing statuses?
             # Actually SS earnings cap is per person, so doesn't vary by filing status 
             # (though for joint filers each has their own cap).
             # Taxcalc might return array of 5 for filing statuses, all same.
             ss_cap = ss_cap[0] 
        
        # Capital Gains Rates
        cg_brackets = []
        cg_rates = []
        i = 1
        while hasattr(pol, f"CG_brk{i}"):
            val = getattr(pol, f"CG_brk{i}")
            cg_brackets.append(extract_val(val))
            i += 1
        i = 1
        while hasattr(pol, f"CG_rt{i}"):
            val = getattr(pol, f"CG_rt{i}")
            cg_rates.append(extract_val(val))
            i += 1
        
        # Long Term Capital Gains rates usually: 0%, 15%, 20%
        # CG_rt1, CG_rt2, CG_rt3?

        print(f"Standard Deduction ({year}):", std)
        # Standard Deduction is [Single, Joint, MFS, Head, Widow]
        # Order in taxcalc: 
        # 0: single
        # 1: joint
        # 2: separate
        # 3: head of household
        # 4: widow(er)
        
        print(f"Rates:", rates)
        print(f"Brackets:", brackets)
        print(f"SS Wage Base ({year}):", ss_cap)
        
        final_data[year] = {
            "standard_deduction": std,
            "rates": rates,
            "brackets": brackets,
            "ss_wage_base": ss_cap,
            "cg_rates": cg_rates,
            "cg_brackets": cg_brackets
        }

    # Save to a json file for inspection
    with open("tax_data.json", "w") as f:
        json.dump(final_data, f, indent=2)

if __name__ == "__main__":
    inspect_policy()
