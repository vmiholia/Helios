from backend import services, database, models, main
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_dashboard_aggregation():
    db = database.SessionLocal()
    try:
        print("\n--- Test 5: Dashboard Aggregation ---")
        
        # 1. Log "100g Arhar Dal" (known to have micros now)
        print("> Logging '100g Arhar Dal'...")
        response = client.post("/log", json={"raw_text": "100g Arhar Dal"})
        assert response.status_code == 200
        data = response.json()
        print(f"Logged Entry ID: {data['id']}")
        
        # 2. Get Dashboard
        print("\n> Fetching Dashboard...")
        dash_res = client.get("/dashboard")
        assert dash_res.status_code == 200
        dash_data = dash_res.json()
        
        totals = dash_data["totals"]
        print(f"Total Micros: {totals.get('micros')}")
        
        # Verify specific micro exists and is > 0
        micros = totals.get("micros", {})
        if micros.get("potassium_mg", 0) > 0:
            print("✅ Dashboard correctly aggregates micros (Potassium detected).")
        else:
            print("❌ Dashboard failed to aggregate micros.")

    finally:
        db.close()

if __name__ == "__main__":
    test_dashboard_aggregation()
