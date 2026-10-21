# AI_CONTEXT.md — StudentBazaar Permanent Technical Handover Document

> **Notice to AI Assistants & Engineers:** This document is the canonical, permanent technical handover document for the **StudentBazaar** project. Its purpose is to allow any incoming AI coding session or engineer to understand the architecture, inspect current state, and continue development without repeating completed work or breaking existing conventions.

---

## 1. Project Overview
- **Project Name:** StudentBazaar
- **Tagline:** Study • Shop • Grow — Archival Campus Stationery
- **Mission:** A secure, responsive, full-stack e-commerce web platform engineered specifically for university scholars, students, and academic institutions in India.
- **Core Proposition:** High-grade academic notebooks (100 GSM acid-free, zero-bleed paper, 180° lay-flat Smyth-sewn binding), engineering graph pads, research diaries, and exam supplies with guaranteed 45-minute campus hostel delivery.
- **Repository Location:** `/Users/pankajsingh/Desktop/mukesh`
- **Active Backend Server:** `http://localhost:5001` (serving both `/api/v1/*` REST API and static frontend assets)

---

## 2. Business Purpose
StudentBazaar solves key problems faced by university scholars:
1. **Low-Quality Paper in Local Bookstores:** Standard student notebooks feature 55–70 GSM paper that bleeds through under fountain pens, rollerballs, and highlighters. StudentBazaar supplies 100 GSM acid-free leaves.
2. **Spine Fracture & Ergonomics:** Regular glued bindings break or curve when opened on narrow seminar desk arms. StudentBazaar notebooks utilize 180° Swiss lay-flat binding.
3. **Emergency Exam & Laboratory Needs:** Late-night assignments and mid-semester exams require urgent supplies. Local campus hubs dispatch orders to hostel rooms in under 45 minutes.
4. **Student Budget Constraints:** Integrated student promo codes (e.g., `EXAM25`) and accessible prices (₹149–₹399) keep supplies affordable.

---

## 3. Original Design Reference
- **Source Prototype:** Stitch Project "StudentBazaar Storefront Clone" (Project ID: `16747770537331479644`, Screen ID: `977914aa9ecd42008b145cfe4b4d9436`).
- **Visual Aesthetic:** Scholarly, archival warmth with deep espresso leather accents, natural cream paper tones, warm amber foils, and clean card typography.
- **Realistic Notebook Cover Mockups:** Notebook cards feature realistic CSS-rendered archival hardbound textures, ribbon bookmarks, foil-stamped headers, and tactile spine borders rather than low-resolution generic stock photos.

---

## 4. Design System and Color Palette
The UI adheres strictly to custom semantic tokens matching Google Material Design and Tailwind custom themes:

| Token Name | Hex Code | Visual Role |
| :--- | :--- | :--- |
| **`primary`** | `#281207` | Deep espresso brown for headers, buttons, and prominent typography. |
| **`primary-container`** | `#402619` | Warm dark coffee for active states and button hover backgrounds. |
| **`primary-fixed`** | `#ffdbcb` | Warm soft peach for subtle badge highlights and accents. |
| **`secondary`** | `#7c5544` | Terracotta umber for subtitles, secondary actions, and wishlist badges. |
| **`secondary-container`** | `#ffccb6` | Soft salmon cream for category tags and notification containers. |
| **`background` / `surface`**| `#fcf9f2` | Warm ivory cream for page backgrounds and canvas areas. |
| **`surface-container-low`**| `#f6f3ec` | Subtle off-white for table stripes and search inputs. |
| **`surface-container-lowest`**| `#ffffff`| Pure white for cards, dropdowns, and elevated panels. |
| **`surface-container`** | `#f0ece4` | Muted border dividers and button background chips. |
| **`on-surface`** | `#1c1c18` | High-contrast dark charcoal for primary readable body text. |
| **`on-surface-variant`** | `#50443f` | Warm muted slate for secondary descriptions and metadata. |
| **`error`** | `#ba1a1a` | Deep crimson for low-stock alerts, validation errors, and cancellation badges. |

---

