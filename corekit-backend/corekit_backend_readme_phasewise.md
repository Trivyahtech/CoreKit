# Corekit Backend README

## Overview

Corekit Backend is designed as a **modular, reusable, and package-oriented backend architecture**.  
The project is structured so that each module can be developed, maintained, and reused independently across future Corekit-based products.

The backend is divided into five module groups:

- **Core Modules** — identity, access, tenant control, system backbone
- **Base Modules** — essential commerce and operational modules
- **Advanced Modules** — scalable business enhancements
- **Additional Modules** — optional product upgrades
- **Extra Modules** — premium, niche, or future-facing modules

This README defines the **phase-wise development roadmap** for backend implementation.

---

## Proposed Backend Structure

```txt
src/
  modules/
    core/
      auth/
      users/
      roles/
      permissions/
      tenants/
      config/
      settings/
      audit-log/
      uploads/
      notifications/

    base/
      products/
      categories/
      inventory/
      cart/
      checkout/
      orders/
      addresses/
      payments/
      shipping/
      customers/
      admin-dashboard/

    advanced/
      vendors/
      variants/
      coupons/
      reviews/
      reports/
      invoices/
      search/
      seo/
      cms/
      tracking/
      feature-flags/
      imports/
      exports/

    additional/
      wishlist/
      flash-sales/
      loyalty/
      referrals/
      wallet/
      cashback/
      abandoned-cart/
      guest-cart/
      review-moderation/
      tax-rules/
      payouts/
      logistics/

    extra/
      subscriptions/
      ai-recommendations/
      crm-automation/
      analytics/
      automation/
      pricing-engine/
      settlements/
      integrations/
      custom/

  shared/
    constants/
    decorators/
    guards/
    interceptors/
    pipes/
    dto/
    enums/
    utils/
    types/

  infrastructure/
    database/
    cache/
    queue/
    mail/
    storage/
    search/

  main.ts
  app.module.ts
```

---

## Development Principles

### 1. Modular by design

Each module must be independently maintainable and as copy-pasteable as possible.

### 2. Clear dependency direction

Dependency flow should remain:

- `core` -> foundation only
- `base` can depend on `core`
- `advanced` can depend on `base` + `core`
- `additional` can depend on `advanced` + `base` + `core`
- `extra` can depend on all, but nothing should depend on `extra`

### 3. Infrastructure stays separate

Technical concerns such as database, caching, queues, storage, email, and search must remain inside `infrastructure/` and not be mixed into business modules.

### 4. Shared stays generic

`shared/` should only contain reusable utilities, DTOs, constants, decorators, guards, interceptors, types, and enums.

### 5. Core modules stay business-agnostic

No commerce or niche-specific logic should be placed inside `core/`.

---

# Phase-wise Module Roadmap

## Phase 0 — Foundation Setup

### Objective

Establish the backend skeleton, infrastructure readiness, and shared architecture standards before feature development begins.

### Scope

- Project structure finalization
- Path aliases setup
- Global exception handling
- Global response transformation
- Validation pipeline
- Base guards and decorators
- Database configuration
- Cache configuration
- Queue configuration
- Mail configuration
- Storage abstraction
- Search abstraction placeholder
- Common DTO and utility patterns

### Modules/Areas Covered

- `shared/*`
- `infrastructure/database`
- `infrastructure/cache`
- `infrastructure/queue`
- `infrastructure/mail`
- `infrastructure/storage`
- `infrastructure/search`

### Deliverables

- Working NestJS app bootstrapped
- Prisma connected and migration-ready
- Global guards/interceptors configured
- Standard error/response format finalized
- Shared module conventions documented

### Completion Criteria

- App boots successfully
- Environment validation works
- Database connection is stable
- Migrations run without issues
- Common architecture is ready for module implementation

---

## Phase 1 — Identity and Access Foundation

### Objective

Build the authentication and user-access backbone required by every future module.

### Modules

- `core/auth`
- `core/users`
- `core/roles`
- `core/permissions`

### Scope

#### Auth

- Register
- Login
- Refresh token
- Logout
- Forgot password
- Reset password
- JWT authentication
- Public route support

#### Users

- Create user
- Update user
- View profile
- List users
- Activate/deactivate user
- Soft delete support

#### Roles

- Role CRUD
- Role assignment to users
- System roles support

#### Permissions

