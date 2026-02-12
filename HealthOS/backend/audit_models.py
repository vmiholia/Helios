#!/usr/bin/env python3
"""
Model comparison audit: Haiku vs Sonnet vs Opus on the same food logs.
Extracts only the core macros for each item for easy comparison.
"""
import anthropic
import json
import os

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

MODELS = {
    "haiku": "claude-3-haiku-20240307",
    "sonnet": "claude-sonnet-4-20250514",
    "opus": "claude-3-opus-20240229",
}

# Today's raw entries
ENTRIES = [
    {
        "id": 16,
        "raw": "1.5 katori aloo jhinge posto,1 katori cooked rice, 2 roti, 1 katori cooked masoor dal at 2 pm",
        "label": "Bengali Lunch"
    },
    {
        "id": 23,
        "raw": "in the morinng at arond 10 30 amm i ate 2 sandwiches made from sourdough bread i bought from krumbcraft indiranagar. Inside omlette : omlette, ham,cheese",
        "label": "Sourdough Sandwiches"
    },
    {
        "id": 25,
        "raw": "1 katori kadhi, 2 roti, 0.5 katori rice at 8 30 pm",
        "label": "Kadhi Dinner"
    },
]

PROMPT_TEMPLATE = """You are a nutrition assistant. Parse the following food log into structured data.
User Input: "{raw}"
Current Time: 2026-02-11T14:00:00

Rules:
1. Estimate calories and macros (protein, carbs, fats) based on standard nutritional data.
2. Identify discrete food items. For each item, estimate its specific contribution.
3. When the user says 'katori', assume a standard Indian katori (~150ml cooked volume, roughly 150g cooked food).
4. For 'roti', assume a standard medium homemade whole wheat roti (~6 inch diameter, ~30g dry atta, ~70-80 cal each).
5. ALWAYS use COOKED nutritional values unless the user explicitly specifies raw/uncooked.
6. Return ONLY valid JSON. No preamble, no explanation, no markdown code blocks.

JSON Schema:
{{
    "food_name": "Summary",
    "items": [
        {{
            "name": "Item Name",
            "quantity": "Amount",
            "nutrients": {{
                "calories": int,
                "protein": int,
                "carbs": int,
                "fats": int
            }}
        }}
    ],
    "total_macros": {{
        "calories": int,
        "protein": int,
        "carbs": int,
        "fats": int
    }}
}}
"""

def query_model(model_key, raw_text):
    model_id = MODELS[model_key]
    prompt = PROMPT_TEMPLATE.format(raw=raw_text)
    try:
        msg = client.messages.create(
            model=model_id,
            max_tokens=1200,
            messages=[{"role": "user", "content": prompt}]
        )
        content = msg.content[0].text
        return json.loads(content)
    except Exception as e:
        return {"error": str(e)}

def print_comparison(entry, results):
    print(f"\n{'='*90}")
    print(f"  ENTRY: {entry['label']}")
    print(f"  RAW: {entry['raw'][:80]}...")
    print(f"{'='*90}")
    
    # Collect all item names across all models
    all_items = {}
    for model_key in ["haiku", "sonnet", "opus"]:
        data = results[model_key]
        if "error" in data:
            continue
        for item in data.get("items", []):
            name = item["name"]
            n = item.get("nutrients", {})
            if name not in all_items:
                all_items[name] = {}
            all_items[name][model_key] = n
    
    # Print item-level comparison
    print(f"\n  {'Item':<30} | {'Model':<8} | {'Cal':>5} | {'Pro':>5} | {'Carb':>5} | {'Fat':>5}")
    print(f"  {'-'*30}-+-{'-'*8}-+-{'-'*5}-+-{'-'*5}-+-{'-'*5}-+-{'-'*5}")
    
    for item_name, model_data in all_items.items():
        first = True
        for m in ["haiku", "sonnet", "opus"]:
            if m in model_data:
                n = model_data[m]
                prefix = item_name[:30] if first else ""
                print(f"  {prefix:<30} | {m:<8} | {n.get('calories',0):>5} | {n.get('protein',0):>5} | {n.get('carbs',0):>5} | {n.get('fats',0):>5}")
                first = False
        print(f"  {'':<30}-+-{'-'*8}-+-{'-'*5}-+-{'-'*5}-+-{'-'*5}-+-{'-'*5}")
    
    # Print totals
    print(f"\n  {'TOTALS':<30} | {'Model':<8} | {'Cal':>5} | {'Pro':>5} | {'Carb':>5} | {'Fat':>5}")
    print(f"  {'-'*30}-+-{'-'*8}-+-{'-'*5}-+-{'-'*5}-+-{'-'*5}-+-{'-'*5}")
    for m in ["haiku", "sonnet", "opus"]:
        data = results[m]
        if "error" in data:
            print(f"  {'TOTAL':<30} | {m:<8} | ERROR: {data['error'][:40]}")
            continue
        t = data.get("total_macros", {})
        print(f"  {'TOTAL':<30} | {m:<8} | {t.get('calories',0):>5} | {t.get('protein',0):>5} | {t.get('carbs',0):>5} | {t.get('fats',0):>5}")

if __name__ == "__main__":
    for entry in ENTRIES:
        print(f"\n>>> Querying all 3 models for: {entry['label']}...")
        results = {}
        for model_key in ["haiku", "sonnet", "opus"]:
            print(f"    [{model_key.upper()}] calling...", end=" ", flush=True)
            results[model_key] = query_model(model_key, entry["raw"])
            print("done.")
        print_comparison(entry, results)
