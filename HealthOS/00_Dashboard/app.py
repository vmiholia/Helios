
import streamlit as st
import pandas as pd
from pathlib import Path

# Config
BASE_DIR = Path(__file__).resolve().parent.parent
FAMILY_DIR = BASE_DIR / "02_Family"

st.set_page_config(page_title="HealthOS Dashboard", layout="wide")

st.title("❤️ HealthOS Family Dashboard")

# Sidebar for User Selection
st.sidebar.header("Select Person")
users = [d.name for d in FAMILY_DIR.iterdir() if d.is_dir()]
selected_user = st.sidebar.selectbox("Family Member", users)

if selected_user:
    st.header(f"Health Overview: {selected_user}")
    
    # Load Data
    metrics_file = FAMILY_DIR / selected_user / "Metrics" / "metrics.csv"
    
    if metrics_file.exists():
        df = pd.read_csv(metrics_file)
        df['date'] = pd.to_datetime(df['date'])
        
        # Key Metrics (Last Entry)
        latest = df.iloc[-1]
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            val = f"{latest['weight']} kg" if 'weight' in latest else "-"
            st.metric("Current Weight", val)
            
        with col2:
            val = f"{latest['resting_hr']} bpm" if 'resting_hr' in latest else "-"
            st.metric("Resting Heart Rate", val)
            
        with col3:
            val = f"{latest['sleep_hours']} h" if 'sleep_hours' in latest else "-"
            st.metric("Last Sleep", val)
            
        # Charts
        st.subheader("Trends")
        
        tab1, tab2, tab3, tab4, tab5 = st.tabs(["Overview", "Recovery (Whoop)", "Body Comp (Omron)", "Performance", "Nutrition (DB)"])
        
        with tab1:
            st.caption("Weight & Heart Rate")
            if 'weight' in df.columns:
                st.line_chart(df.set_index('date')['weight'])
            if 'resting_hr' in df.columns:
                st.line_chart(df.set_index('date')['resting_hr'])
                
        with tab2:
            st.caption("Recovery & HRV")
            if 'recovery_score' in df.columns and 'hrv' in df.columns:
                col_a, col_b = st.columns(2)
                with col_a:
                    st.line_chart(df.set_index('date')['recovery_score'])
                with col_b:
                    st.line_chart(df.set_index('date')['hrv'])
            else:
                st.info("No Whoop data found.")

        with tab3:
            st.caption("Body Composition")
            if 'body_fat' in df.columns and 'muscle_percent' in df.columns:
                st.line_chart(df.set_index('date')[['body_fat', 'muscle_percent']])
            else:
                st.info("No Body Composition data found.")
                
        with tab4:
             st.caption("Strain vs Sleep")
             if 'strain' in df.columns and 'sleep_score' in df.columns:
                 st.line_chart(df.set_index('date')[['strain', 'sleep_score']])
             else:
                 st.info("No Strain data found.")

        with tab5:
            st.caption("Nutrition Logs (Real-time DB)")
            import sqlite3
            import datetime
            import altair as alt
            
            DB_PATH = BASE_DIR / "backend" / "metrics.db"
            if DB_PATH.exists():
                conn = sqlite3.connect(DB_PATH)
                
                # Sub-tabs
                subtab_log, subtab_analytics = st.tabs(["Daily Log", "History & Analytics"])
                
                # --- SUBTAB 1: DAILY LOG (Existing View) ---
                with subtab_log:
                    # Fetch Recent Logs
                    logs_df = pd.read_sql_query("""
                        SELECT *
                        FROM nutrition_logs 
                        ORDER BY date DESC, time DESC 
                        LIMIT 20
                    """, conn)

                    for index, row in logs_df.iterrows():
                        summary = f"{row['date']} {row['time']} - **{row['food_item']}** | {row['calories']} kcal | P: {row['protein_g']}g C: {row['carbs_g']}g F: {row['fats_g']}g"
                        with st.expander(summary):
                            data = row.to_dict()
                            exclude = ['id', 'log_id', 'user_id', 'date', 'time', 'food_item', 'quantity_text', 'calories', 'protein_g', 'carbs_g', 'fats_g']
                            micros = {k: v for k, v in data.items() if k not in exclude and v is not None and v > 0}
                            
                            if micros:
                                st.json(micros)
                            else:
                                st.caption("No additional details recorded.")

                    # Today's Snapshot
                    st.divider()
                    st.subheader("Today's Progress")
                    today = pd.Timestamp.now().strftime('%Y-%m-%d')
                    
                    daily_sum = pd.read_sql_query(f"""
                        SELECT * FROM nutrition_logs WHERE date = '{today}'
                    """, conn)
                    
                    if not daily_sum.empty:
                        # Sum string/object columns might fail, so pick numeric
                        numeric_cols = daily_sum.select_dtypes(include=['number']).columns
                        totals = daily_sum[numeric_cols].sum()
                        
                        # Targets
                        targets_df = pd.read_sql_query("SELECT metric_name, target_value_min, target_value_max, unit FROM health_targets", conn)
                        
                        track_list = ['calories', 'protein_g', 'carbs_g', 'fats_g', 'fiber_g', 'magnesium_mg', 'iron_mg']
                        cols = st.columns(len(track_list))
                        
                        for idx, metric in enumerate(track_list):
                            val = totals.get(metric, 0)
                            t_row = targets_df[targets_df['metric_name'] == metric]
                            
                            label = metric.replace('_g', '').replace('_mg', '').replace('_', ' ').title()
                            delta_msg = None
                            
                            if not t_row.empty:
                                t_min = t_row.iloc[0]['target_value_min']
                                unit = t_row.iloc[0]['unit'] or ''
                                if t_min:
                                    diff = val - t_min
                                    delta_msg = f"{diff:.0f} to goal" if diff < 0 else "Goal Met"
                                label += f" ({unit})"
                            
                            with cols[idx]:
                                st.metric(label, f"{val:.0f}", delta=delta_msg)
                    else:
                        st.info("No logs for today yet.")

                # --- SUBTAB 2: ANALYTICS ---
                with subtab_analytics:
                    st.subheader("Nutrient Analysis")
                    
                    # 1. Date Controls
                    col_dt1, col_dt2 = st.columns([1, 2])
                    with col_dt1:
                        range_mode = st.selectbox("Range", ["Last 7 Days", "Last 30 Days", "This Month", "Custom"])
                    
                    start_date, end_date = None, None
                    today_dt = datetime.date.today()
                    
                    if range_mode == "Last 7 Days":
                        start_date = today_dt - datetime.timedelta(days=7)
                        end_date = today_dt
                    elif range_mode == "Last 30 Days":
                        start_date = today_dt - datetime.timedelta(days=30)
                        end_date = today_dt
                    elif range_mode == "This Month":
                        start_date = today_dt.replace(day=1)
                        end_date = today_dt
                    else:
                        with col_dt2:
                            dates = st.date_input("Select Range", [])
                            if len(dates) == 2:
                                start_date, end_date = dates
                    
                    if start_date and end_date:
                        # Fetch Data for Range
                        query = f"""
                            SELECT date, 
                                SUM(calories) as calories, 
                                SUM(protein_g) as protein_g, 
                                SUM(carbs_g) as carbs_g, 
                                SUM(fats_g) as fats_g,
                                SUM(magnesium_mg) as magnesium_mg,
                                SUM(iron_mg) as iron_mg,
                                SUM(calcium_mg) as calcium_mg,
                                SUM(zinc_mg) as zinc_mg,
                                SUM(sugar_g) as sugar_g
                            FROM nutrition_logs 
                            WHERE date BETWEEN '{start_date}' AND '{end_date}'
                            GROUP BY date
                            ORDER BY date
                        """
                        history_df = pd.read_sql_query(query, conn)
                        
                        if not history_df.empty:
                            history_df['date'] = pd.to_datetime(history_df['date'])
                            
                            # A. Macro Trends (Line Chart)
                            st.markdown("### Macro Trends")
                            macro_chart = history_df.melt('date', value_vars=['protein_g', 'carbs_g', 'fats_g'], var_name='Macro', value_name='Grams')
                            
                            c = alt.Chart(macro_chart).mark_line(point=True).encode(
                                x='date:T',
                                y='Grams:Q',
                                color='Macro:N',
                                tooltip=['date', 'Macro', 'Grams']
                            ).interactive()
                            st.altair_chart(c, use_container_width=True)

                            # B. Calorie Trend
                            st.markdown("### Calorie Intake")
                            c_cal = alt.Chart(history_df).mark_bar().encode(
                                x='date:T',
                                y='calories:Q',
                                tooltip=['date', 'calories']
                            )
                            st.altair_chart(c_cal, use_container_width=True)
                            
                            # C. Micro Compliance (Target vs Average)
                            st.markdown("### Micronutrient Average vs Target")
                            
                            targets_df = pd.read_sql_query("SELECT metric_name, target_value_min FROM health_targets", conn)
                            
                            micros_of_interest = ['magnesium_mg', 'iron_mg', 'calcium_mg', 'zinc_mg']
                            avg_intake = history_df[micros_of_interest].mean().reset_index()
                            avg_intake.columns = ['metric_name', 'avg_value']
                            
                            # Merge with targets
                            comparison = pd.merge(avg_intake, targets_df, on='metric_name', how='left')
                            comparison['status'] = comparison.apply(lambda x: 'Met' if x['avg_value'] >= (x['target_value_min'] or 0) else 'Under', axis=1)
                            
                            c_micro = alt.Chart(comparison).mark_bar().encode(
                                x='metric_name:N',
                                y='avg_value:Q',
                                color=alt.Color('status', scale=alt.Scale(domain=['Met', 'Under'], range=['green', 'red'])),
                                tooltip=['metric_name', 'avg_value', 'target_value_min']
                            )
                            
                            # Add Target Line Rule
                            rules = alt.Chart(comparison).mark_rule(color='black', strokeDash=[5,5]).encode(
                                x='metric_name:N',
                                y='target_value_min:Q'
                            )
                            
                            st.altair_chart(c_micro + rules, use_container_width=True)
                            
                            # Data Table
                            with st.expander("View Raw Data"):
                                st.dataframe(history_df)
                                
                        else:
                            st.info(f"No data found for {start_date} to {end_date}.")
                    else:
                        st.info("Please select a valid date range.")

                conn.close()
            else:
                st.error(f"Database not found at {DB_PATH}")
                
        # Recent logs
        st.subheader("Recent Logs")
        st.dataframe(df.sort_values('date', ascending=False).head(5))
        
    else:
        st.info("No data found. Please add a markdown log in 'Daily_Logs' and run the ingestor.")

st.sidebar.markdown("---")
st.sidebar.info("Run `python3 processors/ingestor.py` to refresh data.")
