from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, database

app = FastAPI(title="HealthOS API")

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
    return {"status": "HealthOS Backend is running"}

import os
import json
from datetime import datetime
from dotenv import load_dotenv
import anthropic

# Load env vars
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY")
)

@app.post("/log", response_model=schemas.Entry)
def create_log(entry: schemas.EntryCreate, db: Session = Depends(get_db)):
    if entry.date:
        # User specified a date via UI (e.g. "2023-10-10")
        # We set current_time to noon on that day to ensure it falls within the day
        current_time = datetime.strptime(entry.date, "%Y-%m-%d").replace(hour=12, minute=0, second=0).isoformat()
    else:
        current_time = datetime.now().isoformat()
    
    prompt = f"""
    You are a nutrition assistant. Parse the following food log into structured data.
    User Input: "{entry.raw_text}"
    Current Time: {current_time}

    Rules:
    1. Estimate calories and macros (protein, carbs, fats) based on standard nutritional data.
    2. Identify discrete food items. For each item, estimate its specific contribution.
    3. DETAILED MICRONUTRIENTS: Estimate discrete values for vitamins and minerals where significant.
    4. FATTY ACIDS & SUPPLEMENTS: Extract 'epa_mg', 'dha_mg', and 'creatine_g' (for products like creatine monohydrate). Use THESE EXACT KEYS.
    5. Extract the 'ingested_at' time. IMPORTANTE: Use the YEAR from 'Current Time' ({current_time[:4]}) unless the user explicitly states a different year.
    6. Return ONLY valid JSON. No preamble, no explanation, no markdown code blocks. Just the raw JSON object.
    7. BIAS CORRECTION: 
       - Avoid assuming Vitamin D for generic "Fish Oil" unless "Cod Liver Oil" or Vit D is mentioned. 
       - For regional dishes (e.g. 'Aloo Jhinge Posto'), estimate based on ingredients (Potato, Ridge Gourd, Poppy Seeds).
       - SUPPLEMENT CONCENTRATION: The total weight of a capsule (e.g., 1250mg) is NEITHER the EPA nor the DHA amount. Most capsules are only 30-70% Omega-3. Use internal knowledge for specific brands (e.g., 'Sports Research' is usually ~690mg EPA, ~260mg DHA per 1250mg cap).
       - EXTRACTION RIGOR: If a specific dosage (e.g. "5g", "500mg", "10gm") is mentioned for a supplement or nutrient, it MUST be extracted into the corresponding key (e.g. 'creatine_g', 'epa_mg') in the 'micros' object. Do not omit it.
    
    JSON Schema:
    {{
        "food_name": "Summary string (e.g. 'Chicken Rice Bowl')",
        "ingested_at": "ISO 8601 string",
        "items": [
            {{
                "name": "Specific Item (e.g. 'Brown Rice')",
                "quantity": "Estimation (e.g. '1 cup')",
                "nutrients": {{
                    "calories": int,
                    "protein": int,
                    "carbs": int,
                    "fats": int,
                    "fiber": int,
                    "sugar": int,
                    "sodium": int
                }}
            }}
        ],
        "total_macros": {{
            "calories": int,
            "protein": int,
            "carbs": int,
            "fats": int,
            "water_ml": int
        }},
        "micros": {{
            "creatine_g": float,
            "epa_mg": float,
            "dha_mg": float,
            // Vitamins
            "vitamin_a_iu": int,
            "vitamin_b1_thiamine_mg": float,
            "vitamin_b2_riboflavin_mg": float,
            "vitamin_b3_niacin_mg": float,
            "vitamin_b5_pantothenic_acid_mg": float,
            "vitamin_b6_pyridoxine_mg": float,
            "vitamin_b7_biotin_mcg": float,
            "vitamin_b9_folate_mcg": float,
            "vitamin_b12_cobalamin_mcg": float,
            "vitamin_c_mg": int,
            "vitamin_d_iu": int,
            "vitamin_e_mg": float,
            "vitamin_k_mcg": float,
            
            // Minerals
            "calcium_mg": int,
            "sodium_mg": int,
            "potassium_mg": int,
            "magnesium_mg": int,
            "phosphorus_mg": int,
            "chloride_mg": int,
            "iron_mg": float,
            "zinc_mg": float,
            "copper_mcg": float,
            "manganese_mg": float,
            "selenium_mcg": float,
            "iodine_mcg": float,
            "chromium_mcg": float,
            "molybdenum_mcg": float,

            // Other
            "fiber_g": int,
            "sugar_g": int,
            "added_sugar_g": int,
            "saturated_fat_g": int,
            "cholesterol_mg": int
        }}
    }}
    """

    try:
        message = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1500,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        content = message.content[0].text
        data = json.loads(content)
        
        # BASIC VALIDATION: Check for silent extraction failures
        warnings = []
        raw_lower = entry.raw_text.lower()
        micros = data.get("micros", {})
        
        check_map = {
            "creatine": "creatine_g",
            "omega": "epa_mg",
            "fish oil": "epa_mg",
            "magnesium": "magnesium_mg",
            "vitamin d": "vitamin_d_iu"
        }
        
        for keyword, key in check_map.items():
            if keyword in raw_lower:
                val = micros.get(key, 0)
                if not val or val == 0:
                    warnings.append(f"Mentioned '{keyword}' but no {key} was extracted.")

        # Create DB Entry with RICH DATA
        db_entry = models.Entry(
            raw_text=entry.raw_text,
            created_at=datetime.now(),
            ingested_at=datetime.fromisoformat(data.get("ingested_at", current_time)),
            macros={
                "calories": data["total_macros"].get("calories", 0),
                "protein": data["total_macros"].get("protein", 0),
                "carbs": data["total_macros"].get("carbs", 0),
                "fats": data["total_macros"].get("fats", 0),
                "water_ml": data["total_macros"].get("water_ml", 0),
                "food_name": data.get("food_name", "Unknown"),
                # Extended Data
                "items": data.get("items", []),
                "micros": micros,
                "warnings": warnings if warnings else None
            }
        )
        
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry

    except Exception as e:
        print(f"LLM Error: {e}")
        # Fallback: Save raw text even if LLM fails
        fallback_entry = models.Entry(
            raw_text=entry.raw_text, 
            ingested_at=datetime.fromisoformat(current_time),
            macros={"error": str(e)}
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

    for e in today_entries:
        if e.macros:
            total_calories += e.macros.get("calories", 0)
            total_protein += e.macros.get("protein", 0)
            total_carbs += e.macros.get("carbs", 0)
            total_fats += e.macros.get("fats", 0)
            total_water += e.macros.get("water_ml", 0)
    
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
            "water_ml": total_water
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