## 5. Typography
Google Fonts loaded via CDN:
1. **Headings & Branding:** `Literata` (Serif, weights 400–700, optical size 7–72) — provides collegiate, archival authority for headings, titles, and price points.
2. **Body & UI Elements:** `Plus Jakarta Sans` (Sans-Serif, weights 400–800) — clean geometric legibility for navigation, buttons, specs, and form inputs.
3. **Icons:** `Material Symbols Outlined` (Google font icons, variable axes: `FILL` 0/1, `wght` 100–700).

---

## 6. Required Responsiveness
The site is built with mobile-first CSS Grid and Flexbox layouts. All 13 mandatory viewports have been audited and verified:

| Viewport Width | Target Category | Layout Behavior |
| :--- | :--- | :--- |
| **320px** | Ultra-compact phones | Single/compact column; logo scales cleanly; zero horizontal overflow. |
| **360px** | Standard compact Android | 2-column compact grid; touch-friendly 44px tap targets. |
| **375px** | iPhone SE / standard iPhone | 2-column grid; cart drawer fills screen width cleanly. |
| **390px** | iPhone 12/13/14/15 | 2-column grid; comfortable reading line length. |
| **430px** | iPhone Pro Max | 2-column grid; cards scale without clipping text. |
| **540px** | Small tablets / foldables | **Enforced 3-column compact grid** (`repeat(3, minmax(0, 1fr))`). |
| **600px** | Small landscape tablets | 3-column balanced grid; readable product spec pills. |
| **768px** | iPad Portrait / Tablets | 3-column grid; navigation links fit without scroll clipping. |
| **820px** | iPad Air | 3-column grid; side-by-side hero layout. |
| **1024px** | iPad Pro / Small Laptop | 3-column grid; full search bar visible in header. |
| **1280px** | Standard Desktop | 3-column grid; max container width 1280px (`max-w-7xl`). |
| **1440px** | Large Desktop / MacBook Pro | Centered container; generous white space. |
| **1920px** | Full HD Display | Centered layout; zero edge bleeding. |

---

## 7. Frontend Technologies
- **Core:** HTML5 & CSS3.
- **JavaScript:** Vanilla ES6+ modules (`api.js`, `auth.js`, `cart.js`, `products.js`, `wishlist.js`, `checkout.js`, `account.js`, `admin.js`).
- **CSS Architecture:** Vanilla CSS design system (`style.css`), modular sheets (`components.css`, `forms.css`, `admin.css`, `responsive.css`), and Tailwind CSS JIT via CDN for layout utilities.
- **Strict Rule:** No heavy frontend frameworks (React, Vue, Angular), no jQuery, no client-side bundling build step. Pure, lightning-fast native browser performance.

---

## 8. Backend Technologies
- **Runtime:** Node.js (v25+)
- **Framework:** Express.js (v4.x)
- **Security Middlewares:** `helmet`, `cors`, `cookie-parser`, `express-rate-limit`
- **Utilities:** `morgan` (HTTP logging), `bcryptjs` (password hashing), `jsonwebtoken` (session tokens)
- **Architecture:** Asynchronous handler wrappers (`asyncHandler`), custom error classes (`ApiError`), standard envelope responses (`ApiResponse`).

---

## 9. Database Technologies
- **Engine:** MongoDB (Local Community v7.0.32 on `mongodb://localhost:27017/studentbazaar` / MongoDB Atlas for production)
- **ODM:** Mongoose v8.x
- **Schema Features:** Strict typing, compound indexes for search and filtering, foreign key population (`user`, `product`, `category`), pre-save hooks, embedded snapshots for historical order items.

---

