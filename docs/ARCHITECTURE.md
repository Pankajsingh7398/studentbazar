# StudentBazaar — System Architecture & Data Flow

## 1. High-Level Architectural Diagram

```
+------------------------------------------------------------------------+
|                            CLIENT TIER                                 |
|                                                                        |
|  [ Storefront: index.html ]        [ Multi-Pages: /pages/*.html ]      |
|  [ Admin Portal: /admin/*.html ]   [ Styles: /style.css, /css/*.css ]  |
|                                                                        |
|                        Frontend Shared JS Clients                      |
|          (api.js, auth.js, cart.js, wishlist.js, checkout.js)          |
+-----------------------------------+------------------------------------+
                                    |
                          HTTPS REST API Requests
                     (JSON payloads, Signed HttpOnly Cookies)
                                    |
                                    v
+-----------------------------------+------------------------------------+
|                         SERVER APPLICATION TIER                        |
|                         (Node.js / Express.js)                         |
|                                                                        |
|  [ Security Middlewares: Helmet, CORS, RateLimiter, CookieParser ]     |
|                                                                        |
|  [ API Router (/api/v1) ]                                              |
|    ├── /auth         (Register, Login, Logout, Me, Password Reset)     |
|    ├── /products     (Listing, Search, Filter, Detail, Inventory)      |
|    ├── /categories   (Category taxonomy)                               |
|    ├── /cart         (Persistent user cart & server calculation)       |
|    ├── /wishlist     (Persistent user wishlist)                        |
|    ├── /orders       (Order creation, snapshots, state machine)        |
|    ├── /payments     (Razorpay order creation & signature verification)|
|    └── /admin        (Dashboard stats, inventory, user & order mgmt)   |
|                                                                        |
|  [ Centralized Error Handling & Async Controller Layer ]               |
+-----------------------------------+------------------------------------+
                                    |
                          Mongoose ODM Queries
                                    |
                                    v
+-----------------------------------+------------------------------------+
|                         PERSISTENCE TIER                               |
|                                                                        |
|                   MongoDB Atlas / Local Community                      |
|                                                                        |
|  Collections:                                                          |
|  - users        (Authentication, roles, profile, address book)         |
|  - products     (Archival catalog, SKU, pricing, stock, specs)         |
|  - categories   (Taxonomy categories)                                  |
|  - orders       (Immutable order item snapshots, status history)       |
|  - wishlists    (User-linked product references)                       |
|  - coupons      (Discount codes, validity, usage limits)               |
|  - reviews      (Student ratings, comments, moderation flags)          |
+------------------------------------------------------------------------+
```

## 2. Authentication & Authorization Flow
1. **Registration/Login**: Client sends credentials via HTTPS POST to `/api/v1/auth/login`.
2. **Password Verification**: Server compares password against `bcryptjs` hash (12 salt rounds).
3. **Session Cookie**: Upon successful authentication, server issues a signed, HTTP-only, SameSite cookie containing the signed JWT payload. The client cannot access or tamper with this cookie via JavaScript (XSS mitigation).
4. **Protected Endpoints**: Requests to customer or admin endpoints pass through `authMiddleware.js`.
5. **Role Verification**: Admin endpoints enforce `requireRole('admin')`. Customer roles (`customer`) cannot access administrative operations.

## 3. Cart & Order Calculation Invariants
- **Zero Trust Client**: The client NEVER sends authoritative item prices, discounts, or delivery fees.
- **Server Authority**: The server retrieves fresh product records from MongoDB, validates real-time stock levels, applies campus delivery tiers (Free above ₹200, ₹20 under threshold), applies student subsidies (₹25 off for subtotals > ₹100), and calculates the final total.
- **Order Snapshots**: During order placement, product attributes (name, SKU, unit price, cover styling) are copied into immutable order item subdocuments. Subsequent price changes to the product catalog never alter historical order records.
