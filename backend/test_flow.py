from backend import services, database, models
from sqlalchemy.orm import Session

def test_flow():
    db = database.SessionLocal()
    try:
        # Test Case 1: Parse and Learn
        print("\n--- Test 1: New Item '2 katori Dal' ---")
        raw_text = "2 katori Dal"
        result = services.process_entry_text(raw_text, db)
        print(f"Result: {result}")
        
        # Verify DB
        food_item = db.query(models.FoodItem).filter(models.FoodItem.name.ilike("Dal")).first()
        if food_item:
            print(f"✅ Learned 'Dal': {food_item.calories_per_100} kcal/100g")
        else:
            print(f"❌ Failed to learn 'Dal'")

        # Test Case 2: Reuse Memory
        print("\n--- Test 2: Reuse 'Dal' (should not call LLM for macros) ---")
        # in a real test we'd mock llm, here we just check if it runs
        result2 = services.process_entry_text("1 bowl Dal", db)
        print(f"Result 2: {result2}")
        
        # Test Case 3: Flexible Unit
        print("\n--- Test 3: Flexible Unit 'bowl' (250g) vs 'katori' (150g) ---")
        # 1 bowl = 250g, 1 katori = 150g. 
        # If Dal is approx 100kcal/100g (just example)
        # 1 bowl should be ~250 kcal
        # 2 katori should be ~300 kcal (2 * 150)
        
        print("\nDONE")

    finally:
        db.close()

if __name__ == "__main__":
    test_flow()
