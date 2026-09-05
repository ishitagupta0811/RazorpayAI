from app.db.database import engine, Base
from app.db.csv_importer import import_csv_catalog

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Auto-migrate SQLite schema for orders table if columns are missing
    try:
        import sqlite3
        import os
        db_file = os.path.join(os.path.dirname(__file__), "..", "..", "catalog.db")
        if os.path.exists(db_file):
            conn = sqlite3.connect(db_file)
            cursor = conn.cursor()
            cols = [info[1] for info in cursor.execute("PRAGMA table_info(orders)").fetchall()]
            if cols:
                if "ai_recommendation_type" not in cols:
                    cursor.execute("ALTER TABLE orders ADD COLUMN ai_recommendation_type TEXT")
                if "is_seed" not in cols:
                    cursor.execute("ALTER TABLE orders ADD COLUMN is_seed BOOLEAN DEFAULT 0")
                conn.commit()
            conn.close()
    except Exception as e:
        print("Orders table schema migration note:", e)

    import_csv_catalog()

if __name__ == "__main__":
    init_db()
