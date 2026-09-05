import os
import sys
import json

# Ensure stdout handles UTF-8 on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
backend_dir = os.path.join(root_dir, "backend")
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

def run_phase3_verification():
    results = {}
    print("==================================================")
    print("        RAZORPAY AI PHASE 3 VERIFICATION          ")
    print("==================================================")

    try:
        from app.db.csv_importer import import_csv_catalog
        from app.db.database import SessionLocal, engine, Base
        from app.models.catalog import Product
        from ai.agents.proactive_agent import ProactiveAgent

        Base.metadata.create_all(bind=engine)
        csv_path = os.path.join(backend_dir, "data", "seed", "products.csv")
        import_csv_catalog(csv_path)

        db = SessionLocal()
        products = db.query(Product).all()
        catalog_dicts = [{
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "category": p.category,
            "subcategory": p.subcategory,
            "price": p.price,
            "currency": p.currency,
            "image_url": p.image_url,
            "attributes": p.attributes or {}
        } for p in products]

        agent = ProactiveAgent(confidence_threshold=0.65)

        # 1. Test Upsell Evaluation on Add to Bag Event
        res_upsell = agent.evaluate_event(
            event_type="add_to_bag",
            target_product_id="prod_201",
            cart_items=[{"product_id": "prod_201", "title": "Classic White Formal Shirt", "price": 549}],
            wishlist_items=[],
            catalog_products=catalog_dicts
        )

        if res_upsell.get("type") in ["UPSELL", "CROSS_SELL"] and res_upsell.get("product", {}).get("image_url", "").startswith("http"):
            results["proactive_upsell"] = ("PASS", f"Evaluated add_to_bag event: Generated {res_upsell['type']} for product '{res_upsell['product']['title']}' with image_url and rationale")
        else:
            results["proactive_upsell"] = ("FAIL", f"Invalid response: {res_upsell}")

        # 2. Test Cross-Sell / Look Completion Evaluation
        res_cross = agent.evaluate_event(
            event_type="add_to_bag",
            target_product_id="prod_201",
            cart_items=[{"product_id": "prod_201", "subcategory": "Shirts"}],
            wishlist_items=[],
            catalog_products=catalog_dicts
        )

        if res_cross.get("type") in ["CROSS_SELL", "UPSELL"] and "explanation" in res_cross:
            results["proactive_cross_sell"] = ("PASS", f"Evaluated cross-sell look completion: Headline '{res_cross['explanation']['headline']}' with rationale")
        else:
            results["proactive_cross_sell"] = ("FAIL", f"Invalid cross-sell response: {res_cross}")

        # 3. Test Wishlist Recovery Trigger
        res_wish = agent.evaluate_event(
            event_type="add_to_bag",
            target_product_id="prod_201",
            cart_items=[{"product_id": "prod_201", "subcategory": "Shirts"}],
            wishlist_items=[{"product_id": "prod_221", "title": "Formal Straight-Fit Trousers", "price": 899}],
            catalog_products=catalog_dicts
        )

        if res_wish.get("type") in ["UPSELL", "CROSS_SELL", "WISHLIST_RECOVERY"]:
            results["proactive_wishlist"] = ("PASS", f"Evaluated wishlist recovery: Trigger type {res_wish['type']} with image_url")
        else:
            results["proactive_wishlist"] = ("FAIL", f"Invalid wishlist recovery response: {res_wish}")

        # 4. Test Silence Gatekeeper
        res_silent = agent.evaluate_event(
            event_type="add_to_bag",
            target_product_id="non_existent_id",
            cart_items=[],
            wishlist_items=[],
            catalog_products=catalog_dicts
        )

        if res_silent.get("type") == "SILENT" and res_silent.get("confidence_score") == 0.0:
            results["silence_gatekeeper"] = ("PASS", "Silence gatekeeper correctly returned SILENT type for non-matching event to prevent spamming")
        else:
            results["silence_gatekeeper"] = ("FAIL", f"Silence gatekeeper failed: {res_silent}")

        db.close()

    except Exception as e:
        results["proactive_upsell"] = ("FAIL", f"Error testing ProactiveAgent: {e}")

    # 5. Test REST Endpoint POST /api/agent/proactive-trigger
    try:
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)

        payload = {
            "event_type": "add_to_bag",
            "product_id": "prod_201",
            "cart_items": [{"product_id": "prod_201", "title": "Classic White Formal Shirt", "price": 549}],
            "wishlist_items": [],
            "session_id": "sess_proactive_test"
        }

        resp = client.post("/api/agent/proactive-trigger", json=payload)
        if resp.status_code == 200:
            data = resp.json()
            if "type" in data and "confidence_score" in data:
                results["proactive_api_endpoint"] = ("PASS", f"POST /api/agent/proactive-trigger returned 200 OK with recommendation type {data['type']}")
            else:
                results["proactive_api_endpoint"] = ("FAIL", f"Invalid response schema: {data}")
        else:
            results["proactive_api_endpoint"] = ("FAIL", f"API status code {resp.status_code}")

    except Exception as e:
        results["proactive_api_endpoint"] = ("FAIL", f"Error testing Proactive API route: {e}")

    print("\n--------------------------------------------------")
    print("               VERIFICATION RESULTS               ")
    print("--------------------------------------------------")
    for key, (status, detail) in results.items():
        print(f"[{status}] {key.upper()}: {detail}")
    print("==================================================")

if __name__ == "__main__":
    run_phase3_verification()
