# CoreKit ECommerce — Business Requirements Document (BRD) / User Requirements Specification (URS)

| Field              | Value                                      |
| ------------------ | ------------------------------------------ |
| **Project Name**   | CoreKit ECommerce Platform                 |
| **Version**        | 1.0.0                                      |
| **Date**           | 2026-04-14                                  |
| **Status**         | Active Development                          |
| **Stack**          | NestJS · Next.js 16 · PostgreSQL · Redis   |

---

## 1. Executive Summary

CoreKit is a **multi-tenant, headless ECommerce platform** that enables independent storefronts to operate under a shared infrastructure. The system provides a complete online-shopping lifecycle — from product catalogue management and cart operations to checkout, payment processing (Razorpay / COD), order fulfilment, and shipping — while supporting role-based access for Admins, Vendors, Staff, and Customers.

---

## 2. Business Objectives

| # | Objective | Success Metric |
|---|-----------|----------------|
| BO-1 | Launch a multi-tenant SaaS ecommerce backend | ≥ 1 tenant onboarded with live transactions |
| BO-2 | Support multiple payment methods (UPI, Card, COD) | Payment success rate ≥ 95 % |
| BO-3 | Provide self-service vendor onboarding | Vendor registration → verification flow operational |
| BO-4 | Deliver a responsive storefront for end-customers | Page load < 3 s on 4G; Lighthouse score ≥ 80 |
| BO-5 | Role-based admin dashboard for operations | Admin can manage users, products, orders |

---

## 3. Stakeholders

| Role | Description |
|------|-------------|
| **Platform Owner (Super Admin)** | Manages tenants, global settings, and system health |
| **Tenant Admin** | Manages their store's catalogue, orders, coupons, and staff |
| **Vendor** | Creates and manages their own products within a tenant |
| **Staff** | Assists with day-to-day order/product operations |
| **Customer** | Browses products, manages cart, places orders, tracks delivery |

---

## 4. Functional Requirements

### 4.1 Multi-Tenancy (FR-MT)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-MT-01 | Each tenant has a unique slug and one or more custom domains | Must Have |
| FR-MT-02 | Tenant-level settings (currency, country, timezone, theme) | Must Have |
| FR-MT-03 | Data isolation: all queries scoped to `tenantId` | Must Have |
| FR-MT-04 | Tenant statuses: ACTIVE, INACTIVE, MAINTENANCE | Must Have |

### 4.2 Authentication & Authorization (FR-AUTH)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-01 | Email + password registration and login | Must Have |
| FR-AUTH-02 | JWT-based access tokens with refresh token rotation | Must Have |
| FR-AUTH-03 | OTP-based passwordless login (send & verify) | Must Have |
| FR-AUTH-04 | Google OAuth 2.0 SSO | Should Have |
| FR-AUTH-05 | Role-Based Access Control: ADMIN, VENDOR, STAFF, CUSTOMER | Must Have |
| FR-AUTH-06 | Rate limiting on auth endpoints (5 reg / 10 login per minute) | Must Have |
| FR-AUTH-07 | Protected `/auth/me` endpoint for current user profile | Must Have |

### 4.3 User Management (FR-USER)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-USER-01 | Admin/Staff can list all users for a tenant | Must Have |
| FR-USER-02 | Admin can update user roles | Must Have |
| FR-USER-03 | User statuses: ACTIVE, SUSPENDED, INVITED, DELETED | Must Have |

### 4.4 Vendor Management (FR-VENDOR)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-VENDOR-01 | Users can apply as vendors with business details and GSTIN | Must Have |
| FR-VENDOR-02 | Vendor statuses: PENDING → VERIFIED / REJECTED / SUSPENDED | Must Have |
| FR-VENDOR-03 | Verified vendors can create and manage their own products | Must Have |

### 4.5 Product Catalogue (FR-PROD)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PROD-01 | CRUD operations for products (Admin/Vendor/Staff) | Must Have |
| FR-PROD-02 | Product variants with SKU, price, compareAtPrice, stock, weight | Must Have |
| FR-PROD-03 | Product images with sort order and primary flag | Must Have |
| FR-PROD-04 | Product statuses: DRAFT → ACTIVE → ARCHIVED | Must Have |
| FR-PROD-05 | Publish / Unpublish actions (Admin/Staff) | Must Have |
| FR-PROD-06 | Assign products to categories (many-to-many) | Must Have |
| FR-PROD-07 | Public product listing by tenant with optional status filter | Must Have |
| FR-PROD-08 | Public product detail view with variants, images, reviews | Must Have |
| FR-PROD-09 | Tax code and tax rate per product | Should Have |

### 4.6 Category Management (FR-CAT)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CAT-01 | Hierarchical categories (parent → children tree) | Must Have |
| FR-CAT-02 | CRUD with unique slug per tenant | Must Have |
| FR-CAT-03 | Public listing and detail with associated products | Must Have |
| FR-CAT-04 | Sort order and active/inactive toggle | Should Have |

### 4.7 Shopping Cart (FR-CART)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-CART-01 | Authenticated cart with automatic subtotal computation | Must Have |
| FR-CART-02 | Add items (product + variant), update quantity, remove items | Must Have |
| FR-CART-03 | Clear entire cart | Must Have |
| FR-CART-04 | Apply coupon code (FLAT / PERCENTAGE discount) | Must Have |
| FR-CART-05 | Cart statuses: ACTIVE → CONVERTED / ABANDONED | Must Have |
| FR-CART-06 | Cart expiry (optional `expiresAt`) | Should Have |
| FR-CART-07 | Price snapshots stored per cart item | Must Have |

