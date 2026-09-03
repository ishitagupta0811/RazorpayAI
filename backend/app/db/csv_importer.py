import csv
import os
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.models.catalog import Category, Product, ProductRelation

def import_csv_catalog(csv_file_path: str = None):
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    
    if not csv_file_path:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        csv_file_path = os.path.join(base_dir, "data", "seed", "products.csv")

    if not os.path.exists(csv_file_path):
        print(f"[CSV Importer] Warning: CSV file not found at {csv_file_path}")
        return

    try:
        # Clear existing data to ensure clean import
        db.query(ProductRelation).delete()
        db.query(Product).delete()
        db.query(Category).delete()
        db.commit()

        categories_map = {}
        products_list = []
        relations_list = []

        with open(csv_file_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                prod_id = row["product_id"].strip()
                if not prod_id:
                    continue

                cat_name = row.get("category", "Apparel").strip()
                cat_id = f"cat_{cat_name.lower()}"
                
                if cat_id not in categories_map:
                    categories_map[cat_id] = Category(
                        id=cat_id,
                        name=cat_name,
                        slug=cat_name.lower(),
                        description=f"{cat_name} product collection"
                    )

                # Parse occasions split by semicolon
                occasions_raw = row.get("occasions", "")
                occasions = [o.strip() for o in occasions_raw.split(";") if o.strip()]

                # Additional image URLs
                img2 = row.get("image_url_2", "").strip()
                image_urls = [row["image_url"].strip()]
                if img2:
                    image_urls.append(img2)

                attributes = {
                    "color": row.get("color", "").strip(),
                    "base_color": row.get("base_color", "").strip(),
                    "fabric": row.get("material_fabric", "").strip(),
                    "fit": row.get("fit_or_build", "").strip(),
                    "style": row.get("style", "").strip(),
                    "occasions": occasions
                }

                price = float(row.get("price", 0))
                stock = int(row.get("stock_qty", 50)) if row.get("stock_qty") else 50

                db_prod = Product(
                    id=prod_id,
                    title=row.get("title", "").strip(),
                    description=row.get("description", "").strip(),
                    category=cat_id,
                    subcategory=row.get("subcategory", "").strip(),
                    price=price,
                    currency=row.get("currency", "INR").strip(),
                    image_url=row.get("image_url", "").strip(),
                    image_urls=image_urls,
                    attributes=attributes,
                    in_stock=stock
                )
                products_list.append(db_prod)

                # Parse Upsell Relation
                upsell_id = row.get("upsell_to_product_id", "").strip()
                if upsell_id:
                    delta_p = float(row.get("upsell_delta_price", 0)) if row.get("upsell_delta_price") else 0.0
                    pitch = row.get("upsell_pitch", "").strip()
                    relations_list.append(ProductRelation(
                        source_id=prod_id,
                        target_id=upsell_id,
                        relation_type="UPGRADE",
                        delta_price=delta_p,
                        slot=row.get("subcategory", "").strip(),
                        pitch=pitch
                    ))

                # Parse Cross-sell Relations
                cross_ids_raw = row.get("cross_sell_product_ids", "").strip()
                cross_pitch = row.get("cross_sell_pitch", "").strip()
                if cross_ids_raw:
                    cross_ids = [c.strip() for c in cross_ids_raw.split("|") if c.strip()]
                    for target_c_id in cross_ids:
                        relations_list.append(ProductRelation(
                            source_id=prod_id,
                            target_id=target_c_id,
                            relation_type="COMPLEMENT",
                            delta_price=0.0,  # Will be populated from target price
                            slot="Complementary Item",
                            pitch=cross_pitch
                        ))

        # Insert into DB
        for cat in categories_map.values():
            db.add(cat)
        db.commit()

        for prod in products_list:
            db.add(prod)
        db.commit()

        for rel in relations_list:
            db.add(rel)
        db.commit()

        print(f"[CSV Importer] Successfully imported {len(products_list)} products, {len(categories_map)} categories, and {len(relations_list)} relationship edges from CSV!")

    except Exception as e:
        print(f"[CSV Importer] Error during import: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_csv_catalog()
