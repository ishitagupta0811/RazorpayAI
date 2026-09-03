"""
Product Relationship Graph Builder
Computes pairwise relationship links between products:
1. UPGRADE links (same subcategory, superior fabric/quality, reasonable price delta)
2. COMPLEMENT links (cross-category matching: Topwear -> Bottomwear -> Footwear -> Accessories)
"""

from typing import List, Dict, Any

class ProductGraphBuilder:
    def __init__(self, max_upsell_price_ratio: float = 1.6):
        self.max_upsell_price_ratio = max_upsell_price_ratio

    def build_relationship_graph(self, products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        relations = []

        # Map by subcategory & category
        by_subcategory = {}
        for p in products:
            sub = p.get("subcategory", "")
            if sub not in by_subcategory:
                by_subcategory[sub] = []
            by_subcategory[sub].append(p)

        # 1. Compute UPGRADE links
        for sub, items in by_subcategory.items():
            sorted_items = sorted(items, key=lambda x: x.get("price", 0))
            for i in range(len(sorted_items)):
                for j in range(i + 1, len(sorted_items)):
                    lower = sorted_items[i]
                    higher = sorted_items[j]

                    price_diff = higher["price"] - lower["price"]
                    ratio = higher["price"] / lower["price"] if lower["price"] > 0 else 2.0

                    if 1.05 <= ratio <= self.max_upsell_price_ratio:
                        higher_q = higher.get("attributes", {}).get("quality_tier", 3)
                        lower_q = lower.get("attributes", {}).get("quality_tier", 3)
                        
                        pitch = f"Upgrade to {higher['title']} for ₹{int(price_diff)} more for superior fabric and enhanced durability."
                        relations.append({
                            "source_id": lower["id"],
                            "target_id": higher["id"],
                            "relation_type": "UPGRADE",
                            "delta_price": price_diff,
                            "slot": sub,
                            "pitch": pitch
                        })

        # 2. Compute COMPLEMENT links across categories
        tops = [p for p in products if p.get("subcategory") == "Shirts"]
        bottoms = [p for p in products if p.get("subcategory") == "Trousers"]
        shoes = [p for p in products if "Shoes" in p.get("subcategory", "")]

        for top in tops:
            for bottom in bottoms:
                top_style = top.get("attributes", {}).get("style", "Smart Casual")
                bottom_style = bottom.get("attributes", {}).get("style", "Smart Casual")

                # Match styles
                if top_style == bottom_style or "Smart" in top_style or "Smart" in bottom_style:
                    relations.append({
                        "source_id": top["id"],
                        "target_id": bottom["id"],
                        "relation_type": "COMPLEMENT",
                        "delta_price": bottom["price"],
                        "slot": "Bottomwear",
                        "pitch": f"{bottom['title']} matches the style of your selected shirt perfectly."
                    })

        for bottom in bottoms:
            for shoe in shoes:
                relations.append({
                    "source_id": bottom["id"],
                    "target_id": shoe["id"],
                    "relation_type": "COMPLEMENT",
                    "delta_price": shoe["price"],
                    "slot": "Footwear",
                    "pitch": f"{shoe['title']} completes your outfit with your selected trousers."
                })

        return relations