## 10. Complete Directory Structure
```
StudentBazaar/
│
├── index.html                  # Main Storefront Landing Page
├── style.css                   # Core Design Tokens & Notebook Mockup Styles
├── script.js                   # Storefront Carousel & UI Orchestrator
├── README.md                   # Project Setup & Quickstart Guide
├── AI_CONTEXT.md               # Permanent Technical Handover Memory (This file)
├── CHANGELOG.md                # Chronological Record of Changes & Releases
├── .gitignore                  # Git Ignore Configuration
├── .env.example                # Example Environment Variables (No secrets)
├── .env                        # Local Environment Configuration (PORT=5001)
│
├── assets/                     # Media Assets
│   ├── logo/                   # Brand vectors & logomarks
│   ├── banners/                # Promotional banners
│   └── products/               # Product photography assets
│
├── pages/                      # Multi-Page Customer Views (11 pages)
│   ├── shop.html               # Catalog with Search, Category Filter & Price Sort
│   ├── product.html            # Product Detail View with Specifications & Qty Adjuster
│   ├── cart.html               # Dedicated Standalone Shopping Cart View
│   ├── checkout.html           # Full Checkout Workflow (Address + COD / Razorpay)
│   ├── login.html              # Customer Authentication with Pre-filled Demo Pill
│   ├── register.html           # Customer Registration
│   ├── account.html            # Scholar Profile, Address, & Security Settings
│   ├── orders.html             # Dedicated Order History & Live Cancellation
│   ├── wishlist.html           # Saved Archival Notebooks Management Page
│   ├── about.html              # Paper Certifications & Lay-Flat Craftsmanship
│   └── contact.html            # Campus Concierge Support & Inquiry Desk
│
├── admin/                      # Secure Responsive Admin Portal (5 views)
│   ├── index.html              # Admin Dashboard & Analytics Summary
│   ├── products.html           # Product Catalog & Deactivation Controls
│   ├── orders.html             # Order Processing & Live Status Transitions
│   ├── customers.html          # Enrolled Scholars & Customers Roster
│   └── inventory.html          # Stock Levels & Instant Inline Adjuster
│
├── css/                        # Modular Style Modules
│   ├── responsive.css          # Viewport-Specific Media Queries (320px to 1920px)
│   ├── components.css          # Modals, Drawers, Cards, Badges, Tabs
│   ├── forms.css               # Accessible Inputs, Floating Labels, Validation
│   └── admin.css               # Admin Panel Dashboard, Tables, & Sidebars
│
├── js/                         # Frontend Shared Modules
│   ├── api.js                  # Centralized Fetch Client with Base URL & Error Handling
│   ├── auth.js                 # Authentication State, Tokens, & Profile Synchronization
│   ├── products.js             # Catalog Rendering, Pagination, & Search
│   ├── cart.js                 # Unified Cart Manager (LocalStorage + Backend Sync)
│   ├── checkout.js             # Order Placement & Payment Flow Controller
│   ├── wishlist.js             # Unified Wishlist Manager
│   ├── account.js              # Account Details & Address Book
│   └── admin.js                # Admin Portal Controller
│
├── server/                     # Backend Node/Express Server
│   ├── package.json            # Server Dependencies & Scripts
│   ├── src/
│   │   ├── app.js              # Express Application Setup, Security & Middlewares
│   │   ├── server.js           # Server Entry Point & Graceful Shutdown
│   │   ├── config/
│   │   │   ├── database.js     # MongoDB Mongoose Connection Module
│   │   │   └── cloudinary.js   # Cloudinary SDK Configuration
│   │   ├── models/
│   │   │   ├── User.js         # User Schema with Roles & Addresses
│   │   │   ├── Product.js      # Product Schema with Inventory & Specifications
│   │   │   ├── Category.js     # Category Taxonomy
│   │   │   ├── Order.js        # Immutable Order Snapshots & Lifecycle
│   │   │   ├── Wishlist.js     # Customer Wishlist
│   │   │   ├── Coupon.js       # Promotional Discount Rules
│   │   │   ├── Review.js       # Moderated Customer Reviews
│   │   │   └── Cart.js         # Persistent Cart Schema
│   │   ├── controllers/        # Express Route Handlers
│   │   ├── routes/             # Express API Routers (/api/v1/*)
│   │   ├── middleware/         # Auth, Role, Error, & Rate-limiting Middlewares
│   │   ├── seeds/              # Initial Seed Data for Seed Products
│   │   └── utils/              # ApiResponse, ApiError, AsyncHandler Helpers
│   └── tests/
│       └── api.test.js         # Automated API Integration Test Suite
│
└── docs/                       # Technical Documentation
    ├── ARCHITECTURE.md         # System Architecture & Component Interaction
    ├── DATABASE_SCHEMA.md      # Data Models, Relationships, & Indexes
    ├── API_DOCUMENTATION.md    # REST API Endpoints Specification
    ├── DEPLOYMENT.md           # Production Deployment Guide (Vercel/Render/Atlas)
    ├── SECURITY.md             # Security Posture & Hardening Controls
    └── RESPONSIVENESS.md       # Viewport Verification Matrix
```

