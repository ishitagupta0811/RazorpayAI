"""
Reactive AI Sales Co-Pilot Agent
Handles customer-initiated natural language queries, budget limits, multi-turn clarification,
and returns explainable product recommendations with images.
"""

import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from ai.agents.intent_parser import IntentParser
from ai.agents.guardrails import Guardrails

load_dotenv()

class ReactiveAgent:
    def __init__(self):
        self.intent_parser = IntentParser()
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.client = None

        if self.api_key and not self.api_key.startswith("your_"):
            try:
                import anthropic
                self.client = anthropic.Anthropic(api_key=self.api_key)
                print("[DIAGNOSTIC] [ReactiveAgent] Anthropic Claude API client initialized successfully.")
            except Exception as e:
                print(f"[DIAGNOSTIC] [ReactiveAgent] Anthropic SDK initialization failed: {e}. Will use Rule-Based Fallback Engine.")
        else:
            print("[DIAGNOSTIC] [ReactiveAgent] ANTHROPIC_API_KEY missing or placeholder. Will use Rule-Based Fallback Engine.")

    def _categories_match(self, req_cat: Optional[str], prod_cat: Optional[str]) -> bool:
        if not req_cat or not prod_cat:
            return True
        rc = req_cat.lower()
        pc = prod_cat.lower()
        if rc in pc or pc in rc:
            return True
        if "footwear" in rc and ("footwear" in pc or "shoe" in pc):
            return True
        if "apparel" in rc and ("apparel" in pc or "cloth" in pc):
            return True
        if "access" in rc and ("access" in pc):
            return True
        return False

    def process_query(
        self,
        query: str,
        catalog_products: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Processes a customer reactive query against catalog products with AI Guardrails.
        Returns conversational reply, matched product DTOs, and quick action pills.
        """
        # Guardrail Step 1: Sanitize User Query to neutralize prompt injection
        safe_query = Guardrails.sanitize_user_input(query)

        parsed_intent = self.intent_parser.parse_intent(safe_query)
        max_price = parsed_intent.get("max_price")
        req_category = parsed_intent.get("category")
        req_subcat = parsed_intent.get("subcategory")
        req_style = parsed_intent.get("style")
        req_occasion = parsed_intent.get("occasion")

        # 1. Filter catalog based on extracted constraints
        matched_products = []
        for p in catalog_products:
            price = float(p.get("price", 0))
            attrs = p.get("attributes", {})
            cat = p.get("category", "")
            subcat = p.get("subcategory", "")
            style = attrs.get("style", "")
            occs = attrs.get("occasions", [])

            # Hard budget check
            if max_price is not None and price > max_price:
                continue

            # Main Category check if specified (e.g. Footwear MUST NOT match Apparel/Shirts)
            if req_category and not self._categories_match(req_category, cat):
                continue

            # Subcategory check if specified
            if req_subcat and subcat.lower() != req_subcat.lower() and req_subcat.lower() not in p.get("title", "").lower():
                continue

            # Style check if specified
            if req_style and req_style.lower() not in style.lower():
                continue

            # Occasion check if specified
            if req_occasion and not any(req_occasion.lower() in o.lower() for o in occs):
                continue

            matched_products.append(p)

        # Fallback 1: If strict occasion/style filtering returns empty, relax style/occasion BUT NEVER relax main category
        if not matched_products:
            for p in catalog_products:
                price = float(p.get("price", 0))
                cat = p.get("category", "")
                subcat = p.get("subcategory", "")

                if max_price is not None and price > max_price:
                    continue
                if req_category and not self._categories_match(req_category, cat):
                    continue
                if req_subcat and subcat.lower() != req_subcat.lower() and req_subcat.lower() not in p.get("title", "").lower():
                    continue

                matched_products.append(p)

        # Fallback 2: Final Fallback if still empty and no category/subcategory was requested
        if not matched_products and not req_category and not req_subcat:
            if max_price is not None:
                matched_products = [p for p in catalog_products if float(p.get("price", 0)) <= max_price]
            else:
                matched_products = catalog_products[:6]

        # Guardrail Step 2: Enforce Strict Financial Budget Ceiling
        top_matches = Guardrails.enforce_budget_ceiling(matched_products[:6], max_price)

        # 2. Synthesize Explainable AI Response
        conversational_reply = self._generate_explanation(safe_query, parsed_intent, top_matches)
        
        # Guardrail Step 3: Redact PII from outgoing response text
        conversational_reply = Guardrails.redact_pii(conversational_reply)

        # 3. Generate One-Tap Quick Actions
        quick_actions = self._generate_quick_actions(parsed_intent, top_matches)

        return {
            "reply": conversational_reply,
            "intent": parsed_intent,
            "products": top_matches,
            "quick_actions": quick_actions
        }

    def _generate_explanation(
        self,
        query: str,
        intent: Dict[str, Any],
        matched_products: List[Dict[str, Any]]
    ) -> str:
        """Uses Claude API if key present, otherwise generates rich rule-based explanation."""
        if self.client and len(matched_products) > 0:
            print("[DIAGNOSTIC] [ReactiveAgent] Attempting reasoning path: Anthropic Claude API (claude-3-haiku-20240307)")
            try:
                products_summary = "\n".join([
                    f"- {p['title']} (₹{p['price']}): {p.get('description', '')[:100]}... [Fabric/Material: {p.get('attributes', {}).get('fabric', 'N/A')}, Fit: {p.get('attributes', {}).get('fit', 'N/A')}]"
                    for p in matched_products[:4]
                ])

                prompt = (
                    f"You are a helpful, professional AI Sales Assistant for a premium fashion store.\n"
                    f"Customer query: '{query}'\n"
                    f"Target category: {intent.get('category') or intent.get('subcategory') or 'Fashion'}\n"
                    f"Extracted budget constraint: ₹{intent.get('max_price') or 'No limit'}\n"
                    f"Extracted style/occasion: {intent.get('style') or intent.get('occasion') or 'General'}\n\n"
                    f"Matched products in catalog:\n{products_summary}\n\n"
                    f"Write a concise, warm 2-3 sentence response introducing these recommendations. Explain WHY they fit the customer's request and budget. Mention specific key qualities like fabric, material, fit, or style."
                )

                response = self.client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=200,
                    messages=[{"role": "user", "content": prompt}]
                )
                print("[DIAGNOSTIC] [ReactiveAgent] Reasoning path executed: Anthropic Claude API (SUCCESS)")
                return response.content[0].text.strip()
            except Exception as e:
                print(f"[DIAGNOSTIC] [ReactiveAgent] Reasoning path failed via Anthropic Claude API: {e}. Falling back to Rule-Based Engine...")

        # Rule-based fallback explanation
        reason = "No API Client initialized" if not self.client else "No matched products"
        print(f"[DIAGNOSTIC] [ReactiveAgent] Reasoning path executed: Rule-Based Fallback Engine (Reason: {reason})")

        count = len(matched_products)
        cat_or_subcat = intent.get("category") or intent.get("subcategory") or ""
        cat_label_str = f" {cat_or_subcat}" if cat_or_subcat else ""
        budget_str = f" under ₹{int(intent['max_price']):,}" if intent.get("max_price") else ""
        style_str = f" for {intent['style'] or intent['occasion']}" if (intent.get("style") or intent.get("occasion")) else ""

        if count > 0:
            first_p = matched_products[0]
            attrs = first_p.get("attributes", {})
            fabric_info = f" featuring {attrs.get('fabric', 'quality material')}" if attrs.get("fabric") else ""
            return (
                f"I found {count} great{cat_label_str} option{'s' if count > 1 else ''}{budget_str}{style_str}! "
                f"For instance, the {first_p['title']} (₹{first_p['price']:,}){fabric_info} delivers a sharp, comfortable fit. "
                f"Take a look at the curated items displayed below."
            )
        else:
            return f"I couldn't find exact matches{cat_label_str}{budget_str}. Here are some of our popular recommendations you might like!"

    def _generate_quick_actions(
        self,
        intent: Dict[str, Any],
        matched_products: List[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        actions = []
        
        if not intent.get("max_price"):
            actions.append({"id": "filter_1200", "label": "Under ₹1,200", "query": "under ₹1200"})
            actions.append({"id": "filter_2000", "label": "Under ₹2,000", "query": "under ₹2000"})

        cat = intent.get("category")
        subcat = intent.get("subcategory")

        if cat == "Footwear" or subcat in ["Heels", "Flats", "Sneakers", "Sandals"]:
            actions.append({"id": "show_heels", "label": "Formal Block Heels", "query": "formal block heels for interview"})
            actions.append({"id": "show_flats", "label": "Ballerina Flats", "query": "ballerina flats for office"})
        elif cat == "Apparel" or subcat in ["Shirts", "Tops", "T-Shirts"]:
            actions.append({"id": "show_trousers", "label": "Show matching trousers", "query": "matching trousers"})
            actions.append({"id": "build_outfit", "label": "Complete formal look", "query": "build me a complete formal outfit under ₹2500"})

        if not any(a["id"] == "show_party" for a in actions):
            actions.append({"id": "show_party", "label": "Show Party Wear", "query": "party wear outfits"})

        return actions[:4]
