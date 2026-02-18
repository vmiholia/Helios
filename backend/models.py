from sqlalchemy import Column, Integer, String, DateTime, JSON
from .database import Base
from datetime import datetime

class Entry(Base):
    __tablename__ = "entries"

    id = Column(Integer, primary_key=True, index=True)
    raw_text = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    ingested_at = Column(DateTime, nullable=True) # Per PRD: Strict Timestamp
    
    # Store Macros as JSON {calories, protein, carbs, fats, water_ml}
    macros = Column(JSON, nullable=True) 

class DailyGoal(Base):
    __tablename__ = "daily_goals"

    date = Column(String, primary_key=True, index=True) # YYYY-MM-DD
    calorie_target = Column(Integer, default=2000)
    protein_target = Column(Integer, default=150)
    water_target_ml = Column(Integer, default=3000)

class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    
    # Base macros per 100g/ml
    calories_per_100 = Column(Integer, default=0)
    protein_per_100 = Column(Integer, default=0)
    carbs_per_100 = Column(Integer, default=0)
    fats_per_100 = Column(Integer, default=0)
    
    # Full Micronutrient Profile (JSON)
    micros = Column(JSON, nullable=True)
    
    default_unit = Column(String, default="g") # 'g' or 'ml'
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    source = Column(String, default="user_log") # 'user_log', 'seed', 'manual'

class PortionUnit(Base):
    __tablename__ = "portion_units"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False) # 'katori', 'bowl', 'tablespoon'
    weight_in_grams = Column(Integer, nullable=False) # Standard conversion
    description = Column(String, nullable=True)
