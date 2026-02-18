from backend import services, database, models
from sqlalchemy.orm import Session
import time

def test_specificity_and_micros():
    db = database.SessionLocal()
    try:
        print("\n--- Test 4: Specificity & Micros ---")
        
        # 1. Learn "Arhar Dal"
        print("> Learning '100g Arhar Dal'...")
        res_arhar = services.process_entry_text("100g Arhar Dal", db)
        item_arhar = db.query(models.FoodItem).filter(models.FoodItem.name == "Arhar Dal").first()
        
        if item_arhar:
            print(f"✅ Learned 'Arhar Dal': {item_arhar.calories_per_100} kcal/100g")
            print(f"   Micros: {item_arhar.micros}")
        else:
            print(f"❌ Failed to learn 'Arhar Dal'")

        # 2. Learn "Masoor Dal"
        print("\n> Learning '100g Masoor Dal'...")
        res_masoor = services.process_entry_text("100g Masoor Dal", db)
        item_masoor = db.query(models.FoodItem).filter(models.FoodItem.name == "Masoor Dal").first()
        
        if item_masoor:
            print(f"✅ Learned 'Masoor Dal': {item_masoor.calories_per_100} kcal/100g")
            print(f"   Micros: {item_masoor.micros}")
        else:
            print(f"❌ Failed to learn 'Masoor Dal'")

        # 3. Verify Distinction
        if item_arhar and item_masoor and item_arhar.id != item_masoor.id:
            print("\n✅ SUCCESS: 'Arhar Dal' and 'Masoor Dal' are stored as distinct items.")
        else:
             print("\n❌ FAILURE: Items were not distinguished correctly.")

    finally:
        db.close()

if __name__ == "__main__":
    test_specificity_and_micros()
