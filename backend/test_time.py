import dateutil.parser

times = [
    "8 PMM", 
    "20:00 PM", 
    "20:00", 
    "8:30AMM",
    "8:30 AM",
    "08:00 PM"
]

print(f"{'Input':<15} | {'Parsed':<20} | {'Error'}")
print("-" * 50)

for t in times:
    try:
        clean = t.upper().replace("PMM", "PM").replace("AMM", "AM").strip()
        # dateutil failed on 20:00 PM in my previous run?
        # Let's see if fuzzy helps, or if just cleaning is enough.
        dt = dateutil.parser.parse(clean)
        print(f"{t:<15} | {dt.strftime('%H:%M:%S'):<20} | form: {clean}")
    except Exception as e:
        print(f"{t:<15} | {'FAILED':<20} | {e}")
