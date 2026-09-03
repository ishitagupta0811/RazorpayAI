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
from app.models.catalog import Product, ProductRelation
from app.schemas.agent import (
    AgentChatRequestSchema, AgentChatResponseSchema, IntentParseRequestSchema
)
from ai.agents.reactive_agent import ReactiveAgent
from ai.agents.intent_parser import IntentParser

router = APIRouter(prefix="/agent", tags=["AI Agent"])
reactive_agent = ReactiveAgent()
intent_parser = IntentParser()

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
            "image_urls": p.image_urls or [],
            "attributes": p.attributes or {},
            "in_stock": p.in_stock
        })
    return catalog_list

@router.post("/chat", response_model=AgentChatResponseSchema)
def agent_chat(payload: AgentChatRequestSchema, db: Session = Depends(get_db)):
    """
    Reactive AI Agent endpoint:
    Ingests customer queries (e.g., 'formal shirt under ₹600'), processes constraints,
    queries catalog, and returns conversational response with matched product DTOs & image_url.
    """
    query_text = (payload.message or payload.query or "").strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="Query or message text cannot be empty")

    catalog_products = _get_catalog_as_dicts(db)
    
    # Format message history if present
    history_dicts = [{"role": m.role, "content": m.content} for m in payload.history]

    # Process query through Reactive Agent
    result = reactive_agent.process_query(
        query=query_text,
        catalog_products=catalog_products,
        chat_history=history_dicts
    )

    return result

@router.post("/parse-intent")
def parse_intent(payload: IntentParseRequestSchema):
    """Utility endpoint to extract structured intent from customer natural language query."""
    return intent_parser.parse_intent(payload.query)
