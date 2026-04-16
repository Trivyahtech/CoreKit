# CoreKit ECommerce — Wireframes (Text-Based)

| Field            | Value                     |
| ---------------- | ------------------------- |
| **Project**      | CoreKit ECommerce         |
| **Version**      | 1.0.0                    |
| **Date**         | 2026-04-14                |

> These are low-fidelity, text-based wireframes describing the layout and key elements of each page in the CoreKit storefront and admin panel.

---

## 1. Global Layout

```
┌─────────────────────────────────────────────────────────┐
│  🛒 CoreKit Logo     [Categories ▼]  🔍 Search          │
│                      Home | Products | Cart | Account   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    [ PAGE CONTENT ]                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Footer: About · Privacy · Terms · Contact   © CoreKit  │
└─────────────────────────────────────────────────────────┘
```

**Navbar Elements:**
- Logo (links to `/`)
- Category dropdown
- Search bar
- Navigation: Home, Products, Cart (with badge), Account/Login
- Responsive: hamburger menu on mobile

---

## 2. Home Page (`/`)

```
┌─────────────────────────────────────────────────────────┐
│                     NAVBAR                               │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │             HERO BANNER / CAROUSEL               │    │
│  │    "Discover Premium Products"                    │    │
│  │            [ Shop Now → ]                         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ── Featured Categories ──────────────────────────────  │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │ Cat1 │  │ Cat2 │  │ Cat3 │  │ Cat4 │              │
│  │ img  │  │ img  │  │ img  │  │ img  │              │
│  └──────┘  └──────┘  └──────┘  └──────┘              │
│                                                         │
│  ── New Arrivals ─────────────────────────────────────  │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐             │
│  │ Image │ │ Image │ │ Image │ │ Image │             │
│  │ Name  │ │ Name  │ │ Name  │ │ Name  │             │
│  │ ₹Price│ │ ₹Price│ │ ₹Price│ │ ₹Price│             │
│  │ [Add] │ │ [Add] │ │ [Add] │ │ [Add] │             │
│  └───────┘ └───────┘ └───────┘ └───────┘             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                     FOOTER                               │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Products Listing Page (`/products`)

```
┌─────────────────────────────────────────────────────────┐
│                     NAVBAR                               │
├───────────┬─────────────────────────────────────────────┤
│ FILTERS   │  Sort by: [Newest ▼]     Showing 24 results │
│           │                                             │
│ Category  │  ┌───────┐ ┌───────┐ ┌───────┐             │
│ ☐ Cat 1   │  │ Img   │ │ Img   │ │ Img   │             │
│ ☐ Cat 2   │  │ Title │ │ Title │ │ Title │             │
│ ☐ Cat 3   │  │ ₹999  │ │ ₹1499 │ │ ₹599  │             │
│           │  │ ★★★★☆ │ │ ★★★☆☆ │ │ ★★★★★ │             │
│ Price     │  └───────┘ └───────┘ └───────┘             │
│ ₹[__]-[__]│                                             │
│           │  ┌───────┐ ┌───────┐ ┌───────┐             │
│ Status    │  │ Img   │ │ Img   │ │ Img   │             │
│ ● Active  │  │ Title │ │ Title │ │ Title │             │
│           │  │ ₹749  │ │ ₹2199 │ │ ₹399  │             │
│           │  │ ★★★☆☆ │ │ ★★★★☆ │ │ ★★★★☆ │             │
│           │  └───────┘ └───────┘ └───────┘             │
│           │                                             │
│           │  [ ← Prev ]  1  2  3  [ Next → ]           │
└───────────┴─────────────────────────────────────────────┘
```

---

## 4. Product Detail Page (`/products/[id]`)

```
┌─────────────────────────────────────────────────────────┐
│                     NAVBAR                               │
├─────────────────────────────────────────────────────────┤
│  Breadcrumb: Home > Category > Product Name             │
│                                                         │
│  ┌────────────────┐  Product Name                       │
│  │                │  Brand: BrandName                    │
│  │   MAIN IMAGE   │  ★★★★☆ (24 reviews)                 │
│  │                │                                     │
│  │                │  ₹1,299  ₹̶1̶,̶9̶9̶9̶  (35% off)         │
│  └────────────────┘                                     │
│  [thumb1][thumb2]     Variant: [Size ▼] [Color ▼]       │
│  [thumb3][thumb4]     Stock: In Stock (12 left)         │
│                                                         │
│                       Qty: [- 1 +]                      │
│                       [ 🛒 Add to Cart ]                 │
│                                                         │
│  ── Description ──────────────────────────────────────  │
│  Lorem ipsum dolor sit amet, consectetur adipiscing     │
│  elit. Sed do eiusmod tempor incididunt...              │
│                                                         │
│  ── Customer Reviews ─────────────────────────────────  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ★★★★★  "Great quality!"  — John D.  ✓ Verified  │   │
│  │ Really happy with this purchase...               │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ★★★☆☆  "Decent"  — Jane S.                      │   │
│  │ Could be better packaging...                     │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                     FOOTER                               │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Categories Page (`/categories`)

