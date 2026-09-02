# Razorpay AI Revenue Growth Agent: Phase-Wise Architecture

## 1. Executive Summary & Problem Framing

Merchants with large catalogs often suffer from sub-optimal Average Order Value (AOV) because traditional e-commerce search and category grids leave the burden of product discovery entirely on the buyer. Customers frequently purchase a single isolated item without discovering superior alternatives, complementary accessories, or items they had previously saved in their wishlist.

The **Razorpay AI Revenue Growth Agent** is an autonomous, context-aware co-pilot embedded within a merchant's digital storefront. It leverages **Razorpay Test-Mode APIs** alongside a hybrid **Reactive & Proactive AI reasoning engine** to drive merchant revenue through three pillars:
1. **Upselling**: Intelligently proposing superior upgrades within acceptable price deltas and explained value (e.g., wrinkle-resistant fabric, structured fit, premium craftsmanship).
2. **Cross-Selling**: Progressively assembling coherent bundles / complete looks based dynamically on the customer's active choices and intent (e.g., Topwear &rarr; Bottomwear &rarr; Footwear &rarr; Accessories).
3. **Wishlist Conversion**: Resurfacing previously saved items when they contextually match the customer's active shopping basket and intent.

### Non-Negotiable Operating Principles
- **Dynamic AI Reasoning (No Hardcoded Flows)**: The AI dynamically interprets user choices, style preferences, categories, budgets, and occasions. Recommendations are generated contextually based on whatever clothing or items the user selects—not constrained by hardcoded scripts or fixed occasion templates.
- **Visual Richness & Image First**: Every product recommendation, search result, cart item, and recommendation card visually renders product images to maximize conversion and customer trust.
- **Explainability**: Every recommendation includes a clear, customer-centric rationale ("Why this?").
- **Financial & Budget Guardrails**: Hard ceilings on customer budget; no automated billing—every financial action requires explicit customer approval before Razorpay checkout initiation.
- **Respectful Proactivity ("The Power of Doing Nothing")**: The agent evaluates relevance score and confidence threshold; if no high-value recommendation exists, it remains completely silent to prevent customer fatigue.

---

## 2. High-Level System Architecture

The solution is decomposed into three isolated yet closely coordinated modules: **Frontend Storefront**, **Backend Orchestrator**, and **AI Engine**, cleanly organized in dedicated workspace directories (`frontend/`, `backend/`, `ai/`).

```mermaid
flowchart TB
    subgraph Frontend ["frontend/ (Storefront Web App)"]
        UI_Store["Product Discovery Grid (Visual Image Cards)"]
        UI_Chat["AI Sales Co-Pilot & Chat Panel"]
        UI_OneTap["One-Tap Quick Actions & View Product Triggers"]
        UI_Cart["Cart & Outfit Builder (Image Thumbnails)"]
        UI_Wishlist["Wishlist Drawer (Visual Items)"]
        UI_Razorpay["Razorpay Test Checkout Modal"]
    end

    subgraph Backend ["backend/ (FastAPI / Node API Orchestrator)"]
        API_Gateway["API Gateway & Session Manager"]
        Catalog_Service["Catalog, Image Asset & Inventory Service"]
        Cart_Service["Cart & Wishlist State Service"]
        Event_Bus["Shopping Event Pipeline (Add to Bag, View, Query)"]
        Razorpay_Service["Razorpay Payment & Order Service"]
        Analytics_Service["AOV & Conversion Attribution Service"]
        DB[(PostgreSQL / SQLite Storage)]
    end

    subgraph AI ["ai/ (Reasoning & Recommendation Engine)"]
        KG_Vector["Catalog Embeddings & Relationship Graph"]
        Intent_Parser["Reactive Intent & Budget Parser"]
        Proactive_Engine["Proactive Decision Engine"]
        Upsell_Module["Upsell Evaluator"]
        CrossSell_Module["Cross-Sell / Look Builder"]
        Wishlist_Module["Wishlist Matcher"]
        Silence_Guard["Relevance & Silence Gatekeeper"]
        Explanation_Gen["Explainability & Copy Generator"]
    end

    subgraph Razorpay_Cloud ["Razorpay Cloud (Test Mode)"]
        RP_Orders["Orders API"]
        RP_Payments["Payment Verification & Webhooks"]
    end

    %% User interactions
    UI_Store -->|Browse / Search| API_Gateway
    UI_Chat <-->|Chat / One-Tap Actions| API_Gateway
    UI_Cart -->|Cart Events / Add to Bag| Event_Bus
    UI_Wishlist <-->|Save / Retrieve| Cart_Service
    UI_Razorpay <-->|Payment Trigger & Verification| Razorpay_Service

    %% Backend internal
    API_Gateway --> Catalog_Service
    API_Gateway --> Cart_Service
    Catalog_Service --> DB
    Cart_Service --> DB
    Razorpay_Service --> DB
    Razorpay_Service <--> RP_Orders
    RP_Payments --> Razorpay_Service

    %% Backend to AI
    Event_Bus -->|Shopping Context & Trigger| Proactive_Engine
    API_Gateway <-->|Natural Language Queries| Intent_Parser

    %% AI Pipeline
    Intent_Parser <--> KG_Vector
    Proactive_Engine --> Upsell_Module
    Proactive_Engine --> CrossSell_Module
    Proactive_Engine --> Wishlist_Module
    Upsell_Module & CrossSell_Module & Wishlist_Module --> Silence_Guard
    Silence_Guard -->|If Score >= Threshold| Explanation_Gen
    Silence_Guard -->|If Score < Threshold| Proactive_Engine
    Explanation_Gen -->|Structured Recommendation Card + Image URL| API_Gateway
```

