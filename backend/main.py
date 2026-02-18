from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, database

app = FastAPI(title="Helios API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"status": "Helios Backend is running"}

import os
import json
import dateutil.parser
from datetime import datetime
from dotenv import load_dotenv
from . import services

# Load env vars
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# ══════════════════════════════════════════════════
# STEP 1: Parse raw text into structured items
# ══════════════════════════════════════════════════
class ParseRequest(schemas.BaseModel):
    raw_text: str

@app.post("/parse")
def parse_food_text(req: ParseRequest):
    return services.llm.parse_food_text(req.raw_text)

@app.post("/preview_log")
def preview_log(entry: schemas.EntryBase, db: Session = Depends(get_db)):
    """
    Analyze text and return structured data with nutrients,
    BUT DO NOT save to the database.
    """
    processed_data = services.process_entry_text(entry.raw_text, db)
    return processed_data

@app.post("/log", response_model=schemas.Entry)
def create_log(entry: schemas.EntryCreate, db: Session = Depends(get_db)):
    # 1. Base date from user or now
    if entry.date:
        base_date = datetime.strptime(entry.date, "%Y-%m-%d")
    else:
        base_date = datetime.now()
    
    # Default to current time if no specific time found
    final_ingested_at = datetime.now()
    # If historical date, default to 12:00 PM
    if entry.date and entry.date != datetime.now().strftime("%Y-%m-%d"):
         final_ingested_at = base_date.replace(hour=12, minute=0, second=0)

    try:
        # Use new services to process text
        processed_data = services.process_entry_text(entry.raw_text, db)
        
        # Merge Time Logic
        ai_time = processed_data.get("time")
        if ai_time:
             try:
                 # LLM now returns clean "HH:MM"
                 parsed_time = datetime.strptime(ai_time, "%H:%M")
                 
                 # Merge with base_date
                 final_ingested_at = base_date.replace(
                     hour=parsed_time.hour, 
                     minute=parsed_time.minute,
                     second=0,
                     microsecond=0
                 )
             except Exception as e:
                 print(f"Time parse error for '{ai_time}': {e}")
                 # Fallback to default logic (already set above)

        # Create DB Entry
        db_entry = models.Entry(
            raw_text=entry.raw_text,
            created_at=datetime.now(),
            ingested_at=final_ingested_at,
            macros={
                "calories": processed_data["total_macros"]["calories"],
                "protein": processed_data["total_macros"]["protein"],
                "carbs": processed_data["total_macros"]["carbs"],
                "fats": processed_data["total_macros"]["fats"],
                "water_ml": processed_data["total_macros"]["water_ml"],
                "food_name": processed_data.get("food_name", "Unknown"),
                "items": processed_data.get("items", []),
                "micros": processed_data.get("micros", {}) 
            }
        )
        
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry

    except Exception as e:
        print(f"Error processing log: {e}")
        # Fallback
        fallback_entry = models.Entry(
            raw_text=entry.raw_text, 
            ingested_at=final_ingested_at,
            macros={
                "error": str(e),
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fats": 0,
                "water_ml": 0,
                "food_name": entry.raw_text,
                "items": []
            }
        )
        db.add(fallback_entry)
        db.commit()
        db.refresh(fallback_entry)
        return fallback_entry

@app.get("/dashboard")
def read_dashboard(date: str = None, db: Session = Depends(get_db)):
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    
    # query daily goal
    goal = db.query(models.DailyGoal).filter(models.DailyGoal.date == date).first()
    if not goal:
        # Create default goal if not exists
        goal = models.DailyGoal(date=date)
        db.add(goal)
        db.commit()
        db.refresh(goal)

    # query entries for the day (using string comparison for simplicity with sqlite)
    entries = db.query(models.Entry).all()
    
    today_entries = []
    for e in entries:
        if e.ingested_at:
             if e.ingested_at.strftime("%Y-%m-%d") == date:
                 today_entries.append(e)
    
    # Aggregate
    total_calories = 0
    total_protein = 0
    total_carbs = 0
    total_fats = 0
    total_water = 0
    
    # Init Micros
    total_micros = {}

    for e in today_entries:
        if e.macros:
            total_calories += e.macros.get("calories", 0)
            total_protein += e.macros.get("protein", 0)
            total_carbs += e.macros.get("carbs", 0)
            total_fats += e.macros.get("fats", 0)
            total_water += e.macros.get("water_ml", 0)
            
            # Aggregate Micros
            entry_micros = e.macros.get("micros", {})
            if entry_micros:
                for k, v in entry_micros.items():
                    total_micros[k] = total_micros.get(k, 0) + v
                    # Round for display
                    total_micros[k] = round(total_micros[k], 2)
    
    return {
        "date": date,
        "goals": {
            "calories": goal.calorie_target,
            "protein": goal.protein_target,
            "water_ml": goal.water_target_ml
        },
        "totals": {
            "calories": total_calories,
            "protein": total_protein,
            "carbs": total_carbs,
            "fats": total_fats,
            "water_ml": total_water,
            "micros": total_micros
        },
        "entries": today_entries
    }

@app.delete("/log/{entry_id}")
def delete_log(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(models.Entry).filter(models.Entry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(entry)
    db.commit()
    return {"message": "Entry deleted"}

# ══════════════════════════════════════════════════
# EVALS DASHBOARD API
# ══════════════════════════════════════════════════

@app.get("/evals/logs")
def get_llm_logs():
    """Return the last 50 LLM trace logs."""
    log_file = os.path.join(os.path.dirname(__file__), "llm_logs.jsonl")
    logs = []
    if os.path.exists(log_file):
        try:
            with open(log_file, "r") as f:
                # Read all lines and take the last 50
                lines = f.readlines()
                for line in lines[-50:]:
                    try:
                        logs.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            print(f"Error reading logs: {e}")
    # Return reversed (newest first)
    return logs[::-1]

from .evals.run_evals import run_all_evals

@app.post("/evals/run")
def run_evaluations():
    """Run the full evaluation suite and return results."""
    try:
        results = run_all_evals()
        return results
    except Exception as e:
        print(f"Eval Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
