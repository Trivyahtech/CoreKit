# CoreKit E-Commerce Engine

CoreKit is a modular, high-performance e-commerce framework designed for scalability. It is split into a robust NestJS backend and a modern Next.js frontend, both structured around a clear `platform`, `common`, and `modules` architecture.

## Phase Status (per `corekit_backend_readme_phasewise.md`)

| Phase | Scope (SOP) | Status |
|---|---|---|
| Phase 0 | Foundation & Infrastructure | ✅ Complete — `platform/` (DB, cache, queue, mail, storage, search, health, config + validateEnv) |
| Phase 1 | Identity & Access | ✅ Complete — auth (JWT, OTP, Google SSO), users, roles, permissions |
| Phase 2 | Tenant Awareness | ✅ Complete — `tenantId` on primary entities, tenant-scoped queries |
| Phase 3 | Core Commerce (D2C) | ✅ Complete — products, categories, cart, addresses, orders, payments (COD + Razorpay w/ signature verify + webhook), shipping |
| Phase 4+ | System support, enhancements, marketplace, SaaS | ⏳ Not started |

> Earlier commit message `"phase 0 completed"` was mis-labeled; the repo is at the end of **Phase 3**.

## Architecture

Both the **Backend** and **Frontend** follow a scalable, three-tier architecture:

1. **`platform/`**: Technical runtime & infrastructure (Database, Cache, Queue, Mail, Storage, Search, Health, Config).
2. **`common/`**: Shared pure helpers (Utils, Interfaces, Layout Components, Decorators, Guards, Filters, Interceptors).
3. **`modules/`**: Actual business logic isolated by feature domain (`core/`, `base/`).

---

## Completed Modules & Functionalities

Built primarily in the backend and exposed via REST APIs to the frontend.

### Core Modules (`modules/core/`)
These form the functional foundation of user identity and access:
- **Auth Module**: 
  - JWT generation and validation strategies.
  - Login and authentication state management.
- **Users Module**: 
  - Standard user management (CRUD).
  - Role-based properties implementation.

### Base E-Commerce Modules (`modules/base/`)
These represent the standard functionality required for day-to-day storefront operations:
- **Catalog (Products & Categories)**: 
  - Full CRUD operations for store categories and products.
  - Publicly accessible APIs for storefront rendering.
- **Cart Module**: 
  - Active session cart tracking.
  - Addition, modification, and deletion of cart items.
  - Subtotal, tax calculation, and coupon validation logic.
- **Addresses Module**: 
  - Managing user shipping and billing addresses.
  - `isDefault` address selections.
- **Orders Module**: 
  - Converts active carts (with selected addresses) into finalized orders.
  - Stock validation and subtraction logic.
  - Order status tracking (e.g., CREATED, COMPLETED, CANCELLED).
- **Payments Module**:
  - Payment initiation bound to generated orders.
  - Supports "Cash on Delivery" (COD) immediately marking orders as `CONFIRMED`.
  - Razorpay online payments with HMAC-SHA256 signature verification on client-side `verify`, and a signed server-to-server webhook (`/payments/webhook/razorpay`) for async capture.

### Platform Infrastructure (`platform/`)
- **Database**: Centralized `PrismaService` handling all DB transactions.
- **Mail**: Email queueing system utilizing `BullMQ` (for sending order confirmations, status transitions).
- **Cache**: Fast key-value operations caching powered by Redis.
- **Health**: Liveness and readiness endpoints for cloud deployments.

---

## Next Steps / Upcoming Features
1. **Flesh out Payment Integrations**: Replace Razorpay placeholders with full webhook handling.
2. **Shipping Implementations**: Connect logistics providers to dynamic calculation integrations.
3. **Admin Dashboard (Frontend)**: Expanding current layout hooks (metrics, data tables) with React Query data binding.
4. **Additional Roles & Permissions**: Enhancing access control matrix within `modules/core/roles`.

---

*This project uses standard Next.js (port 6768) and NestJS implementations. Review internal `docs/` and architectural walkthroughs for deployment nuances.*