---

## 3. Directory Structure & Separation of Concerns

The workspace is organized into four core directories with a strict separation of concerns:

```
RazorpayAI/
├── .gitignore                    # Master ignore rules for Python, Node, env, build artifacts
├── docs/                         # Architecture, problem statement, API schemas
│   ├── problemStatement.md       # Original contest problem statement
│   └── phase_wise_architecture.md# Dynamic architectural specification with image handling
│
├── backend/                      # Backend Orchestrator & Business Logic
│   ├── README.md
│   ├── app/
│   │   ├── api/                  # REST/WebSocket endpoints
│   │   │   ├── routes_catalog.py
│   │   │   ├── routes_cart.py
│   │   │   ├── routes_agent.py
│   │   │   └── routes_checkout.py
│   │   ├── core/                 # App configuration, security, database sessions
│   │   ├── models/               # Database ORM models (Product with image_url, Cart, Order)
│   │   ├── schemas/              # Pydantic / DTO validation schemas
│   │   └── services/             # Razorpay client, Cart logic, Event dispatcher
│   ├── tests/                    # Backend unit and integration tests
│   └── requirements.txt / package.json
│
├── frontend/                     # Interactive Merchant Storefront & AI Drawer
│   ├── README.md
│   ├── public/                   # Static assets, product sample images
│   │   └── images/               # Product image catalog assets
│   ├── src/
│   │   ├── assets/               # CSS styles, design system tokens
│   │   ├── components/
│   │   │   ├── catalog/          # Product card with image rendering, discovery grid, filters
│   │   │   ├── chat/             # AI co-pilot panel, message bubbles with product images
│   │   │   ├── recommendations/  # Upsell cards, Cross-sell bundles, Wishlist prompts with image & View Product
│   │   │   ├── cart/             # Slide-over cart with product image thumbnails
│   │   │   └── checkout/         # Razorpay checkout trigger & order confirmation
│   │   ├── context/              # CartContext, WishlistContext, AgentContext
│   │   ├── hooks/                # useAgent, useCart, useRazorpay
│   │   └── services/             # API client methods
│   └── package.json
│
└── ai/                           # AI Models, Embeddings, Prompts & Decision Logic
    ├── README.md
    ├── catalog_indexer/          # Catalog enrichment, auto-tagging, vector/graph generation
    ├── agents/
    │   ├── reactive_agent.py     # Conversational search returning product images & details
    │   ├── proactive_agent.py    # Add-to-bag trigger evaluator & rule orchestration
    │   └── decision_engine.py    # Upsell vs Cross-sell vs Wishlist prioritization
    ├── prompts/                  # System prompts, few-shot templates, explainability guardrails
    ├── vector_store/             # ChromaDB / FAISS or Vector index handler
    ├── utils/                    # Budget parser, attribute extractor, ranking metrics
    └── tests/                    # AI unit tests and evaluation suite
```

---

## 4. Detailed Data Models & Schema Design

