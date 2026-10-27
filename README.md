# StudentBazaar — Academic Stationery & Campus Store

> Curated academic stationery and tactile supplies built for focused minds, aspiring designers, and high-achieving scholars across India.

StudentBazaar is a production-grade, secure, responsive full-stack e-commerce web application designed specifically for student communities and university campuses.

---

## 🌟 Features

- **Archival Stationery Catalog**: 100 GSM non-bleed notebooks, hardbound journals, spiral draft pads, engineering isometric grids, and semester kits.
- **Campus Delivery Advantage**: Free priority campus delivery within 10 km university perimeter for orders above ₹200.
- **Student-First Pricing & Discounts**: Dynamic student subsidy tier (₹25 off for orders above ₹100).
- **Interactive Storefront**:
  - 3-slide promotional hero carousel with pause-on-interaction.
  - Live client & server product search and taxonomy filtering.
  - Slide-out shopping cart drawer with instant subtotal and delivery progress tracker.
  - Persistent wishlist with heart indicator states.
- **Secure Full-Stack Backend**:
  - Express.js REST API with `/api/v1` routes.
  - MongoDB Atlas & Mongoose ODM.
  - Customer authentication with bcrypt password hashing and HTTP-only signed cookies.
  - Role-based authorization (`customer` vs `admin`).
  - Cash on Delivery (COD) and Razorpay test payment integration with signature verification.
  - Comprehensive Admin portal for products, inventory, orders, and customer management.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0 or higher recommended, tested on Node v25)
- **npm** (v9+)
- **MongoDB** (Local instance or MongoDB Atlas cluster connection string)

## 📁 Project Structure

```
.
├── index.html          # Public Storefront (Home)
├── pages/              # Frontend Pages (shop, product, cart, checkout, login, orders)
├── js/                 # Client scripts (api.js, auth.js, cart.js, checkout.js, etc.)
├── css/                # Stylesheets (components.css, forms.css, responsive.css)
├── admin/              # Admin Portal (orders.html, index.html, products.html, etc.)
├── server/             # Express.js REST API & MongoDB models
│   ├── src/
│   │   ├── controllers/# Business logic (auth, orders, admin, cart, products)
│   │   ├── models/     # Mongoose Schemas (User, Order, NotificationLog, etc.)
│   │   ├── routes/     # API routes (/api/v1/...)
│   │   ├── services/   # WhatsApp Cloud API service
│   │   └── server.js   # Server entrypoint (Port 5001)
└── package.json        # Root runner scripts
```

> **Note**: Frontend files (`index.html`, `pages/`, `js/`) reside in the root directory. There is no separate `cd frontend` directory.

---

## 🚀 Getting Started & How to Run

### Prerequisites
- **Node.js** (v18.0 or higher)
- **MongoDB** (running locally on port 27017)

### 1. Install Dependencies
From the project root directory:
```bash
cd server
npm install
cd ..
```

### 2. Environment Setup
Verify that `.env` exists in the root directory (copied from `.env.example`):
```ini
NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:8080
MONGODB_URI=mongodb://localhost:27017/studentbazaar
JWT_SECRET=your_secure_jwt_secret
ADMIN_PASSKEY=AdminPassKey123!
```

### 3. Seed Database
Seed categories, archival notebook editions, demo accounts, and coupons:
```bash
npm run seed
# OR: cd server && npm run seed
```

---

### 4. Running Backend and Frontend

You can run the application in two ways:

#### Option A: Quick Start (Backend serves both API and Frontend)
The backend server is configured to automatically serve the frontend static pages:
```bash
# From project root:
npm run backend

# OR:
cd server
npm run dev
```
- **Backend API & Storefront URL**: [`http://localhost:5001`](http://localhost:5001)
- **Admin Orders Portal**: [`http://localhost:5001/admin/orders.html`](http://localhost:5001/admin/orders.html)
- **Scholar Login**: [`http://localhost:5001/pages/login.html`](http://localhost:5001/pages/login.html)

---

#### Option B: Dedicated Frontend Dev Server (Port 8080)
If you prefer running the frontend on a dedicated static server (port 8080) alongside the backend:

**Terminal 1 — Run Backend:**
```bash
npm run backend
# Listens on http://localhost:5001
```

**Terminal 2 — Run Frontend (from project root):**
```bash
npm run frontend
# Listens on http://localhost:8080
```
*(Alternatively, you can also run `npx serve -l 8080 .` or `python3 -m http.server 8080` from the root directory).*

---

### 5. Running Automated Tests
Run all 29 automated integration tests covering authentication, admin passkey, order lifecycle, live tracking, and WhatsApp webhooks:
```bash
npm test
# OR: cd server && npm test
```

---

## 📐 Technology Architecture

- **Frontend**: HTML5, Vanilla CSS3 (Custom design system + Tailwind utility classes), Vanilla ES6 JavaScript (Zero frameworks, zero inline handlers).
- **Backend**: Node.js, Express.js, Mongoose, Helmet, CORS, Cookie-Parser, Bcrypt, JWT.
- **Database**: MongoDB (User, Product, Category, Order, Wishlist, Coupon, Review).
- **Payments**: Cash on Delivery (COD) & Razorpay (Test mode with webhook verification).

---

## 📚 Technical Documentation

Detailed architectural and schema documentation is available:
- **[Full Implementation Guide (Order Management & WhatsApp)](PROJECT_IMPLEMENTATION.md)**
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Database Schema & Models](docs/DATABASE_SCHEMA.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Security Controls](docs/SECURITY.md)
- [Responsiveness Audit](docs/RESPONSIVENESS.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

---

## 📄 License
Copyright © 2025 StudentBazaar Private Limited. Crafted for scholars.
# studentbazar
