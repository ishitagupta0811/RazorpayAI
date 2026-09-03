"""
Structured Intent & Constraint Parser for Reactive AI Sales Agent
Extracts product category, subcategory, max budget, style preference, occasion, and outfit goals.
"""

import re
from typing import Dict, Any, Optional, List

class IntentParser:
    def __init__(self):
        self.category_keywords = {
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

        self.style_keywords = {
            "Formal": ["formal", "office", "business", "executive", "tailored"],
            "Smart Casual": ["smart casual", "semi formal", "work casual"],
            "Casual": ["casual", "daily", "everyday", "lounge", "relaxed"],
            "Party": ["party", "evening", "gala", "celebration", "new year", "date night"]
        }

        self.occasion_keywords = {
            "Interviews": ["interview", "job interview"],
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

        # 2. Subcategory / Category extraction
        matched_subcategory = None
        for subcat, keywords in self.category_keywords.items():
            if any(kw in text for kw in keywords):
                matched_subcategory = subcat
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
            "subcategory": matched_subcategory,
            "max_price": max_price,
            "style": matched_style,
            "occasion": matched_occasion,
            "is_outfit_request": is_outfit_request
        }
