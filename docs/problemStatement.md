Problem Statement

Merchants often have a large product catalog, but simply displaying products does not guarantee higher revenue per customer. Customers may purchase one product without discovering relevant complementary products, better alternatives, or products they have previously saved in their wishlist.

The challenge is to build an AI-powered revenue growth agent using Razorpay test-mode APIs that helps merchants increase Average Order Value (AOV) through intelligent and contextual:

Upselling — encouraging customers to choose a better version of the product they are already considering.
Cross-selling — identifying complementary products that complete the customer's intended purchase.
Wishlist conversion — recognizing relevant products from the customer's wishlist and bringing them back into the current shopping journey.

Every recommendation and money-related action should be explainable, bounded by customer preferences/budget, and explicitly approved by the customer.

Proposed Solution

We propose an AI Sales Agent integrated directly into a merchant's online storefront.

The merchant can upload or connect their product database/catalog. The system automatically organizes products into categories and subcategories and uses AI to understand relationships between products, such as:

Products that complement each other
Better versions/upgrades
Similar alternatives
Products suitable for specific occasions or intents
Products that can be combined into an outfit or bundle

The customer can then browse the store normally while a persistent AI Sales Agent works alongside the shopping experience.

The agent acts like an intelligent salesperson: it answers the customer's questions when asked, but also proactively identifies useful opportunities based on the customer's actions.

1. Reactive AI — When the Customer Asks

The agent is reactive when the customer directly asks for assistance.

For example:

"I need a formal shirt under ₹499."

The agent understands:

Category: Shirt
Style: Formal
Maximum price: ₹499

It searches the merchant's catalog and displays the most relevant shirts in the product discovery section.

The customer can then ask:

"Which one is better for an interview?"

or:

"Show me something in blue."

or:

"Build me a complete formal outfit under ₹2,500."

The agent responds to these requests and updates the products shown in the discovery area.

2. Proactive AI — When the Customer Takes an Action

The agent becomes proactive when a meaningful shopping event occurs, especially when the customer clicks Add to Bag.

It does not constantly interrupt the customer. Instead, it evaluates the current shopping context and decides whether there is a useful action to take.

After an item is added to the bag, the agent checks:

Customer intent + current basket + budget + preferences + wishlist + product relationships

and decides between:

A. Upsell

If a better version of the selected product exists, the agent can suggest it.

Example:

Customer adds:

White Formal Shirt — ₹399

Agent:

✨ Better version found
For ₹100 more, this shirt offers wrinkle-resistant fabric and a more structured fit, which may be better suited for an interview.

It shows a product card containing:

Product image
Product name
Price
Short explanation
View Product

The customer can choose:

Yes, show me | No, keep this

If the customer selects Yes, the agent can ask small one-tap questions such as:

What would you like to improve?

Better Color | Better Design | Better Fit | Better Fabric

The next recommendation is based on the customer's answer.

If the customer selects No, the agent does not repeatedly push the same upgrade.

3. Cross-Selling — Completing the Customer's Goal

After an upsell is rejected—or when no meaningful upsell exists—the agent checks whether the customer's original goal is complete.

For example:

Customer: "I need a formal outfit for an interview."

Customer adds a shirt.

The agent understands that the goal is not just buying a shirt; it is creating a complete formal outfit.

Therefore, it proactively recommends:

🔵 Complete your look
These formal trousers pair well with your selected shirt.

The customer can view the recommended product directly inside the AI chat.

Clicking View Product opens that product in the main discovery area while keeping the AI conversation open.

After trousers are selected, the agent can identify that formal shoes are still missing and recommend them.

The agent therefore progressively moves the customer toward:

Shirt → Trousers → Shoes → Complete Outfit

rather than randomly recommending unrelated products.

4. Wishlist Intelligence — Recovering Existing Customer Intent

The agent can also use the customer's wishlist as another source of context.

For example, the customer is currently building an interview outfit and has previously saved:

Navy Formal Trousers — ₹899

The agent can recognize that the wishlist item is relevant to the current outfit and say:

💡 From your wishlist
You saved these navy formal trousers earlier, and they match the shirt you've selected. Would you like to use them for your outfit?

This helps the merchant convert previously expressed purchase intent into an actual purchase.

Importantly, the agent should explain why the wishlist product is being surfaced instead of simply saying:

"You have this in your wishlist."

5. Frictionless AI Interaction

The customer should not have to type every instruction.

The AI chat uses one-tap contextual options such as:

Better version? → Yes / No
Improve → Color / Design / Fit / Fabric
Complete my outfit
Show matching products
Use wishlist item
View product
Add to bag

This allows the agent to guide the customer through the shopping journey without turning the experience into a long questionnaire.

The customer can still type naturally at any time, so the AI works both as:

A conversational shopping assistant

and

A proactive digital salesperson.

6. The Agent's Decision-Making

The core agent loop is:

Customer Intent
↓
Customer Action
↓
Update Shopping Context
↓
Understand Current Basket & Goal
↓
Check for Better Product → Upsell
↓
Check for Missing/Complementary Product → Cross-sell
↓
Check Relevant Wishlist Items → Wishlist Recovery
↓
If Nothing Meaningful Exists → Stay Silent
↓
Show Explainable Recommendation
↓
Customer Approves/Rejects
↓
Update Cart
↓
Razorpay Checkout

The important part is that the agent is allowed to do nothing.

It should not recommend a more expensive product simply because one exists. It should only proactively intervene when it can provide meaningful value to both the customer and the merchant.

7. Role of AI in Different Sections
Product Catalog

AI automatically understands and organizes the merchant's products into categories, subcategories, attributes, occasions, and product relationships.

Product Discovery

AI controls what products are surfaced based on the customer's request, preferences, current selections, and recommendations.

AI Chat Panel

This is where the agent communicates with the customer, answers questions, provides explanations, displays upsell/cross-sell/wishlist recommendations, and gives one-tap actions.

Cart / Outfit Building

AI continuously evaluates whether the customer's intended purchase is complete and recommends relevant complementary products.

Wishlist

AI identifies previously saved products that are relevant to the customer's current shopping intent and brings them back into the purchase journey.

Checkout

The AI prepares the final cart but does not independently charge the customer. The customer explicitly approves the final purchase before the transaction proceeds through Razorpay.

Core Value Proposition

The AI agent doesn't simply recommend more products. It understands what the customer is trying to accomplish, observes their shopping journey, and decides whether the next best action is to upgrade the current product, add a complementary product, recover something from their wishlist, or do nothing.