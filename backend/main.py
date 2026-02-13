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
from datetime import datetime
from dotenv import load_dotenv
import anthropic

# Load env vars
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY")
)

# ══════════════════════════════════════════════════
# STEP 1: Parse raw text into structured items (Haiku — cheap & fast)
# ══════════════════════════════════════════════════
class ParseRequest(schemas.BaseModel):
    raw_text: str

@app.post("/parse")
def parse_food_text(req: ParseRequest):
    parse_prompt = f"""You are a food log parser. Break the user's messy food log into discrete, structured items with clear quantities.

User Input: "{req.raw_text}"

RULES:
1. Identify each distinct food item mentioned.
2. For each item, infer a reasonable quantity with a UNIT (slices, eggs, katori, pieces, g, ml, cups, etc.).
3. If the user mentions "sandwiches", calculate how many bread slices that implies (2 sandwiches = 4 slices).
4. If the user mentions "omelette" without specifying eggs, assume 2 eggs and note it.
5. Extract the time if mentioned, even if it has typos (e.g., "arond 10 30 amm" → "10:30 am").
6. Add a brief 'note' explaining any assumptions you made, so the user can correct them.
7. Set 'confidence' to "high", "medium", or "low" based on how clear the input was.
8. Return ONLY valid JSON. No preamble, no markdown.

JSON Schema:
{{
    "items": [
        {{
            "name": "Item name (clean, title case)",
            "quantity": "Amount with unit (e.g., '4 slices', '2 eggs', '1 katori')",
            "note": "Brief assumption explanation"
        }}
    ],
    "time": "Extracted time string (e.g., '10:30 am') or null if not found",
    "confidence": "high|medium|low"
}}

EXAMPLE:
Input: "2 sandwiches sourdough bread, omelette, ham, cheese at 10 30 am"
Output:
{{
    "items": [
        {{"name": "Sourdough Bread", "quantity": "4 slices", "note": "2 sandwiches = 4 slices"}},
        {{"name": "Egg Omelette", "quantity": "2 eggs", "note": "Standard 2-egg omelette assumed"}},
        {{"name": "Ham", "quantity": "2 slices", "note": "Deli ham, 1 slice per sandwich"}},
        {{"name": "Cheese", "quantity": "1 slice", "note": "1 slice total assumed"}}
    ],
    "time": "10:30 am",
    "confidence": "medium"
}}"""

    try:
        message = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=800,
            messages=[{"role": "user", "content": parse_prompt}]
        )
        content = message.content[0].text.strip()
        # Strip markdown code blocks if present
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            content = content.rsplit("```", 1)[0]
        content = content.strip()
        return json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parse failed: {str(e)}")

