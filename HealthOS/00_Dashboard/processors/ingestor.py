import os
import glob
import yaml
import pandas as pd
from pathlib import Path

# Base Path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
FAMILY_DIR = BASE_DIR / "02_Family"

def parse_markdown_log(file_path):
    """Extracts YAML frontmatter from a markdown file."""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Simple split to get frontmatter (assumes "---" at start)
    try:
        parts = content.split('---', 2)
        if len(parts) >= 3:
            frontmatter = yaml.safe_load(parts[1])
            return frontmatter
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
    return None

def process_user(user_name):
    """Scans user logs and rebuilds metrics.csv."""
    user_dir = FAMILY_DIR / user_name
    logs_dir = user_dir / "Daily_Logs"
    metrics_file = user_dir / "Metrics" / "metrics.csv"
    
    # Ensure Metrics dir exists
    (user_dir / "Metrics").mkdir(parents=True, exist_ok=True)
    
    records = []
    
    # Find all .md files
    log_files = glob.glob(str(logs_dir / "*.md"))
    
    for log_file in log_files:
        data = parse_markdown_log(log_file)
        if data:
            # Flatten tags list to string if present
            if 'tags' in data and isinstance(data['tags'], list):
                data['tags'] = ",".join(data['tags'])
            
            # Ensure date is present, if not use filename
            if 'date' not in data:
                data['date'] = Path(log_file).stem
                
            records.append(data)
            
    if records:
        df = pd.DataFrame(records)
        # Sort by date
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
        
        # Save to CSV
        df.to_csv(metrics_file, index=False)
        print(f"✅ Updated {user_name}: {len(records)} logs processed.")
    else:
        print(f"ℹ️ No logs found for {user_name}.")

def main():
    print(f"HealthOS Ingestor Running on {FAMILY_DIR}")
    
    # Find all user folders
    users = [d.name for d in FAMILY_DIR.iterdir() if d.is_dir()]
    
    for user in users:
        process_user(user)

if __name__ == "__main__":
    main()
