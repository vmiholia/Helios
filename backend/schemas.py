from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

# Entry Schemas
class EntryBase(BaseModel):
    raw_text: str

class EntryCreate(EntryBase):
    date: Optional[str] = None # YYYY-MM-DD override

class Entry(EntryBase):
    id: int
    created_at: datetime
    ingested_at: Optional[datetime] = None
    macros: Optional[Dict] = None

    class Config:
        from_attributes = True

# Daily Goal Schemas
class DailyGoalBase(BaseModel):
    calorie_target: int
    protein_target: int
    water_target_ml: int

class DailyGoalCreate(DailyGoalBase):
    date: str # YYYY-MM-DD

class DailyGoal(DailyGoalBase):
    date: str

    class Config:
        from_attributes = True

# Food Item Schemas
class FoodItemBase(BaseModel):
    name: str
    calories_per_100: int
    protein_per_100: int
    carbs_per_100: int
    fats_per_100: int
    default_unit: str = "g"
    micros: Optional[Dict] = None

class FoodItemCreate(FoodItemBase):
    pass

class FoodItem(FoodItemBase):
    id: int
    created_at: datetime
    source: str

    class Config:
        from_attributes = True

# Portion Unit Schemas
class PortionUnitBase(BaseModel):
    name: str
    weight_in_grams: int
    description: Optional[str] = None

class PortionUnitCreate(PortionUnitBase):
    pass

class PortionUnit(PortionUnitBase):
    id: int

    class Config:
        from_attributes = True
