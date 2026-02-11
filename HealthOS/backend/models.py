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
