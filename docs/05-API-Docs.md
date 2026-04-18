# CoreKit ECommerce — API Documentation

| Field          | Value                                  |
| -------------- | -------------------------------------- |
| **Base URL**   | `http://localhost:6767/api/v1`         |
| **Auth**       | Bearer JWT Token                       |
| **Swagger UI** | `http://localhost:6767/api/docs`       |
| **Versioning** | URI-based (`/api/v1/`)                 |

---

## Authentication Headers

All protected endpoints require:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

Endpoints marked 🔓 are public (no auth required).

---

## 1. Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | 🔓 | Service health check |

**Response `200`:**
```json
{
  "status": "ok",
  "service": "corekit-backend",
  "timestamp": "2026-04-14T14:00:00.000Z"
}
```

---

## 2. Auth

### 2.1 Register

| Method | Endpoint | Auth | Rate Limit |
|--------|----------|------|------------|
| POST | `/auth/register` | 🔓 | 5/min |

**Request Body:**
```json
{
  "tenantSlug": "corekit",
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+919876543210"
}
```

**Response `201`:**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "firstName": "John",
    "role": "CUSTOMER"
  }
}
```

---

### 2.2 Login

| Method | Endpoint | Auth | Rate Limit |
|--------|----------|------|------------|
| POST | `/auth/login` | 🔓 | 10/min |

**Request Body:**
```json
{
  "tenantSlug": "corekit",
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response `200`:** Same as Register response.

---

### 2.3 Send OTP

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/auth/otp/send` | 🔓 |

**Request Body:**
```json
{
  "tenantSlug": "corekit",
  "email": "user@example.com"
}
```

**Response `200`:**
```json
{ "message": "OTP sent to user@example.com" }
```

---

### 2.4 Verify OTP

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/auth/otp/verify` | 🔓 |

**Request Body:**
```json
{
  "tenantSlug": "corekit",
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response `200`:** Returns JWT tokens.

---

### 2.5 Refresh Token

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/auth/refresh` | 🔓 |

**Request Body:**
```json
{ "refreshToken": "eyJhbG..." }
```

**Response `200`:**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

**Error `401`:** Invalid or expired refresh token.

---

### 2.6 Google OAuth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/auth/google` | 🔓 | Redirect to Google consent |
| GET | `/auth/google/callback` | 🔓 | Google callback handler |

---

### 2.7 Get Current User

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/auth/me` | 🔒 Bearer |

**Response `200`:**
```json
{
  "id": "clx...",
  "tenantId": "clx...",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER",
  "status": "ACTIVE"
}
```

---

### 2.8 Admin Check

| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| GET | `/auth/admin-check` | 🔒 Bearer | ADMIN |

**Response `200`:**
```json
{ "message": "You have admin access", "user": { ... } }
```

---

## 3. Users

### 3.1 List Users

| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| GET | `/users?tenant=corekit` | 🔒 Bearer | ADMIN, STAFF |

**Response `200`:** Array of user objects.

---

### 3.2 Update User Role

| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| PATCH | `/users/:id/role` | 🔒 Bearer | ADMIN |

**Request Body:**
```json
{ "role": "STAFF" }
```

**Valid Roles:** `ADMIN`, `VENDOR`, `STAFF`, `CUSTOMER`

---

## 4. Products

### 4.1 Create Product

| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| POST | `/products` | 🔒 Bearer | ADMIN, VENDOR, STAFF |

**Request Body:**
```json
{
  "tenantSlug": "corekit",
  "name": "Premium T-Shirt",
  "slug": "premium-t-shirt",
  "shortDescription": "Comfortable cotton tee",
  "description": "Full description...",
  "brand": "CoreBrand",
  "vendorId": "clx...",
  "taxCode": "GST18",
  "taxRate": 18.00
}
```

---

### 4.2 List Products

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/products?tenant=corekit&status=ACTIVE` | 🔓 |

**Query Params:**
- `tenant` (required) — tenant slug
- `status` (optional) — `DRAFT`, `ACTIVE`, `ARCHIVED`

---

### 4.3 Get Product

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/products/:id` | 🔓 |

**Response:** Product with variants, images, categories, reviews.

---

### 4.4 Update Product

| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| PATCH | `/products/:id` | 🔒 Bearer | ADMIN, VENDOR, STAFF |

---

### 4.5 Publish Product

| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| PATCH | `/products/:id/publish` | 🔒 Bearer | ADMIN, STAFF |

---

### 4.6 Unpublish Product

| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| PATCH | `/products/:id/unpublish` | 🔒 Bearer | ADMIN, STAFF |

---

### 4.7 Assign Categories

| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| PATCH | `/products/:id/categories` | 🔒 Bearer | ADMIN, STAFF |

**Request Body:**
```json
{ "categoryIds": ["clx...", "clx..."] }
```

---

### 4.8 Delete Product

| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| DELETE | `/products/:id` | 🔒 Bearer | ADMIN |

---

## 5. Categories

### 5.1 Create Category

| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| POST | `/categories` | 🔒 Bearer | ADMIN, STAFF |

**Request Body:**
```json
{
  "tenantSlug": "corekit",
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic gadgets",
  "parentId": null,
  "sortOrder": 0
}
```

---

### 5.2 List Categories

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/categories?tenant=corekit` | 🔓 |

---

### 5.3 Get Category

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/categories/:id` | 🔓 |

**Response:** Category with associated products.

---

### 5.4 Update Category

| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| PATCH | `/categories/:id` | 🔒 Bearer | ADMIN, STAFF |

---

### 5.5 Delete Category

| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| DELETE | `/categories/:id` | 🔒 Bearer | ADMIN |

---

## 6. Cart

> All cart endpoints require authentication. Cart is scoped to the logged-in user's active cart.

### 6.1 Get Cart

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/cart` | 🔒 Bearer |

**Response `200`:**
```json
{
  "id": "clx...",
  "status": "ACTIVE",
  "items": [
    {
      "id": "clx...",
      "productId": "clx...",
      "variantId": "clx...",
      "titleSnapshot": "Premium T-Shirt - Blue / L",
      "skuSnapshot": "TSH-BLU-L",
      "unitPrice": 1299.00,
      "quantity": 2,
      "totalPrice": 2598.00
    }
  ],
  "subtotal": 2598.00,
  "taxAmount": 467.64,
  "shippingAmount": 49.00,
  "discountAmount": 0,
  "grandTotal": 3114.64
}
```

---

### 6.2 Add Item

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/cart/items` | 🔒 Bearer |

**Request Body:**
```json
{
  "productId": "clx...",
  "variantId": "clx...",
  "quantity": 1
}
```

---

### 6.3 Update Item Quantity

| Method | Endpoint | Auth |
|--------|----------|------|
| PATCH | `/cart/items/:itemId` | 🔒 Bearer |

**Request Body:**
```json
{ "quantity": 3 }
```

---

### 6.4 Remove Item

| Method | Endpoint | Auth |
|--------|----------|------|
| DELETE | `/cart/items/:itemId` | 🔒 Bearer |

---

### 6.5 Clear Cart

| Method | Endpoint | Auth |
|--------|----------|------|
| DELETE | `/cart` | 🔒 Bearer |

---

### 6.6 Apply Coupon

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/cart/coupon` | 🔒 Bearer |

**Request Body:**
```json
{ "couponCode": "SAVE10" }
```

---

## 7. Addresses

### 7.1 Create Address

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/addresses` | 🔒 Bearer |

**Request Body:**
```json
{
  "type": "SHIPPING",
  "fullName": "John Doe",
  "phone": "+919876543210",
  "line1": "123 Main Street",
  "line2": "Apt 4B",
  "landmark": "Near Central Park",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001"
}
```

---

### 7.2 List Addresses

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/addresses` | 🔒 Bearer |

---

### 7.3 Get Address

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/addresses/:id` | 🔒 Bearer |

---

### 7.4 Update Address

| Method | Endpoint | Auth |
|--------|----------|------|
| PATCH | `/addresses/:id` | 🔒 Bearer |

---

### 7.5 Set Default

| Method | Endpoint | Auth |
|--------|----------|------|
| PATCH | `/addresses/:id/default` | 🔒 Bearer |

---

### 7.6 Delete Address

| Method | Endpoint | Auth |
|--------|----------|------|
| DELETE | `/addresses/:id` | 🔒 Bearer |

---

## 8. Orders

### 8.1 Create Order

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/orders` | 🔒 Bearer |

**Request Body:**
```json
{
  "billingAddressId": "clx...",
  "shippingAddressId": "clx...",
  "customerNote": "Please deliver before 5 PM"
}
```

---

### 8.2 List My Orders

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/orders` | 🔒 Bearer |

---

### 8.3 Get Order Details

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/orders/:id` | 🔒 Bearer |

**Response:** Order with items, payments, status logs, addresses.

---

### 8.4 Update Order Status

| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| PATCH | `/orders/:id/status` | 🔒 Bearer | ADMIN, STAFF |

**Request Body:**
```json
{
  "status": "CONFIRMED",
  "note": "Payment verified"
}
```

**Valid Statuses:** `CREATED`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `COMPLETED`, `CANCELLED`, `REFUNDED`

---

## 9. Payments

### 9.1 Initiate Payment

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/payments` | 🔒 Bearer |

**Request Body:**
```json
{
  "orderId": "clx...",
  "provider": "RAZORPAY"
}
```

**Valid Providers:** `RAZORPAY`, `COD`, `MANUAL`

---

### 9.2 Verify Payment

| Method | Endpoint | Auth |
|--------|----------|------|
| PATCH | `/payments/:id/verify` | 🔓 (webhook) |

**Request Body:**
```json
{
  "gatewayPaymentId": "pay_xxxxx",
  "gatewaySignature": "sig_xxxxx"
}
```

---

### 9.3 Get Payments for Order

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/payments/order/:orderId` | 🔒 Bearer |

---

### 9.4 Get Payment Details

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/payments/:id` | 🔒 Bearer |

---

## 10. Shipping

### 10.1 Create Shipping Zone

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/shipping` | 🔒 Bearer |

---

### 10.2 List Shipping Zones

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/shipping` | 🔒 Bearer |

---

### 10.3 Get Shipping Zone

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/shipping/:id` | 🔒 Bearer |

---

### 10.4 Update Shipping Zone

| Method | Endpoint | Auth |
|--------|----------|------|
| PATCH | `/shipping/:id` | 🔒 Bearer |

---

### 10.5 Delete Shipping Zone

| Method | Endpoint | Auth |
|--------|----------|------|
| DELETE | `/shipping/:id` | 🔒 Bearer |

---

## Error Response Format

All API errors follow a consistent structure:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

| Status Code | Meaning |
|-------------|---------|
| `400` | Bad Request — validation error |
| `401` | Unauthorized — missing/invalid token |
| `403` | Forbidden — insufficient role |
| `404` | Not Found |
| `409` | Conflict — duplicate resource |
| `429` | Too Many Requests — rate limited |
| `500` | Internal Server Error |