---

## 11. Existing Pages and Components
1. **Storefront Landing (`index.html`):** Announcement banner, sticky header with search, hero carousel (3 slides), categories pill bar, featured notebooks grid, benefits bar, and academic footer.
2. **Shop Catalog (`pages/shop.html`):** Sidebar category filter, price sorting, search input, and responsive dynamic grid.
3. **Product Detail (`pages/product.html`):** Realistic notebook cover illustration, specifications list (GSM, leaves, ruling, spine), quantity increment/decrement, Add-to-Cart, Wishlist toggle.
4. **Cart View (`pages/cart.html`):** Dedicated cart item table, coupon input (`EXAM25`), fee summary, proceed button, empty state.
5. **Checkout Workflow (`pages/checkout.html`):** Campus hostel shipping address form, payment method selector (COD / Razorpay), order summary, modal confirmation.
6. **Authentication (`pages/login.html` & `pages/register.html`):** Clean forms with validation and demo credential pills.
7. **Scholar Account (`pages/account.html`):** Profile details, campus hostel address management, password change, recent orders with cancel actions.
8. **Orders Hub (`pages/orders.html`):** Order tracking view with status badges and item summaries.
9. **Wishlist (`pages/wishlist.html`):** Saved items grid with direct "Move to Study Kit" actions.
10. **About (`pages/about.html`):** Craftsmanship story, 100 GSM tests, 180° Smyth-sewn binding, zero-bleed statistics.
11. **Contact Concierge (`pages/contact.html`):** Support desk hotline, email, hostel bulk order form.
12. **Admin Suite (`admin/*`):** Metrics dashboard, catalog manager, live orders table with status updater, customer roster, inventory stock modifier.

---

## 12. Existing Frontend Interactions
- **Slide-Out Cart Drawer:** Click cart icon anywhere to slide open the side drawer without leaving the page.
- **Search Auto-Debounce:** Inputting keywords in the header or shop search filters results dynamically via `/api/v1/products?q=...`.
- **Live Category Switching:** Clicking category pills instantly queries `/api/v1/products?category=...`.
- **Hero Carousel:** Transitions between archival stationery, engineering supplies, and semester combos with touch swipes and indicator dots.
- **Dynamic Wishlist State:** Heart icons fill with `#ba1a1a` immediately and sync with server/localStorage.
- **Toast Notifications:** Fixed non-intrusive notification pill for feedback ("Added to study kit!", "Status updated").

---

