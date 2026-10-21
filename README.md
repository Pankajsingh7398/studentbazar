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

### 1. Installation

Clone or open the repository directory:
```bash
cd StudentBazaar
```

Install server dependencies:
```bash
cd server
npm install
```

### 2. Environment Setup

Copy `.env.example` to create your working `.env`:
```bash
cp .env.example .env
```

Ensure your MongoDB URI and secrets are specified:
```ini
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/studentbazaar
JWT_SECRET=your_secure_random_jwt_secret
COOKIE_SECRET=your_secure_cookie_secret
```

### 3. Seed Database
Seed initial categories and the 6 archival notebook editions:
```bash
cd server
npm run seed
```

### 4. Running the Application

Start the backend server:
```bash
cd server
npm run dev
# Server will listen on http://localhost:5000
```

Serve the frontend application:
Open `index.html` directly in a browser or serve via any static HTTP server:
```bash
# Example using Python HTTP server
python3 -m http.server 8080
# Open http://localhost:8080 in your browser
```

---

## 📐 Technology Architecture

- **Frontend**: HTML5, Vanilla CSS3 (Custom design system + Tailwind utility classes), Vanilla ES6 JavaScript (Zero frameworks, zero inline handlers).
- **Backend**: Node.js, Express.js, Mongoose, Helmet, CORS, Cookie-Parser, Bcrypt, JWT.
- **Database**: MongoDB (User, Product, Category, Order, Wishlist, Coupon, Review).
- **Payments**: Cash on Delivery (COD) & Razorpay (Test mode with webhook verification).

---

## 📚 Technical Documentation

Detailed architectural and schema documentation is available in `docs/`:
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Database Schema & Models](docs/DATABASE_SCHEMA.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Security Controls](docs/SECURITY.md)
- [Responsiveness Audit](docs/RESPONSIVENESS.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

---

## 📄 License
Copyright © 2025 StudentBazaar Private Limited. Crafted for scholars.
