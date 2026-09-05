from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ProactiveTriggerRequestSchema(BaseModel):
    event_type: str  # 'add_to_bag', 'view_product', 'wishlist_add'
    product_id: Optional[str] = None
    cart_items: List[Dict[str, Any]] = Field(default_factory=list)
    wishlist_items: List[Dict[str, Any]] = Field(default_factory=list)
    session_id: Optional[str] = "sess_default"

class ExplanationSchema(BaseModel):
    headline: str
    rationale: str
    delta_price_label: Optional[str] = None

class ActionSchema(BaseModel):
    id: str
    label: str
    action_type: str
    payload: Optional[Dict[str, Any]] = Field(default_factory=dict)

class ProactiveRecommendationResponseSchema(BaseModel):
    recommendation_id: str
    type: str  # 'UPSELL', 'CROSS_SELL', 'WISHLIST_RECOVERY', 'SILENT'
    confidence_score: float
    product: Optional[Dict[str, Any]] = None
    explanation: Optional[ExplanationSchema] = None
    quick_actions: List[ActionSchema] = Field(default_factory=list)
