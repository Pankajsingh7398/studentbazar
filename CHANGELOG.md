# Changelog

All notable changes to the **StudentBazaar** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-dev] - 2026-10-21

### Added
- **Project Structure & Architecture**: Organized full-stack structure comprising `pages/`, `admin/`, `css/`, `js/`, `server/`, and `docs/`.
- **Environment Configuration**: Added `.env.example` and local `.env` with comprehensive placeholders for MongoDB Atlas, JWT, Cookie Signing, Razorpay, and Cloudinary.
- **Persistent AI Memory**: Added `AI_CONTEXT.md` to ensure state continuity across sessions.
- **Documentation**: Initialized `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `API_DOCUMENTATION.md`, `DEPLOYMENT.md`, `SECURITY.md`, and `RESPONSIVENESS.md`.
- **Git Setup**: Initialized Git repository and created comprehensive `.gitignore`.
- **Backend REST API**: Node.js & Express.js with `/api/v1` routes for auth, products, categories, cart, wishlist, orders, payments, admin, and health.
- **Database & Schemas**: Mongoose models for `User`, `Product`, `Category`, `Order`, `Wishlist`, `Coupon`, `Review`, and `Cart`.
- **Zero-Trust Pricing**: All totals, discounts, shipping fees, and taxes calculated strictly server-side.
- **Database Seeder**: Populated with 7 categories, 6 realistic archival notebook editions, promotional coupon `EXAM25`, and seeded demo accounts.
- **Frontend Architecture**: Modular client controllers (`api.js`, `auth.js`, `products.js`, `cart.js`, `wishlist.js`, `checkout.js`, `account.js`, `admin.js`).
- **Complete Multi-Page Storefront**: Implemented `shop.html`, `product.html`, `cart.html`, `checkout.html`, `login.html`, `register.html`, `account.html`, `orders.html`, `wishlist.html`, `about.html`, and `contact.html`.
- **Responsive Admin Portal**: Implemented `admin/index.html`, `admin/products.html`, `admin/orders.html`, `admin/customers.html`, and `admin/inventory.html`.
- **Automated Integration Tests**: 13/13 passing tests covering auth, catalog, cart, orders, ownership, and admin access control.

### Changed
- Refactored original single-file design into dedicated HTML5, modular CSS3, and Vanilla JavaScript with zero inline event handlers.
- Preserved 100% of the authentic warm cream-and-brown branding, Literata and Plus Jakarta Sans typography, and realistic notebook illustrations.
- Explicitly enforced a 3-column product grid at ~540px viewports without horizontal page overflow.
