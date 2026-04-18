# CoreKit E-Commerce Engine

CoreKit is a modular, high-performance e-commerce framework designed for scalability. It is split into a robust NestJS backend and a modern Next.js frontend, both structured around a clear `platform`, `common`, and `modules` architecture.

## Current Project Status: Architecture Restructure Complete ✅

Both the **Backend** and **Frontend** have been successfully transitioned from a flat, monolithic structure to a scalable, three-tier architecture:

1. **`platform/`**: Technical runtime & infrastructure (Database, Cache, API Client, Theme Context).
2. **`common/`**: Shared pure helpers (Utils, Interfaces, Layout Components, Decorators).
3. **`modules/`**: Actual business logic isolated by feature domain.

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
  - Placeholder scaffolding for online integrated methods (like Razorpay).

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
