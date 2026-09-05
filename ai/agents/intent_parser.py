"""
Structured Intent & Constraint Parser for Reactive AI Sales Agent
Extracts product category, subcategory, max budget, style preference, occasion, and outfit goals.
"""

import re
from typing import Dict, Any, Optional, List

class IntentParser:
    def __init__(self):
        self.main_category_keywords = {
            "Footwear": ["footwear", "foot wear", "foot-wear", "shoes", "shoe", "heels", "flats", "sneakers", "sandals", "boots", "loafers", "oxfords", "stilettos", "ballerina"],
            "Apparel": ["apparel", "clothing", "clothes", "outfit", "attire", "wear", "shirt", "shirts", "top", "tops", "tee", "t-shirt", "tshirt", "trouser", "trousers", "pants", "jeans", "denim", "blouse", "palazzo", "culotte"],
            "Accessories": ["accessories", "accessory", "jewellery", "jewelry", "necklace", "necklaces", "perfume", "perfumes", "fragrance", "watch", "watches", "chain", "pendant"]
        }

        self.subcategory_keywords = {
            "Shirts": ["shirt", "button-down", "blouse"],
            "Tops": ["top", "tank", "halter", "wrap top", "sequin top"],
            "T-Shirts": ["tee", "t-shirt", "tshirt", "round neck"],
            "Trousers": ["trouser", "pants", "chinos", "palazzos", "culotte"],
            "Jeans": ["jeans", "denim pants"],
            "Heels": ["heels", "stilettos", "block heel"],
            "Flats": ["flats", "ballerina"],
            "Sneakers": ["sneakers", "trainers"],
            "Sandals": ["sandals", "strappy"],
            "Necklaces": ["necklace", "pendant", "chain"],
            "Perfumes": ["perfume", "fragrance", "eau de parfum", "eau de toilette"],
            "Watches": ["watch", "timepiece"]
        }

        self.subcat_to_main_category = {
            "Shirts": "Apparel",
            "Tops": "Apparel",
            "T-Shirts": "Apparel",
            "Trousers": "Apparel",
            "Jeans": "Apparel",
            "Heels": "Footwear",
            "Flats": "Footwear",
            "Sneakers": "Footwear",
            "Sandals": "Footwear",
            "Necklaces": "Accessories",
            "Perfumes": "Accessories",
            "Watches": "Accessories"
        }

        self.style_keywords = {
            "Formal": ["formal", "office", "business", "executive", "tailored"],
            "Smart Casual": ["smart casual", "semi formal", "work casual"],
            "Casual": ["casual", "daily", "everyday", "lounge", "relaxed"],
            "Party": ["party", "evening", "gala", "celebration", "new year", "date night"]
        }

        self.occasion_keywords = {
            "Interviews": ["interview", "job interview", "interviews"],
            "Office": ["office", "work", "desk", "business"],
            "Formal Events": ["formal event", "gala", "ceremony"],
            "Evening Events": ["evening", "dinner", "cocktail", "night out"],
            "Date Night": ["date night", "romantic"],
            "Parties": ["party", "club", "festive"],
            "Weekend": ["weekend", "brunch", "outing", "lounge"],
            "Daily Wear": ["daily", "everyday", "casual wear"]
        }

    def parse_intent(self, query: str) -> Dict[str, Any]:
        text = query.lower()

        # 1. Budget extraction (e.g. "under 600", "under ₹2,500", "below 1000", "< 500", "budget 800")
        max_price: Optional[float] = None
        price_patterns = [
            r'(?:under|below|less than|within|max|budget|\<|\<=|\u20b9|\b|inr)\s*[\u20b9\s]*(\d+[\d,.]*)',
            r'(\d+[\d,.]*)\s*(?:rupees|rs|\u20b9|inr|max|budget)'
        ]
        for pattern in price_patterns:
            match = re.search(pattern, text)
            if match:
                val_str = match.group(1).replace(',', '')
                try:
                    val = float(val_str)
                    if val > 50:  # avoid matching small numbers like sizes
                        max_price = val
                        break
                except ValueError:
                    pass

        # 2. Main Category & Subcategory extraction
        matched_category = None
        matched_subcategory = None

        # Check subcategory first
        for subcat, keywords in self.subcategory_keywords.items():
            if any(kw in text for kw in keywords):
                matched_subcategory = subcat
                matched_category = self.subcat_to_main_category.get(subcat)
                break

        # If no specific subcategory matched, check main category keywords (e.g. "footwear", "shoes")
        if not matched_category:
            for main_cat, keywords in self.main_category_keywords.items():
                if any(kw in text for kw in keywords):
                    matched_category = main_cat
                    break

        # 3. Style extraction
        matched_style = None
        for style, keywords in self.style_keywords.items():
            if any(kw in text for kw in keywords):
                matched_style = style
                break

        # 4. Occasion extraction
        matched_occasion = None
        for occ, keywords in self.occasion_keywords.items():
            if any(kw in text for kw in keywords):
                matched_occasion = occ
                break

        # 5. Outfit / Look Builder Goal detection
        outfit_keywords = ["outfit", "look", "complete look", "bundle", "pair with", "full set"]
        is_outfit_request = any(kw in text for kw in outfit_keywords)

        return {
            "query": query,
            "category": matched_category,
            "subcategory": matched_subcategory,
            "max_price": max_price,
            "style": matched_style,
            "occasion": matched_occasion,
            "is_outfit_request": is_outfit_request
        }