### 4.1 Product & Relationship Graph Model (with Product Image Support)
```json
{
  "product_id": "prod_101",
  "title": "Classic Oxford Shirt",
  "description": "100% breathable cotton, slim fit, versatile styling.",
  "category": "Apparel",
  "subcategory": "Shirts",
  "price": 399,
  "currency": "INR",
  "image_url": "/images/products/classic_oxford_shirt.png",
  "image_urls": [
    "/images/products/classic_oxford_shirt_front.png",
    "/images/products/classic_oxford_shirt_detail.png"
  ],
  "attributes": {
    "color": "White",
    "fabric": "Cotton",
    "fit": "Slim",
    "style": "Smart Casual",
    "occasions": ["Daily Wear", "Office", "Events"]
  },
  "upgrades": [
    {
      "target_product_id": "prod_102",
      "delta_price": 100,
      "upgrade_axis": ["Fabric", "Durability"],
      "pitch": "Wrinkle-resistant luxury weave with structured collar"
    }
  ],
  "complements": [
    {
      "target_product_id": "prod_201",
      "relation_type": "pairs_with",
      "slot": "Trousers",
      "pitch": "Navy tailored trousers complement your selected shirt perfectly"
    },
    {
      "target_product_id": "prod_301",
      "relation_type": "accessory",
      "slot": "Footwear",
      "pitch": "Leather shoes styled to complete your outfit"
    }
  ]
}
```

### 4.2 Shopping Context & Active Session (Retaining Images for Visual Confirmation)
```json
{
  "session_id": "sess_abc123",
  "customer_profile": {
    "explicit_budget": 2500,
    "current_intent": "Dynamic Customer Goal (e.g., Casual Weekend, Office Formal, Party Look)",
    "preferred_styles": ["Minimalist", "Modern"]
  },
  "cart": {
    "items": [
      {
        "product_id": "prod_101",
        "title": "Classic Oxford Shirt",
        "quantity": 1,
        "price": 399,
        "image_url": "/images/products/classic_oxford_shirt.png"
      }
    ],
    "subtotal": 399,
    "completed_slots": ["Topwear"],
    "missing_slots": ["Bottomwear", "Footwear"]
  },
  "wishlist": [
    {
      "product_id": "prod_201",
      "title": "Navy Tailored Trousers",
      "price": 899,
      "image_url": "/images/products/navy_trousers.png",
      "added_at": "2026-08-15T10:00:00Z"
    }
  ],
  "interaction_history": [
    { "action": "search", "query": "cotton shirt under 499" },
    { "action": "add_to_bag", "product_id": "prod_101" }
  ]
}
```

### 4.3 Recommendation & Explanation Contract (Image & Visual Actions)
```json
{
  "recommendation_id": "rec_9921",
  "type": "UPSELL" | "CROSS_SELL" | "WISHLIST_RECOVERY" | "SILENT",
  "confidence_score": 0.92,
  "product": {
    "product_id": "prod_102",
    "title": "Premium Wrinkle-Free Oxford Shirt",
    "price": 499,
    "image_url": "/images/products/oxford_wrinkle_free.png",
    "attributes": {
      "fabric": "Wrinkle-Resistant Cotton",
      "fit": "Structured Slim"
    }
  },
  "explanation": {
    "headline": "✨ Better version found",
    "rationale": "For ₹100 more, this shirt offers wrinkle-resistant fabric and a more structured fit, ideal for your chosen style.",
    "delta_price_label": "+₹100"
  },
  "quick_actions": [
    {
      "id": "view_product",
      "label": "View Product",
      "action_type": "HIGHLIGHT_PRODUCT_IN_GRID",
      "payload": { "product_id": "prod_102" }
    },
    {
      "id": "accept_upsell",
      "label": "Yes, upgrade",
      "action_type": "SWAP_CART_ITEM",
      "payload": { "remove_id": "prod_101", "add_id": "prod_102" }
    },
    {
      "id": "reject_upsell",
      "label": "No, keep this",
      "action_type": "DISMISS"
    },
    {
      "id": "add_to_outfit",
      "label": "Add to outfit",
      "action_type": "ADD_TO_CART",
      "payload": { "product_id": "prod_102" }
    }
  ]
}
```

---

## 5. Core AI Reasoning & Decision Loop

