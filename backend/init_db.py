from .database import engine, Base, SessionLocal
from . import models

def seed_portion_units(db):
    units = [
        {"name": "katori", "weight_in_grams": 150, "description": "Standard Indian bowl (150ml)"},
        {"name": "bowl", "weight_in_grams": 250, "description": "Large bowl (250ml)"},
        {"name": "plate", "weight_in_grams": 300, "description": "Standard dinner plate"},
        {"name": "cup", "weight_in_grams": 240, "description": "Standard US cup"},
        {"name": "tablespoon", "weight_in_grams": 15, "description": "Standard tablespoon"},
        {"name": "teaspoon", "weight_in_grams": 5, "description": "Standard teaspoon"},
        {"name": "glass", "weight_in_grams": 200, "description": "Standard glass (200ml)"},
        {"name": "slice", "weight_in_grams": 30, "description": "Standard slice of bread"},
        {"name": "piece", "weight_in_grams": 50, "description": "Generic piece size"},
        {"name": "ladle", "weight_in_grams": 150, "description": "Standard serving spoon"}
    ]
    
    for unit_data in units:
        existing = db.query(models.PortionUnit).filter(models.PortionUnit.name == unit_data["name"]).first()
        if not existing:
            print(f"Seeding unit: {unit_data['name']}")
            unit = models.PortionUnit(**unit_data)
            db.add(unit)
    
    db.commit()

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Seeding data...")
    db = SessionLocal()
    try:
        seed_portion_units(db)
    finally:
        db.close()
        
    print("Tables created and seeded successfully.")

if __name__ == "__main__":
    init_db()
