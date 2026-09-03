from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.catalog import Product, Category, ProductRelation
from app.schemas.catalog import ProductSchema, CategorySchema, ProductRelationSchema

router = APIRouter(prefix="/catalog", tags=["Catalog"])

@router.get("/categories", response_model=List[CategorySchema])
def list_categories(db: Session = Depends(get_db)):
    """Fetch all product categories"""
    categories = db.query(Category).all()
    return categories

@router.get("/styles", response_model=List[str])
def list_styles(db: Session = Depends(get_db)):
    """Fetch all distinct product styles"""
    products = db.query(Product).all()
    styles = set()
    for p in products:
        s = (p.attributes or {}).get("style")
        if s:
            styles.add(s)
    return sorted(list(styles))

@router.get("/occasions", response_model=List[str])
def list_occasions(db: Session = Depends(get_db)):
    """Fetch all distinct product occasions"""
    products = db.query(Product).all()
    occasions = set()
    for p in products:
        occs = (p.attributes or {}).get("occasions", [])
        for o in occs:
            occasions.add(o)
    return sorted(list(occasions))

@router.get("/products", response_model=List[ProductSchema])
def list_products(
    category: Optional[str] = Query(None, description="Filter by category ID"),
    subcategory: Optional[str] = Query(None, description="Filter by subcategory"),
    search: Optional[str] = Query(None, description="Search query string"),
    min_price: Optional[float] = Query(None, description="Minimum price limit"),
    max_price: Optional[float] = Query(None, description="Maximum price limit"),
    style: Optional[str] = Query(None, description="Filter by style attribute"),
    occasion: Optional[str] = Query(None, description="Filter by occasion attribute"),
    db: Session = Depends(get_db)
):
    """Retrieve catalog products with full image metadata, attribute filtering, and keyword search."""
    query = db.query(Product)

    if category and category != "all":
        query = query.filter(Product.category == category)
    if subcategory:
        query = query.filter(Product.subcategory == subcategory)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Product.title.ilike(search_pattern)) | 
            (Product.description.ilike(search_pattern)) |
            (Product.subcategory.ilike(search_pattern))
        )

    products = query.all()

    # Filter style client-side if specified
    if style:
        filtered = []
        for p in products:
            attrs = p.attributes or {}
            if attrs.get("style", "").lower() == style.lower():
                filtered.append(p)
        products = filtered

    # Filter occasion client-side if specified
    if occasion:
        filtered = []
        for p in products:
            attrs = p.attributes or {}
            occs = [o.lower() for o in attrs.get("occasions", [])]
            if any(occasion.lower() in o for o in occs):
                filtered.append(p)
        products = filtered

    # Enrich DTOs
    res = []
    for p in products:
        p_dict = {
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
            "in_stock": p.in_stock,
            "upgrades": [],
            "complements": []
        }
        res.append(p_dict)

    return res


@router.get("/products/{product_id}", response_model=ProductSchema)
def get_product_by_id(product_id: str, db: Session = Depends(get_db)):
    """Get single product details with full image URLs and metadata"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    upgrades_rels = db.query(ProductRelation).filter(
        ProductRelation.source_id == product_id,
        ProductRelation.relation_type == "UPGRADE"
    ).all()

    complements_rels = db.query(ProductRelation).filter(
        ProductRelation.source_id == product_id,
        ProductRelation.relation_type == "COMPLEMENT"
    ).all()

    def build_relation_dto(rel):
        target = db.query(Product).filter(Product.id == rel.target_id).first()
        return {
            "target_id": rel.target_id,
            "target_title": target.title if target else "",
            "target_image_url": target.image_url if target else "",
            "target_price": target.price if target else 0.0,
            "relation_type": rel.relation_type,
            "delta_price": rel.delta_price,
            "slot": rel.slot,
            "pitch": rel.pitch
        }

    return {
        "id": product.id,
        "title": product.title,
        "description": product.description,
        "category": product.category,
        "subcategory": product.subcategory,
        "price": product.price,
        "currency": product.currency,
        "image_url": product.image_url,
        "image_urls": product.image_urls or [],
        "attributes": product.attributes or {},
        "in_stock": product.in_stock,
        "upgrades": [build_relation_dto(r) for r in upgrades_rels],
        "complements": [build_relation_dto(r) for r in complements_rels]
    }
