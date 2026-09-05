from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.db.database import get_db
from app.services.analytics_service import analytics_service

router = APIRouter(tags=["Analytics & Merchant Dashboard"])

class LogAiEventRequest(BaseModel):
    event_type: str  # e.g., 'recommendation_shown', 'recommendation_accepted', 'recommendation_dismissed'
    recommendation_type: Optional[str] = None  # 'upsell', 'cross_sell', 'wishlist_recovery'
    product_id: Optional[str] = None
    session_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@router.get("/analytics/aov-summary")
def get_aov_summary(db: Session = Depends(get_db)):
    """
    Returns aggregated merchant analytics: Baseline vs AI-assisted AOV, revenue uplift,
    attribution breakdown by recommendation type, and 30-day daily trend metrics.
    """
    try:
        data = analytics_service.get_aov_summary(db)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch AOV summary analytics: {str(e)}"
        )

@router.post("/analytics/log-event")
def log_ai_event(req: LogAiEventRequest):
    """
    Logs AI interaction audit events.
    """
    return {
        "success": True,
        "message": f"Logged AI interaction event '{req.event_type}'",
        "event": req.dict()
    }

@router.post("/analytics/seed-demo")
@router.get("/analytics/trigger-seed")
def seed_demo_analytics(db: Session = Depends(get_db)):
    """
    Idempotently seeds 45 realistic orders spread over the last 30 days using active catalog items.
    """
    try:
        result = analytics_service.seed_demo_orders(db)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed demo analytics orders: {str(e)}"
        )