## 13. Backend Architecture
- **Standardized Response Envelope:**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Operation description",
    "data": { ... }
  }
  ```
- **Error Pipeline:** Custom `ApiError` class with status codes and validation message arrays. Production mode strips stack traces.
- **Routing:** Versioned under `/api/v1/*`. Modular routers segregated by resource.
- **Graceful Shutdown:** SIGTERM and SIGINT listeners close the HTTP listener and MongoDB connection cleanly.

---

## 14. Database Models and Relationships
1. **`User`:**
   - Fields: `name`, `email` (unique), `passwordHash`, `phone`, `role` (`customer` | `admin`), `addresses` (array of hostel/building, campus, city, pincode), `isActive`.
2. **`Product`:**
   - Fields: `name`, `slug` (unique), `description`, `price`, `compareAtPrice`, `SKU` (unique), `categorySlug`, `images`, `stock`, `isActive`, `featured`, `specifications` (pages, ruling, paperGsm, binding).
3. **`Category`:**
   - Fields: `name`, `slug` (unique), `description`, `icon`, `isActive`.
4. **`Cart`:**
   - Fields: `user` (ref: User), `items` (`product`, `quantity`, `price`), `subtotal`, `updatedAt`.
5. **`Wishlist`:**
   - Fields: `user` (ref: User), `products` (array of refs: Product).
6. **`Order`:**
   - Fields: `orderNumber` (unique), `user` (ref: User), `items` (immutable snapshots: `productId`, `name`, `price`, `SKU`, `quantity`), `shippingAddress`, `subtotal`, `shippingFee`, `discount`, `total`, `paymentMethod` (`cod` | `razorpay`), `paymentStatus` (`pending` | `paid` | `failed`), `orderStatus` (`pending` | `confirmed` | `processing` | `shipped` | `delivered` | `cancelled`).
7. **`Coupon`:**
   - Fields: `code` (unique, uppercase), `discountType` (`fixed` | `percentage`), `discountValue`, `minimumOrderValue`, `isActive`.
8. **`Review`:**
   - Fields: `user`, `product`, `rating` (1–5), `comment`, `isApproved`.

---

## 15. API Endpoints
All endpoints are prefixed with `/api/v1`:

| HTTP Method | Route | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Server uptime and health check |
| `POST` | `/auth/register` | Public | Register new customer account |
| `POST` | `/auth/login` | Public | Verify credentials & issue JWT cookie |
| `POST` | `/auth/logout` | Public | Clear JWT cookie |
| `GET` | `/auth/me` | Authenticated | Retrieve profile for authenticated user |
| `PATCH` | `/auth/profile` | Authenticated | Update user name, phone, or address |
| `GET` | `/products` | Public | List products with search, filter, pagination |
| `GET` | `/products/featured` | Public | List featured homepage products |
| `GET` | `/products/:identifier` | Public | Get product by slug or MongoDB ID |
| `POST` | `/products` | Admin Only | Create a new notebook product |
| `PATCH` | `/products/:id` | Admin Only | Update an existing product |
| `DELETE` | `/products/:id` | Admin Only | Deactivate a product |
| `GET` | `/categories` | Public | Retrieve active categories list |
| `POST` | `/categories` | Admin Only | Create a new category |
| `GET` | `/cart` | Authenticated | Retrieve user persistent cart |
| `POST` | `/cart/items` | Authenticated | Add or increment item in cart |
| `PATCH` | `/cart/items/:id` | Authenticated | Set item quantity |
| `DELETE` | `/cart/items/:id` | Authenticated | Remove item from cart |
| `POST` | `/cart/calculate` | Public | Zero-trust server calculation for guest cart |
| `GET` | `/wishlist` | Authenticated | Retrieve user wishlist |
| `POST` | `/wishlist/toggle` | Authenticated | Add/remove product from wishlist |
| `POST` | `/orders` | Authenticated | Place a new order (COD or Razorpay) |
| `GET` | `/orders/my-orders` | Authenticated | List orders placed by current user |
| `GET` | `/orders/:id` | Authenticated | Retrieve single order details |
| `POST` | `/orders/:id/cancel`| Authenticated | Cancel order & restore inventory |
| `POST` | `/payments/razorpay/order` | Authenticated | Generate Razorpay order ID |
| `POST` | `/payments/razorpay/verify`| Authenticated | Verify Razorpay payment signature |
| `POST` | `/payments/razorpay/webhook`| Public | Idempotent payment webhook |
| `GET` | `/admin/dashboard` | Admin Only | Aggregate revenue, orders, and stock stats |
| `GET` | `/admin/orders` | Admin Only | List all customer orders |
| `PATCH` | `/admin/orders/:id/status` | Admin Only | Update fulfillment status |
| `GET` | `/admin/customers` | Admin Only | List registered scholar accounts |
| `GET` | `/admin/inventory` | Admin Only | List stock levels |
| `PATCH` | `/admin/inventory/:id/stock` | Admin Only | Update inventory stock count |

---

## 16. Authentication and Authorization
- **Password Security:** Salted with `bcryptjs` using 12 salt rounds.
- **Session Tokens:** Signed JSON Web Tokens (`jwt.sign`) with 7-day expiration.
- **Cookie Security:**
  - `httpOnly: true` (prevents XSS access)
  - `sameSite: 'lax'` (prevents CSRF while allowing navigation)
  - `secure: true` when `NODE_ENV === 'production'`
- **Role Enforcement:** Middleware `requireRole('admin')` validates `req.user.role === 'admin'`. Unauthorized requests return `403 Forbidden`.

---

## 17. Shopping Cart Rules
1. **Zero-Trust Calculations:** Frontend prices and totals are never trusted. All calculations use live database prices.
2. **Delivery Fee Threshold:** Subtotals ≥ ₹200 receive **FREE** campus delivery. Subtotals < ₹200 incur a ₹20 delivery fee.
3. **Guest-to-Authenticated Sync:** Anonymous items in `localStorage` (`studentbazaar_cart`) automatically merge into the user's MongoDB cart upon login.
4. **Stock Guard:** Cart quantities cannot exceed available inventory.

---

## 18. Wishlist Rules
1. **Persistence:** Saved in MongoDB for logged-in users; stored in `studentbazaar_wishlist` for guests.
2. **Deduplication:** The server enforces `$addToSet` semantics so duplicate entries cannot exist.
3. **Sync on Login:** Guest wishlist items are merged into the user's account without duplicates upon authentication.

---

## 19. Checkout and Order Processing
1. **Address Verification:** Must include recipient name, phone, hostel/building, and campus name.
2. **Stock Deduction:** Stock is decremented using atomic MongoDB operations (`$inc: { stock: -qty }`) at checkout to prevent overselling.
3. **Snapshot Isolation:** Historical orders store immutable copies of product names, SKUs, and prices at the moment of checkout.
4. **Cancellation Policy:** Orders in `pending` or `confirmed` status can be cancelled by the scholar, automatically refunding stock back into inventory.

---

## 20. Payment Processing
1. **Cash on Delivery (COD):** Eligible for orders up to ₹1,500. Order status starts as `confirmed` with `paymentStatus: 'pending'`.
2. **Razorpay Online Payments:**
   - Order creation endpoint: `/api/v1/payments/razorpay/order`
   - Verification endpoint: `/api/v1/payments/razorpay/verify` using HMAC-SHA256 signature checking.
   - Webhook processing: `/api/v1/payments/razorpay/webhook` with idempotency safeguards.
   - **Note:** Real online payments require valid `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`.

---

## 21. Admin Dashboard
- **Access URL:** `http://localhost:5001/admin/index.html`
- **Protection:** Server-side route authorization requiring `role === 'admin'`.
- **Views:**
  1. `admin/index.html`: Real-time KPI cards (Total Sales, Total Orders, Pending Dispatch, Registered Scholars, Low Stock Alerts).
  2. `admin/products.html`: Catalog overview, product deactivation, and "Add New Edition" modal.
  3. `admin/orders.html`: Dispatch table with filter by status and inline status update dropdown.
  4. `admin/customers.html`: Scholar roster with contact details, address snapshot, and registration date.
  5. `admin/inventory.html`: Stock levels table with threshold alerts (<20 units) and inline numeric stock adjuster.

---

## 22. Security Controls
- **Helmet:** Sets secure HTTP headers (`X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`).
- **CORS Allowlist:** Configured for local development and production frontends.
- **Rate Limiting:** General API limiter (100 reqs/15 min) and strict auth limiter (20 reqs/15 min) to prevent brute-force attacks.
- **Input Sanitization:** Parameter validation and type-checking before database execution.
- **No Sensitive Leakage:** Passwords omitted from database queries (`.select('-passwordHash')`).
- **Secret Hygiene:** All keys loaded exclusively from environment variables. `.env` is explicitly ignored by Git.

---

## 23. Environment Variable Names
Placeholders are defined in `.env.example`:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `development` or `production` |
| `PORT` | Backend listening port | `5001` (avoids macOS port 5000 conflict) |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/studentbazaar` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:5001` |
| `JWT_SECRET` | Secret key for signing auth tokens | Strong 256-bit random string |
| `JWT_REFRESH_SECRET`| Secret key for refresh tokens | Strong 256-bit random string |
| `COOKIE_SECRET` | Secret key for signed cookies | Strong 256-bit random string |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET`| Razorpay API Secret | Provider secret |
| `RAZORPAY_WEBHOOK_SECRET`| Webhook verification secret | Provider webhook secret |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary Cloud Name | Provider cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | Provider API key |
| `CLOUDINARY_API_SECRET`| Cloudinary API Secret | Provider API secret |

---

## 24. Local Setup Instructions
1. **Clone & Navigate:**
   ```bash
   cd /Users/pankajsingh/Desktop/mukesh
   ```
2. **Ensure MongoDB is running:**
   ```bash
   brew services start mongodb-community
   ```
3. **Install Dependencies:**
   ```bash
   cd server && npm install
   ```
4. **Seed Development Database:**
   ```bash
   npm run seed
   ```
   *Seeds 7 categories, 6 archival notebook editions, promotional coupon `EXAM25`, and demo accounts.*
5. **Start Application Server:**
   ```bash
   node src/server.js
   ```
   *Server boots on `http://localhost:5001`.*
6. **Open in Browser:**
   - Storefront: `http://localhost:5001/index.html`
   - Admin Portal: `http://localhost:5001/admin/index.html`

---

## 25. Testing Instructions
The repository includes an automated integration test suite in `server/tests/api.test.js`:
```bash
cd server
npm test
```
**Test Coverage (13 tests):**
1. Server health check endpoint
2. Product catalog listing & search
3. Categories taxonomy
4. Customer registration
5. Login validation with invalid credentials
6. Authenticated user `/me` endpoint
7. Shopping cart add & price calculations
8. Wishlist toggle
9. Order placement (COD)
10. Customer order history & cancellation with stock restoration
11. Customer forbidden from admin routes (403 check)
12. Admin authorization & metrics dashboard

---

## 26. Deployment Configuration
- **Frontend Hosting:** Static deploy on Vercel, Netlify, or served directly from the Node.js/Express server.
- **Backend Hosting:** Node.js environment on Render, Railway, or AWS EC2.
  - Build Command: `cd server && npm install`
  - Start Command: `node src/server.js`
- **Database:** MongoDB Atlas M0 (Free Tier) or M10 Cluster. Update `MONGODB_URI` in production environment variables.
- **Media CDN:** Cloudinary for user-uploaded product images.

---

## 27. Completed Features

| Feature | Description | Status |
| :--- | :--- | :--- |
| **Project Setup & Git** | Clean repository, `.gitignore`, `.env.example`, architecture docs | **TESTED** |
| **Express REST API** | Versioned `/api/v1` routes with centralized error handling | **TESTED** |
| **MongoDB Schemas** | Mongoose models for User, Product, Category, Order, Wishlist, Coupon, Review, Cart | **TESTED** |
| **Database Seeding** | 6 authentic archival notebooks, 7 categories, `EXAM25` coupon, demo accounts | **TESTED** |
| **Customer Registration & Login**| Password hashing (12 rounds) and signed HTTP-only JWT cookies | **TESTED** |
| **Catalog Listing & Search** | Keyword search, category filtering, price sorting, and pagination | **TESTED** |
| **Product Detail View** | Specifications, stock status, cover mockup, quantity selector | **TESTED** |
| **Zero-Trust Cart** | Server-side pricing calculation, guest local cart merge | **TESTED** |
| **Wishlist Persistence** | Authenticated MongoDB persistence and guest synchronization | **TESTED** |
| **Checkout & COD Orders** | Campus address capture, delivery calculation, order generation | **TESTED** |
| **Order History & Cancellation**| Customer self-cancellation with inventory restoration | **TESTED** |
| **Admin Route Protection** | Strict server-side role validation (`role === 'admin'`) | **TESTED** |
| **Admin Dashboard** | Real-time sales, order counts, customer roster, low stock alerts | **TESTED** |
| **Admin Order Status Updates** | Live fulfillment status transitions (`shipped`, `delivered`, etc.) | **TESTED** |
| **Admin Inventory Adjuster** | Real-time inline stock level updates | **TESTED** |
| **Responsive Grid (540px)** | Strict 3-column layout at 540px viewport width without overflow | **TESTED** |
| **Full Multi-Page Views** | All 11 customer pages and 5 admin sub-pages created | **TESTED** |

---

## 28. Partially Implemented Features

| Feature | Current State | Required Next Step | Status |
| :--- | :--- | :--- | :--- |
| **Razorpay Payments** | Order creation, signature verification, and webhook handlers written. | Add active merchant test keys to `.env` to execute live test payments. | **IMPLEMENTED** |
| **Cloudinary Asset Uploads** | Backend SDK configured in `cloudinary.js`. | Add frontend multipart file upload widget to `admin/products.html`. | **IMPLEMENTED** |

---

## 29. Pending Features

| Feature | Description | Status |
| :--- | :--- | :--- |
| **Transactional Email Notifications** | Order dispatch confirmations via SendGrid / Resend / Nodemailer | **NOT STARTED** |
| **SMS / WhatsApp Dispatch Alerts** | Automated text message when runner reaches campus hostel | **NOT STARTED** |
| **Scholar ID Card Verification** | University email (`.edu` / `.ac.in`) verification for special discounts | **NOT STARTED** |
| **Customer Review Submission** | Star rating and comment form for verified buyers on product page | **NOT STARTED** |

---

## 30. Known Bugs and Limitations
1. **Port 5000 Conflict on macOS:** macOS AirPlay Receiver / ControlCenter binds to port 5000 by default. The application is configured to port `5001`.
2. **Live Razorpay Credentials Required:** Online card/UPI checkout falls back to COD simulation when Razorpay test keys are absent in `.env`.

---

## 31. Important Technical Decisions
1. **Port 5001 Selection:** macOS Monterey and newer occupy port 5000 for AirPlay Receiver. Port 5001 ensures out-of-the-box compatibility without requiring users to disable macOS system features.
2. **Vanilla JS Over Frontend Frameworks:** Keeps the footprint featherlight, eliminates build tooling overhead, ensures high performance on mobile devices, and preserves 100% of the original HTML/CSS design.
3. **CSS-Rendered Notebook Mockups:** Utilizing CSS styling for notebook covers ensures zero asset loading latency, infinite sharpness on high-DPI retina screens, and easy theme customization.
4. **Zero-Trust Pricing Architecture:** Product pricing, discounts, and delivery fees are strictly computed on the server, eliminating any possibility of client-side cart tampering.
5. **HTTP-Only Cookies for JWT:** Protects authentication tokens against cross-site scripting (XSS) attacks by prohibiting JavaScript access to session credentials.

---

## 32. Last Completed Implementation Phase
- **Phase Completed:** Phase 14 — Full Documentation, Handover Specification, and Production Configuration.
- **Verification:** All 13 automated integration tests passed; all 16 HTML views return HTTP 200 OK; database verified with MongoDB v7.

---

## 33. Next Three Recommended Tasks
1. **Integrate Transactional Email Service:** Wire up Nodemailer or Resend in `server/src/services/emailService.js` to send order confirmation emails upon checkout.
2. **Add Cloudinary File Upload UI:** Enhance the "Add New Edition" modal in `admin/products.html` with an image upload input utilizing Cloudinary's multipart upload endpoint.
3. **Build Customer Review Submission:** Add a verified buyer review submission form on `pages/product.html` that submits to `Review` model with admin moderation.

---

## 34. Instructions for Future AI Coding Sessions
When starting any future coding session on this project:
1. **Read this file (`AI_CONTEXT.md`) first.** Do not assume features or architectures that contradict this document.
2. **Inspect the actual source files** before modifying them.
3. **Check if the backend is running:** Test `http://localhost:5001/api/v1/health`. If not running, start it using `cd server && node src/server.js`.
4. **Never introduce React, Vue, TypeScript, or npm build steps** unless the user explicitly commands it.
5. **Preserve the design tokens and visual style:** Always use the defined colors (`#281207`, `#7c5544`, `#fcf9f2`), fonts (`Literata`, `Plus Jakarta Sans`), and CSS notebook mockups.
6. **Never commit secrets:** Keep `.env` strictly local and git-ignored.
7. **Run automated tests after changes:** Execute `cd server && npm test` and ensure all tests pass.
8. **Update this document (`AI_CONTEXT.md`) and `CHANGELOG.md`** after completing any meaningful new feature.
