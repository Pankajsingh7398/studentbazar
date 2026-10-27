# StudentBazaar E-Commerce Order Management & WhatsApp Notification System
## Production-Ready Technical Implementation Guide & Architecture Reference

---

## 1. Project Overview & Architecture

**StudentBazaar** is a production-ready academic stationery e-commerce platform built for college campuses and hostels. It provides a warm cream-and-brown visual design, an authenticated customer storefront, an administrative management portal, and an automated real-time notification engine.

```
┌────────────────────────────────────────────────────────────────────────┐
│                     CLIENT TIER (HTML5 / JS / CSS3)                    │
│  • Public Storefront & Product Catalog (index.html, shop.html)         │
│  • Dual Customer & Admin Passkey Auth (login.html, register.html)      │
│  • Campus Cart & Checkout with WhatsApp Opt-in (checkout.html)         │
│  • Live Customer Order Stepper Timeline & Polling (orders.html)        │
│  • Administrative Order Lifecycle & Courier Portal (admin/orders.html) │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTPS / REST API / Cookies
┌─────────────────────────────────▼──────────────────────────────────────┐
│                    NODE.JS / EXPRESS BACKEND (Port 5001)               │
│  • Auth Controller: Dual Customer JWT & Admin Passkey verification     │
│  • Order Controller: Server-side price validation & stock deduction   │
│  • Admin Controller: Strict lifecycle transition enforcement          │
│  • WhatsApp Service: Asynchronous Meta Cloud API & simulation mode     │
│  • Webhooks Handler: Verification handshake & receipt processing       │
│  • Security: Rate-limiting, Helmet, CORS, NoSQL Sanitizer              │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ Mongoose ODM
┌─────────────────────────────────▼──────────────────────────────────────┐
│                        MONGODB DATABASE (Port 27017)                   │
│  • users (customers & admins with hashed passkeys)                     │
│  • products (inventory & pricing)                                      │
│  • orders (price snapshots, delivery address, courier, tracking)       │
│  • orderstatushistories (immutable timestamped transition audit log)   │
│  • notificationlogs (durable WhatsApp dispatch & delivery records)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication System

### A. Customer Authentication
- **Registration**: Full name, email address, password, phone number. Passwords hashed with `bcryptjs` (salt rounds: 12).
- **Authentication**: JWT token issued via HTTP-only cookie (`token`) and returned in response body.
- **Provider Hybrid**: Direct email/password login integrated seamlessly with optional Clerk Authentication.
- **Role Isolation**: Default role is `customer`. Customers cannot access `/api/v1/admin/*` routes under any circumstances.

### B. Admin Passkey Authentication
- **Separate Terminal Option**: Located on `/pages/login.html` via a distinct "Admin Login" tab.
- **Configurable Passkey**: Controlled via server-side environment variable `ADMIN_PASSKEY` and securely hashed in the database (`adminPasskeyHash`).
- **Zero Frontend Exposure**: The passkey is never exposed in browser JavaScript, React components, HTML source, or API error messages.
- **Role-Based Access Control (RBAC)**: Validated on the server via `verifyJWT` and `requireRole('admin')`.
- **Passkey Modification**: Authenticated administrators can update the passkey at `POST /api/v1/auth/admin/change-passkey`. Credentials are saved as a high-strength bcrypt hash and existing tokens are re-issued.

---

## 3. Order Processing & Lifecycle Workflow

Every order strictly progresses through an auditable, non-skippable lifecycle:

```
CUSTOMER ADDS NOTEBOOKS TO CART
               ↓
CUSTOMER CHECKS OUT (Enters Address, WhatsApp Number & Opt-In)
               ↓
SERVER VALIDATES PRICES & DEDUCTS STOCK ATOMICALLY
               ↓
ORDER SAVED IN DATABASE
[Status: PENDING] (Awaiting Store Confirmation)
               ↓
ASYNC WHATSAPP DISPATCH:
  ├─► WhatsApp notification sent to Store Administrator
  └─► WhatsApp order acknowledgment queued for Customer
               ↓
ADMIN REVIEWS ORDER ON ADMIN DASHBOARD
               ↓
ADMIN CONFIRMS OR REJECTS:
  ├─► [CONFIRM] ──► Status: CONFIRMED (Customer WhatsApp Notification)
  │                   ↓
  │                 Status: PROCESSING (Customer WhatsApp Notification)
  │                   ↓
  │                 Status: PACKED (Customer WhatsApp Notification)
  │                   ↓
  │                 Status: SHIPPED (Requires Courier Name & AWB Tracking Number)
  │                   ↓
  │                 Status: OUT_FOR_DELIVERY (Partner arrival alert)
  │                   ↓
  │                 Status: DELIVERED (Final confirmation; COD marked paid)
  │
  └─► [REJECT]  ──► Status: REJECTED (Reason recorded; stock restored; WhatsApp alert)
```

### Transition Enforcement Rules
- Status transitions are guarded on the server via `ALLOWED_TRANSITIONS` map.
- Invalid attempts (e.g. jumping from `pending` directly to `shipped`) are rejected with `HTTP 400 Bad Request`.
- Marking an order as `shipped` mandates `courierName` and `trackingNumber`.
- Marking an order as `rejected` mandates a non-empty `rejectionReason`.
- Marking an order as `cancelled` or `rejected` automatically restores inventory stock.

---

## 4. WhatsApp Business Platform Cloud API Integration

### Service Configuration
All credentials reside securely in server environment variables:
```env
ADMIN_WHATSAPP_NUMBER=919876543210
WHATSAPP_ACCESS_TOKEN=your_meta_system_user_token
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_meta_business_account_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verification_token
```

### Development Simulation Mode
If `WHATSAPP_ACCESS_TOKEN` or `WHATSAPP_PHONE_NUMBER_ID` is blank:
- The system automatically engages **Durable Simulation Mode**.
- Formatted notification payloads are logged clearly to server terminal logs.
- Every notification is recorded in the `NotificationLog` collection with status `SENT` and a unique `mock_wa_*` provider message ID.
- Checkout and status transitions never block or fail when external Meta credentials are absent.

### Reliability & Idempotency
- **Asynchronous Execution**: WhatsApp notifications run inside non-blocking background promises (`setImmediate`), ensuring checkout responses return in under 20ms.
- **Idempotency Keys**: Notifications generate unique keys (`${orderId}_${stage}`) to prevent duplicate messages upon API retries.
- **Audit Logging**: Every outbound message creates a `NotificationLog` entry tracking recipient, recipient type, provider ID, status (`QUEUED`, `SENT`, `DELIVERED`, `FAILED`), retry count, and errors.

---

## 5. Customer Order Tracking Experience

- **Timeline Progression**: Located at `/pages/orders.html`. Displays an interactive 7-step visual stepper:
  1. `Order Placed`
  2. `Order Confirmed`
  3. `Processing`
  4. `Packed`
  5. `Shipped`
  6. `Out for Delivery`
  7. `Delivered`
- **Database Timestamps**: Each stage reflects actual server timestamps (`createdAt`, `confirmedAt`, `processedAt`, `packedAt`, `shippedAt`, `outForDeliveryAt`, `deliveredAt`).
- **Real-Time Polling**: When the customer opens the tracking view, the interface polls `/api/v1/orders/:id/tracking` every 8 seconds, updating dynamically when the store administrator changes the status.
- **Courier Integration**: Displays courier name, AWB tracking number, and a direct link to the courier's tracking portal.
- **Negative States**: If rejected or cancelled, an alert displays the termination reason and timestamp without showing false delivery progress.

---

## 6. Admin Management Dashboard

- **URL**: `/admin/orders.html` and `/admin/index.html`
- **Dashboard Counters**: Real-time aggregation of Total Sales, Total Orders, Awaiting Confirmation, Confirmed, Processing, Packed, Shipped, Out for Delivery, Delivered, Cancelled/Rejected, and Pending Payments.
- **Contextual Action Workflow**:
  - `Pending` $\rightarrow$ Green `[Confirm]` button + Red `[Reject]` button (with reason dialog).
  - `Confirmed` $\rightarrow$ Indigo `[Start Processing]` button + `[Cancel]` button.
  - `Processing` $\rightarrow$ Teal `[Mark Packed]` button + `[Cancel]` button.
  - `Packed` $\rightarrow$ Purple `[Ship Order]` button (opens Courier & AWB modal) + `[Cancel]` button.
  - `Shipped` $\rightarrow$ Orange `[Out for Delivery]` button.
  - `Out for Delivery` $\rightarrow$ Emerald `[Mark Delivered]` button.
- **WhatsApp Notification Inspector**: Every row includes an `[Info]` button to inspect live notification delivery logs (`recipient`, `status`, `provider ID`, `timestamp`, `error message`) and complete transition history.

---

## 7. Database Models Schema Reference

### `users`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique user identifier |
| `name` | String | Scholar full name |
| `email` | String (unique) | Scholar email address |
| `passwordHash` | String (select: false) | Bcrypt hash of customer password |
| `adminPasskeyHash`| String (select: false) | Bcrypt hash of admin passkey |
| `phone` | String | Contact phone number |
| `whatsappNumber` | String | WhatsApp number |
| `whatsappOptIn` | Boolean | Notification opt-in consent |
| `role` | String (enum) | `'customer'` or `'admin'` |
| `addresses` | Array | Saved hostel and campus delivery addresses |

### `orders`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique order identifier |
| `orderNumber` | String (unique) | Human-readable order number (e.g. `SB-123456-ABCDEF`) |
| `user` | ObjectId (ref: User) | Associated customer account |
| `customerSnapshot`| Object | Name, email, and phone at the time of purchase |
| `whatsappNumber` | String | WhatsApp recipient number |
| `whatsappOptIn` | Boolean | Consent flag for order updates |
| `items` | Array | Product snapshot: `name`, `SKU`, `price`, `quantity`, `subtotal` |
| `shippingAddress` | Object | `fullName`, `phone`, `hostelOrBuilding`, `campusName`, `city`, `pinCode` |
| `subtotal` | Number | Server-validated item total |
| `shippingFee` | Number | Calculated campus delivery fee |
| `discount` | Number | Validated coupon or student discount |
| `total` | Number | Final payable amount |
| `paymentMethod` | String | `'cod'` or `'razorpay'` |
| `paymentStatus` | String | `'pending'`, `'paid'`, `'failed'`, `'refunded'` |
| `orderStatus` | String | `'pending'`, `'confirmed'`, `'processing'`, `'packed'`, `'shipped'`, `'out_for_delivery'`, `'delivered'`, `'rejected'`, `'cancelled'` |
| `courierName` | String | Courier delivery partner name |
| `trackingNumber` | String | Courier AWB / tracking number |
| `trackingUrl` | String | Web URL for external tracking |
| `rejectionReason` | String | Recorded reason if rejected |
| `cancellationReason` | String | Recorded reason if cancelled |
| `confirmedAt` | Date | Timestamp of admin confirmation |
| `processedAt` | Date | Timestamp of processing |
| `packedAt` | Date | Timestamp of packing |
| `shippedAt` | Date | Timestamp of courier handover |
| `outForDeliveryAt` | Date | Timestamp of campus arrival |
| `deliveredAt` | Date | Timestamp of completed delivery |

### `orderstatushistories`
| Field | Type | Description |
|---|---|---|
| `order` | ObjectId (ref: Order) | Target order reference |
| `orderNumber` | String | Human-readable order number |
| `previousStatus` | String | Previous lifecycle status |
| `newStatus` | String | Updated lifecycle status |
| `changedBy` | ObjectId (ref: User) | User or admin ID who performed action |
| `changedByName` | String | Name of user or administrator |
| `note` | String | Action note, rejection reason, or cancellation explanation |
| `courierName` | String | Courier partner if updated |
| `trackingNumber`| String | Tracking code if updated |

### `notificationlogs`
| Field | Type | Description |
|---|---|---|
| `order` | ObjectId (ref: Order) | Associated order reference |
| `recipient` | String | Formatted international phone number |
| `recipientType` | String | `'admin'` or `'customer'` |
| `notificationType` | String | E.g. `order_placed_admin`, `order_confirmed`, `order_shipped` |
| `provider` | String | `'meta_cloud_api'` or `'simulated'` |
| `providerMessageId`| String | WhatsApp message ID from Meta or simulation generator |
| `status` | String | `'QUEUED'`, `'SENT'`, `'DELIVERED'`, `'FAILED'` |
| `attemptCount` | Number | Number of dispatch attempts |
| `lastError` | String | Error message from provider API |
| `idempotencyKey` | String (unique) | Prevent duplicate messages |
| `sentAt` | Date | Time message was transmitted |
| `deliveredAt` | Date | Time message delivery receipt was received |

---

## 8. REST API Reference

### Authentication Endpoints
- `POST /api/v1/auth/register` — Register a customer account
- `POST /api/v1/auth/login` — Customer email/password login
- `POST /api/v1/auth/admin/login` — Admin passkey authentication
  - **Body**: `{ "passkey": "your_admin_passkey", "email": "optional" }`
  - **Response**: `{ "success": true, "data": { "token": "...", "user": { "role": "admin" } } }`
- `POST /api/v1/auth/admin/change-passkey` — Change admin passkey (Protected: Admin)
  - **Body**: `{ "currentPasskey": "...", "newPasskey": "..." }`
- `POST /api/v1/auth/logout` — Clear session cookie
- `GET /api/v1/auth/me` — Get authenticated profile

### Orders & Tracking Endpoints
- `POST /api/v1/orders` — Place order (Protected: Customer)
  - **Body**: `{ "shippingAddress": { ... }, "whatsappNumber": "919876543210", "whatsappOptIn": true, "paymentMethod": "cod", "items": [ ... ] }`
  - **Initial Status**: `pending`
- `GET /api/v1/orders/my-orders` — List current user's orders
- `GET /api/v1/orders/:id` — Get single order
- `GET /api/v1/orders/:id/tracking` — Live tracking progression and audit history
- `POST /api/v1/orders/:id/cancel` — Cancel eligible order (restores stock)

### Administrative Management Endpoints (Protected: Admin)
- `GET /api/v1/admin/dashboard` — Overview statistics with full lifecycle breakdown
- `GET /api/v1/admin/orders` — Query orders with status filter and search query (`?status=...&search=...`)
- `GET /api/v1/admin/orders/:id` — Order details, allowed next transitions, and notification logs
- `PATCH /api/v1/admin/orders/:id/status` — Advance order status
  - **Body**: `{ "status": "shipped", "courierName": "...", "trackingNumber": "..." }`
- `GET /api/v1/admin/orders/:id/logs` — List WhatsApp delivery logs for an order

### Webhook Endpoints
- `GET /api/v1/webhooks/whatsapp` — Meta Webhook verification handshake
- `POST /api/v1/webhooks/whatsapp` — Inbound delivery status callback handler

---

## 9. Local Setup & Configuration

### Prerequisites
1. Node.js v18 or newer
2. Local MongoDB running on `mongodb://localhost:27017`

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure the following keys are set:
```env
PORT=5001
FRONTEND_URL=http://localhost:8080
MONGODB_URI=mongodb://localhost:27017/studentbazaar
JWT_SECRET=your_jwt_secret_key_here
ADMIN_PASSKEY=YourSecretAdminPasskey!
ADMIN_WHATSAPP_NUMBER=919876543210
WHATSAPP_WEBHOOK_VERIFY_TOKEN=studentbazaar_wa_verify_2026
```

### Running Locally
```bash
# In server directory:
cd server
npm install
npm test            # Runs all 29 automated integration tests
npm start           # Starts API server on http://localhost:5001

# In root directory (serving frontend):
npx serve -l 8080 .
```

---

## 10. Meta WhatsApp Cloud API Production Setup

1. **Create a Meta Developer App**:
   - Go to [developers.facebook.com](https://developers.facebook.com).
   - Create a Business App and add the **WhatsApp** product.
2. **Retrieve API Credentials**:
   - Locate your **Phone Number ID** and **WhatsApp Business Account ID** in the WhatsApp Getting Started panel.
   - Generate a permanent **System User Access Token** in Meta Business Manager with permissions: `whatsapp_business_messaging` and `whatsapp_business_management`.
   - Update `.env`:
     ```env
     WHATSAPP_ACCESS_TOKEN=EAAG...
     WHATSAPP_PHONE_NUMBER_ID=123456789...
     WHATSAPP_BUSINESS_ACCOUNT_ID=987654321...
     ```
3. **Configure Webhook**:
   - In Meta WhatsApp configuration, add your Webhook URL:
     `https://your-domain.com/api/v1/webhooks/whatsapp`
   - Set Verify Token: matching `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
   - Subscribe to the `messages` event field.

---

## 11. Security Audit & Best Practices

1. **Passkey Protection**: Passkeys are never returned in responses, serialized in logs, or placed in client assets.
2. **Server-Side Price Validation**: Never trusts frontend price or discount calculations; prices are looked up directly from MongoDB.
3. **Strict Transition Guard**: Cannot bypass workflow stages through arbitrary API requests.
4. **Rate Limiting**: Applied to `/api/v1/auth/*` endpoints (5 attempts per 15 minutes) to prevent brute-force attacks.
5. **NoSQL Injection Sanitization**: All incoming query and body payloads have dangerous operators stripped while preserving Meta webhook dot notation.
6. **Delivery Verification for COD**: Prevents marking COD orders as paid before physical delivery.
