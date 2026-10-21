# StudentBazaar — REST API Specification (`/api/v1`)

All endpoints respond with standardized JSON bodies:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Human readable response",
  "data": { ... }
}
```

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Creates a customer account. Sets HTTP-only authentication cookie upon registration.
- **Request Body:**
  ```json
  {
    "name": "Arjun Sharma",
    "email": "arjun@college.edu",
    "password": "SecurePassword123!",
    "phone": "9876543210"
  }
  ```
- **Response Status:** `201 Created`

### `POST /api/v1/auth/login`
Authenticates a user, verifies credentials, and issues a signed HTTP-only cookie.
- **Request Body:**
  ```json
  {
    "email": "arjun@college.edu",
    "password": "SecurePassword123!"
  }
  ```
- **Response Status:** `200 OK`

### `POST /api/v1/auth/logout`
Clears the authentication cookie.
- **Response Status:** `200 OK`

### `GET /api/v1/auth/me`
Retrieves the currently authenticated user's profile and active roles.
- **Headers:** Cookie: `token=...`
- **Response Status:** `200 OK` or `401 Unauthorized`

---

## 2. Product Endpoints (`/api/v1/products`)

### `GET /api/v1/products`
Retrieves paginated, filtered, and sorted products.
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 12)
  - `q` (search term for name, description, tags)
  - `category` (category slug)
  - `sort` (`price_asc`, `price_desc`, `newest`, `popular`)
  - `minPrice`, `maxPrice`
- **Response Status:** `200 OK`

### `GET /api/v1/products/featured`
Returns featured products curated for the homepage.
- **Response Status:** `200 OK`

### `GET /api/v1/products/:slugOrId`
Fetches detailed product record by slug or MongoDB ObjectId.
- **Response Status:** `200 OK` or `404 Not Found`

---

## 3. Category Endpoints (`/api/v1/categories`)

### `GET /api/v1/categories`
Retrieves all active categories.
- **Response Status:** `200 OK`

---

## 4. Shopping Cart Endpoints (`/api/v1/cart`)

### `GET /api/v1/cart`
Calculates and returns the user's current persistent cart with server-validated item prices, subtotal, delivery charges, and final total.
- **Response Status:** `200 OK`

### `POST /api/v1/cart/items`
Adds an item to the user's cart or increments quantity.
- **Request Body:**
  ```json
  {
    "productId": "653b...",
    "quantity": 1
  }
  ```
- **Response Status:** `200 OK`

### `PATCH /api/v1/cart/items/:productId`
Updates quantity for an item. If quantity is 0, removes the item.
- **Request Body:**
  ```json
  {
    "quantity": 2
  }
  ```
- **Response Status:** `200 OK`

### `DELETE /api/v1/cart/items/:productId`
Removes an item from the cart.
- **Response Status:** `200 OK`

---

## 5. Wishlist Endpoints (`/api/v1/wishlist`)

### `GET /api/v1/wishlist`
Returns all products saved in the user's wishlist.
- **Response Status:** `200 OK`

### `POST /api/v1/wishlist/items`
Toggles or adds a product to the wishlist.
- **Request Body:** `{ "productId": "653b..." }`
- **Response Status:** `200 OK`

### `DELETE /api/v1/wishlist/items/:productId`
Removes a product from the wishlist.
- **Response Status:** `200 OK`

---

## 6. Order Endpoints (`/api/v1/orders`)

### `POST /api/v1/orders`
Places a new order. Server validates inventory, calculates authoritative prices, applies discount codes, creates an immutable order snapshot, and decrements stock.
- **Request Body:**
  ```json
  {
    "shippingAddress": {
      "fullName": "Arjun Sharma",
      "phone": "9876543210",
      "hostelOrBuilding": "Block B, Room 302",
      "campusName": "North Campus University",
      "city": "New Delhi",
      "pinCode": "110007"
    },
    "paymentMethod": "cod",
    "couponCode": "EXAM25"
  }
  ```
- **Response Status:** `201 Created`

### `GET /api/v1/orders/my-orders`
Retrieves all orders belonging to the authenticated customer.
- **Response Status:** `200 OK`

### `GET /api/v1/orders/:id`
Retrieves detailed snapshot for a single order owned by the user.
- **Response Status:** `200 OK` or `404 Not Found`

---

## 7. Admin Endpoints (`/api/v1/admin`)
*All admin endpoints require an authenticated user with `role === 'admin'`.*

### `GET /api/v1/admin/dashboard`
Returns total sales, order count, registered customer count, pending orders, and low-stock alerts.
- **Response Status:** `200 OK`

### `GET /api/v1/admin/orders`
Returns paginated list of all customer orders.
- **Response Status:** `200 OK`

### `PATCH /api/v1/admin/orders/:id/status`
Updates order status (`confirmed`, `processing`, `shipped`, `delivered`, `cancelled`).
- **Response Status:** `200 OK`

### `POST /api/v1/admin/products`
Creates a new product record.
- **Response Status:** `201 Created`

### `PATCH /api/v1/admin/products/:id`
Updates an existing product record or inventory stock.
- **Response Status:** `200 OK`

### `DELETE /api/v1/admin/products/:id`
Deactivates or deletes a product.
- **Response Status:** `200 OK`

---

## 8. Health Check Endpoint (`/api/v1/health`)
### `GET /api/v1/health`
Checks server uptime, memory usage, and database connectivity.
- **Response Status:** `200 OK`
