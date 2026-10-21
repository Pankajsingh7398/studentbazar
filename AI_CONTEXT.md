# AI_CONTEXT.md — StudentBazaar Long-Term Memory & Project State

## 1. Project Overview & Purpose
- **Project Name:** StudentBazaar
- **Tagline:** Study • Shop • Grow
- **Mission:** Production-grade, secure, responsive, full-stack e-commerce platform engineered specifically for students, university scholars, and academic institutions across India.
- **Key Offerings:** Curated archival stationery (100 GSM notebooks, hardbound journals, spiral draft pads, engineering isometric grids), semester kits, backpacks, exam supplies, and campus delivery within a 10 km university perimeter.

---

## 2. Technology Stack
- **Frontend:**
  - HTML5 (Semantic, accessible markup)
  - CSS3 (Custom design system, CSS variables, responsive grid, animations)
  - Vanilla JavaScript (Modular ES6+, no bloated frameworks, zero inline handlers)
  - Tailwind CSS CDN + JIT Configuration for utility classes
  - Google Fonts: `Literata` (Serif display/headings), `Plus Jakarta Sans` (Body, UI, Currency)
  - Material Symbols Outlined (Google font icons with variable font-variation-settings)
- **Backend:**
  - Node.js (v25+) & Express.js
  - RESTful architecture with `/api/v1` prefix
  - Centralized error handling, async handler, structured JSON responses
- **Database & ODM:**
  - MongoDB Atlas (Cloud) / MongoDB Community v7 (Local development)
  - Mongoose ODM with strict validation, schema methods, and indexes
- **Security & Infrastructure:**
  - Helmet for HTTP security headers
  - CORS with strict allowlist
  - HTTP-only, SameSite, signed cookies for authentication tokens
  - Password hashing via `bcryptjs` (salt rounds: 12)
  - Rate limiting (Express Rate Limit) on sensitive authentication and payment endpoints
  - Express Validator for input validation and sanitization
- **Payments & Storage:**
  - Cash on Delivery (COD) with configurable limit (default: ₹1,500)
  - Razorpay Online Payments (Order creation, signature verification, idempotent webhooks)
  - Cloudinary for secure product asset storage

---

## 3. Directory Structure
```
StudentBazaar/
├── index.html                  # Main Storefront Landing Page
├── style.css                   # Core Design Tokens & Component Styles
├── script.js                   # Landing Page Controller & Client Interactions
├── README.md                   # Setup, Usage, & Architecture Overview
├── AI_CONTEXT.md               # Persistent AI Session Memory & State Tracker
├── CHANGELOG.md                # Chronological Record of Changes & Releases
├── .gitignore                  # Git Ignore Configuration
├── .env.example                # Example Environment Variables (No secrets)
├── .env                        # Local Environment Configuration (Ignored)
│
├── assets/                     # Static media assets
│   ├── logo/
│   ├── banners/
│   └── products/
│
├── pages/                      # Multi-Page Customer Views
│   ├── shop.html               # Product Catalog with Search, Filter & Sort
│   ├── product.html            # Product Detail Page
│   ├── cart.html               # Dedicated Shopping Cart View
│   ├── checkout.html           # Full Checkout Workflow
│   ├── login.html              # Customer Login
│   ├── register.html           # Customer Registration
│   ├── account.html            # Profile, Address, & Security Management
│   ├── orders.html             # Order History & Tracking
│   ├── wishlist.html           # Dedicated Wishlist Management Page
│   ├── about.html              # About StudentBazaar & Mission
│   └── contact.html            # Campus Support & Concierge Desk
│
├── admin/                      # Secure Responsive Admin Portal
│   ├── index.html              # Admin Dashboard & Analytics Summary
│   ├── products.html           # Product Catalog & Inventory Management
│   ├── orders.html             # Order Processing & Status Transitions
│   ├── customers.html          # Customer Roster
│   └── inventory.html          # Stock & Alert Thresholds
│
├── css/                        # Modular Style Modules
│   ├── responsive.css          # Viewport-Specific Media Queries
│   ├── components.css          # Modals, Drawers, Cards, Badges, Tabs
│   ├── forms.css               # Accessible Inputs, Floating Labels, Validation
│   └── admin.css               # Admin Panel Dashboard, Tables, & Sidebars
│
├── js/                         # Frontend Shared Modules
│   ├── api.js                  # Centralized Fetch Client with CSRF & Error Handling
│   ├── auth.js                 # Authentication State, Tokens, & Profile
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
│   │   ├── app.js              # Express Application Setup & Middlewares
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
│   │   │   └── Review.js       # Moderated Customer Reviews
│   │   ├── controllers/        # Route Handlers
│   │   ├── routes/             # Express API Routers (/api/v1/*)
│   │   ├── middleware/         # Auth, Role, Error, & Rate-limiting Middlewares
│   │   ├── services/           # Payment, Email, & Inventory Services
│   │   ├── validators/         # Input Validation Rules
│   │   ├── seeds/              # Initial Seed Data for Seed Products
│   │   └── utils/              # ApiResponse, ApiError, AsyncHandler Helpers
│   └── tests/                  # Automated API & Unit Tests
│
└── docs/                       # Technical Documentation
    ├── ARCHITECTURE.md
    ├── DATABASE_SCHEMA.md
    ├── API_DOCUMENTATION.md
    ├── DEPLOYMENT.md
    ├── SECURITY.md
    └── RESPONSIVENESS.md
```

