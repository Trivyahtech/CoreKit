# CoreKit ECommerce — User Manual

| Field            | Value                     |
| ---------------- | ------------------------- |
| **Project**      | CoreKit ECommerce         |
| **Version**      | 1.0.0                    |
| **Date**         | 2026-04-14                |

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Creating an Account](#2-creating-an-account)
3. [Browsing Products](#3-browsing-products)
4. [Product Details](#4-product-details)
5. [Shopping Cart](#5-shopping-cart)
6. [Checkout & Payment](#6-checkout--payment)
7. [Managing Orders](#7-managing-orders)
8. [Managing Addresses](#8-managing-addresses)
9. [Admin Panel](#9-admin-panel)
10. [Vendor Guide](#10-vendor-guide)
11. [FAQ](#11-faq)

---

## 1. Getting Started

CoreKit is an online shopping platform. You can browse and purchase products as a **Customer**, manage a product catalogue as a **Vendor**, or administer the store as an **Admin/Staff** member.

### Accessing the Store

- **Storefront:** Open your browser and navigate to the store URL (e.g., `http://localhost:3001`)
- **API Documentation:** Developers can access Swagger docs at `http://localhost:3000/api/docs`

---

## 2. Creating an Account

### Register with Email

1. Navigate to the **Register** page (`/register`)
2. Fill in the fields:
   - **First Name** (required)
   - **Last Name** (optional)
   - **Email** (required)
   - **Password** (required)
   - **Phone** (optional)
3. Click **Register**
4. You will be logged in automatically and redirected to the home page

### Login with Email

1. Navigate to the **Login** page (`/login`)
2. Enter your **Email** and **Password**
3. Click **Log In**

### Login with OTP (Passwordless)

1. On the Login page, click **Login with OTP**
2. Enter your registered email address
3. Check your inbox for the OTP code
4. Enter the OTP to log in

### Login with Google

1. On the Login page, click **Sign in with Google**
2. Select your Google account
3. You will be redirected back and logged in automatically

### Staying Logged In

Your session is maintained via secure tokens. If your session expires, refresh the page — the system will attempt to renew your session automatically. If it cannot, you will be redirected to the login page.

---

## 3. Browsing Products

### Home Page

The home page displays:
- **Hero Banner** with promotional content
- **Featured Categories** for quick navigation
- **New Arrivals** showing the latest products

### Products Page (`/products`)

1. Click **Products** in the navbar
2. Browse the product grid
3. Use **Filters** on the left sidebar:
   - Filter by **Category**
   - Filter by **Price range**
4. Use the **Sort** dropdown to sort by newest, price, etc.

### Categories Page (`/categories`)

1. Click **Categories** in the navbar
2. View all category cards with item counts
3. Click a category to see its products

---

## 4. Product Details

1. Click on any product card to open its detail page
2. On the product page you can see:
   - **Product images** (click thumbnails to switch)
   - **Price** and compare-at-price (with discount percentage)
   - **Brand** name
   - **Rating** and number of reviews
   - **Variant selectors** (size, color, etc.)
   - **Stock availability**
   - **Description**
   - **Customer reviews**
3. Select your desired **variant** (size, color, etc.)
4. Adjust the **Quantity**
5. Click **Add to Cart** 🛒

---

## 5. Shopping Cart

### Viewing Your Cart

1. Click the **Cart** icon in the navbar (shows item count badge)
2. Or navigate to `/cart`

### Cart Actions

| Action | How |
|--------|-----|
| **Change quantity** | Use the `–` and `+` buttons next to each item |
| **Remove item** | Click the 🗑 (trash) icon |
| **Clear cart** | Click **Clear Cart** at the bottom |
| **Apply coupon** | Enter code in the coupon field and click **Apply** |

### Cart Summary

The cart shows a price breakdown:
- **Subtotal** — sum of all item prices
- **Discount** — coupon discount (if applied)
- **Tax** — calculated tax amount
- **Shipping** — shipping charges
- **Grand Total** — final amount payable

Click **Proceed to Checkout** to continue.

---

## 6. Checkout & Payment

### Step 1: Select Shipping Address

- Choose from your saved addresses
- Or click **Add New Address** to save a new one
- Fields: Full Name, Phone, Address Line 1, Line 2, Landmark, City, State, Pincode

### Step 2: Billing Address

- Check **Same as shipping address** to reuse it
- Or select / add a different billing address

### Step 3: Choose Payment Method

| Method | Description |
|--------|-------------|
| **Razorpay** | Pay via UPI, Credit/Debit Card, Netbanking, or Wallet |
| **Cash on Delivery (COD)** | Pay when you receive the order |

### Step 4: Review & Place Order

1. Review the **Order Summary** (items, quantities, totals)
2. Add an optional **Customer Note** (e.g., delivery instructions)
3. Click **Place Order**
4. For Razorpay: Complete payment in the Razorpay popup
5. Confirmation page will show your **Order Number**

---

## 7. Managing Orders

### View All Orders

1. Navigate to `/orders` or click **Orders** in your account menu
2. See all your orders with:
   - Order number and date
   - Item count and total
   - Order status and payment status

### Order Statuses

| Status | Meaning |
|--------|---------|
| **CREATED** | Order placed, pending confirmation |
| **CONFIRMED** | Order confirmed by the store |
| **PROCESSING** | Order is being prepared |
| **SHIPPED** | Order has been dispatched |
| **COMPLETED** | Order delivered successfully |
| **CANCELLED** | Order was cancelled |
| **REFUNDED** | Payment has been refunded |

### View Order Details

Click **View Details** on any order to see:
- **Status timeline** with timestamps
- **Item list** with prices
- **Price breakdown**
- **Shipping and billing addresses**
- **Payment information**

---

## 8. Managing Addresses

### Add a New Address

1. Go to your profile or during checkout click **Add New Address**
2. Fill in the address form:
   - **Type:** Shipping or Billing
   - **Full Name** and **Phone**
   - **Address Line 1**, **Line 2** (optional), **Landmark** (optional)
   - **City**, **State**, **Pincode**
3. Save the address

### Set Default Address

- Click the **Set as Default** option on any saved address
- This address will be pre-selected during checkout

### Edit / Delete Address

- Use the **Edit** or **Delete** buttons on any saved address

---

## 9. Admin Panel

> Accessible only to users with **ADMIN** role.

### Accessing the Admin Panel

Navigate to `/admin` after logging in with an admin account.

### Dashboard

The admin dashboard shows:
- **Quick stats:** Total users, orders, revenue, pending items
- **Recent orders** table
- **Low stock alerts**

### User Management (`/admin/users`)

1. Navigate to **Users** in the admin sidebar
2. View all registered users with their roles and status
3. **Search** users by name or email
4. **Filter** by role
5. **Change user role:** Click on a user → select new role → Save
   - Available roles: Admin, Vendor, Staff, Customer

### Product Management

Admins can manage products via the API or admin interface:
- **Create** new products (they start in DRAFT status)
- **Edit** product details, descriptions, images
- **Publish/Unpublish** to control visibility
- **Assign categories** to products
- **Delete** products (admin only)

### Order Management

- View all tenant orders
- **Update order status** (CREATED → CONFIRMED → PROCESSING → SHIPPED → COMPLETED)
- Add **internal notes** on status changes
- View **payment details** and **fulfilment status**

---

## 10. Vendor Guide

### Becoming a Vendor

1. Register as a customer
2. Apply for vendor status (contact tenant admin)
3. Provide business details:
   - **Display Name** — public-facing name
   - **Business Name** and **GSTIN** (optional)
4. Wait for admin verification

### Vendor Statuses

| Status | Meaning |
|--------|---------|
| **PENDING** | Application submitted, awaiting review |
| **VERIFIED** | Approved — can create products |
| **REJECTED** | Application denied |
| **SUSPENDED** | Account temporarily disabled |

### Managing Your Products (Vendor)

Once verified, vendors can:
- **Create products** — they will be linked to your vendor profile
- **Edit your products** — update details, variants, pricing
- **View orders** for your products

> Vendors **cannot** publish products or manage other vendors' items. An Admin or Staff member must publish vendor products.

---

## 11. FAQ

### Account & Login

**Q: I forgot my password. How do I log in?**  
A: Use the **OTP Login** option on the login page. Enter your registered email to receive a one-time code.

**Q: Can I change my email address?**  
A: Contact the store administrator to update your email.

**Q: How do I change my role to Admin/Staff?**  
A: Only existing Admins can change user roles from the Admin Panel.

### Shopping

**Q: Why can't I see a product I'm looking for?**  
A: The product may be in DRAFT status and not yet published. Contact the store team.

**Q: My coupon code isn't working.**  
A: Possible reasons:
- Coupon has expired
- Cart doesn't meet the minimum value
- Coupon usage limit reached

**Q: Can I modify my order after placing it?**  
A: Currently, order modification isn't available. Contact the store to cancel and reorder if needed.

### Payments

**Q: Which payment methods are accepted?**  
A: UPI, Credit/Debit Cards, Netbanking, Wallets (via Razorpay) and Cash on Delivery.

**Q: My payment failed but order was created. What now?**  
A: Go to your order details and retry payment. If the issue persists, contact support.

### Admin & Vendor

**Q: How do I add a new tenant?**  
A: Tenant creation is currently a backend operation via the database. Contact the platform super admin.

**Q: Where is Swagger documentation?**  
A: Visit `http://your-api-url/api/docs` for interactive API documentation.
