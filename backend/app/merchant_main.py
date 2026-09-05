from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes_analytics import router as analytics_router
from app.db.database import engine, Base
from app.models.catalog import Product, Category, ProductRelation
from app.models.order import Order
from app.db.init_db import init_db

# Ensure DB schema and tables exist on catalog.db
Base.metadata.create_all(bind=engine)
init_db()

app = FastAPI(
    title="Razorpay AI Merchant Analytics API",
    description="Dedicated Backend API for Merchant Analytics & AOV Attribution Dashboard",
    openapi_url="/api/openapi.json"
)

# CORS middleware enabling standalone Merchant Portal (http://localhost:5174) & Storefront (http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Analytics Router
app.include_router(analytics_router, prefix="/api")

@app.get("/")
def merchant_root():
    return {
        "service": "Razorpay AI Merchant Analytics Backend API",
        "status": "healthy",
        "port": 8001,
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.merchant_main:app", host="0.0.0.0", port=8001, reload=True)
