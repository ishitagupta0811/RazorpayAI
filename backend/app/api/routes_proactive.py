import sys
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

# Ensure AI module is in Python path
root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app.db.database import get_db
from app.models.catalog import Product
from app.schemas.proactive import (
    ProactiveTriggerRequestSchema, ProactiveRecommendationResponseSchema
)
from ai.agents.proactive_agent import ProactiveAgent

router = APIRouter(prefix="/agent", tags=["Proactive AI Agent"])
proactive_agent = ProactiveAgent()

def _get_catalog_as_dicts(db: Session) -> List[Dict[str, Any]]:
    products = db.query(Product).all()
    catalog_list = []
    for p in products:
        catalog_list.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "category": p.category,
            "subcategory": p.subcategory,
            "price": p.price,
            "currency": p.currency,
            "image_url": p.image_url,
            "attributes": p.attributes or {},
            "in_stock": p.in_stock
        })
    return catalog_list

@router.post("/proactive-trigger", response_model=ProactiveRecommendationResponseSchema)
def proactive_trigger(payload: ProactiveTriggerRequestSchema, db: Session = Depends(get_db)):
    """
    Proactive AI Sales Agent endpoint:
    Evaluates customer shopping actions (add_to_bag, view_product, wishlist_add),
    computes Upsells, Cross-Sells, or Wishlist Recoveries, enforces silence gatekeeper,
    and returns structured recommendation contract containing product image_url and rationale.
    """
    catalog_products = _get_catalog_as_dicts(db)

    result = proactive_agent.evaluate_event(
        event_type=payload.event_type,
        target_product_id=payload.product_id or "",
        cart_items=payload.cart_items,
        wishlist_items=payload.wishlist_items,
        catalog_products=catalog_products
    )

    return result
