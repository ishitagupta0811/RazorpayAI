"""
Catalog Indexer Orchestrator
Runs catalog enrichment, builds relationship graph, and produces vector indices from merchant CSV catalog.
"""

import csv
import json
import os
from ai.catalog_indexer.enricher import CatalogEnricher
from ai.catalog_indexer.graph_builder import ProductGraphBuilder
from ai.catalog_indexer.vector_indexer import CatalogVectorIndexer

def load_products_from_csv(csv_path: str):
    products = []
    if not os.path.exists(csv_path):
        print(f"[Phase 1 Indexer] Warning: CSV not found at {csv_path}")
        return products

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            prod_id = row.get("product_id", "").strip()
            if not prod_id:
                continue

            occasions_raw = row.get("occasions", "")
            occasions = [o.strip() for o in occasions_raw.split(";") if o.strip()]

            img2 = row.get("image_url_2", "").strip()
            image_urls = [row.get("image_url", "").strip()]
            if img2:
                image_urls.append(img2)

            attributes = {
                "color": row.get("color", "").strip(),
                "base_color": row.get("base_color", "").strip(),
                "fabric": row.get("material_fabric", "").strip(),
                "fit": row.get("fit_or_build", "").strip(),
                "style": row.get("style", "").strip(),
                "occasions": occasions
            }

            products.append({
                "id": prod_id,
                "title": row.get("title", "").strip(),
                "description": row.get("description", "").strip(),
                "category": row.get("category", "").strip(),
                "subcategory": row.get("subcategory", "").strip(),
                "price": float(row.get("price", 0)),
                "currency": row.get("currency", "INR").strip(),
                "image_url": row.get("image_url", "").strip(),
                "image_urls": image_urls,
                "attributes": attributes,
                "in_stock": int(row.get("stock_qty", 50)) if row.get("stock_qty") else 50,
                "upsell_to_product_id": row.get("upsell_to_product_id", "").strip(),
                "cross_sell_product_ids": row.get("cross_sell_product_ids", "").strip()
            })
    return products

def run_indexing_pipeline(csv_file_path: str = None):
    if not csv_file_path:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        csv_file_path = os.path.join(base_dir, "backend", "data", "seed", "products.csv")

    raw_products = load_products_from_csv(csv_file_path)
    if not raw_products:
        print("[Phase 1 Indexer] No products loaded.")
        return

    # 1. Enrich
    enricher = CatalogEnricher()
    enriched_products = enricher.enrich_catalog(raw_products)
    print(f"[Phase 1 Indexer] Enriched {len(enriched_products)} catalog products from CSV.")

    # 2. Build Relationship Graph
    graph_builder = ProductGraphBuilder()
    generated_relations = graph_builder.build_relationship_graph(enriched_products)
    print(f"[Phase 1 Indexer] Generated {len(generated_relations)} relationship graph edges (Upgrades & Complements).")

    # 3. Build Vector Index
    vector_indexer = CatalogVectorIndexer()
    v_result = vector_indexer.build_index(enriched_products)
    print(f"[Phase 1 Indexer] Vector index status: {v_result['status']} ({v_result['count']} items indexed).")

    return {
        "products": enriched_products,
        "relations": generated_relations,
        "indexed_count": v_result["count"]
    }

if __name__ == "__main__":
    run_indexing_pipeline()
