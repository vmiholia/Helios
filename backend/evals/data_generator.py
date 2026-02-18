import os
import json
import anthropic
from dotenv import load_dotenv

# Adjust path to point to backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY")
)

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "dataset_food_parsing.json")

def generate_synthetic_data(num_examples=20):
    print(f"Generating {num_examples} synthetic examples...")
    
    prompt = f"""You are a synthetic data generator for a food tracking app.
Generate {num_examples} diverse, realistic, and messy food log entries that a user might type.

Include a mix of:
1. Simple items ("2 eggs")
2. Complex meals ("Chicken curry with 2 rotis")
3. Vague quantities ("a bowl of rice")
4. Indian context specific items ("1 katori dal", "2 idli")
5. Multiple items in one line ("coffee and a bagel")
6. Time mentions ("had breakfast at 9am: oatmeal")
7. Explicitly include implicit time contexts (e.g., "dinner" implies evening).

Return ONLY valid JSON in this format:
[
    {{
        "input_text": "text...",
        "expected_items": ["item1", "item2"], // Just names, lowercase
        "expected_time": "HH:MM" or null, // CRITICAL: If input says "at 9pm", this MUST be "21:00". If "dinner", imply "20:00".
        "difficulty": "easy|medium|hard"
    }},
    ...
]
"""
    try:
        message = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )
        content = message.content[0].text.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1].rsplit("```", 1)[0]
        
        data = json.loads(content.strip())
        
        with open(OUTPUT_FILE, "w") as f:
            json.dump(data, f, indent=2)
            
        print(f"Successfully saved {len(data)} examples to {OUTPUT_FILE}")
        return data
        
    except Exception as e:
        print(f"Error generating data: {e}")
        return []

if __name__ == "__main__":
    generate_synthetic_data()
