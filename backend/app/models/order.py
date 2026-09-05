from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime
from datetime import datetime
from app.db.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    razorpay_order_id = Column(String, unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String, nullable=True, index=True)
    customer_name = Column(String, default="Ishita Gupta")
    customer_email = Column(String, default="ishitagupta0811@gmail.com")
    subtotal_paise = Column(Integer, nullable=False)
    currency = Column(String, default="INR")
    items_json = Column(JSON, nullable=False)  # Array of { product_id, title, price, quantity, image_url }
    ai_attributed = Column(Boolean, default=False)
    ai_recommendation_type = Column(String, nullable=True)  # 'upsell', 'cross_sell', 'wishlist_recovery', or None
    is_seed = Column(Boolean, default=False)
    status = Column(String, default="created")  # 'created', 'paid', 'cancelled', 'failed'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
