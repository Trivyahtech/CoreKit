# CoreKit ECommerce — Test Cases

| Field         | Value             |
| ------------- | ----------------- |
| **Project**   | CoreKit ECommerce |
| **Version**   | 1.0.0            |
| **Date**      | 2026-04-14        |

---

## 1. Auth Module

### TC-AUTH-01: Customer Registration — Happy Path
| Field | Value |
|-------|-------|
| **Precondition** | Tenant "corekit" exists; email not already registered |
| **Input** | `POST /api/v1/auth/register` with valid `tenantSlug`, `email`, `password`, `firstName` |
| **Expected** | `201` — returns `accessToken`, `refreshToken`, and `user` object with role `CUSTOMER` |

### TC-AUTH-02: Registration — Duplicate Email
| Field | Value |
|-------|-------|
| **Precondition** | User with same email already exists in tenant |
| **Input** | `POST /api/v1/auth/register` with existing email |
| **Expected** | `409 Conflict` — "Email already registered" |

### TC-AUTH-03: Registration — Missing Required Fields
| Field | Value |
|-------|-------|
| **Input** | `POST /api/v1/auth/register` without `email` or `password` |
| **Expected** | `400 Bad Request` — validation error listing missing fields |

### TC-AUTH-04: Registration — Rate Limit
| Field | Value |
|-------|-------|
| **Input** | Send 6 registration requests within 1 minute |
| **Expected** | 6th request returns `429 Too Many Requests` |

### TC-AUTH-05: Login — Valid Credentials
| Field | Value |
|-------|-------|
| **Precondition** | Registered user exists |
| **Input** | `POST /api/v1/auth/login` with correct `email` and `password` |
| **Expected** | `200` — returns JWT tokens |

### TC-AUTH-06: Login — Wrong Password
| Field | Value |
|-------|-------|
| **Input** | `POST /api/v1/auth/login` with wrong password |
| **Expected** | `401 Unauthorized` |

### TC-AUTH-07: OTP Send
| Field | Value |
|-------|-------|
| **Precondition** | User exists in tenant |
| **Input** | `POST /api/v1/auth/otp/send` with valid email |
| **Expected** | `200` — OTP sent confirmation |

### TC-AUTH-08: OTP Verify — Valid
| Field | Value |
|-------|-------|
| **Input** | `POST /api/v1/auth/otp/verify` with correct OTP |
| **Expected** | `200` — returns JWT tokens |

### TC-AUTH-09: OTP Verify — Invalid/Expired
| Field | Value |
|-------|-------|
| **Input** | `POST /api/v1/auth/otp/verify` with wrong OTP |
| **Expected** | `401 Unauthorized` |

### TC-AUTH-10: Token Refresh — Valid
| Field | Value |
|-------|-------|
| **Input** | `POST /api/v1/auth/refresh` with valid refresh token |
| **Expected** | `200` — new access + refresh tokens |

### TC-AUTH-11: Token Refresh — Expired Token
| Field | Value |
|-------|-------|
| **Input** | `POST /api/v1/auth/refresh` with expired refresh token |
| **Expected** | `401 Unauthorized` |

### TC-AUTH-12: Get Me — Authenticated
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/auth/me` with valid Bearer token |
| **Expected** | `200` — user profile object |

### TC-AUTH-13: Get Me — No Token
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/auth/me` without Authorization header |
| **Expected** | `401 Unauthorized` |

### TC-AUTH-14: Admin Check — Non-Admin
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/auth/admin-check` with CUSTOMER token |
| **Expected** | `403 Forbidden` |

---

## 2. Products Module

### TC-PROD-01: Create Product — Admin
| Field | Value |
|-------|-------|
| **Precondition** | Authenticated as ADMIN |
| **Input** | `POST /api/v1/products` with valid product data |
| **Expected** | `201` — product created in DRAFT status |

### TC-PROD-02: Create Product — Customer (Forbidden)
| Field | Value |
|-------|-------|
| **Input** | `POST /api/v1/products` with CUSTOMER token |
| **Expected** | `403 Forbidden` |

### TC-PROD-03: Create Product — Duplicate Slug
| Field | Value |
|-------|-------|
| **Precondition** | Product with same slug exists in tenant |
| **Input** | `POST /api/v1/products` with duplicate slug |
| **Expected** | `409 Conflict` |

### TC-PROD-04: List Products — Public
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/products?tenant=corekit` (no auth) |
| **Expected** | `200` — array of products |

### TC-PROD-05: List Products — Status Filter
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/products?tenant=corekit&status=ACTIVE` |
| **Expected** | `200` — only ACTIVE products returned |

### TC-PROD-06: Get Product Detail — Public
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/products/:id` (no auth) |
| **Expected** | `200` — product with variants, images, reviews |

