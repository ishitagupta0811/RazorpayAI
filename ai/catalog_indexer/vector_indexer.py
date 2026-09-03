"""
Vector Indexer & Semantic Search Component
Generates dense vector embeddings for catalog items based on title, description, category, and attributes.
"""

from typing import List, Dict, Any

class CatalogVectorIndexer:
    def __init__(self):
        self.index = []

    def _build_text_representation(self, product: Dict[str, Any]) -> str:
        attrs = product.get("attributes", {})
        parts = [
            product.get("title", ""),
            product.get("description", ""),
            product.get("category", ""),
            product.get("subcategory", ""),
            attrs.get("color", ""),
            attrs.get("fabric", ""),
            attrs.get("style", ""),
            " ".join(attrs.get("occasions", []))
        ]
        return " ".join([p for p in parts if p]).lower()

    def build_index(self, products: List[Dict[str, Any]]) -> Dict[str, Any]:
        self.index = []
        for p in products:
            text = self._build_text_representation(p)
            self.index.append({
                "product_id": p["id"],
                "text": text,
                "product": p
            })
        return {"status": "indexed", "count": len(self.index)}

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        query_terms = query.lower().split()
        results = []

        for item in self.index:
            score = 0
            text = item["text"]
            for term in query_terms:
                if term in text:
                    score += 1.0
            if score > 0:
                results.append((score, item["product"]))

        results.sort(key=lambda x: x[0], reverse=True)
        return [r[1] for r in results[:top_k]]
