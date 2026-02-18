import taxcalc
import json
import numpy as np
import sys

def get_tax_parameters():
    print("Starting...", file=sys.stderr)
    try:
        pol = taxcalc.Policy()
    except Exception as e:
        print(f"Failed to init Policy: {e}", file=sys.stderr)
        return {}
    
    start_year = 2024
    end_year = 2026 
    final_data = {}

    for year in range(start_year, end_year + 1):
        try:
            pol.set_year(year)
        except:
            continue

        def ex(val):
            res = val
            if hasattr(val, 'tolist'): res = val.tolist()
            elif isinstance(val, (list, tuple)): res = list(val)
            elif isinstance(val, np.ndarray): res = val.tolist()
            
            # Unwrap nested list [[...]] -> [...]
            if isinstance(res, list) and len(res) == 1 and isinstance(res[0], list):
                res = res[0]
            
            return res

        filing_statuses = ['single', 'married_joint', 'married_separate', 'head_household', 'widow']
        status_map = { 0: 'single', 1: 'married_joint', 2: 'married_separate', 3: 'head_household', 4: 'widow' }

        # STD
        std_raw = ex(pol.STD)
        
        # Ensure std_raw is a list of 5 values
        if not isinstance(std_raw, list):
            if isinstance(std_raw, (int, float)):
                std_raw = [std_raw] * 5
            else:
                print(f"Warning: STD for {year} has unknown format: {std_raw}", file=sys.stderr)
                std_raw = [0]*5
        elif len(std_raw) != 5:
             print(f"Warning: STD for {year} has length {len(std_raw)}: {std_raw}", file=sys.stderr)
             # Try to recover if it's [val] -> [val, val, ...]
             if len(std_raw) == 1:
                 val = std_raw[0]
                 if isinstance(val, (int, float)):
                     std_raw = [val] * 5
                 elif isinstance(val, list):
                     std_raw = val # Should be handled by ex() but just in case
        
        # Double check
        if not isinstance(std_raw, list) or len(std_raw) < 5:
             std_raw = [0] * 5

        std_data = { status_map[i]: std_raw[i] for i in range(5) }

        # SS
        ss_cap = ex(pol.SS_Earnings_c)
        if isinstance(ss_cap, (list, tuple)): ss_cap = ss_cap[0]

        ss_rate = ex(pol.FICA_ss_trt_employee)
        mc_rate = ex(pol.FICA_mc_trt_employee)

        # Rates
        rates = []
        i = 1
        while hasattr(pol, f"II_rt{i}"):
            rt = getattr(pol, f"II_rt{i}")
            if isinstance(rt, (list, tuple, np.ndarray)):
                r = ex(rt)
                if isinstance(r, list): r = r[0]
            else:
                r = rt
            rates.append(r)
            i += 1

        # Thresholds
        thresholds = { status: [] for status in filing_statuses }
        i = 1
        while hasattr(pol, f"II_brk{i}"):
            brk = getattr(pol, f"II_brk{i}")
            brk_vals = ex(brk)
            # Ensure brk_vals is list of 5
            if not isinstance(brk_vals, list) or len(brk_vals) != 5:
                 # Try unwrapping logic again? Or rely on ex?
                 # If ex returned [val], brk_vals should be [val] which is wrong if 5 needed.
                 # But brackets usually are arrays of 5.
                 pass
            
            for file_idx, status_key in status_map.items():
                thresholds[status_key].append(brk_vals[file_idx])
            i += 1
            
        brackets_by_status = {}
        for status in filing_statuses:
            b_list = []
            curr_thresh = thresholds[status]
            for idx, rate in enumerate(rates):
                if idx < len(curr_thresh):
                    limit = curr_thresh[idx]
                else:
                    limit = 999999999999 
                b_list.append({ "rate": rate, "max": limit })
            brackets_by_status[status] = b_list

        # Capital Gains
        cg_rates = []
        i = 1
        while hasattr(pol, f"CG_rt{i}"):
            rt = getattr(pol, f"CG_rt{i}")
            if isinstance(rt, (list, tuple, np.ndarray)): r = ex(rt)[0]
            else: r = rt
            cg_rates.append(r)
            i += 1
            
        cg_thresholds = { status: [] for status in filing_statuses }
        i = 1
        while hasattr(pol, f"CG_brk{i}"):
            brk = getattr(pol, f"CG_brk{i}")
            brk_vals = ex(brk)
            for file_idx, status_key in status_map.items():
                cg_thresholds[status_key].append(brk_vals[file_idx])
            i += 1

        cg_brackets_formatted = {}
        for status in filing_statuses:
            b_list = []
            curr_thresh = cg_thresholds[status]
            for idx, rate in enumerate(cg_rates):
                    if idx < len(curr_thresh): limit = curr_thresh[idx]
                    else: limit = 999999999999
                    b_list.append({ "rate": rate, "max": limit })
            cg_brackets_formatted[status] = b_list

        final_data[str(year)] = {
            "standard_deduction": std_data['single'],
            "standard_deduction_map": std_data,
            "fica": {
                "ss_wage_base": ss_cap,
                "ss_rate": ss_rate,
                "medicare_rate": mc_rate
            },
            "brackets": brackets_by_status,
            "capital_gains_brackets": cg_brackets_formatted
        }
        
    return final_data

print(json.dumps(get_tax_parameters(), indent=2))