```
┌─────────────────────────────────────────────────────────┐
│                     NAVBAR                               │
├─────────────────────────────────────────────────────────┤
│  All Categories                                         │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Image   │  │  Image   │  │  Image   │              │
│  │ Cat Name │  │ Cat Name │  │ Cat Name │              │
│  │ 12 items │  │ 8 items  │  │ 25 items │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│    └── Sub-categories shown as nested cards/chips       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                     FOOTER                               │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Cart Page (`/cart`)

```
┌─────────────────────────────────────────────────────────┐
│                     NAVBAR                               │
├─────────────────────────────────────────────────────────┤
│  Shopping Cart (3 items)                                │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [Img] Product Name          Qty:[- 2 +]  ₹2,598│   │
│  │       Variant: Blue / L     Unit: ₹1,299   [🗑]│   │
│  ├─────────────────────────────────────────────────┤   │
│  │ [Img] Product Name 2        Qty:[- 1 +]  ₹  599│   │
│  │       Variant: Default      Unit: ₹599     [🗑]│   │
│  ├─────────────────────────────────────────────────┤   │
│  │ [Img] Product Name 3        Qty:[- 1 +]  ₹  749│   │
│  │       Variant: Red / M      Unit: ₹749     [🗑]│   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Coupon: [____________] [Apply]                         │
│  ✅ Coupon SAVE10 applied! (-₹394.60)                   │
│                                                         │
│  ┌──────────────────────────┐                           │
│  │ Subtotal:       ₹3,946  │                           │
│  │ Discount:       -₹394   │                           │
│  │ Tax:            +₹320   │                           │
│  │ Shipping:       +₹49    │                           │
│  │ ─────────────────────── │                           │
│  │ Grand Total:    ₹3,921  │                           │
│  │                          │                           │
│  │ [ Proceed to Checkout → ]│                           │
│  └──────────────────────────┘                           │
│                                                         │
│  [Clear Cart]                                           │
├─────────────────────────────────────────────────────────┤
│                     FOOTER                               │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Checkout Page (`/checkout`)

