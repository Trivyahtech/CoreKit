# CoreKit ECommerce — User Stories & Acceptance Criteria

| Field            | Value                     |
| ---------------- | ------------------------- |
| **Project**      | CoreKit ECommerce         |
| **Version**      | 1.0.0                    |
| **Date**         | 2026-04-14                |

---

## Epic 1 — Authentication & Account Management

### US-1.1 Customer Registration

**As a** visitor,  
**I want to** register with my email and password,  
**So that** I can shop and track my orders.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | User provides `tenantSlug`, `email`, `password`, and `firstName` |
| AC-2 | System validates email uniqueness within the tenant |
| AC-3 | Password is hashed with bcrypt before storage |
| AC-4 | Response returns JWT access token + refresh token |
| AC-5 | Rate limited to 5 requests per minute |

---

### US-1.2 Customer Login

**As a** registered customer,  
**I want to** log in with my credentials,  
**So that** I can access my account.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | User provides `tenantSlug`, `email`, and `password` |
| AC-2 | System returns JWT access token + refresh token on valid credentials |
| AC-3 | Invalid credentials return 401 Unauthorized |
| AC-4 | Rate limited to 10 requests per minute |

---

### US-1.3 OTP-Based Login

**As a** customer,  
**I want to** log in via OTP sent to my email,  
**So that** I don't need to remember a password.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `POST /auth/otp/send` dispatches a one-time code to the user's email |
| AC-2 | `POST /auth/otp/verify` validates the OTP and returns JWT tokens |
| AC-3 | Expired or invalid OTP returns 401 |

---

### US-1.4 Google SSO

**As a** customer,  
**I want to** sign in with my Google account,  
**So that** I can register/login without a password.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | Clicking "Sign in with Google" redirects to Google OAuth consent |
| AC-2 | On callback, system creates or links the user and returns JWT |
| AC-3 | Google ID is stored on the user record |

---

### US-1.5 Token Refresh

**As a** logged-in user,  
**I want to** refresh my expired access token,  
**So that** I stay authenticated without re-entering credentials.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `POST /auth/refresh` accepts a valid refresh token |
| AC-2 | Returns a new access token and rotated refresh token |
| AC-3 | Invalid/expired refresh token returns 401 |

---

### US-1.6 View My Profile

**As a** logged-in user,  
**I want to** see my profile information,  
**So that** I can verify my account details.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `GET /auth/me` returns current user object (id, email, firstName, role) |
| AC-2 | Requires valid Bearer token |

---

## Epic 2 — Product Catalogue

### US-2.1 Create Product

**As an** Admin/Vendor/Staff,  
**I want to** create a new product,  
**So that** it appears in the store catalogue.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | Body includes `tenantSlug`, `name`, `slug`, `description`, optional `vendorId` |
| AC-2 | Product is created in DRAFT status by default |
| AC-3 | Only ADMIN, VENDOR, and STAFF roles can access this endpoint |
| AC-4 | Duplicate slug within the same tenant returns 409 |

---

### US-2.2 Browse Products

**As a** visitor/customer,  
**I want to** browse all active products for a store,  
**So that** I can find items to purchase.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `GET /products?tenant=<slug>` is publicly accessible |
| AC-2 | Optional `status` query filter (default: ACTIVE + published) |
| AC-3 | Response includes product list with images and variant info |

---

### US-2.3 View Product Details

**As a** visitor/customer,  
**I want to** view a product's full details,  
**So that** I can decide whether to buy it.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `GET /products/:id` is publicly accessible |
| AC-2 | Response includes variants, images, categories, and reviews |

---

### US-2.4 Publish/Unpublish Product

**As an** Admin/Staff,  
**I want to** publish or unpublish a product,  
**So that** I control what customers see.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `PATCH /products/:id/publish` sets `isPublished = true`, status = ACTIVE |
| AC-2 | `PATCH /products/:id/unpublish` sets `isPublished = false` |
| AC-3 | Only ADMIN and STAFF can perform this action |

---

### US-2.5 Assign Categories

**As an** Admin/Staff,  
**I want to** assign categories to a product,  
**So that** customers can discover it through category navigation.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `PATCH /products/:id/categories` accepts an array of `categoryIds` |
| AC-2 | Replaces existing category assignments |
| AC-3 | Only ADMIN and STAFF can perform this |

---

### US-2.6 Delete Product

**As an** Admin,  
**I want to** delete a product,  
**So that** discontinued items are removed from the system.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `DELETE /products/:id` soft-deletes or hard-deletes the product |
| AC-2 | Only ADMIN role can delete |
| AC-3 | Products with active orders cannot be deleted (returns 409) |

---

## Epic 3 — Category Management

### US-3.1 Create Category

**As an** Admin/Staff,  
**I want to** create a category with optional parent,  
**So that** I can organize the product catalogue.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | Body includes `tenantSlug`, `name`, `slug`, optional `parentId` |
| AC-2 | Slug must be unique within the tenant |
| AC-3 | Only ADMIN and STAFF can create categories |

---

### US-3.2 Browse Categories

**As a** visitor,  
**I want to** view all categories for a store,  
**So that** I can navigate the catalogue.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `GET /categories?tenant=<slug>` is publicly accessible |
| AC-2 | Returns hierarchical category tree |

---

## Epic 4 — Shopping Cart

### US-4.1 View Cart

**As a** logged-in customer,  
**I want to** see my current cart with all items and totals,  
**So that** I know what I'm about to purchase.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `GET /cart` returns active cart with items, prices, and grand total |
| AC-2 | If no active cart exists, returns an empty cart object |