@app.post("/log", response_model=schemas.Entry)
def create_log(entry: schemas.EntryCreate, db: Session = Depends(get_db)):
    if entry.date:
        # User specified a date via UI (e.g. "2023-10-10")
        # We set current_time to noon on that day to ensure it falls within the day
        current_time = datetime.strptime(entry.date, "%Y-%m-%d").replace(hour=12, minute=0, second=0).isoformat()
    else:
        current_time = datetime.now().isoformat()
    
    prompt = f"""You are a PRECISION NUTRITION ANALYST — the world's most accurate food logging engine.
Your task: Parse a user's food log into exact nutritional data. Accuracy is paramount. You must think like a clinical dietitian cross-referencing IFCT (Indian Food Composition Tables), USDA FoodData Central, and HealthifyMe's verified Indian food database.

User Input: "{entry.raw_text}"
Current Time: {current_time}

═══════════════════════════════════════
SECTION 1: PORTION SIZE CALIBRATION
═══════════════════════════════════════
You MUST use these standard Indian portion sizes. Never guess — use these anchors:

COOKED FOODS (always use COOKED values, never raw):
• 1 katori (standard Indian bowl) = ~150ml = ~150g cooked weight
• 1 katori cooked rice = ~150g cooked = ~170 kcal, 3.5g protein, 37g carbs
• 1 katori cooked dal (any variety) = ~150g cooked = ~120-150 kcal, 7-9g protein, 15-22g carbs
• 1 katori cooked sabzi (dry) = ~150g = varies by dish
• 1 katori cooked sabzi (gravy) = ~200ml including liquid

BREADS:
• 1 medium roti/chapati = ~30g dry atta = ~40g cooked = 72 kcal, 2.5g protein, 15g carbs, 0.4g fat
• 1 paratha (plain) = ~45g dry atta + ghee = ~150 kcal, 3.5g protein, 20g carbs, 7g fat
• 1 naan = ~260 kcal, 8g protein, 42g carbs, 5g fat
• 1 slice sourdough bread (e.g. Krumbkraft bakery, 400g loaf / ~10 slices) = ~40g = 105 kcal, 3.5g protein, 20g carbs, 1g fat
• 1 slice regular bread = ~30g = 80 kcal, 3g protein, 14g carbs, 1g fat

DELI MEATS & CHEESE (Indian market):
• 1 slice deli ham (India, e.g. Prasuma/Godrej) = ~25-30g = 35 kcal, 5g protein, 0.5g carbs, 1.5g fat
• 1 slice Amul processed cheese = ~20g = 60 kcal, 4g protein, 1g carbs, 5g fat

RICE:
• 1 katori cooked white rice = 170 kcal | 1/2 katori = 85 kcal
• 1 plate/serving cooked rice (~200g) = 230 kcal

PROTEINS:
• 1 whole egg (large, cooked) = 78 kcal, 6g protein, 0.6g carbs, 5g fat
• 1 egg omelette (with oil/butter) = ~95 kcal, 6.5g protein, 1g carbs, 7g fat
• 1 katori paneer = ~265 kcal, 18g protein
• 1 glass whole milk (200ml) = 120 kcal, 6.3g protein, 9g carbs, 6.5g fat
• 1 katori curd/yogurt = ~100 kcal, 5g protein

CRITICAL CONVERSION RULES:
• RAW dal has ~24g protein per 100g. COOKED dal has ~7-9g per 100g (3x water absorption).
• RAW rice has ~7g protein per 100g. COOKED rice has ~2.7g per 100g.
• NEVER confuse raw nutritional data with cooked portions. The user always means COOKED unless they say "raw" or "dry".
• Kadhi (yogurt + besan gravy) = ~80-90 kcal per katori, 3-4g protein. It is NOT a high-protein food.

═══════════════════════════════════════
SECTION 2: ANTI-INFLATION GUARDRAILS
═══════════════════════════════════════
Before finalizing, verify these sanity checks:
• 1 roti CANNOT exceed 85 kcal or 3g protein
• 1 katori cooked dal CANNOT exceed 10g protein
• 2 slices of any bread CANNOT exceed 12g protein
• A simple vegetarian Indian meal (sabzi + roti + rice) typically totals 400-600 kcal, 12-20g protein
• An egg omelette sandwich CANNOT have more protein than the eggs + fillings combined
• Total meal protein should pass the "does this make sense" test: 50g+ protein requires significant meat/paneer/eggs

═══════════════════════════════════════
SECTION 3: REGIONAL FOOD INTELLIGENCE
═══════════════════════════════════════
• Bengali: Posto = poppy seed paste (high fat, low protein). Jhinge = ridge gourd. Aloo = potato.
• North Indian: Kadhi = yogurt-besan gravy (NOT dal). Rajma/Chole = higher protein (8-10g/katori cooked).
• South Indian: Sambar has more dal than kadhi (~6-8g protein/katori). Dosa = fermented rice-urad batter.
• Street food: Vada pav ~300 kcal, Pav bhaji plate ~450 kcal, 2 samosas ~350 kcal.

═══════════════════════════════════════
SECTION 4: SUPPLEMENTS & SPECIAL ITEMS
═══════════════════════════════════════
• SUPPLEMENT CONCENTRATION: Capsule total weight ≠ active ingredient weight. Fish oil 1250mg cap ≈ 30-55% omega-3.
• Brand intelligence: 'Sports Research' 1250mg fish oil = ~690mg EPA, ~260mg DHA per cap.
• Creatine monohydrate: Extract exact dosage as 'creatine_g'. Common dose = 5g.
• If a specific dosage is mentioned (e.g. "5g", "500mg", "10gm"), it MUST appear in the 'micros' object. Never omit a stated dosage.
• Vitamin D for "Fish Oil" should NOT be assumed unless "Cod Liver Oil" or Vitamin D is explicitly mentioned.

═══════════════════════════════════════
SECTION 5: TIME & OUTPUT
═══════════════════════════════════════
• Extract 'ingested_at' time. Use the DATE from Current Time ({current_time.split('T')[0]}) as the base. 
• If the user mentions "today" or "yesterday", adjust relative to Current Time.
• Return ONLY valid JSON. No preamble, no markdown, no explanation.
• Include only micronutrients that are meaningfully present (>5% DV). Omit zeros.

JSON Schema:
{{
    "food_name": "Summary string",
    "ingested_at": "ISO 8601 string",
    "items": [
        {{
            "name": "Item Name",
            "quantity": "Amount with unit",
            "nutrients": {{
                "calories": int,
                "protein": float,
                "carbs": float,
                "fats": float,
                "fiber": float,
                "sugar": float,
                "sodium": int
            }}
        }}
    ],
    "total_macros": {{
        "calories": int,
        "protein": float,
        "carbs": float,
        "fats": float,
        "water_ml": int
    }},
    "micros": {{
        "creatine_g": float,
        "epa_mg": float,
        "dha_mg": float,
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
        "fiber_g": float,
        "sugar_g": float,
        "added_sugar_g": float,
        "saturated_fat_g": float,
        "cholesterol_mg": int
    }}
}}"""

    try:
        # Retry logic for transient API failures
        max_retries = 2
        last_error = None
        
        for attempt in range(max_retries + 1):
            try:
                message = client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=2500,
                    messages=[
                        {"role": "user", "content": prompt}
                    ]
                )
                
                # Full API response diagnostics
                print(f"[Sonnet API] stop_reason={message.stop_reason}, "
                      f"content_blocks={len(message.content)}, "
                      f"usage={{input={message.usage.input_tokens}, output={message.usage.output_tokens}}}")
                
                # Check stop reason
                if message.stop_reason == "max_tokens":
                    print("[WARNING] Sonnet hit max_tokens — response may be truncated!")
                
                # Check for empty content
                if not message.content or len(message.content) == 0:
                    if attempt < max_retries:
                        print(f"[Sonnet API] Empty content on attempt {attempt+1}, retrying...")
                        import time; time.sleep(1 * (attempt + 1))
                        continue
                    raise ValueError("Sonnet returned no content blocks after all retries")
                
                content = message.content[0].text.strip()
                
                print(f"[Sonnet Response] Length={len(content)}, First 200 chars: {content[:200]}")
                
                if not content:
                    if attempt < max_retries:
                        print(f"[Sonnet API] Empty text on attempt {attempt+1}, retrying...")
                        import time; time.sleep(1 * (attempt + 1))
                        continue
                    raise ValueError("Sonnet returned empty text after all retries")
                
                # Strip markdown code fences if present
                if content.startswith("```"):
                    content = content.split("\n", 1)[1] if "\n" in content else content[3:]
                    if content.endswith("```"):
                        content = content[:-3].strip()
                
                data = json.loads(content)
                break  # Success — exit retry loop
                
            except json.JSONDecodeError as je:
                last_error = je
                print(f"[Sonnet API] JSON parse failed on attempt {attempt+1}: {je}")
                print(f"[Sonnet API] Raw content was: {repr(content[:500])}")
                if attempt < max_retries:
                    import time; time.sleep(1 * (attempt + 1))
                    continue
                raise
        
        
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

        # MERGE LOGIC: AI extracts time, UI provides date.
        ai_ingested = data.get("ingested_at")
        final_ingested_at = current_time # Fallback to noon on selected day

        if ai_ingested:
            try:
                ai_dt = datetime.fromisoformat(ai_ingested.replace('Z', '+00:00'))
                if entry.date:
                    # Overwrite the date part with the one from the UI picker
                    ui_dt = datetime.strptime(entry.date, "%Y-%m-%d")
                    final_dt = ai_dt.replace(year=ui_dt.year, month=ui_dt.month, day=ui_dt.day)
                    final_ingested_at = final_dt.isoformat()
                else:
                    final_ingested_at = ai_dt.isoformat()
            except ValueError:
                final_ingested_at = current_time

        # Create DB Entry with RICH DATA
        db_entry = models.Entry(
            raw_text=entry.raw_text,
            created_at=datetime.now(),
            ingested_at=datetime.fromisoformat(final_ingested_at),
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
            macros={
                "error": str(e),
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fats": 0,
                "water_ml": 0,
                "food_name": entry.raw_text,
                "items": [],
                "micros": {},
                "warnings": [f"LLM failed: {str(e)}. Nutrients could not be calculated."]
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
