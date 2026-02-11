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