---

## 4. Design Identity & Color Tokens
- **Brand Colors:**
  - Primary: `#281207` (Deep Espresso Brown)
  - Primary Container: `#402619` (Warm Dark Coffee)
  - Primary Fixed: `#ffdbcb` (Soft Warm Peach)
  - Secondary: `#7c5544` (Terracotta Umber)
  - Secondary Container: `#ffccb6` (Soft Salmon Cream)
  - Background & Surface: `#fcf9f2` (Warm Ivory Cream)
  - Surface Container Low: `#f6f3ec`
  - Surface Container Lowest: `#ffffff`
  - Surface Container High: `#ebe8e1`
  - Accent / Error: `#ba1a1a`
- **Typography:**
  - Headings: `Literata`, serif (academic, archival warmth)
  - Body & Numbers: `Plus Jakarta Sans`, sans-serif (crisp, modern readability)

---

## 5. Current Implementation Phase & Progress
- **Phase 1: Project Setup & Audit:** COMPLETED
  - Repository initialized with `.gitignore`, `.env.example`, `.env`.
  - Architecture and documentation created.
- **Phase 2: Backend Architecture & Database Models:** COMPLETED
  - Node.js & Express server listening on port 5001.
  - MongoDB connection (`studentbazaar`) configured with Mongoose models: `User`, `Category`, `Product`, `Order`, `Wishlist`, `Coupon`, `Review`, `Cart`.
- **Phase 3: Core API Endpoints:** COMPLETED
  - `/api/v1/health`: Live health status
  - `/api/v1/auth`: Register, login (JWT cookies), logout, me, address profile
  - `/api/v1/products`: Public listing, filtering, search, pagination, detail, and admin CRUD
  - `/api/v1/categories`: Public categories taxonomy
  - `/api/v1/cart`: Add, update, remove items, calculate totals server-side, sync guest carts
  - `/api/v1/wishlist`: Add, remove, view, sync
  - `/api/v1/orders`: Cash on Delivery (COD) & Razorpay order creation, customer history, cancellation
  - `/api/v1/payments`: Razorpay order generation, signature verification, webhook processing
  - `/api/v1/admin`: Analytics metrics, order dispatch management, inventory stock updater, customer roster
- **Phase 4: Database Seeding:** COMPLETED
  - Seeded 7 categories, 6 realistic archival notebook editions with exact original styling and pricing, promo coupon `EXAM25`, and seeded accounts:
    - **Administrator:** `admin@studentbazaar.in` / `AdminPass123!`
    - **Scholar Customer:** `scholar@studentbazaar.in` / `ScholarPass123!`
- **Phase 5: Frontend Modules & Multi-Page Views:** COMPLETED
  - Modular JS: `api.js`, `auth.js`, `products.js`, `cart.js`, `wishlist.js`, `checkout.js`, `account.js`, `admin.js`.
  - Modular CSS: `components.css`, `forms.css`, `admin.css`, `responsive.css`.
  - All 11 Customer Pages: `index.html`, `pages/shop.html`, `pages/product.html`, `pages/cart.html`, `pages/checkout.html`, `pages/login.html`, `pages/register.html`, `pages/account.html`, `pages/orders.html`, `pages/wishlist.html`, `pages/about.html`, `pages/contact.html`.
  - All 5 Admin Sub-Views: `admin/index.html`, `admin/products.html`, `admin/orders.html`, `admin/customers.html`, `admin/inventory.html`.
- **Phase 6: Automated Testing & Verification:** COMPLETED
  - 13 out of 13 integration tests passing with 0 errors via `npm test`.
  - Responsive design verified across all 13 viewports (320px to 1920px), enforcing 3-column layout at 540px.

---

## 6. Development & Operational Commands
- **Start Backend Server:** `cd server && node src/server.js` (runs on `http://localhost:5001`)
- **Run Automated Tests:** `cd server && npm test`
- **Re-seed Initial Database:** `cd server && npm run seed`
- **Access Admin Dashboard:** Navigate to `http://localhost:5001/admin/index.html` (or log in with `admin@studentbazaar.in` / `AdminPass123!`)