```
Customer Shopping Action (e.g. Add to Bag: prod_101)
               │
               ▼
   [Ingest Event & Dynamically Update Session Context]
   - Current Cart: [prod_101 (Shirt - ₹399, with image_url)]
   - Active Goal: Dynamically Inferred from User Selections / Query
   - Explicit/Inferred Budget: User Budget Ceiling
   - Missing Complementary Slots: [Bottomwear, Footwear]
   - Wishlist: [prod_201 (Navy Trousers - ₹899, with image_url)]
               │
               ▼
      [Step 1: Check Upsell]
   Is there a strictly better version of prod_101?
   - Candidate: prod_102 (₹499, +₹100, image_url: /images/oxford_wrinkle_free.png)
   - Within Budget: Yes (399 + 100 <= Budget)
   - Upsell already rejected this session? No
   - Candidate Confidence >= 0.80? YES
               │
      ┌────────┴────────┐
      ▼                 ▼
   [YES]               [NO]
Suggest Upsell Card!    │
- Render Product Image  ▼
- Price & +₹100 Delta [Step 2: Check Cross-sell / Dynamic Look Completion]
- Reason & View Product Are there missing items to fulfill customer's chosen style/look?
- One-Tap Quick Actions - Missing: Bottomwear
                        - Candidate: prod_201 / prod_202 (with image_url)
                                │
                        ┌───────┴───────┐
                        ▼               ▼
                     [YES]             [NO]
             [Step 3: Check Wishlist]  Search Catalog Complements
             Is relevant item in       (Confidence >= 0.75?)
             wishlist matching user           │
             chosen clothing style?      ┌─────┴─────┐
                        │               ▼           ▼
                 ┌──────┴──────┐      [YES]        [NO]
                 ▼             ▼     Suggest     [Do Nothing]
               [YES]          [NO]   Cross-sell   Stay Silent
             Recover        Suggest  Card with
             Wishlist       Catalog  Product
             Card with      Complement Image
             Image & Rationale
```

---

## 6. Phase-Wise Execution Plan

The project will be delivered sequentially across **6 distinct phases**. Each phase is fully decoupled, testable, and strictly saves its artifacts into `backend/`, `frontend/`, or `ai/`.

```mermaid
gantt
    title Implementation Phases
    dateFormat  X
    axisFormat Phase %d
    section Development
    Phase 1 : Catalog & Vector Graph Ingestion (Image Metadata) : 0, 1
    Phase 2 : Reactive AI & Semantic Discovery (Visual Cards)   : 1, 2
    Phase 3 : Proactive Decision Engine (Visual Recommendation Cards): 2, 3
    Phase 4 : Cart Builder & Razorpay Checkout (Image Basket)   : 3, 4
    section Polishing & Ops
    Phase 5 : Merchant Dashboard & AOV Attribution              : 4, 5
    Phase 6 : Security, Guardrails & Evaluation Benchmarks         : 5, 6
```

---

### Phase 1: Foundation, Catalog Management & Vector/Graph Indexing
**Primary Focus**: Structuring the merchant catalog with full product image support, establishing dynamic relationship graphs, and creating the vector search data foundation.

- **Product Image Integration**:
  - Extend the Product data model to include `image_url` and optional `image_urls`.
  - Product images are provided by the merchant through the uploaded catalog/dataset or mapped from static image assets in `frontend/public/images/`.
  - Store the image reference alongside product metadata so every product can be rendered visually throughout the application.
- **`ai/catalog_indexer/`**:
  - `enricher.py`: LLM-based catalog enricher that dynamically extracts product features (fabric, fit, aesthetic, style, occasions) and links product image metadata.
  - `graph_builder.py`: Computes pairwise relationships dynamically:
    - *Upgrade links* (same category, superior attribute, price delta ratio).
    - *Complementary links* (e.g., Topwear &harr; Bottomwear &harr; Footwear &harr; Accessories).
  - `vector_indexer.py`: Generates vector embeddings for semantic, multi-attribute catalog retrieval.
- **`backend/`**:
  - Database schema definition using SQLite/PostgreSQL (Product with `image_url` column, Category, Attribute, ProductRelation).
  - Seed catalog dataset containing multi-category clothing and accessories with mapped static product images.
  - REST endpoints: `GET /api/catalog/products`, `GET /api/catalog/products/{id}`, `GET /api/catalog/categories`.