### TC-PROD-07: Get Product — Not Found
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/products/nonexistent-id` |
| **Expected** | `404 Not Found` |

### TC-PROD-08: Publish Product
| Field | Value |
|-------|-------|
| **Precondition** | DRAFT product exists; authenticated as ADMIN |
| **Input** | `PATCH /api/v1/products/:id/publish` |
| **Expected** | `200` — `isPublished: true`, `status: ACTIVE` |

### TC-PROD-09: Delete Product — Admin Only
| Field | Value |
|-------|-------|
| **Input** | `DELETE /api/v1/products/:id` with ADMIN token |
| **Expected** | `200` — product deleted |

### TC-PROD-10: Delete Product — Staff (Forbidden)
| Field | Value |
|-------|-------|
| **Input** | `DELETE /api/v1/products/:id` with STAFF token |
| **Expected** | `403 Forbidden` |

---

## 3. Categories Module

### TC-CAT-01: Create Category
| Field | Value |
|-------|-------|
| **Input** | `POST /api/v1/categories` with ADMIN token, valid data |
| **Expected** | `201` — category created |

### TC-CAT-02: List Categories — Public
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/categories?tenant=corekit` |
| **Expected** | `200` — array of categories |

### TC-CAT-03: Create Sub-Category
| Field | Value |
|-------|-------|
| **Input** | `POST /api/v1/categories` with `parentId` of existing category |
| **Expected** | `201` — child category linked to parent |

### TC-CAT-04: Delete Category — Admin Only
| Field | Value |
|-------|-------|
| **Input** | `DELETE /api/v1/categories/:id` with ADMIN token |
| **Expected** | `200` — category deleted; children re-parented |

---

## 4. Cart Module

### TC-CART-01: Get Empty Cart
| Field | Value |
|-------|-------|
| **Precondition** | No active cart for user |
| **Input** | `GET /api/v1/cart` |
| **Expected** | `200` — empty cart or new cart created |

### TC-CART-02: Add Item to Cart
| Field | Value |
|-------|-------|
| **Input** | `POST /api/v1/cart/items` with valid `productId`, `variantId`, `quantity` |
| **Expected** | `201` — cart returned with item; totals calculated |

### TC-CART-03: Add Same Variant Again
| Field | Value |
|-------|-------|
| **Precondition** | Variant already in cart with qty 1 |
| **Input** | `POST /api/v1/cart/items` with same `variantId`, qty 2 |
| **Expected** | Quantity incremented to 3; totals updated |

### TC-CART-04: Update Item Quantity
| Field | Value |
|-------|-------|
| **Input** | `PATCH /api/v1/cart/items/:itemId` with `quantity: 5` |
| **Expected** | `200` — quantity updated; totals recalculated |

### TC-CART-05: Remove Item
| Field | Value |
|-------|-------|
| **Input** | `DELETE /api/v1/cart/items/:itemId` |
| **Expected** | `200` — item removed; totals recalculated |

### TC-CART-06: Clear Cart
| Field | Value |
|-------|-------|
| **Input** | `DELETE /api/v1/cart` |
| **Expected** | `200` — all items removed |

### TC-CART-07: Apply Valid Coupon
| Field | Value |
|-------|-------|
| **Precondition** | Active coupon "SAVE10" exists; cart meets min value |
| **Input** | `POST /api/v1/cart/coupon` with `couponCode: "SAVE10"` |
| **Expected** | `200` — discount applied; `discountAmount` updated |

### TC-CART-08: Apply Invalid Coupon
| Field | Value |
|-------|-------|
| **Input** | `POST /api/v1/cart/coupon` with `couponCode: "INVALID"` |
| **Expected** | `400 Bad Request` — coupon not found or inactive |

### TC-CART-09: Cart Without Auth
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/cart` without Authorization header |
| **Expected** | `401 Unauthorized` |

---

## 5. Address Module

### TC-ADDR-01: Create Address
| Field | Value |
|-------|-------|
| **Input** | `POST /api/v1/addresses` with valid address data |
| **Expected** | `201` — address created |

### TC-ADDR-02: List Addresses
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/addresses` |
| **Expected** | `200` — array of user's addresses |

### TC-ADDR-03: Set Default Address
| Field | Value |
|-------|-------|
| **Input** | `PATCH /api/v1/addresses/:id/default` |
| **Expected** | `200` — address marked default; previous default unset |

### TC-ADDR-04: Delete Address
| Field | Value |
|-------|-------|
| **Input** | `DELETE /api/v1/addresses/:id` |
| **Expected** | `200` — address deleted |

