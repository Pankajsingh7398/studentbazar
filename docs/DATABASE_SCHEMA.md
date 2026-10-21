# StudentBazaar — Database Schema & Mongoose Models

This document details the MongoDB collections, fields, data types, indexes, and relationships implemented via Mongoose.

---

## 1. User Model (`User.js`)
Stores customer and administrator profiles, authentication credentials, and address books.

| Field | Type | Validation / Default | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Required, trimmed, max 80 chars | Full name of scholar / user |
| `email` | String | Required, unique, lowercase, indexed | Email address |
| `passwordHash` | String | Required | Bcrypt salted hash (excluded in JSON) |
| `phone` | String | Optional, trimmed | Contact / WhatsApp number for delivery |
| `role` | String | Enum: `['customer', 'admin']`, default: `'customer'` | Access role (Admins seeded only) |
| `addresses` | Array | Subdocument schema | List of shipping addresses (Hostel/Gate) |
| `isActive` | Boolean | Default: `true` | Account active state |
| `emailVerified`| Boolean | Default: `false` | Email verification flag |
| `createdAt` | Date | Managed by Mongoose | Timestamp |
| `updatedAt` | Date | Managed by Mongoose | Timestamp |

**Indexes:**
- `{ email: 1 }` (Unique)

---

## 2. Product Model (`Product.js`)
Stores product catalog records, pricing, specifications, and inventory counts.

| Field | Type | Validation / Default | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Required, trimmed | Product display name |
| `slug` | String | Required, unique, lowercase | SEO URL slug (e.g. `motivational-notebook`) |
| `description` | String | Required | Detailed product description |
| `shortDescription`| String| Optional | Card synopsis / summary |
| `price` | Number | Required, min: 0 | Current selling price in INR |
| `compareAtPrice` | Number | Optional, min: 0 | MRP / Original price before discount |
| `SKU` | String | Required, unique, uppercase | Inventory SKU code |
| `category` | ObjectId | Ref: `'Category'`, Required | Category taxonomy link |
| `categorySlug`| String | Required, indexed | Redundant category slug for fast queries |
| `images` | [String] | Default: `[]` | Cloudinary URLs or illustration keys |
| `mockupStyle` | String | Optional | CSS classes for notebook cover renderer |
| `stock` | Number | Required, min: 0, default: 0 | Units in stock |
| `isActive` | Boolean | Default: `true`, indexed | Visibility flag |
| `featured` | Boolean | Default: `false`, indexed | Homepage featured showcase |
| `tags` | [String] | Indexed | Search keywords & badges (`bestseller`, etc.) |
| `specifications` | Map | Default: `{}` | Key-value pairs (GSM, Binding, Ruling, Pages) |

**Indexes:**
- `{ slug: 1 }` (Unique)
- `{ SKU: 1 }` (Unique)
- `{ name: 'text', description: 'text', tags: 'text' }` (Text search index)
- `{ categorySlug: 1, isActive: 1, price: 1 }` (Compound filtering index)

---

## 3. Category Model (`Category.js`)
Taxonomy categories for navigation and filtering.

| Field | Type | Validation / Default | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Required, trimmed | Category title (e.g. `Notebooks`) |
| `slug` | String | Required, unique | URL slug (e.g. `notebooks`) |
| `description` | String | Optional | Category summary |
| `icon` | String | Default: `'menu_book'` | Material Symbol icon identifier |
| `isActive` | Boolean | Default: `true` | Visibility status |

---

## 4. Order Model (`Order.js`)
Captures finalized customer purchases with immutable snapshots of items, addresses, and payment records.

| Field | Type | Validation / Default | Description |
| :--- | :--- | :--- | :--- |
| `orderNumber` | String | Required, unique, indexed | Human-friendly code (e.g. `SB-2025-ABCD12`) |
| `user` | ObjectId | Ref: `'User'`, Required, indexed | Customer who placed the order |
| `items` | [OrderItem]| Required, min: 1 item | Immutable item snapshot subdocuments |
| `shippingAddress` | Object | Required | Snapshot of destination address at order time |
| `subtotal` | Number | Required, min: 0 | Sum of item unit prices × quantities |
| `discount` | Number | Default: 0 | Total coupon/student discount applied |
| `shippingFee` | Number | Default: 0 | Campus delivery fee (₹0 if subtotal ≥ ₹200) |
| `total` | Number | Required, min: 0 | Final payable amount |
| `paymentMethod` | String | Enum: `['cod', 'razorpay']` | Payment method chosen |
| `paymentStatus` | String | Enum: `['pending', 'paid', 'failed', 'refunded']` | Payment lifecycle |
| `orderStatus` | String | Enum: `['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']` | Fulfillment status |
| `paymentReference`| String | Optional | Razorpay payment ID / transaction ID |
| `razorpayOrderId` | String | Optional, indexed | Gateway order identifier |
| `trackingNumber` | String | Optional | Campus logistics dispatch identifier |

---

## 5. Wishlist Model (`Wishlist.js`)
Customer saved items list.

| Field | Type | Validation / Default | Description |
| :--- | :--- | :--- | :--- |
| `user` | ObjectId | Ref: `'User'`, Required, unique | Owner customer |
| `products` | [ObjectId]| Ref: `'Product'`, unique set | Saved product IDs |

---

## 6. Coupon Model (`Coupon.js`)
Promotional discount codes with validation constraints.

| Field | Type | Validation / Default | Description |
| :--- | :--- | :--- | :--- |
| `code` | String | Required, unique, uppercase | Promo code (e.g. `EXAM25`) |
| `discountType` | String | Enum: `['percentage', 'flat']` | Percentage or flat INR reduction |
| `discountValue`| Number | Required, min: 1 | Numeric value |
| `minimumOrderValue`| Number | Default: 0 | Minimum cart subtotal required |
| `maximumDiscount` | Number | Optional | Cap for percentage discounts |
| `validFrom` | Date | Required | Start time |
| `validUntil` | Date | Required | Expiration timestamp |
| `usageLimit` | Number | Optional | Total allowed redemptions across all users |
| `usedCount` | Number | Default: 0 | Times redeemed |
| `isActive` | Boolean | Default: `true` | Enable/disable switch |

---

## 7. Review Model (`Review.js`)
Customer product feedback with moderation support.

| Field | Type | Validation / Default | Description |
| :--- | :--- | :--- | :--- |
| `user` | ObjectId | Ref: `'User'`, Required | Reviewer |
| `product` | ObjectId | Ref: `'Product'`, Required, indexed | Product reviewed |
| `rating` | Number | Required, min: 1, max: 5 | Star rating |
| `comment` | String | Required, max: 1000 chars | Text review |
| `isApproved` | Boolean | Default: `true` | Admin moderation approval flag |
