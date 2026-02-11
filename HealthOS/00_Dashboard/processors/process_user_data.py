
import pandas as pd
from pathlib import Path
import os

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
USER_ME_DIR = BASE_DIR / "02_Family/User_Me"
ARCHIVES_DIR = USER_ME_DIR / "Archives"
METRICS_FILE = USER_ME_DIR / "Metrics/metrics.csv"

# Input Files
OMRON_FILE = ARCHIVES_DIR / "BodyComposition_202408-202601.csv"
WHOOP_FILE = ARCHIVES_DIR / "Whoop_Helios/physiological_cycles.csv"

def parse_omron():
    if not OMRON_FILE.exists():
        print(f"⚠️ Omron file not found: {OMRON_FILE}")
        return pd.DataFrame()
    
    try:
        # Omron CSV often has specific encoding or quoting. 
        # Based on view_file, headers are quoted.
        df = pd.read_csv(OMRON_FILE)
        
        # Parse Dates (Format: 2024/08/17 12:36)
        df['date'] = pd.to_datetime(df['Measurement Date'], format='%Y/%m/%d %H:%M')
        df['date'] = df['date'].dt.date
        
        # Rename Columns
        df = df.rename(columns={
            'Weight(kg)': 'weight',
            'Body Fat(%)': 'body_fat',
            'Visceral Fat': 'visceral_fat',
            'Skeletal Muscle(%)': 'muscle_percent',
            'Body Age(years old)': 'body_age'
        })
        
        # Select & Agg (Keep last reading of the day)
        cols = ['date', 'weight', 'body_fat', 'visceral_fat', 'muscle_percent', 'body_age']
        df = df[cols].groupby('date').last().reset_index()
        return df
        
    except Exception as e:
        print(f"❌ Error parsing Omron: {e}")
        return pd.DataFrame()

def parse_whoop():
    if not WHOOP_FILE.exists():
        print(f"⚠️ Whoop file not found: {WHOOP_FILE}")
        return pd.DataFrame()

    try:
        df = pd.read_csv(WHOOP_FILE)
        
        # Parse Dates (Format: 2026-01-09 00:55:02)
        df['date'] = pd.to_datetime(df['Cycle start time'])
        df['date'] = df['date'].dt.date
        
        # Extract Sleep Hours (Asleep duration is in minutes)
        if 'Asleep duration (min)' in df.columns:
            df['sleep_hours'] = round(df['Asleep duration (min)'] / 60, 1)
        else:
            df['sleep_hours'] = None
            
        # Rename Columns
        df = df.rename(columns={
            'Recovery score %': 'recovery_score',
            'Resting heart rate (bpm)': 'resting_hr',
            'Heart rate variability (ms)': 'hrv',
            'Day Strain': 'strain',
            'Sleep performance %': 'sleep_score'
        })
        
        # Select
        cols = ['date', 'recovery_score', 'resting_hr', 'hrv', 'strain', 'sleep_score', 'sleep_hours']
        # Handle missing cols if they don't exist
        available_cols = [c for c in cols if c in df.columns]
        df = df[available_cols].groupby('date').last().reset_index()
        return df

    except Exception as e:
        print(f"❌ Error parsing Whoop: {e}")
        return pd.DataFrame()

def merge_and_save():
    print("🔄 Processing User Data...")
    
    df_omron = parse_omron()
    print(f"   Omron: Found {len(df_omron)} records.")
    
    df_whoop = parse_whoop()
    print(f"   Whoop: Found {len(df_whoop)} records.")
    
    if df_omron.empty and df_whoop.empty:
        print("   No data to merge.")
        return

    # Merge Outer (Keep all dates)
    if not df_omron.empty and not df_whoop.empty:
        df_merged = pd.merge(df_whoop, df_omron, on='date', how='outer')
    elif not df_omron.empty:
        df_merged = df_omron
    else:
        df_merged = df_whoop
        
    # Sort
    df_merged = df_merged.sort_values('date')
    
    # Save
    METRICS_FILE.parent.mkdir(parents=True, exist_ok=True)
    df_merged.to_csv(METRICS_FILE, index=False)
    print(f"✅ Success! Saved {len(df_merged)} merged records to {METRICS_FILE}")

if __name__ == "__main__":
    merge_and_save()
