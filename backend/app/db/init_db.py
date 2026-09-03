from app.db.database import engine, Base
from app.db.csv_importer import import_csv_catalog

def init_db():
    Base.metadata.create_all(bind=engine)
    import_csv_catalog()

if __name__ == "__main__":
    init_db()
