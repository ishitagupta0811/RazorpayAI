from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ProductAttributeSchema(BaseModel):
    color: Optional[str] = None
    fabric: Optional[str] = None
    fit: Optional[str] = None
    style: Optional[str] = None
    occasions: List[str] = Field(default_factory=list)

class ProductRelationSchema(BaseModel):
    target_id: str
    target_title: Optional[str] = None
    target_image_url: Optional[str] = None
    target_price: Optional[float] = None
    relation_type: str  # UPGRADE, COMPLEMENT, ALTERNATIVE
    delta_price: float = 0.0
    slot: Optional[str] = None
    pitch: Optional[str] = None

    class Config:
        from_attributes = True

class ProductSchema(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str
    subcategory: str
    price: float
    currency: str = "INR"
    image_url: str
    image_urls: List[str] = Field(default_factory=list)
    attributes: Dict[str, Any] = Field(default_factory=dict)
    in_stock: int = 50
    upgrades: List[ProductRelationSchema] = Field(default_factory=list)
    complements: List[ProductRelationSchema] = Field(default_factory=list)

    class Config:
        from_attributes = True

class CategorySchema(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class CatalogFilterSchema(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None
    search: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    style: Optional[str] = None
    fabric: Optional[str] = None
