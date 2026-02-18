import taxcalc
pol = taxcalc.Policy()
try:
    s = pol.specification(year=2024)
except:
    try:
        s = pol.specification()
    except:
        s = []

found = []
if s:
    for k in s:
        if isinstance(k, str) and ('ss' in k.lower() or 'fica' in k.lower()):
            found.append(k)

print("Specs Found:", found)

props = [k for k in dir(pol) if 'ss' in k.lower() or 'fica' in k.lower()]
print("Dir Found:", props)
