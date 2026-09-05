from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from app.db.database import get_db
from app.models.order import Order
from app.services.razorpay_service import razorpay_service

router = APIRouter(tags=["Checkout & Orders"])

class CartItemDTO(BaseModel):
    product_id: str
    title: str
    price: float
    quantity: int = 1
    image_url: Optional[str] = None

class CreateOrderRequest(BaseModel):
    items: List[CartItemDTO]
    customer_name: Optional[str] = "Ishita Gupta"
    customer_email: Optional[str] = "ishitagupta0811@gmail.com"
    ai_attributed: Optional[bool] = False
    ai_recommendation_type: Optional[str] = None  # 'upsell', 'cross_sell', 'wishlist_recovery', or None

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@router.post("/checkout/create-order")
def create_order(req: CreateOrderRequest, db: Session = Depends(get_db)):
    if not req.items or len(req.items) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart items cannot be empty")

    total_amount_inr = sum(item.price * item.quantity for item in req.items)
    subtotal_paise = int(round(total_amount_inr * 100))

    # Generate order from Razorpay Service
    rp_order = razorpay_service.create_order(amount_paise=subtotal_paise, currency="INR")
    razorpay_order_id = rp_order["id"]

    # Convert items to JSON dict format
    items_json = [item.dict() for item in req.items]

    # Insert Order record in DB with status='created'
    db_order = Order(
        razorpay_order_id=razorpay_order_id,
        customer_name=req.customer_name or "Ishita Gupta",
        customer_email=req.customer_email or "ishitagupta0811@gmail.com",
        subtotal_paise=subtotal_paise,
        currency="INR",
        items_json=items_json,
        ai_attributed=bool(req.ai_attributed),
        ai_recommendation_type=req.ai_recommendation_type,
        is_seed=False,
        status="created",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    return {
        "success": True,
        "order_id": razorpay_order_id,
        "amount": subtotal_paise,
        "amount_inr": total_amount_inr,
        "currency": "INR",
        "key_id": rp_order["key_id"],
        "customer": {
            "name": db_order.customer_name,
            "email": db_order.customer_email
        },
        "items": items_json
    }

@router.post("/checkout/verify-payment")
def verify_payment(req: VerifyPaymentRequest, db: Session = Depends(get_db)):
    is_valid = razorpay_service.verify_payment_signature(
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id,
        razorpay_signature=req.razorpay_signature
    )

    db_order = db.query(Order).filter(Order.razorpay_order_id == req.razorpay_order_id).first()

    if not is_valid:
        if db_order:
            db_order.status = "failed"
            db_order.updated_at = datetime.utcnow()
            db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Razorpay HMAC signature verification")

    if db_order:
        db_order.status = "paid"
        db_order.razorpay_payment_id = req.razorpay_payment_id
        db_order.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_order)

    return {
        "success": True,
        "message": "Payment verified successfully",
        "razorpay_order_id": req.razorpay_order_id,
        "razorpay_payment_id": req.razorpay_payment_id,
        "status": "paid"
    }

@router.get("/orders")
def get_all_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return [
        {
            "id": order.id,
            "razorpay_order_id": order.razorpay_order_id,
            "razorpay_payment_id": order.razorpay_payment_id,
            "customer_name": order.customer_name,
            "customer_email": order.customer_email,
            "subtotal_paise": order.subtotal_paise,
            "subtotal_inr": round(order.subtotal_paise / 100.0, 2),
            "currency": order.currency,
            "items_json": order.items_json,
            "ai_attributed": order.ai_attributed,
            "ai_recommendation_type": getattr(order, 'ai_recommendation_type', None),
            "is_seed": getattr(order, 'is_seed', False),
            "status": order.status,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "updated_at": order.updated_at.isoformat() if order.updated_at else None
        }
        for order in orders
    ]