### TC-ADDR-05: Access Other User's Address
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/addresses/:otherId` (address belongs to different user) |
| **Expected** | `404 Not Found` or `403 Forbidden` |

---

## 6. Orders Module

### TC-ORD-01: Create Order from Cart
| Field | Value |
|-------|-------|
| **Precondition** | Active cart with items; valid addresses exist |
| **Input** | `POST /api/v1/orders` with `billingAddressId` and `shippingAddressId` |
| **Expected** | `201` — order created with CREATED status; cart becomes CONVERTED |

### TC-ORD-02: Create Order — Empty Cart
| Field | Value |
|-------|-------|
| **Input** | `POST /api/v1/orders` when cart is empty |
| **Expected** | `400 Bad Request` |

### TC-ORD-03: List My Orders
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/orders` |
| **Expected** | `200` — array of user's orders only |

### TC-ORD-04: Get Order Details
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/orders/:id` |
| **Expected** | `200` — order with items, payments, status logs |

### TC-ORD-05: Update Order Status — Admin
| Field | Value |
|-------|-------|
| **Input** | `PATCH /api/v1/orders/:id/status` with `status: "CONFIRMED"` |
| **Expected** | `200` — status updated; log entry created |

### TC-ORD-06: Update Order Status — Customer (Forbidden)
| Field | Value |
|-------|-------|
| **Input** | `PATCH /api/v1/orders/:id/status` with CUSTOMER token |
| **Expected** | `403 Forbidden` |

---

## 7. Payments Module

### TC-PAY-01: Initiate Razorpay Payment
| Field | Value |
|-------|-------|
| **Input** | `POST /api/v1/payments` with `orderId` and `provider: "RAZORPAY"` |
| **Expected** | `201` — payment created; gateway order ID returned |

### TC-PAY-02: Initiate COD Payment
| Field | Value |
|-------|-------|
| **Input** | `POST /api/v1/payments` with `provider: "COD"` |
| **Expected** | `201` — payment created with PENDING status |

### TC-PAY-03: Verify Payment — Valid
| Field | Value |
|-------|-------|
| **Input** | `PATCH /api/v1/payments/:id/verify` with valid gateway data |
| **Expected** | `200` — payment status set to CAPTURED; order updated |

### TC-PAY-04: Verify Payment — Invalid Signature
| Field | Value |
|-------|-------|
| **Input** | `PATCH /api/v1/payments/:id/verify` with tampered signature |
| **Expected** | `400 Bad Request` — payment status set to FAILED |

### TC-PAY-05: Get Payments for Order
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/payments/order/:orderId` |
| **Expected** | `200` — array of payments for the order |

---

## 8. Users Module

### TC-USER-01: List Users — Admin
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/users?tenant=corekit` with ADMIN token |
| **Expected** | `200` — array of all tenant users |

### TC-USER-02: List Users — Customer (Forbidden)
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/users?tenant=corekit` with CUSTOMER token |
| **Expected** | `403 Forbidden` |

### TC-USER-03: Update Role — Admin
| Field | Value |
|-------|-------|
| **Input** | `PATCH /api/v1/users/:id/role` with `role: "STAFF"` |
| **Expected** | `200` — user role updated |

### TC-USER-04: Update Role — Staff (Forbidden)
| Field | Value |
|-------|-------|
| **Input** | `PATCH /api/v1/users/:id/role` with STAFF token |
| **Expected** | `403 Forbidden` |

---

## 9. Shipping Module

### TC-SHIP-01: Create Shipping Zone
| Field | Value |
|-------|-------|
| **Input** | `POST /api/v1/shipping` with zone data |
| **Expected** | `201` — shipping zone created |

### TC-SHIP-02: List Shipping Zones
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/shipping` |
| **Expected** | `200` — array of shipping zones |

### TC-SHIP-03: Delete Shipping Zone
| Field | Value |
|-------|-------|
| **Input** | `DELETE /api/v1/shipping/:id` |
| **Expected** | `200` — zone deleted |

---

## 10. Health Module

### TC-HEALTH-01: Health Check
| Field | Value |
|-------|-------|
| **Input** | `GET /api/v1/health` (no auth) |
| **Expected** | `200` — `{ status: "ok", service: "corekit-backend", timestamp: "..." }` |

---

## 11. Cross-Cutting Test Cases

### TC-CC-01: Tenant Data Isolation
| Field | Value |
|-------|-------|
| **Description** | User in Tenant A cannot see products/orders from Tenant B |
| **Steps** | Create resources in two tenants; query from each tenant |
| **Expected** | Resources are scoped to their respective tenants |

### TC-CC-02: Global Rate Limiting
| Field | Value |
|-------|-------|
| **Input** | Send 61 requests within 1 minute from same IP |
| **Expected** | 61st request returns `429 Too Many Requests` |

### TC-CC-03: Input Validation — Extra Fields
| Field | Value |
|-------|-------|
| **Input** | Include unexpected fields in request body (e.g., `role: "ADMIN"` on register) |
| **Expected** | `400 Bad Request` — forbidNonWhitelisted rejects extra fields |

### TC-CC-04: Expired JWT
| Field | Value |
|-------|-------|
| **Input** | Make any protected request with expired access token |
| **Expected** | `401 Unauthorized` |