---

### US-4.2 Add Item to Cart

**As a** customer,  
**I want to** add a product variant to my cart,  
**So that** I can purchase it later.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | Body includes `productId`, `variantId`, and `quantity` |
| AC-2 | Price snapshot is captured at time of add |
| AC-3 | If the same variant exists in cart, quantity is incremented |
| AC-4 | Cart totals are recalculated |

---

### US-4.3 Update Cart Item Quantity

**As a** customer,  
**I want to** change the quantity of a cart item,  
**So that** I can order more or fewer of an item.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `PATCH /cart/items/:itemId` accepts new `quantity` |
| AC-2 | Quantity of 0 removes the item |
| AC-3 | Cart totals are recalculated |

---

### US-4.4 Remove Cart Item

**As a** customer,  
**I want to** remove an item from my cart,  
**So that** I don't purchase something I no longer want.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `DELETE /cart/items/:itemId` removes the item |
| AC-2 | Cart totals are recalculated |

---

### US-4.5 Apply Coupon

**As a** customer,  
**I want to** apply a coupon code to my cart,  
**So that** I can get a discount.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `POST /cart/coupon` accepts `couponCode` |
| AC-2 | System validates code, date range, usage limit, and min cart value |
| AC-3 | Discount (FLAT or PERCENTAGE) is applied to cart |
| AC-4 | Invalid or expired coupon returns 400 with descriptive error |

---

## Epic 5 — Address Management

### US-5.1 Add Address

**As a** customer,  
**I want to** save a shipping/billing address,  
**So that** I can reuse it during checkout.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | Body includes `type` (SHIPPING/BILLING), `fullName`, `phone`, `line1`, `city`, `state`, `pincode` |
| AC-2 | Address is scoped to the authenticated user and tenant |

---

### US-5.2 Set Default Address

**As a** customer,  
**I want to** set one address as my default,  
**So that** checkout is faster.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `PATCH /addresses/:id/default` marks the address as default |
| AC-2 | Previous default address is unset |

---

## Epic 6 — Order Management

### US-6.1 Place Order

**As a** customer,  
**I want to** create an order from my active cart,  
**So that** my purchase is processed.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | Body includes `billingAddressId` and `shippingAddressId` |
| AC-2 | Order is created with auto-generated order number |
| AC-3 | Cart status changes from ACTIVE → CONVERTED |
| AC-4 | Order items are copied from cart items with price snapshots |
| AC-5 | Initial order status is CREATED |

---

### US-6.2 View My Orders

**As a** customer,  
**I want to** see a list of all my orders,  
**So that** I can track purchase history.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `GET /orders` returns all orders for the authenticated user |
| AC-2 | Orders are scoped to the user's tenant |

---

### US-6.3 View Order Details

**As a** customer,  
**I want to** see full details of a specific order,  
**So that** I can track its status and items.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `GET /orders/:id` returns order with items, payments, and status logs |
| AC-2 | Only the order owner can view it (or Admin/Staff) |

---

### US-6.4 Update Order Status

**As an** Admin/Staff,  
**I want to** update an order's status,  
**So that** I can move it through the fulfilment pipeline.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `PATCH /orders/:id/status` accepts `status` and optional `note` |
| AC-2 | A status log entry is created with from/to status and timestamp |
| AC-3 | Only ADMIN and STAFF roles can perform this |

---

## Epic 7 — Payments

### US-7.1 Initiate Payment

**As a** customer,  
**I want to** initiate a payment for my order,  
**So that** I can complete the purchase.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `POST /payments` accepts `orderId` and `provider` (RAZORPAY/COD/MANUAL) |
| AC-2 | For Razorpay, returns gateway order ID for frontend SDK |
| AC-3 | Payment record created with PENDING status |

---

### US-7.2 Verify Payment

**As the** system (via webhook),  
**I want to** verify and capture a payment,  
**So that** the order payment status is updated.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | `PATCH /payments/:id/verify` is publicly accessible (webhook) |
| AC-2 | Validates gateway signature and payment ID |
| AC-3 | Payment status transitions to CAPTURED or FAILED |
| AC-4 | Order payment status is updated accordingly |

---

## Epic 8 — Shipping

### US-8.1 Manage Shipping Zones & Rules

**As an** Admin,  
**I want to** configure shipping zones and rules,  
**So that** delivery pricing is calculated correctly.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | CRUD for shipping zones with pincode/region configuration |
| AC-2 | Each zone has shipping rules with method, rates, and COD flag |

---

## Epic 9 — Admin Dashboard

### US-9.1 User Management Dashboard

**As an** Admin,  
**I want to** view and manage all users,  
**So that** I can assign roles and handle account issues.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | Admin dashboard page lists all tenant users |
| AC-2 | Admin can change user roles via the interface |

---

### US-9.2 Admin Panel Overview

**As an** Admin,  
**I want to** access an admin panel,  
**So that** I can manage store operations from one place.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | Admin panel accessible at `/admin` |
| AC-2 | Restricted to ADMIN role only |
| AC-3 | Provides navigation to user management and other sections |

---

## Epic 10 — Reviews

### US-10.1 Submit Product Review

**As a** customer,  
**I want to** rate and review a product I've purchased,  
**So that** other shoppers can make informed decisions.

| # | Acceptance Criteria |
|---|---------------------|
| AC-1 | Customer can submit rating (1-5), title, and body |
| AC-2 | One review per product per user |
| AC-3 | Verified purchase flag is set if user has a completed order for the product |
| AC-4 | Review is created in PENDING status for moderation |
