from backend.database import engine
from sqlalchemy import text

def add_micros_column():
    with engine.connect() as conn:
        try:
            # Check if column exists (naive check or just try-catch)
            try:
                conn.execute(text("SELECT micros FROM food_items LIMIT 1"))
                print("Column 'micros' already exists.")
            except Exception:
                print("Adding 'micros' column...")
                # SQLite doesn't support JSON type natively, use JSON or TEXT. SQLAlchemy uses JSON type which maps to JSON storage if supported or Text.
                # In SQLite ALTER TABLE, we just add the column.
                conn.execute(text("ALTER TABLE food_items ADD COLUMN micros JSON"))
                print("Column 'micros' added successfully.")
                conn.commit()
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    add_micros_column()
