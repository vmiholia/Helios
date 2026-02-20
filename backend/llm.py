import os
import json
import time
import datetime
from dotenv import load_dotenv
import anthropic
from . import schemas

# Load env vars
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY")
)

LOG_FILE = os.path.join(os.path.dirname(__file__), "llm_logs.jsonl")

def log_trace(func_name, input_data, output_data, latency_ms, model, error=None):
    """
    Log LLM traces to a JSONL file for evaluation.
    """
    trace = {
        "timestamp": datetime.datetime.now().isoformat(),
        "function": func_name,
        "input": input_data,
        "output": output_data,
        "latency_ms": latency_ms,
        "model": model,
        "error": str(error) if error else None
    }
    
    # Ensure directory exists (though backend usually exists)
    try:
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(trace) + "\n")
            f.flush()
            os.fsync(f.fileno())
    except Exception as e:
        print(f"Logging failed: {e}")

import dateutil.parser

def clean_time_string(time_str: str) -> str:
    """Clean and standardize time string to HH:MM format."""
    if not time_str:
        return None
    try:
        # CLEAN COMMON TYPOS
        # "8 PMM" -> "8 PM", "8:30AMM" -> "8:30 AM"
        clean = time_str.upper().replace("PMM", "PM").replace("AMM", "AM").strip()
        
        # Parse time only
        # Using dateutil to be flexible with formats (8pm, 8:00 PM, 20:00)
        try:
            parsed = dateutil.parser.parse(clean)
        except Exception:
            # Retry by stripping extra AM/PM (e.g. "20:00 PM" -> "20:00")
            clean_simple = clean.replace("PM", "").replace("AM", "").strip()
            parsed = dateutil.parser.parse(clean_simple)
            
        return parsed.strftime("%H:%M")
    except Exception as e:
        print(f"Time parse error for '{time_str}': {e}")
        return None

def parse_food_text(raw_text: str):
    """
    Step 1: Parse raw text into structured items using Haiku.
    """
    start_time = time.time()
    
    parse_prompt = f"""You are a food log parser. Break the user's messy food log into discrete, structured items with clear quantities.

User Input: "{raw_text}"

RULES:
1. Identify each distinct food item mentioned.
2. For each item, infer a reasonable quantity with a UNIT (slices, eggs, katori, pieces, g, ml, cups, etc.).
3. If the user mentions "sandwiches", calculate how many bread slices that implies (2 sandwiches = 4 slices).
4. If the user mentions "omelette" without specifying eggs, assume 2 eggs and note it.
5. Extract the time if mentioned.
6. Return ONLY valid JSON.
7. Time Format: "HH:MM" (24-hour format, e.g., "20:00", "10:30"). Convert "8 PMM" to "20:00".

JSON Schema:
{{
    "items": [
        {{
            "name": "Item name (clean, title case)",
            "quantity": "Amount with unit (e.g., '4 slices', '2 eggs', '1 katori')",
            "note": "Brief assumption explanation"
        }}
    ],
    "time": "Extracted time string in HH:MM 24-hour format or null",
    "confidence": "high|medium|low"
}}"""

    model_name = "claude-3-haiku-20240307"
    try:
        message = client.messages.create(
            model=model_name,
            max_tokens=800,
            messages=[{"role": "user", "content": parse_prompt}]
        )
        content = message.content[0].text.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0]
        
        result = json.loads(content.strip())
        
        # CLEAN TIME HERE
        if result.get("time"):
            result["time"] = clean_time_string(result["time"])
        
        # Log success
        latency = (time.time() - start_time) * 1000
        log_trace("parse_food_text", {"raw_text": raw_text}, result, latency, model_name)
        
        return result
    except Exception as e:
        print(f"Parse Error: {e}")
        error_result = {"items": [{"name": raw_text, "quantity": "1 serving", "note": "Parse failed"}], "time": None}
        
        # Log error
        latency = (time.time() - start_time) * 1000
        log_trace("parse_food_text", {"raw_text": raw_text}, error_result, latency, model_name, error=e)
        
        return error_result

def estimate_metric_macros(food_name: str):
    """
    Step 2: Get base nutritional info for 100g/ml of a specific food item.
    """
    start_time = time.time()
    
    prompt = f"""You are a nutrition database builder. 
Provide standard nutritional values for 100 grams (or 100ml for liquids) of: "{food_name}".

Rules:
1. SPECIFICITY IS KEY. If the user asked for "Arhar Dal", do NOT provide generic "Dal". Provide stats for "Arhar Dal" specifically.
2. Assume standard preparation (cooked for grains/meats, raw for fruits/veg unless specified).
3. Be conservative/average.
4. Return ONLY valid JSON.

JSON Schema:
{{
    "calories_per_100": int,
    "protein_per_100": int, 
    "carbs_per_100": int,
    "fats_per_100": int,
    "default_unit": "g",  // or 'ml'
    "micros": {{
        "fiber_g": float,
        "sugar_g": float,
        "sodium_mg": int,
        "potassium_mg": int,
        "calcium_mg": int,
        "iron_mg": float,
        "vitamin_c_mg": int,
        "vitamin_a_iu": int,
        "cholesterol_mg": int,
        "saturated_fat_g": float
        // Add any other relevant micros here
    }}
}}
"""
    model_name = "claude-sonnet-4-5"  # Sonnet for better nutrition accuracy
    try:
        message = client.messages.create(
            model=model_name,
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}]
        )
        content = message.content[0].text.strip()
        if content.startswith("```"):
             content = content.split("\n", 1)[1].rsplit("```", 1)[0]
        
        result = json.loads(content.strip())
        
        # Log success
        latency = (time.time() - start_time) * 1000
        log_trace("estimate_metric_macros", {"food_name": food_name}, result, latency, model_name)
        
        return result

    except Exception as e:
        print(f"Macro Estimation Error: {e}")
        # Return safe defaults
        error_result = {
            "calories_per_100": 0,
            "protein_per_100": 0, 
            "carbs_per_100": 0, 
            "fats_per_100": 0, 
            "default_unit": "g",
            "micros": {}
        }
        
        # Log error
        latency = (time.time() - start_time) * 1000
        log_trace("estimate_metric_macros", {"food_name": food_name}, error_result, latency, "claude-sonnet-4-5", error=e)
        
        return error_result
