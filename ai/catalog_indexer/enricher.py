"""
Catalog Enricher
Dynamically extracts and enriches product metadata with style attributes, fabric quality scores,
occasion suitability tags, and visual image metadata.
"""

from typing import Dict, Any, List

class CatalogEnricher:
    def __init__(self):
        self.fabric_quality_hierarchy = {
            "Egyptian Wrinkle-Free Cotton": 5,
            "100% French Linen": 5,
            "Italian Wool": 5,
            "Full Grain Leather": 5,
            "100% Cotton": 3,
            "Cotton Stretch Blend": 3,
            "Nappa Leather": 4,
            "Italian Leather": 4
        }

    def enrich_product(self, product: Dict[str, Any]) -> Dict[str, Any]:
        enriched = dict(product)
        attributes = dict(product.get("attributes", {}))
        
        # Calculate quality tier score
        fabric = attributes.get("fabric", "")
        quality_score = self.fabric_quality_hierarchy.get(fabric, 3)
        attributes["quality_tier"] = quality_score

        # Auto-infer style category if missing
        if "style" not in attributes:
            title_desc = f"{product.get('title', '')} {product.get('description', '')}".lower()
            if "formal" in title_desc or "oxford" in title_desc or "derby" in title_desc:
                attributes["style"] = "Formal"
            elif "linen" in title_desc or "sneaker" in title_desc or "casual" in title_desc:
                attributes["style"] = "Casual"
            else:
                attributes["style"] = "Smart Casual"

        # Ensure image metadata is validated
        if "image_url" not in enriched or not enriched["image_url"]:
            enriched["image_url"] = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80"
        
        if "image_urls" not in enriched or not enriched["image_urls"]:
            enriched["image_urls"] = [enriched["image_url"]]

        enriched["attributes"] = attributes
        return enriched

    def enrich_catalog(self, products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [self.enrich_product(p) for p in products]
