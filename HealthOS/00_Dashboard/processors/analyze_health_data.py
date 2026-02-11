
import xml.etree.ElementTree as ET
from datetime import datetime
import collections
import statistics
import os
import pandas as pd
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
XML_FILE = BASE_DIR / "02_Family/Ronita/Archives/Ronita_Health08012026/apple_health_export/export.xml"

# Metrics of interest (using 'contains' logic for types)
METRICS = {
    'HKQuantityTypeIdentifierBodyMass': 'Weight',
    'HKQuantityTypeIdentifierStepCount': 'Steps',
    'HKQuantityTypeIdentifierActiveEnergyBurned': 'ActiveCalories',
    'HKQuantityTypeIdentifierRestingHeartRate': 'RestingHR' # Note: In export it is 'RestingHeartRate' usually
}

# The previous script used exact matches in logic but dictionary keys are full identifiers.
# Let's verify identifiers from previous `view_file`.
# view_file showed: HKQuantityTypeIdentifierBodyMass, HKQuantityTypeIdentifierStepCount
# HKQuantityTypeIdentifierRestingHeartRate wasn't explicitly shown in the small chunk but is standard.
# However, the previous analysis script outputted data for Steps/Cal, so keys are likely correct.
# Wait, previous script had `HKQuantityTypeIdentifierRestingHeartRate` in dict.

def parse_date(date_str):
    # Format example: "2025-02-20 15:21:42 +0530"
    try:
        return datetime.strptime(date_str.split(' ')[0], '%Y-%m-%d')
    except:
        return None

def analyze_data():
    print(f"Parsing {XML_FILE}...")
    
    if not XML_FILE.exists():
        print(f"Error: {XML_FILE} does not exist.")
        return

    # Using iterparse for memory efficiency given the 288MB file size
    context = ET.iterparse(XML_FILE, events=('end',))
    
    day_data = collections.defaultdict(dict)
    
    for event, elem in context:
        if elem.tag == 'Record':
            record_type = elem.get('type')
            
            if record_type in METRICS:
                try:
                    val = float(elem.get('value'))
                    date_str = elem.get('startDate')
                    dt = parse_date(date_str)
                    
                    if dt and dt.year >= 2024:  # Focus on recent history (2024-2026)
                        day_key = dt.strftime('%Y-%m-%d')
                        metric_name = METRICS[record_type] # e.g. Weight, Steps
                        
                        # Aggregation Logic
                        if metric_name == 'Weight':
                            # Renew weight if multiple readings (take last)
                            day_data[day_key]['weight'] = val
                        elif metric_name == 'RestingHR':
                            day_data[day_key]['resting_hr'] = val
                        elif metric_name == 'Steps':
                             day_data[day_key]['steps'] = day_data[day_key].get('steps', 0) + val
                        elif metric_name == 'ActiveCalories':
                             day_data[day_key]['active_cal'] = day_data[day_key].get('active_cal', 0) + val

                except (ValueError, TypeError):
                    pass
            
            # Clear element to save memory
            elem.clear()
            
    # Convert to DataFrame
    rows = []
    for day, metrics in day_data.items():
        row = {'date': day}
        row.update(metrics)
        rows.append(row)
        
    if rows:
        df = pd.DataFrame(rows)
        df = df.sort_values('date')
        
        output_path = BASE_DIR / "02_Family/Ronita/Metrics/metrics.csv"
        os.makedirs(output_path.parent, exist_ok=True)
        df.to_csv(output_path, index=False)
        print(f"Successfully exported {len(df)} days of history to {output_path}")
    else:
        print("No matches found.")

if __name__ == "__main__":
    analyze_data()