```
┌─────────────────────────────────────────────────────────┐
│                     NAVBAR                               │
├─────────────────────────────────────────────────────────┤
│  Checkout                                               │
│                                                         │
│  ── Step 1: Shipping Address ─────────────────────────  │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │ ● Home Address       │  │ ○ Office Address     │    │
│  │   John Doe           │  │   John Doe           │    │
│  │   123 Main St, Apt 4 │  │   456 Work Ave       │    │
│  │   Mumbai, MH 400001  │  │   Pune, MH 411001    │    │
│  │   📞 +91-9876543210  │  │   📞 +91-9876543210  │    │
│  └──────────────────────┘  └──────────────────────┘    │
│  [ + Add New Address ]                                  │
│                                                         │
│  ── Step 2: Billing Address ──────────────────────────  │
│  ☑ Same as shipping address                             │
│                                                         │
│  ── Step 3: Payment Method ───────────────────────────  │
│  ○ Razorpay (UPI / Card / Netbanking / Wallet)          │
│  ○ Cash on Delivery (COD)                               │
│                                                         │
│  ── Order Summary ────────────────────────────────────  │
│  │ 3 items · Subtotal: ₹3,946 · Total: ₹3,921        │
│  │ [View Items ▼]                                      │
│                                                         │
│  Customer Note: [____________________________]          │
│                                                         │
│  [ ← Back to Cart ]          [ Place Order → ]          │
├─────────────────────────────────────────────────────────┤
│                     FOOTER                               │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Orders Page (`/orders`)

```
┌─────────────────────────────────────────────────────────┐
│                     NAVBAR                               │
├─────────────────────────────────────────────────────────┤
│  My Orders                                              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ #ORD-20260414-001    📅 14 Apr 2026              │   │
│  │ 3 items · ₹3,921                                │   │
│  │ Status: [CONFIRMED]  Payment: [CAPTURED]         │   │
│  │                              [ View Details → ]  │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ #ORD-20260410-002    📅 10 Apr 2026              │   │
│  │ 1 item · ₹1,299                                 │   │
│  │ Status: [SHIPPED]    Payment: [CAPTURED]         │   │
│  │                              [ View Details → ]  │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ #ORD-20260405-003    📅 05 Apr 2026              │   │
│  │ 2 items · ₹2,498                                │   │
│  │ Status: [COMPLETED]  Payment: [CAPTURED]         │   │
│  │                              [ View Details → ]  │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                     FOOTER                               │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Order Detail Page (`/orders/[id]`)

