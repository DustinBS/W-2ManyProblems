import taxcalc
import json
import numpy as np

def get_tax_parameters():
    # Attempt to initialize Policy
    # This might fail if the installed taxcalc doesn't support the years we want out of the box without puf, 
    # but the user script does not seem to load puf.
    try:
        pol = taxcalc.Policy()
    except Exception as e:
        # Fallback for some versions/configurations
        pol = taxcalc.Policy()

    # The user script logic needs to be inside the function or called.
    # The provided snippet is slightly broken indentation-wise in my thought process, 
    # but looking at the user prompt, it seems correct.
    
    # We need to replicate the user's logic exactly.
    
    start_year = 2024
    end_year = 2026 
    final_data = {}

    # Policy start year verification
    # pol.start_year might be different. 
    
    for year in range(start_year, end_year + 1):
        # We need to calculate policy for specific years
        # Accessing private members like _II_rt1 might be needed if public aliases fail, 
        # but the user script uses getattr(pol, f"II_rt{i}") which are typical parameter names.
        
        # Note: taxcalc parameters are complex objects. 
        # The user's script tries to handle this with 'ex' function.

        # To ensure we get the values for the specific year, we must set the year.
        # But 'set_year' only works if the Policy object has advanced to that year?
        # Actually in standard taxcalc usage:
        # pol = Policy()
        # pol.set_year(year) 
        pass

    # Let's paste the user's exact code.
    pass

if __name__ == "__main__":
    pol = taxcalc.Policy()
    
    start_year = 2024
    end_year = 2026 
    final_data = {}

    for year in range(start_year, end_year + 1):
        try:
            pol.set_year(year)
        except:
            # If we can't set the year (e.g. out of range), we might skip or reuse last known
            # But the user's script just says continue
            continue

        def ex(val):
            if hasattr(val, 'tolist'): return val.tolist()
            if isinstance(val, (list, tuple)): return list(val)
            if isinstance(val, np.ndarray): return val.tolist()
            return val

        filing_statuses = ['single', 'married_joint', 'married_separate', 'head_household', 'widow']
        status_map = { 0: 'single', 1: 'married_joint', 2: 'married_separate', 3: 'head_household', 4: 'widow' }

        # STD
        # Access parameter values. 
        # In recent taxcalc versions, doing pol.STD gives the value for the *current* year set by set_year?
        # Or do we need to peek?
        # The user's script assumes pol.STD works.
        std_raw = ex(pol.STD)
        
        # Policy arrays are often [year_index, value] or just value depending on how accessed.
        # When accessing via getattr on the instance, it usually returns the current year's value array (5 filing statuses).
        
        std_data = { status_map[i]: std_raw[i] for i in range(5) }

        # SS
        ss_cap = ex(pol.SS_Earnings_c)
        if isinstance(ss_cap, (list, tuple)): ss_cap = ss_cap[0]

        ss_rate = ex(pol.FICA_ss_trt)
        mc_rate = ex(pol.FICA_mc_trt)

        # Rates
        # II_rt1, II_rt2, etc.
        rates = []
        i = 1
        while hasattr(pol, f"II_rt{i}"):
            rt = getattr(pol, f"II_rt{i}")
            if isinstance(rt, (list, tuple, np.ndarray)):
                r = ex(rt)[0]
            else:
                r = rt
            rates.append(r)
            i += 1

        # Thresholds
        # II_brk1, II_brk2...
        thresholds = { status: [] for status in filing_statuses }
        i = 1
        while hasattr(pol, f"II_brk{i}"):
            brk = getattr(pol, f"II_brk{i}")
            brk_vals = ex(brk)
            for file_idx, status_key in status_map.items():
                thresholds[status_key].append(brk_vals[file_idx])
            i += 1
            
        brackets_by_status = {}
        for status in filing_statuses:
            b_list = []
            curr_thresh = thresholds[status]
            # rate[0] applies up to thresh[0], rate[1] up to thresh[1]...
            # But rates usually has 1 more item than thresholds if we consider the top bracket.
            # actually II_rt1 is the first rate applying to 0..brk1
            # II_rt2 applies to brk1..brk2
            
            # The user script logic:
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
                "social_security_wage_base": ss_cap, # Fixed key name to match intended use or output style if generic
                "ss_wage_base": ss_cap,
                "ss_rate": ss_rate,
                "medicare_rate": mc_rate
            },
            "brackets": brackets_by_status,
            "capital_gains_brackets": cg_brackets_formatted
        }
        
    print(json.dumps(final_data, indent=2))
