import taxcalc
import json
import os
import numpy as np

def get_tax_parameters():
    # Initialize Policy
    pol = taxcalc.Policy()
    
    # We will fetch data for current year + next few years if available
    # Taxcalc typically has projections.
    start_year = 2023
    end_year = 2026 
    final_data = {}

    for year in range(start_year, end_year + 1):
        try:
            pol.set_year(year)
        except Exception as e:
            print(f"Skipping year {year}: {e}")
            continue

        # Helper to extract values
        def ex(val):
            if hasattr(val, 'tolist'): return val.tolist()
            if isinstance(val, np.ndarray): return val.tolist()
            if isinstance(val, (list, tuple)): return list(val)
            return val

        # Filing status indices in taxcalc:
        # 0: single, 1: joint, 2: separate, 3: head, 4: widow
        # We will map these to keys for our JS app
        filing_statuses = ['single', 'married_joint', 'married_separate', 'head_household', 'widow']
        
        # Mapping index to status key
        status_map = { 0: 'single', 1: 'married_joint', 2: 'married_separate', 3: 'head_household', 4: 'widow' }

        # --- Standard Deduction ---
        std_raw = ex(pol.STD)
        std_data = { status_map[i]: std_raw[i] for i in range(5) }

        # --- Personal Exemption (if applicable, mostly 0 now) ---
        # ii_em_raw = ex(pol.II_em)
        # personal_exemption = ii_em_raw if isinstance(ii_em_raw, (int, float)) else ii_em_raw[0]

        # --- SS Wage Base ---
        ss_cap = ex(pol.SS_Earnings_c)
        if isinstance(ss_cap, list): ss_cap = ss_cap[0]

        # --- Medicare Rates (usually static but good to have) ---
        # FICA_ss_trt, FICA_mc_trt
        ss_rate = ex(pol.FICA_ss_trt)
        mc_rate = ex(pol.FICA_mc_trt)

        # --- Tax Brackets & Rates ---
        # We need to construct the bracket structure:
        # Rate 1: 10% -> up to Bracket 1
        # Rate 2: 12% -> up to Bracket 2
        # ...
        
        # Collect rates
        rates = []
        i = 1
        while hasattr(pol, f"II_rt{i}"):
            rt = getattr(pol, f"II_rt{i}")
            # rates are usually same for all statuses, but can differ. 
            # We'll take index 0 assuming uniformity for now or store full array if needed.
            # Taxcalc 2018+ TCJA has uniform rates usually.
            if isinstance(rt, (list, tuple)) or hasattr(rt, 'tolist') or isinstance(rt, np.ndarray):
                r = ex(rt)[0]
            else:
                r = rt
            rates.append(r)
            i += 1

        # Collect thresholds
        # II_brkX is the upper limit of the X-th bracket.
        thresholds = { status: [] for status in filing_statuses }
        
        i = 1
        # There is one fewer threshold than rates (last rate is for > last threshold)
        while hasattr(pol, f"II_brk{i}"):
            brk = getattr(pol, f"II_brk{i}")
            brk_vals = ex(brk)
            for file_idx, status_key in status_map.items():
                thresholds[status_key].append(brk_vals[file_idx])
            i += 1
            
        # Combine rates and thresholds
        brackets_by_status = {}
        for status in filing_statuses:
            b_list = []
            curr_thresh = thresholds[status]
            
            for idx, rate in enumerate(rates):
                if idx < len(curr_thresh):
                    limit = curr_thresh[idx]
                else:
                    limit = float('inf') # JS JSON won't support infinity directly, handle later or use huge number
                    # We will use string "Infinity" or just null/omit if user prefers. 
                    # Let's use a very large number for JSON compatibility or modify in JS.
                    if limit == float('inf'):
                        limit = 999999999999 # Safe fallback
                
                b_list.append({
                    "rate": rate,
                    "max": limit
                })
            brackets_by_status[status] = b_list

        final_data[str(year)] = {
            "standard_deduction": std_data[ 'single' ], # Simplified for now, or use full map if needed
            "standard_deduction_map": std_data,
            "fica": {
                "ss_wage_base": ss_cap,
                "ss_rate": ss_rate,
                "medicare_rate": mc_rate
            },
            "brackets": brackets_by_status
        }
        
    return final_data

if __name__ == "__main__":
    try:
        data = get_tax_parameters()
    except Exception as e:
        print(f"Error during parameters extraction: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
    
    # Ensure src/data exists
    # Using relative path from where script is run, assuming project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    output_dir = os.path.join(project_root, "src", "data")
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    output_path = os.path.join(output_dir, "tax_data.json")
    
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"Successfully generated tax data for years {list(data.keys())} at {output_path}")
