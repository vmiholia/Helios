#!/usr/bin/env python3
"""
Audit V2: Compare OLD prompt (Haiku) vs NEW prompt (Sonnet) for today's entries.
"""
import anthropic
import json

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

ENTRIES = [
    {"label": "Bengali Lunch", "raw": "1.5 katori aloo jhinge posto,1 katori cooked rice, 2 roti, 1 katori cooked masoor dal at 2 pm"},
    {"label": "Sourdough Sandwiches", "raw": "in the morinng at arond 10 30 amm i ate 2 sandwiches made from sourdough bread i bought from krumbcraft indiranagar. Inside omlette : omlette, ham,cheese"},
    {"label": "Kadhi Dinner", "raw": "1 katori kadhi, 2 roti, 0.5 katori rice at 8 30 pm"},
]

NEW_PROMPT = """You are a PRECISION NUTRITION ANALYST — the world's most accurate food logging engine.
Your task: Parse a user's food log into exact nutritional data. Accuracy is paramount. You must think like a clinical dietitian cross-referencing IFCT (Indian Food Composition Tables), USDA FoodData Central, and HealthifyMe's verified Indian food database.

User Input: "{raw}"
Current Time: 2026-02-11T14:00:00

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
• 1 slice sourdough bread = ~50g = 130 kcal, 5g protein, 25g carbs, 1g fat (artisan/bakery)
• 1 slice regular bread = ~30g = 80 kcal, 3g protein, 14g carbs, 1g fat

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
• If a specific dosage is mentioned (e.g. "5g", "500mg", "10gm"), it MUST appear in the 'micros' object.

═══════════════════════════════════════
SECTION 5: TIME & OUTPUT
═══════════════════════════════════════
• Extract 'ingested_at' time. Use YEAR from Current Time (2026).
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
                "fats": float
            }}
        }}
    ],
    "total_macros": {{
        "calories": int,
        "protein": float,
        "carbs": float,
        "fats": float
    }}
}}"""


def query(raw_text):
    prompt = NEW_PROMPT.format(raw=raw_text)
    msg = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2500,
        messages=[{"role": "user", "content": prompt}]
    )
    content = msg.content[0].text.strip()
    # Strip markdown code blocks if present
    if content.startswith("```"):
        content = content.split("\n", 1)[1]  # remove first line
        content = content.rsplit("```", 1)[0]  # remove last ```
    content = content.strip()
    return json.loads(content)


if __name__ == "__main__":
    for entry in ENTRIES:
        print(f"\n>>> [{entry['label']}] Querying Sonnet with NEW prompt...")
        data = query(entry["raw"])
        
        print(f"\n{'='*80}")
        print(f"  {entry['label']}")
        print(f"  RAW: {entry['raw'][:80]}...")
        print(f"{'='*80}")
        
        for item in data.get("items", []):
            n = item.get("nutrients", {})
            print(f"  {item['name']:<35} | Cal: {n.get('calories',0):>5} | Pro: {n.get('protein',0):>5} | Carb: {n.get('carbs',0):>5} | Fat: {n.get('fats',0):>5}")
        
        t = data.get("total_macros", {})
        print(f"  {'--- TOTAL ---':<35} | Cal: {t.get('calories',0):>5} | Pro: {t.get('protein',0):>5} | Carb: {t.get('carbs',0):>5} | Fat: {t.get('fats',0):>5}")
