-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VENDOR', 'STAFF', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INVITED', 'DELETED');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VariantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('BILLING', 'SHIPPING');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('FLAT', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "ShippingZoneType" AS ENUM ('PINCODE', 'REGION');

-- CreateEnum
CREATE TYPE "ShippingMethod" AS ENUM ('STANDARD', 'EXPRESS', 'SAME_DAY', 'PICKUP');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "OrderItemStatus" AS ENUM ('CREATED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'PARTIAL', 'FULFILLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('RAZORPAY', 'COD', 'MANUAL');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'CARD', 'NETBANKING', 'WALLET', 'COD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "currencyCode" TEXT NOT NULL DEFAULT 'INR',
    "defaultCountry" TEXT NOT NULL DEFAULT 'IN',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "theme" JSONB,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantDomain" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "VendorStatus" NOT NULL DEFAULT 'PENDING',
    "displayName" TEXT NOT NULL,
    "businessName" TEXT,
    "gstin" TEXT,
    "verificationMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vendorId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "brand" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "taxCode" TEXT,
    "taxRate" DECIMAL(5,2),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "title" TEXT,
    "attributes" JSONB NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "compareAtPrice" DECIMAL(12,2),
    "stockOnHand" INTEGER NOT NULL DEFAULT 0,
    "reservedStock" INTEGER NOT NULL DEFAULT 0,
    "weightGrams" INTEGER,
    "status" "VariantStatus" NOT NULL DEFAULT 'ACTIVE',
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("productId","categoryId")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AddressType" NOT NULL DEFAULT 'SHIPPING',
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "landmark" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "pincode" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shippingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "skuSnapshot" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "minCartValue" DECIMAL(12,2),
    "maxDiscountAmount" DECIMAL(12,2),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ShippingZoneType" NOT NULL DEFAULT 'PINCODE',
    "pincodes" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingRule" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "method" "ShippingMethod" NOT NULL,
    "minWeightGrams" INTEGER,
    "maxWeightGrams" INTEGER,
    "flatRate" DECIMAL(12,2),
    "ratePerKg" DECIMAL(12,2),
    "minOrderValue" DECIMAL(12,2),
    "isCodAllowed" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shippingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'INR',
    "couponCode" TEXT,
    "billingAddress" JSONB NOT NULL,
    "shippingAddress" JSONB NOT NULL,
    "customerNote" TEXT,
    "internalNote" TEXT,
    "placedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "vendorId" TEXT,
    "productName" TEXT NOT NULL,
    "variantName" TEXT,
    "sku" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "status" "OrderItemStatus" NOT NULL DEFAULT 'CREATED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "note" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "method" "PaymentMethod",
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "gatewaySignature" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'INR',
    "rawPayload" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TenantDomain_host_key" ON "TenantDomain"("host");

-- CreateIndex
CREATE INDEX "TenantDomain_tenantId_idx" ON "TenantDomain"("tenantId");

-- CreateIndex
CREATE INDEX "User_tenantId_role_status_idx" ON "User"("tenantId", "role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_userId_key" ON "VendorProfile"("userId");

-- CreateIndex
CREATE INDEX "VendorProfile_tenantId_status_idx" ON "VendorProfile"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Category_tenantId_parentId_isActive_idx" ON "Category"("tenantId", "parentId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Category_tenantId_slug_key" ON "Category"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Product_tenantId_status_isPublished_idx" ON "Product"("tenantId", "status", "isPublished");

-- CreateIndex
CREATE INDEX "Product_tenantId_vendorId_idx" ON "Product"("tenantId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_tenantId_slug_key" ON "Product"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_status_idx" ON "ProductVariant"("productId", "status");

-- CreateIndex
CREATE INDEX "ProductVariant_tenantId_stockOnHand_idx" ON "ProductVariant"("tenantId", "stockOnHand");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_tenantId_sku_key" ON "ProductVariant"("tenantId", "sku");

-- CreateIndex
CREATE INDEX "ProductCategory_categoryId_idx" ON "ProductCategory"("categoryId");

-- CreateIndex
CREATE INDEX "Address_tenantId_userId_isDefault_idx" ON "Address"("tenantId", "userId", "isDefault");

-- CreateIndex
CREATE INDEX "Address_tenantId_pincode_idx" ON "Address"("tenantId", "pincode");

-- CreateIndex
CREATE INDEX "Cart_tenantId_userId_status_idx" ON "Cart"("tenantId", "userId", "status");

-- CreateIndex
CREATE INDEX "CartItem_tenantId_cartId_idx" ON "CartItem"("tenantId", "cartId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_variantId_key" ON "CartItem"("cartId", "variantId");

-- CreateIndex
CREATE INDEX "Coupon_tenantId_isActive_startsAt_endsAt_idx" ON "Coupon"("tenantId", "isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_tenantId_code_key" ON "Coupon"("tenantId", "code");

-- CreateIndex
CREATE INDEX "ShippingZone_tenantId_isActive_idx" ON "ShippingZone"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "ShippingRule_zoneId_isActive_method_idx" ON "ShippingRule"("zoneId", "isActive", "method");

-- CreateIndex
CREATE INDEX "Order_tenantId_userId_status_idx" ON "Order"("tenantId", "userId", "status");

-- CreateIndex
CREATE INDEX "Order_tenantId_paymentStatus_fulfillmentStatus_idx" ON "Order"("tenantId", "paymentStatus", "fulfillmentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Order_tenantId_orderNumber_key" ON "Order"("tenantId", "orderNumber");

-- CreateIndex
CREATE INDEX "OrderItem_tenantId_orderId_idx" ON "OrderItem"("tenantId", "orderId");

-- CreateIndex
CREATE INDEX "OrderItem_tenantId_vendorId_status_idx" ON "OrderItem"("tenantId", "vendorId", "status");

-- CreateIndex
CREATE INDEX "OrderStatusLog_orderId_createdAt_idx" ON "OrderStatusLog"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_tenantId_orderId_status_idx" ON "Payment"("tenantId", "orderId", "status");

-- CreateIndex
CREATE INDEX "Payment_provider_gatewayPaymentId_idx" ON "Payment"("provider", "gatewayPaymentId");

-- CreateIndex
CREATE INDEX "Review_tenantId_productId_status_idx" ON "Review"("tenantId", "productId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Review_productId_userId_key" ON "Review"("productId", "userId");

-- AddForeignKey
ALTER TABLE "TenantDomain" ADD CONSTRAINT "TenantDomain_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProfile" ADD CONSTRAINT "VendorProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProfile" ADD CONSTRAINT "VendorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingZone" ADD CONSTRAINT "ShippingZone_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingRule" ADD CONSTRAINT "ShippingRule_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ShippingZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "VendorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusLog" ADD CONSTRAINT "OrderStatusLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