- Permission registry
- Role-permission mapping
- Permission resolution
- Route-level permission enforcement

### Deliverables

- Authentication flow is functional
- RBAC is enforced through guards/decorators
- User and role management APIs are ready

### Completion Criteria

- Users can register and log in
- Protected routes work correctly
- Roles and permissions are assignable
- Unauthorized access is blocked correctly

---

## Phase 2 — Tenant and System Control Layer

### Objective

Make the platform reusable for multiple clients through tenant-aware and configurable system behavior.

### Modules

- `core/tenants`
- `core/config`
- `core/settings`

### Scope

#### Tenants

- Tenant creation and update
- Tenant status management
- Tenant slug/domain/subdomain support
- Tenant-user association
- Tenant context resolution

#### Config

- System configuration keys
- Module-level behavior toggles
- Feature flag foundation
- Tenant override support
- Default + override resolution

#### Settings

- Tenant settings
- User settings
- Branding settings
- Locale/timezone/currency preferences
- Application preferences

### Deliverables

- Multi-tenant structure is functional
- Tenant-specific config resolution works
- Tenant/user settings are manageable

### Completion Criteria

- Requests resolve current tenant correctly
- Tenant-specific behavior can be configured
- Settings can be retrieved and updated safely

---

## Phase 3 — Traceability and File Support

### Objective

Add traceability and reusable file handling to support enterprise-level workflows.

### Modules

- `core/audit-log`
- `core/uploads`

### Scope

#### Audit Log

- Action logging
- Actor tracking
- Tenant tracking
- Entity/action history
- Filterable log entries
- Critical event audit coverage

#### Uploads

- File upload API
- File metadata storage
- Type/size validation
- Tenant-aware file organization
- Storage abstraction compatibility

### Deliverables

- Audit logging available for important system actions
- File upload flow available for future modules

### Completion Criteria

- Sensitive and important actions are logged automatically
- Files are uploaded and tracked securely
- Metadata is stored consistently

---

## Phase 4 — Notification Backbone

### Objective

Create the communication layer used by all future business modules.

### Modules

- `core/notifications`

### Scope

- Notification event handling
- Email notification dispatch
- Queue-based sending
- Notification templates
- Notification history/logs
- User preference awareness
- Tenant branding support in templates

### Deliverables

- Notification system ready for auth, onboarding, and future business events
- Basic email template pipeline completed

### Completion Criteria

- Events can trigger notifications
- Notifications are queued and tracked
- Template rendering works reliably

---

## Phase 5 — Base Commerce Backbone

### Objective

Build the minimum business modules required for a fully functional commerce-capable backend.

### Modules

- `base/products`
- `base/categories`
- `base/inventory`
- `base/cart`
- `base/checkout`
- `base/orders`
- `base/addresses`
- `base/payments`
- `base/shipping`
- `base/customers`
- `base/admin-dashboard`

### Scope

#### Catalog and Inventory

- Product CRUD
- Category CRUD
- Inventory tracking
- Product-category relation

#### Cart and Checkout

- Cart create/update/remove flows
- Address selection
- Checkout summary
- Stock validation

#### Orders and Payments

- Order creation
- Order state lifecycle
- Payment initiation and status handling
- Payment/order linkage

#### Shipping and Customer

- Shipping charges/rules
- Customer management
- Customer address history

#### Admin Dashboard

- Operational summary APIs
- Basic reporting widgets

### Deliverables

- Core commerce operations functional end to end

### Completion Criteria

- Product to order flow works
- Checkout can create order successfully
- Payment integration structure is ready
- Admin can manage core commerce data

---

## Phase 6 — Advanced Business Modules

### Objective

Enhance the platform with scalable business capabilities and marketplace-grade features.

### Modules

- `advanced/vendors`
- `advanced/variants`
- `advanced/coupons`
- `advanced/reviews`
- `advanced/reports`
- `advanced/invoices`
- `advanced/search`
- `advanced/seo`
- `advanced/cms`
- `advanced/tracking`
- `advanced/feature-flags`
- `advanced/imports`
- `advanced/exports`

### Scope

- Vendor and multi-seller operations
- Product variants
- Discount engine
- Reviews and ratings
- Invoice generation
- Search optimization
- SEO metadata control
- CMS-managed sections
- Tracking support
- Module-level feature enable/disable
- Import/export tools

### Deliverables