- **`frontend/`**:
  - Storefront layout with header, multi-filter navigation, category chips, and responsive product grid.
  - Product Card component displaying high-resolution product image, price, title, and badges for fabric/style tags.

---

### Phase 2: Reactive AI Assistant & Semantic Product Discovery
**Primary Focus**: Handling customer-initiated requests, custom style queries, budget constraints, multi-turn clarification, and dynamic grid updates with visual product cards.

- **Product Image Handling in Search & Chat**:
  - When the reactive agent searches or recommends products, the backend API response returns `product_id`, `title`, `price`, `image_url`, and relevant attributes.
  - The center discovery grid renders the actual product image for all returned items.
  - AI recommendations displayed inside the chat drawer render visual product cards containing the product image.
- **`ai/agents/reactive_agent.py`**:
  - Intent parser extracting user-specified categories, styles, colors, occasions, and price limits dynamically from free-form user prompt.
  - Dynamic outfit/look builder intent extractor (allocating budget across slots based on user selections).
  - Conversational memory answering product comparison and advice questions based on user's selected clothes.
- **`backend/`**:
  - `POST /api/agent/chat`: Ingests conversation history, invokes reactive agent, returns conversational reply and matched products with `image_url`.
  - Session state tracking for current user query parameters and active filters.
- **`frontend/`**:
  - Collapsible/Floating AI Sales Agent Drawer.
  - Interactive message bubbles with embedded visual mini product cards (showing image, title, price).
  - Seamless sync: AI recommendations in chat update or highlight items in the main product discovery grid.

---

### Phase 3: Proactive Sales Agent (Upselling, Cross-Selling, Wishlist Recovery)
**Primary Focus**: Autonomous event-triggered sales assistance delivering rich, explainable recommendation cards with product images and interactive "View Product" triggers.

- **Visual Recommendation Contract**:
  - For every `UPSELL`, `CROSS_SELL`, or `WISHLIST_RECOVERY` recommendation, the recommendation contract returns the product `image_url`.
  - The AI chat recommendation card displays:
    1. **Product image**
    2. **Product name**
    3. **Price**
    4. **Price difference (&Delta;Price)** for upsells, when applicable (e.g., `+₹100`)
    5. **Short explanation / reason** ("Why this recommendation?")
    6. **View Product** button/link
    7. **Relevant one-tap action** such as `Yes, upgrade`, `No, keep this`, or `Add to outfit`
- **View Product Interaction Flow**:
  - When the customer clicks **View Product**, the frontend opens/highlights that exact product in the center discovery area while keeping the AI agent panel open.
- **`ai/agents/proactive_agent.py` & `ai/agents/decision_engine.py`**:
  - Event listener evaluating `ShoppingContext` on `item_added_to_bag`.
  - **Upsell Evaluator**: Finds upgrade candidates matching the selected item's style with superior attributes, price delta, and image URL.
  - **Cross-Sell Evaluator**: Identifies complementary pieces matching the customer's selected clothes to complete a look.
  - **Wishlist Recovery Evaluator**: Scans customer's saved wishlist for items matching current selections.
  - **Silence Gatekeeper**: If recommendation relevance &lt; 0.70 or delta price exceeds budget, returns `SILENT`.
- **`backend/`**:
  - `POST /api/events/shopping-event`: Ingests cart changes, triggers proactive agent pipeline returning complete recommendation payload with images.
  - State tracking for rejected recommendations (avoids repeating rejected items).
- **`frontend/`**:
  - Interactive recommendation card component with image preview, price tag, &Delta;price badge, explanation text, and one-tap action buttons.
  - Contextual banner in chat: *"💡 From your wishlist..."* and *"✨ Better version found..."*.
  - View Product event listener syncing selection to center discovery grid without closing chat.

---

### Phase 4: Cart Outfit Builder & Razorpay Checkout Integration
**Primary Focus**: Frictionless basket composition with product image thumbnails, outfit completion tracker, and secure Razorpay Test-Mode payment flow.

- **Visual Cart & Outfit Builder**:
  - Cart and outfit-builder items retain their `image_url` thumbnail so the customer can visually confirm their final basket before proceeding to Razorpay checkout.
