from sqlalchemy.orm import Session
from . import models, schemas, llm
import re

def get_food_item(db: Session, name: str):
    """Find a food item by name (case-insensitive)."""
    return db.query(models.FoodItem).filter(models.FoodItem.name.ilike(name)).first()

def create_food_item(db: Session, item_data: dict, source: str = "llm"):
    """Create a new food item in memory."""
    db_item = models.FoodItem(
        name=item_data["name"],
        calories_per_100=item_data["calories_per_100"],
        protein_per_100=item_data["protein_per_100"],
        carbs_per_100=item_data["carbs_per_100"],
        fats_per_100=item_data["fats_per_100"],
        default_unit=item_data.get("default_unit", "g"),
        micros=item_data.get("micros", {}),
        source=source
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_portion_unit(db: Session, unit_name: str):
    """Find a portion unit by name (case-insensitive)."""
    # Try exact match first
    unit = db.query(models.PortionUnit).filter(models.PortionUnit.name.ilike(unit_name)).first()
    if unit:
        return unit
    
    # Simple mapping for common variations
    mappings = {
        "bowl": "bowl",
        "katori": "katori",
        "cup": "cup",
        "tbsp": "tablespoon",
        "tsp": "teaspoon",
        "glass": "glass",
        "slice": "slice",
        "pc": "piece",
        "piece": "piece"
    }
    
    # Check if unit_name contains any mapped key
    for key, value in mappings.items():
        if key in unit_name.lower():
             return db.query(models.PortionUnit).filter(models.PortionUnit.name == value).first()
             
    return None

def resolve_weight(quantity_str: str, db: Session) -> float:
    """
    Parse a quantity string and return estimated weight in grams.
    Default to 100g if unknown.
    """
    # Regex to find number and unit
    match = re.search(r"(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?", quantity_str)
    
    if match:
        amount = float(match.group(1))
        unit_str = match.group(2).lower() if match.group(2) else ""
        
        # Check standard weights
        if unit_str in ['g', 'gm', 'gms', 'gram', 'grams']:
            return amount
        elif unit_str in ['ml', 'l', 'liter', 'liters', 'litre']:
             # Assuming 1ml ~ 1g for simplicity
            return amount
        elif unit_str in ['kg', 'kilo']:
            return amount * 1000
        else:
            # Check PortionUnit DB
            portion_unit = get_portion_unit(db, unit_str)
            if portion_unit:
                return amount * portion_unit.weight_in_grams
            else:
                # Fallback: Assume "serving" or "each" is ~100g or return 100g default
                # If no unit provided (e.g. "2 eggs"), check if we can infer? 
                # For now, simplistic default.
                return amount * 50 # Arbitrary avg for "1 unit" of something unknown
    
    return 100.0 # Fallback

def process_entry_text(raw_text: str, db: Session) -> dict:
    """
    Orchestrate the parsing and processing of a food log.
    1. Parse text -> items
    2. Resolve items (DB lookup or LLM)
    3. Calculate total macros
    """
    # 1. Parse
    parsed_data = llm.parse_food_text(raw_text)
    items = parsed_data.get("items", [])
    time = parsed_data.get("time")
    
    processed_items = []
    total_macros = {
        "calories": 0, "protein": 0, "carbs": 0, "fats": 0, "water_ml": 0, 
        # Add aggregation for key micros
        "fiber_g": 0, "sugar_g": 0, "sodium_mg": 0, "potassium_mg": 0,
        "calcium_mg": 0, "iron_mg": 0, "vitamin_c_mg": 0
    }
    
    # We will also collect a full "micros" dict for the entry
    entry_micros = {}

    for item in items:
        name = item["name"]
        quantity_str = item["quantity"]
        
        # Resolve Weight
        weight_g = resolve_weight(quantity_str, db)
        
        # Resolve Food Item
        food_item = get_food_item(db, name)
        
        if not food_item:
            # New Food! Ask LLM for base stats
            print(f"Learning new food: {name}")
            base_stats = llm.estimate_metric_macros(name)
            # Add name to stats to satisfy create_food_item signature
            base_stats["name"] = name
            food_item = create_food_item(db, base_stats, source="llm_check")
        else:
            # CACHE HIT: Log it so it shows in evaluations
            # We construct a synthetic trace for "Cache Hit"
            try:
                llm.log_trace(
                    func_name="estimate_metric_macros", 
                    input_data={"food_name": name}, 
                    output_data={"source": "CACHE", "calories": food_item.calories_per_100}, 
                    latency_ms=0, 
                    model="DATABASE_CACHE"
                )
            except Exception:
                pass
            
        # Calculate Macros for this instance
        ratio = weight_g / 100.0
        
        item_macros = {
            "calories": int(food_item.calories_per_100 * ratio),
            "protein": round(food_item.protein_per_100 * ratio, 1),
            "carbs": round(food_item.carbs_per_100 * ratio, 1),
            "fats": round(food_item.fats_per_100 * ratio, 1)
        }
        
        # Calculate Micros
        item_micros = {}
        if food_item.micros:
            for key, val in food_item.micros.items():
                if isinstance(val, (int, float)):
                    val = float(val)
                    item_micros[key] = round(val * ratio, 2)
                    
                    # Aggregate into total_macros if key exists there (for convenience)
                    if key in total_macros:
                        total_macros[key] += item_micros[key]
                    
                    # Aggregate into entry_micros
                    entry_micros[key] = entry_micros.get(key, 0) + item_micros[key]

        # Add fiber to item_macros for frontend display if available
        if "fiber" in item_micros:
             item_macros["fiber"] = item_micros["fiber"]
        elif "fiber_g" in item_micros:
             item_macros["fiber"] = item_micros["fiber_g"]

        processed_items.append({
            "name": name,
            "quantity": quantity_str,
            "weight_g": round(weight_g, 1),
            "nutrients": item_macros,
            "micros": item_micros # Store individual item micros
        })
        
        # Aggregate Macros
        total_macros["calories"] += item_macros["calories"]
        total_macros["protein"] += item_macros["protein"]
        total_macros["carbs"] += item_macros["carbs"]
        total_macros["fats"] += item_macros["fats"]
        
    return {
        "items": processed_items,
        "total_macros": total_macros,
        "micros": entry_micros, # Return aggregated micros
        "time": time,
        "food_name": ", ".join([i["name"] for i in processed_items])
    }