- Platform becomes package-ready for mid/high-tier clients

### Completion Criteria

- Advanced modules integrate cleanly with base modules
- Search/report/invoice/export flows work correctly
- Feature flags can control advanced capabilities

---

## Phase 7 — Additional Product Upgrades

### Objective

Introduce optional, value-added modules that improve customer retention and conversion.

### Modules

- `additional/wishlist`
- `additional/flash-sales`
- `additional/loyalty`
- `additional/referrals`
- `additional/wallet`
- `additional/cashback`
- `additional/abandoned-cart`
- `additional/guest-cart`
- `additional/review-moderation`
- `additional/tax-rules`
- `additional/payouts`
- `additional/logistics`

### Scope

- Retention and marketing tools
- Promotional flows
- Wallet and loyalty features
- Tax and payout logic
- Guest and abandoned cart experience
- Review governance
- Logistics integrations

### Deliverables

- Optional business upgrades ready for selective package activation

### Completion Criteria

- Modules remain optional and isolated
- No dependency leakage into core/base
- Features can be enabled without architecture changes

---

## Phase 8 — Premium and Future Modules

### Objective

Add enterprise, premium, or experimental capabilities without affecting the default reusable platform.

### Modules

- `extra/subscriptions`
- `extra/ai-recommendations`
- `extra/crm-automation`
- `extra/analytics`
- `extra/automation`
- `extra/pricing-engine`
- `extra/settlements`
- `extra/integrations`
- `extra/custom`

### Scope

- Subscription flows
- Personalized recommendations
- CRM automation
- Deep analytics
- Workflow automation
- Dynamic pricing
- Settlement engines
- Enterprise connectors
- Niche-specific custom modules

### Deliverables

- Premium module layer separated from the standard product backbone

### Completion Criteria

- Extra modules do not create coupling with standard product flow
- Enterprise features remain isolated and configurable

---

# Suggested Module Delivery Sequence

## Core Sequence

1. `users`
2. `auth`
3. `roles`
4. `permissions`
5. `tenants`
6. `config`
7. `settings`
8. `audit-log`
9. `uploads`
10. `notifications`

## Base Sequence

1. `categories`
2. `products`
3. `inventory`
4. `customers`
5. `addresses`
6. `cart`
7. `checkout`
8. `orders`
9. `payments`
10. `shipping`
11. `admin-dashboard`

## Advanced Sequence

1. `vendors`
2. `variants`
3. `coupons`
4. `reviews`
5. `reports`
6. `invoices`
7. `search`
8. `seo`
9. `cms`
10. `tracking`
11. `feature-flags`
12. `imports`
13. `exports`

---

# Recommended Module Template

Each business module should follow a consistent internal structure:

```txt
module-name/
  dto/
  entities/
  repositories/
  services/
  controllers/
  module-name.module.ts
  index.ts
```

For larger or critical modules, the structure may evolve into:

```txt
module-name/
  application/
  domain/
  infrastructure/
  presentation/
  module-name.module.ts
  index.ts
```

---

# Suggested Dependency Rules

- `core` must never depend on `base`, `advanced`, `additional`, or `extra`
- `base` may depend on `core`
- `advanced` may depend on `core` and `base`
- `additional` may depend on `core`, `base`, and `advanced`
- `extra` may depend on all, but other groups must not depend on `extra`
- `shared` must remain generic and reusable
- `infrastructure` must never contain business rules

---

# Suggested Definition of Done

A phase is considered complete only when:

- Module APIs are implemented
- DTO validation is complete
- Repository/service boundaries are respected
- Authorization is applied where needed
- Tenant awareness is handled where applicable
- Audit logging is added for critical actions
- Unit tests are written for core behaviors
- Swagger or API documentation is updated
- Module exports are clean and reusable

---

# Final Goal

At the end of this roadmap, Corekit Backend should provide:

- A reusable **core platform backbone**
- A stable **base commerce package**
- A clean **advanced upgrade layer**
- Optional **additional value modules**
- Isolated **extra enterprise modules**

This will allow future Corekit products to be assembled by selecting the required module groups and copying only the relevant folders without breaking the architecture.

---

## Next Recommended Step

Start development with:

1. `core/users`
2. `core/auth`
3. `core/roles`
4. `core/permissions`

Only after identity and access control are stable should tenant, config, and settings development begin.
