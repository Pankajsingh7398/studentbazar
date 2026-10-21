# StudentBazaar — Security Policies & Hardening Controls

This document specifies the defense-in-depth security architecture implemented across the application.

---

## 1. Authentication & Session Management
- **Zero LocalStorage Tokens**: JWTs are strictly transmitted inside `HttpOnly`, `SameSite=Lax` (or `Strict`), cryptographically signed cookies. They are inaccessible to client-side JavaScript, defending against Cross-Site Scripting (XSS) credential theft.
- **Password Security**: Passwords hashed with `bcryptjs` using a cost factor of 12. Password hashes are explicitly excluded from database query projections by default (`select: false`).
- **Timing Attack Mitigation**: Credential verification employs constant-time comparison.
- **Login Rate Limiting**: Exponential backoff and maximum request count limits on `/api/v1/auth/login` to prevent credential stuffing and brute-force attacks.

---

## 2. Authorization & Privilege Escalation Prevention
- **Role Enforcement**: User roles are strictly validated server-side. Users cannot assign or mutate their own `role` field via registration or profile updates.
- **Object-Level Access Control**: Customers can only inspect or modify their own shopping cart, wishlist, profile, and orders.
- **Admin Isolation**: Admin endpoints verify `req.user.role === 'admin'`. No admin functionality is exposed without server-side validation.

---

## 3. Financial & Order Data Integrity
- **Untrusted Client Inputs**: Prices, discounts, shipping fees, stock availability, and payment statuses provided by the browser are discarded.
- **Authoritative Calculations**: All calculations are executed server-side using immutable product records fetched directly from MongoDB.
- **Payment Verification**: Razorpay payment signatures are validated using HMAC-SHA256 with the secret key before orders are marked `paid`. Webhook events are processed idempotently.

---

## 4. HTTP Headers & Transport
- **Helmet**: Disables `X-Powered-By`, enables HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, and Referrer-Policy.
- **CORS Allowlist**: Cross-Origin requests restricted to authorized origins (e.g., `FRONTEND_URL`).
- **Request Body Limits**: JSON and URL-encoded body sizes limited to 1 MB to prevent Denial-of-Service (DoS) buffer exhaustion.

---

## 5. Input Sanitization & Injection Defense
- **Mongoose ODM Type Casting**: Enforces schema types, automatically quoting and escaping inputs against NoSQL injection.
- **Express Validator**: Validates email format, phone numbers, quantities, strings, and slugs before processing.