### 4.8 Address Management (FR-ADDR)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ADDR-01 | CRUD for shipping and billing addresses | Must Have |
| FR-ADDR-02 | Set a default address | Must Have |
| FR-ADDR-03 | Indian address format (line1, line2, landmark, city, state, pincode) | Must Have |

### 4.9 Order Management (FR-ORD)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ORD-01 | Create order from active cart with billing + shipping address | Must Have |
| FR-ORD-02 | Auto-generated unique order number per tenant | Must Have |
| FR-ORD-03 | Order statuses: CREATED → CONFIRMED → PROCESSING → SHIPPED → COMPLETED | Must Have |
| FR-ORD-04 | Cancellation and refund statuses | Must Have |
| FR-ORD-05 | Order status log with audit trail (from/to status, note, user) | Must Have |
| FR-ORD-06 | Fulfilment tracking: PENDING → PARTIAL → FULFILLED → RETURNED | Must Have |
| FR-ORD-07 | Customer can list and view their own orders | Must Have |
| FR-ORD-08 | Admin/Staff can update order status | Must Have |

### 4.10 Payment Processing (FR-PAY)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PAY-01 | Initiate payment for an order (Razorpay / COD / Manual) | Must Have |
| FR-PAY-02 | Verify and capture payment via webhook / callback | Must Have |
| FR-PAY-03 | Payment methods: UPI, Card, Netbanking, Wallet, COD | Must Have |
| FR-PAY-04 | Payment statuses: PENDING → AUTHORIZED → CAPTURED / FAILED / REFUNDED | Must Have |
| FR-PAY-05 | Store raw gateway payload for reconciliation | Should Have |
| FR-PAY-06 | View payments by order | Must Have |

### 4.11 Shipping (FR-SHIP)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SHIP-01 | Define shipping zones by pincode or region | Must Have |
| FR-SHIP-02 | Shipping rules with methods: Standard, Express, Same-Day, Pickup | Must Have |
| FR-SHIP-03 | Weight-based and flat-rate pricing | Must Have |
| FR-SHIP-04 | COD availability flag per rule | Should Have |
| FR-SHIP-05 | Minimum order value threshold | Should Have |

### 4.12 Coupons (FR-COUP)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-COUP-01 | Create coupons with code, type (FLAT/PERCENTAGE), value | Must Have |
| FR-COUP-02 | Min cart value, max discount amount constraints | Must Have |
| FR-COUP-03 | Usage limit and used count tracking | Must Have |
| FR-COUP-04 | Date-based validity (startsAt / endsAt) | Must Have |

### 4.13 Reviews (FR-REV)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-REV-01 | Customers can submit product reviews (rating + title + body) | Must Have |
| FR-REV-02 | One review per product per user | Must Have |
| FR-REV-03 | Verified purchase flag | Should Have |
| FR-REV-04 | Review statuses: PENDING → APPROVED / REJECTED | Must Have |

### 4.14 Email Notifications (FR-EMAIL)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-EMAIL-01 | Transactional emails via Nodemailer (welcome, OTP, order confirmation) | Must Have |
| FR-EMAIL-02 | Background processing via BullMQ / Redis queues | Must Have |

### 4.15 Health & Monitoring (FR-HEALTH)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-HEALTH-01 | Public `/api/v1/health` endpoint returning service status | Must Have |

---

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | **Performance** | API p95 latency < 200 ms for read endpoints |
| NFR-02 | **Scalability** | Horizontal scaling via stateless design + Redis sessions |
| NFR-03 | **Security** | Helmet headers, CORS whitelist, input validation (whitelist + forbidNonWhitelisted), rate limiting (60 req/min global) |
| NFR-04 | **Security** | Passwords hashed with bcrypt; JWT bearer auth |
| NFR-05 | **Data Integrity** | Prisma migrations for schema changes; referential integrity enforced at DB level |
| NFR-06 | **Availability** | Target 99.5 % uptime; health check endpoint for load balancers |
| NFR-07 | **DevOps** | Docker + docker-compose for local development; multi-stage Dockerfile for production |
| NFR-08 | **API Standards** | URI versioning (`/api/v1/`); Swagger/OpenAPI auto-generated docs |
| NFR-09 | **Compression** | Response compression enabled via `compression` middleware |
| NFR-10 | **Frontend** | SEO-friendly SSR (Next.js App Router); responsive design with TailwindCSS 4 |

---

## 6. Constraints & Assumptions

| # | Item |
|---|------|
| C-1 | PostgreSQL 16 is the primary database |
| C-2 | Redis 7 is required for caching, sessions, and job queues |
| C-3 | Node.js 20+ runtime (LTS) |
| C-4 | Default currency is INR; default country is India |
| C-5 | Razorpay is the primary payment gateway |
| A-1 | Tenants are provisioned manually or via seed; self-service tenant creation is Phase 2 |
| A-2 | File/image uploads are handled externally (URLs stored in DB) |

---

## 7. Out of Scope (Phase 1)

- Inventory warehouse management
- Multi-currency / multi-language support
- Real-time chat or customer support integration
- Mobile native applications
- Advanced analytics / reporting dashboard
- Wishlist functionality
- Self-service tenant registration portal

---

## 8. Glossary

| Term | Definition |
|------|------------|
| **Tenant** | An independent store instance on the platform |
| **Variant** | A specific purchasable configuration of a product (size, color, etc.) |
| **SKU** | Stock Keeping Unit — unique identifier for a variant |
| **COD** | Cash on Delivery |
| **GSTIN** | Goods and Services Tax Identification Number (India) |
| **BullMQ** | Redis-backed job queue for background task processing |
