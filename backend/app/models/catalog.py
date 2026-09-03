from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, Text, Table
from sqlalchemy.orm import relationship
from app.db.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)

    products = relationship("Product", back_populates="category_rel")


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, ForeignKey("categories.id"), nullable=False)
    subcategory = Column(String, index=True, nullable=False)
    price = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    image_url = Column(String, nullable=False)
    image_urls = Column(JSON, default=list)  # List of additional image URLs
    attributes = Column(JSON, default=dict)  # {color, fabric, fit, style, occasions}
    in_stock = Column(Integer, default=50)

    category_rel = relationship("Category", back_populates="products")
    relations_from = relationship("ProductRelation", foreign_keys="[ProductRelation.source_id]", back_populates="source_product")
    relations_to = relationship("ProductRelation", foreign_keys="[ProductRelation.target_id]", back_populates="target_product")


class ProductRelation(Base):
    __tablename__ = "product_relations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_id = Column(String, ForeignKey("products.id"), nullable=False, index=True)
    target_id = Column(String, ForeignKey("products.id"), nullable=False, index=True)
    relation_type = Column(String, nullable=False)  # 'UPGRADE', 'COMPLEMENT', 'ALTERNATIVE'
    delta_price = Column(Float, default=0.0)
    slot = Column(String, nullable=True)  # e.g., 'Bottomwear', 'Footwear', 'Accessory'
    pitch = Column(Text, nullable=True)

    source_product = relationship("Product", foreign_keys=[source_id], back_populates="relations_from")
    target_product = relationship("Product", foreign_keys=[target_id], back_populates="relations_to")