```
┌─────────────────────────────────────────────────────────┐
│                     NAVBAR                               │
├─────────────────────────────────────────────────────────┤
│  Order #ORD-20260414-001                                │
│  Placed on 14 Apr 2026                                  │
│                                                         │
│  Status: CONFIRMED    Payment: CAPTURED                 │
│  Fulfilment: PENDING                                    │
│                                                         │
│  ── Status Timeline ──────────────────────────────────  │
│  ● CREATED (14 Apr, 10:00 AM)                           │
│  ● CONFIRMED (14 Apr, 10:05 AM) — "Payment verified"   │
│  ○ PROCESSING                                           │
│  ○ SHIPPED                                              │
│  ○ COMPLETED                                            │
│                                                         │
│  ── Items ────────────────────────────────────────────  │
│  [Img] Product Name × 2   ₹1,299 × 2 = ₹2,598         │
│  [Img] Product Name 2 × 1 ₹599 × 1   = ₹599           │
│                                                         │
│  ── Price Breakdown ──────────────────────────────────  │
│  Subtotal:    ₹3,946                                    │
│  Discount:    -₹394                                     │
│  Tax:         +₹320                                     │
│  Shipping:    +₹49                                      │
│  Grand Total: ₹3,921                                    │
│                                                         │
│  ── Addresses ────────────────────────────────────────  │
│  Shipping: John Doe, 123 Main St, Mumbai 400001        │
│  Billing:  Same as shipping                             │
│                                                         │
│  Customer Note: "Please deliver before 5 PM"            │
├─────────────────────────────────────────────────────────┤
│                     FOOTER                               │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Login Page (`/login`)

```
┌─────────────────────────────────────────────────────────┐
│                     NAVBAR                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│           ┌──────────────────────────┐                  │
│           │      Welcome Back        │                  │
│           │                          │                  │
│           │  Email:                  │                  │
│           │  [____________________]  │                  │
│           │                          │                  │
│           │  Password:               │                  │
│           │  [____________________]  │                  │
│           │                          │                  │
│           │  [      Log In      ]    │                  │
│           │                          │                  │
│           │  ─── or ───              │                  │
│           │                          │                  │
│           │  [🔵 Sign in with Google] │                  │
│           │  [ 📧 Login with OTP ]    │                  │
│           │                          │                  │
│           │  Don't have an account?  │                  │
│           │  [ Register → ]          │                  │
│           └──────────────────────────┘                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                     FOOTER                               │
└─────────────────────────────────────────────────────────┘
```

---

## 11. Register Page (`/register`)

```
┌─────────────────────────────────────────────────────────┐
│                     NAVBAR                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│           ┌──────────────────────────┐                  │
│           │    Create an Account     │                  │
│           │                          │                  │
│           │  First Name:             │                  │
│           │  [____________________]  │                  │
│           │                          │                  │
│           │  Last Name (optional):   │                  │
│           │  [____________________]  │                  │
│           │                          │                  │
│           │  Email:                  │                  │
│           │  [____________________]  │                  │
│           │                          │                  │
│           │  Password:               │                  │
│           │  [____________________]  │                  │
│           │                          │                  │
│           │  Phone (optional):       │                  │
│           │  [____________________]  │                  │
│           │                          │                  │
│           │  [    Register     ]     │                  │
│           │                          │                  │
│           │  Already have an account?│                  │
│           │  [ Log In → ]            │                  │
│           └──────────────────────────┘                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                     FOOTER                               │
└─────────────────────────────────────────────────────────┘
```

---

## 12. Admin Panel (`/admin`)

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN NAVBAR                          │
├───────────┬─────────────────────────────────────────────┤
│ SIDEBAR   │  Dashboard Overview                         │
│           │                                             │
│ Dashboard │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│ Users     │  │ 124  │ │  38  │ │ ₹2.4L│ │  12  │      │
│ Products  │  │Users │ │Orders│ │ Rev. │ │ Pend.│      │
│ Orders    │  └──────┘ └──────┘ └──────┘ └──────┘      │
│ Categories│                                             │
│ Coupons   │  ── Recent Orders ────────────────────────  │
│ Shipping  │  │ #ORD-001 │ John │ ₹3,921 │ CONFIRMED │  │
│ Settings  │  │ #ORD-002 │ Jane │ ₹1,299 │ SHIPPED   │  │
│           │  │ #ORD-003 │ Mike │ ₹2,498 │ COMPLETED │  │
│           │                                             │
│           │  ── Low Stock Alerts ─────────────────────  │
│           │  │ SKU-001 │ Widget Blue │ 2 remaining    │  │
│           │  │ SKU-015 │ Gadget Red  │ 0 remaining    │  │
└───────────┴─────────────────────────────────────────────┘
```

---

## 13. Admin — User Management (`/admin/users`)

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN NAVBAR                          │
├───────────┬─────────────────────────────────────────────┤
│ SIDEBAR   │  User Management          [+ Invite User]  │
│           │                                             │
│ ...       │  Search: [___________]  Role: [All ▼]       │
│           │                                             │
│ ► Users   │  ┌───────────────────────────────────────┐  │
│           │  │ Name    │ Email   │ Role   │ Status │  │  │
│           │  ├─────────┼─────────┼────────┼────────┤  │  │
│           │  │ John D. │ j@e.com │ ADMIN  │ ACTIVE │  │  │
│           │  │ Jane S. │ s@e.com │ CUST.  │ ACTIVE │  │  │
│           │  │ Mike V. │ m@e.com │ VENDOR │ ACTIVE │  │  │
│           │  │ Staff 1 │ t@e.com │ STAFF  │ ACTIVE │  │  │
│           │  └───────────────────────────────────────┘  │
│           │                                             │
│           │  Role Change: Select user → [Role ▼] [Save] │
└───────────┴─────────────────────────────────────────────┘
```

---

## Page Navigation Flow

```mermaid
graph LR
    A[Home /] --> B[Products /products]
    A --> C[Categories /categories]
    B --> D[Product Detail /products/id]
    D --> E[Cart /cart]
    E --> F[Checkout /checkout]
    F --> G[Order Confirmation]
    G --> H[Orders /orders]
    H --> I[Order Detail /orders/id]

    J[Login /login] --> A
    K[Register /register] --> J
    
    L[Admin /admin] --> M[Admin Users /admin/users]
```
