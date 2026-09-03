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

def run_phase2_verification():
    results = {}
    print("==================================================")
    print("        RAZORPAY AI PHASE 2 VERIFICATION          ")
    print("==================================================")

    # 1. Intent Parser Verification
    try:
        from ai.agents.intent_parser import IntentParser
        parser = IntentParser()

        q1 = "I need a formal shirt under ₹600 for an interview"
        i1 = parser.parse_intent(q1)
        if i1.get("max_price") == 600.0 and i1.get("subcategory") == "Shirts" and i1.get("style") == "Formal":
            results["intent_parser_budget"] = ("PASS", f"Successfully extracted max_price=600, subcategory=Shirts, style=Formal from '{q1}'")
        else:
            results["intent_parser_budget"] = ("FAIL", f"Parsed intent: {i1}")

        q2 = "Build me a complete formal outfit under ₹2500"
        i2 = parser.parse_intent(q2)
        if i2.get("max_price") == 2500.0 and i2.get("is_outfit_request") is True:
            results["intent_parser_outfit"] = ("PASS", f"Successfully extracted max_price=2500 and is_outfit_request=True from '{q2}'")
        else:
            results["intent_parser_outfit"] = ("FAIL", f"Parsed intent: {i2}")

    except Exception as e:
        results["intent_parser_budget"] = ("FAIL", f"Error testing IntentParser: {e}")

    # 2. Reactive Agent & Catalog Matcher Verification
    try:
        from app.db.csv_importer import import_csv_catalog
        from app.db.database import SessionLocal, engine, Base
        from app.models.catalog import Product
        from ai.agents.reactive_agent import ReactiveAgent

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

        agent = ReactiveAgent()

        # Query 1: Budget & Category
        res1 = agent.process_query("formal shirt under ₹600", catalog_dicts)
        matched_prods = res1.get("products", [])
        has_valid_images = all(p.get("image_url", "").startswith("http") for p in matched_prods)

        if len(matched_prods) > 0 and all(p["price"] <= 600 for p in matched_prods) and has_valid_images:
            results["reactive_agent_match"] = ("PASS", f"Agent matched {len(matched_prods)} formal shirts <= INR 600 with valid image_url strings")
        else:
            results["reactive_agent_match"] = ("FAIL", f"Matched products: {len(matched_prods)}")

        # Query 2: Explainable response check
        reply = res1.get("reply", "")
        if reply and len(reply) > 20:
            results["reactive_agent_reply"] = ("PASS", f"Agent generated explainable AI response: '{reply[:90]}...'")
        else:
            results["reactive_agent_reply"] = ("FAIL", f"Agent reply empty or short: '{reply}'")

        # Query 3: Quick action pills check
        actions = res1.get("quick_actions", [])
        if len(actions) > 0:
            results["reactive_agent_actions"] = ("PASS", f"Agent generated {len(actions)} one-tap quick action pills (e.g. '{actions[0]['label']}')")
        else:
            results["reactive_agent_actions"] = ("FAIL", "Quick actions empty")

        db.close()

    except Exception as e:
        results["reactive_agent_match"] = ("FAIL", f"Error testing ReactiveAgent: {e}")

    # 3. Agent API Route verification
    try:
        from fastapi.testclient import TestClient
        from app.main import app

        client = TestClient(app)

        # Test POST /api/agent/chat
        chat_payload = {
            "query": "formal shirt under 600",
            "session_id": "sess_test_123",
            "history": []
        }
        resp = client.post("/api/agent/chat", json=chat_payload)
        if resp.status_code == 200:
            data = resp.json()
            if "reply" in data and "products" in data and "quick_actions" in data:
                results["agent_api_chat"] = ("PASS", f"POST /api/agent/chat returned 200 OK with {len(data['products'])} products and quick_actions")
            else:
                results["agent_api_chat"] = ("FAIL", f"Invalid response schema: {data}")
        else:
            results["agent_api_chat"] = ("FAIL", f"API status code {resp.status_code}")

        # Test POST /api/agent/parse-intent
        resp_intent = client.post("/api/agent/parse-intent", json={"query": "party wear under 1500"})
        if resp_intent.status_code == 200:
            results["agent_api_intent"] = ("PASS", "POST /api/agent/parse-intent returned 200 OK with extracted intent parameters")
        else:
            results["agent_api_intent"] = ("FAIL", f"API status code {resp_intent.status_code}")

    except Exception as e:
        results["agent_api_chat"] = ("FAIL", f"Error testing Agent API routes: {e}")

    print("\n--------------------------------------------------")
    print("               VERIFICATION RESULTS               ")
    print("--------------------------------------------------")
    for key, (status, detail) in results.items():
        print(f"[{status}] {key.upper()}: {detail}")
    print("==================================================")

if __name__ == "__main__":
    run_phase2_verification()