- **`backend/services/razorpay_service.py`**:
  - Razorpay SDK integration running in **Test Mode**.
  - `POST /api/checkout/create-order`: Validates cart total in paise, creates Razorpay Order (`order_id`), returns key ID and order details.
  - `POST /api/checkout/verify-payment`: Verifies HMAC SHA256 signature (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`) to confirm payment authenticity.
- **`frontend/`**:
  - **Slide-over Cart & Look Completion Tracker**: Visual stepper showing product image thumbnails alongside look progression (e.g., [x] Topwear image, [x] Bottomwear image, [ ] Footwear).
  - **Razorpay Checkout Modal integration**: Loads `https://checkout.razorpay.com/v1/checkout.js` in test mode.
  - Order success screen with visual summary of purchased items, images, savings, and payment ID.

---

### Phase 5: Merchant Dashboard & AOV Metrics Attribution
**Primary Focus**: Providing merchant visibility into revenue uplift generated by the AI sales agent.

- **`backend/services/analytics_service.py`**:
  - Tracks conversions attributed to:
    - Standard checkout vs. AI-assisted checkout.
    - Upsell conversions (incremental revenue &Delta;INR).
    - Cross-sell conversions (bundled items).
    - Wishlist conversion rate.
  - `GET /api/analytics/aov-summary`: Aggregated AOV comparison metrics.
- **`frontend/`**:
  - Merchant Analytics View togglable from top navigation:
    - Baseline AOV vs. AI-Assisted AOV.
    - Recommendation acceptance rates (Upsell % vs Cross-sell %).
    - Wishlist recovery revenue counter.

---

### Phase 6: System Hardening, Guardrails & Evaluation Benchmarking
**Primary Focus**: Safety, rate-limiting, budget enforcement, image fallback handling, and offline evaluation.

- **AI Safety & Financial Boundary**:
  - AI can never invoke payment charges or alter prices arbitrarily.
  - Image URL fallback mechanism (placeholders/default asset if image link is unreachable).
  - Strict PII redaction on customer chat logs.
- **Automated Test Scenarios**:
  - Budget overflow test: Customer budget ceiling &rarr; agent must NOT suggest upsells exceeding limit.
  - Silence test: Single unrelated item added &rarr; agent must remain silent if no credible link exists.
  - Image integrity test: Ensure all search & recommendation API outputs return valid `image_url` strings.
  - Signature verification test: Razorpay webhook tampering rejected with 400 Bad Request.

---

## 7. Deliverables Mapped to Folders

| Phase | `backend/` Deliverables | `frontend/` Deliverables | `ai/` Deliverables |
|---|---|---|---|
| **Phase 1** | Catalog schema with `image_url`, DB migration, Seed data, Product APIs | Storefront shell, Product grid with image cards, Category navigation | Catalog enricher with image metadata, Graph builder, Embeddings |
| **Phase 2** | Session manager, Chat API endpoint returning `image_url`, Filter resolver | AI Chat drawer with visual product cards, Message bubbles, Grid search sync | Reactive intent parser, Budget extractor, Visual outfit builder |
| **Phase 3** | Shopping event bus, Rejection tracker, Context API with image contracts | Recommendation cards (Image, Price, &Delta;Price, Rationale, View Product trigger, One-tap buttons) | Proactive decision engine, Silence threshold, Explainability generator |
| **Phase 4** | Razorpay order creation, Signature verification, Cart logic with images | Visual outfit completion tracker, Cart drawer with image thumbnails, Razorpay modal | Look-completion validator |
| **Phase 5** | Analytics schema, AOV metric aggregation API | Merchant analytics dashboard & attribution charts | Conversion logger & interaction audit |
| **Phase 6** | Rate limiting, Auth middleware, Integration test suite, Image fallbacks | Error boundaries, Toast notifications, Polished dark/light UI | Prompt injection defense, Budget safety assertions |

---

## 8. Summary of Non-Functional & Operational Requirements

1. **Latency**:
   - Reactive chat responses: `< 1.2s`.
   - Proactive event evaluation: `< 450ms` (runs asynchronously on `Add to Bag`).
2. **Security**:
   - Razorpay key secrets strictly loaded via `.env` and kept server-side in `backend/`.
   - Client only receives the public `key_id`.
3. **Reliability & Fallbacks**:
   - Fallback image placeholder rendered gracefully if product image fails to load.
   - Fallback to rule-based recommendations if LLM API encounters timeout or rate limits.
   - Merchant storefront remains 100% functional even if AI service is temporarily offline.
