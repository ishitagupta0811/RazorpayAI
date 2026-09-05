"""
Proactive Sales Agent
Evaluates shopping events (add_to_bag, view_product, wishlist_add), computes upsells,
cross-sells, look completion, wishlist recovery, and enforces silence guardrails.
"""

import os
import uuid
from typing import List, Dict, Any, Optional
from ai.agents.decision_engine import DecisionEngine

class ProactiveAgent:
    def __init__(self, confidence_threshold: float = 0.65, max_cross_sells: int = 2):
        self.decision_engine = DecisionEngine(confidence_threshold=confidence_threshold)
        # Track sequential sales funnel lifecycle per product_id: "INIT" -> "UPSELL_DONE" -> "STOPPED"
        self.funnel_history: Dict[str, str] = {}
        # Track total cross-sells issued per shopping session (max 2)
        self.session_cross_sell_count: int = 0
        self.max_cross_sells: int = max_cross_sells

    def evaluate_event(
        self,
        event_type: str,
        target_product_id: str,
        cart_items: List[Dict[str, Any]],
        wishlist_items: List[Dict[str, Any]],
        catalog_products: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Sequential Sales Funnel Lifecycle:
        1. UPSELL FIRST: Recommend premium upgrade version of target product.
        2. CROSS-SELL SECOND: Recommend at most 1 or 2 cross-sell outfit items across the session.
        3. STOP PROACTIVE AGENT: After max 2 cross-sell recommendations, stop sending proactive popups completely!
        """
        # Reset cross-sell session counter if cart is completely emptied
        if not cart_items:
            self.session_cross_sell_count = 0
            self.funnel_history.clear()

        catalog_map = {p["id"]: p for p in catalog_products}
        target_product = catalog_map.get(target_product_id)

        if not target_product and cart_items:
            target_product = catalog_map.get(cart_items[-1].get("product_id") or cart_items[-1].get("id"))

        if not target_product:
            return self._silent_response()

        prod_id = target_product.get("id") or target_product_id
        current_state = self.funnel_history.get(prod_id, "INIT")

        # Explicit user response handlers to transition state
        if event_type in ["upsell_rejected", "upgrade_accepted"]:
            self.funnel_history[prod_id] = "UPSELL_DONE"
            current_state = "UPSELL_DONE"
        elif event_type in ["cross_sell_rejected", "cross_sell_accepted", "add_to_outfit", "reject_cross_sell", "stop_proactive"]:
            self.funnel_history[prod_id] = "STOPPED"
            self.session_cross_sell_count = self.max_cross_sells
            return self._silent_response()

        # If proactive agent has completed both stages for this product, STOP!
        if current_state == "STOPPED":
            return self._silent_response()

        # STAGE 1: UPSELL FIRST
        if current_state == "INIT":
            upsell_cand = self._evaluate_upsell(target_product, catalog_products)
            if upsell_cand:
                self.funnel_history[prod_id] = "UPSELL_DONE"
                return self.decision_engine.evaluate_candidates(
                    upsell_candidate=upsell_cand,
                    cross_sell_candidate=None,
                    wishlist_candidate=None,
                    event_type=event_type,
                    session_context={"cart": cart_items, "wishlist": wishlist_items}
                )
            else:
                # If no higher tier product exists, advance to UPSELL_DONE and proceed to Cross-Sell
                current_state = "UPSELL_DONE"
                self.funnel_history[prod_id] = "UPSELL_DONE"

        # STAGE 2: CROSS-SELL SECOND (Once UPSELL has been done)
        if current_state == "UPSELL_DONE":
            # Cap cross-sells at max 2 per session! Stop after 2 cross-sells.
            if self.session_cross_sell_count >= self.max_cross_sells:
                self.funnel_history[prod_id] = "STOPPED"
                return self._silent_response()

            cross_sell_cand = self._evaluate_cross_sell(target_product, cart_items, catalog_products)
            if cross_sell_cand:
                self.session_cross_sell_count += 1
                self.funnel_history[prod_id] = "STOPPED"
                return self.decision_engine.evaluate_candidates(
                    upsell_candidate=None,
                    cross_sell_candidate=cross_sell_cand,
                    wishlist_candidate=None,
                    event_type=event_type,
                    session_context={"cart": cart_items, "wishlist": wishlist_items}
                )
            else:
                self.funnel_history[prod_id] = "STOPPED"
                return self._silent_response()

        # STAGE 3: STOPPED (Safety Fallback)
        self.funnel_history[prod_id] = "STOPPED"
        return self._silent_response()

    def _evaluate_upsell(
        self,
        target_product: Dict[str, Any],
        catalog_products: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        target_price = float(target_product.get("price", 0))
        target_subcat = target_product.get("subcategory", "")
        target_cat = target_product.get("category", "")
        target_id = target_product.get("id")

        # 1. Search for higher-priced similar products in the exact same subcategory
        subcat_upgrades = []
        for p in catalog_products:
            if p.get("id") == target_id:
                continue
            if p.get("subcategory") == target_subcat:
                p_price = float(p.get("price", 0))
                if p_price > target_price:
                    subcat_upgrades.append(p)

        # Sort subcategory upgrades by price ascending (steps up to next tier!)
        subcat_upgrades.sort(key=lambda p: float(p.get("price", 0)))
        upgrades = subcat_upgrades

        # 2. If no higher price item in exact subcategory, search in same main category
        if not upgrades:
            cat_upgrades = []
            for p in catalog_products:
                if p.get("id") == target_id:
                    continue
                if p.get("category") == target_cat:
                    p_price = float(p.get("price", 0))
                    if p_price > target_price:
                        cat_upgrades.append(p)
            cat_upgrades.sort(key=lambda p: float(p.get("price", 0)))
            upgrades = cat_upgrades

        if not upgrades:
            return None

        # Select top upgrade candidate (the next higher price, premium version!)
        upgrade_p = upgrades[0]
        delta_price = float(upgrade_p.get("price", 0)) - target_price
        attrs = upgrade_p.get("attributes", {})
        fabric = attrs.get("fabric", "premium quality material")
        fit = attrs.get("fit", "structured fit")

        return {
            "recommendation_id": f"rec_upsell_{uuid.uuid4().hex[:6]}",
            "type": "UPSELL",
            "confidence_score": 0.92,
            "product": {
                "product_id": upgrade_p["id"],
                "title": upgrade_p["title"],
                "price": upgrade_p["price"],
                "image_url": upgrade_p["image_url"],
                "attributes": attrs
            },
            "explanation": {
                "headline": "Recommended Premium Upgrade",
                "rationale": f"For +₹{int(delta_price):,} more, upgrade to {upgrade_p['title']} featuring superior {fabric} and an upgraded {fit}.",
                "delta_price_label": f"+₹{int(delta_price):,}"
            },
            "quick_actions": [
                {
                    "id": "accept_upsell_replace",
                    "label": "Yes, upgrade & replace",
                    "action_type": "SWAP_CART_ITEM",
                    "payload": { "remove_id": target_id, "add_id": upgrade_p["id"] }
                },
                {
                    "id": "reject_upsell",
                    "label": "No, keep this",
                    "action_type": "DISMISS",
                    "payload": { "target_id": target_id }
                }
            ]
        }

    def _evaluate_cross_sell(
        self,
        target_product: Dict[str, Any],
        cart_items: List[Dict[str, Any]],
        catalog_products: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        target_subcat = target_product.get("subcategory", "")
        target_style = target_product.get("attributes", {}).get("style", "Formal")

        # Map complementary slot rules for outfit building
        complement_slot_map = {
            "Shirts": ["Trousers", "Heels", "Sneakers"],
            "Tops": ["Jeans", "Trousers", "Heels"],
            "T-Shirts": ["Jeans", "Sneakers"],
            "Trousers": ["Shirts", "Heels", "Tops"],
            "Jeans": ["T-Shirts", "Tops", "Sneakers"],
            "Heels": ["Shirts", "Trousers", "Tops"]
        }

        needed_slots = complement_slot_map.get(target_subcat, ["Trousers", "Heels", "Jeans", "Shirts"])
        cart_subcats = [c.get("subcategory") for c in cart_items if c.get("subcategory")]

        # Filter slot candidates not already in cart
        candidates = []
        for p in catalog_products:
            subcat = p.get("subcategory")
            if p.get("id") == target_product.get("id"):
                continue
            if subcat in needed_slots and subcat not in cart_subcats:
                p_style = p.get("attributes", {}).get("style", "")
                if target_style.lower() in p_style.lower() or not p_style:
                    candidates.append(p)

        # Fallback: any product in different subcategory
        if not candidates:
            for p in catalog_products:
                if p.get("id") != target_product.get("id") and p.get("subcategory") != target_subcat and p.get("subcategory") not in cart_subcats:
                    candidates.append(p)

        if not candidates:
            return None

        comp_p = candidates[0]
        comp_attrs = comp_p.get("attributes", {})

        return {
            "recommendation_id": f"rec_cross_{uuid.uuid4().hex[:6]}",
            "type": "CROSS_SELL",
            "confidence_score": 0.88,
            "product": {
                "product_id": comp_p["id"],
                "title": comp_p["title"],
                "price": comp_p["price"],
                "image_url": comp_p["image_url"],
                "attributes": comp_attrs
            },
            "explanation": {
                "headline": "Complete the Look (Cross-Sell Outfit)",
                "rationale": f"Pair your {target_product.get('title')} with the {comp_p['title']} to complete a flawless {target_style} outfit!",
                "delta_price_label": f"₹{int(comp_p['price']):,}"
            },
            "quick_actions": [
                {
                    "id": "add_to_outfit",
                    "label": "Add to outfit",
                    "action_type": "ADD_TO_CART",
                    "payload": { "product_id": comp_p["id"] }
                },
                {
                    "id": "reject_cross_sell",
                    "label": "Don't add",
                    "action_type": "STOP_PROACTIVE",
                    "payload": { "target_id": comp_p["id"] }
                }
            ]
        }

    def _evaluate_wishlist_recovery(
        self,
        target_product: Dict[str, Any],
        wishlist_items: List[Dict[str, Any]],
        catalog_products: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        if not wishlist_items:
            return None

        target_style = target_product.get("attributes", {}).get("style", "Formal")
        catalog_map = {p["id"]: p for p in catalog_products}

        matched_wish = None
        for w in wishlist_items:
            w_id = w.get("product_id") or w.get("id")
            if w_id and w_id in catalog_map:
                p = catalog_map[w_id]
                p_style = p.get("attributes", {}).get("style", "")
                if target_style.lower() in p_style.lower():
                    matched_wish = p
                    break

        if not matched_wish:
            return None

        return {
            "recommendation_id": f"rec_wish_{uuid.uuid4().hex[:6]}",
            "type": "WISHLIST_RECOVERY",
            "confidence_score": 0.78,
            "product": {
                "product_id": matched_wish["id"],
                "title": matched_wish["title"],
                "price": matched_wish["price"],
                "image_url": matched_wish["image_url"],
                "attributes": matched_wish.get("attributes", {})
            },
            "explanation": {
                "headline": "❤️ Wishlist Favorite Available",
                "rationale": f"The {matched_wish['title']} from your wishlist perfectly complements your current selection!",
                "delta_price_label": f"₹{int(matched_wish['price']):,}"
            },
            "quick_actions": [
                {
                    "id": "add_wishlist_to_bag",
                    "label": "Move Wishlist to Bag",
                    "action_type": "ADD_TO_CART",
                    "payload": { "product_id": matched_wish["id"] }
                }
            ]
        }

    def _silent_response(self) -> Dict[str, Any]:
        return {
            "recommendation_id": "rec_silent",
            "type": "SILENT",
            "confidence_score": 0.0,
            "product": None,
            "explanation": None,
            "quick_actions": []
        }
