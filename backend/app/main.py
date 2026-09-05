from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes_catalog import router as catalog_router
from app.api.routes_agent import router as agent_router
from app.api.routes_proactive import router as proactive_router
from app.api.routes_checkout import router as checkout_router
from app.api.routes_analytics import router as analytics_router
from app.db.database import engine, Base
from app.models.catalog import Product, Category, ProductRelation
from app.models.order import Order
from app.db.init_db import init_db

# Create DB tables
Base.metadata.create_all(bind=engine)

# Seed database if empty
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set CORS middleware allowing Vite dev server (http://localhost:5173) & all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(catalog_router, prefix=settings.API_V1_STR)
app.include_router(agent_router, prefix=settings.API_V1_STR)
app.include_router(proactive_router, prefix=settings.API_V1_STR)
app.include_router(checkout_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "status": "healthy",
        "phase": "Phase 5 - Merchant Dashboard & AOV Metrics Attribution (Updated)",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
