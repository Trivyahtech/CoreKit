-- Suppliers
CREATE TABLE "Supplier" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Supplier_tenantId_isActive_idx" ON "Supplier"("tenantId", "isActive");
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;

-- PurchaseOrderStatus enum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT','ORDERED','PARTIAL','RECEIVED','CANCELLED');

-- PurchaseOrder
CREATE TABLE "PurchaseOrder" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "poNumber" TEXT NOT NULL,
  "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "expectedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PurchaseOrder_tenantId_poNumber_key" ON "PurchaseOrder"("tenantId","poNumber");
CREATE INDEX "PurchaseOrder_tenantId_status_idx" ON "PurchaseOrder"("tenantId","status");
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT;

-- PurchaseOrderItem
CREATE TABLE "PurchaseOrderItem" (
  "id" TEXT NOT NULL,
  "poId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "received" INTEGER NOT NULL DEFAULT 0,
  "unitCost" DECIMAL(12,2) NOT NULL,
  "totalCost" DECIMAL(12,2) NOT NULL,
  CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PurchaseOrderItem_poId_idx" ON "PurchaseOrderItem"("poId");
CREATE INDEX "PurchaseOrderItem_variantId_idx" ON "PurchaseOrderItem"("variantId");
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_poId_fkey"
  FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT;

-- InventoryLot
CREATE TABLE "InventoryLot" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "lotNumber" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "remaining" INTEGER NOT NULL,
  "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "expiryAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "poItemId" TEXT,
  "notes" TEXT,
  CONSTRAINT "InventoryLot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InventoryLot_tenantId_variantId_remaining_idx" ON "InventoryLot"("tenantId","variantId","remaining");
CREATE INDEX "InventoryLot_tenantId_expiryAt_idx" ON "InventoryLot"("tenantId","expiryAt");
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE;
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_poItemId_fkey"
  FOREIGN KEY ("poItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE SET NULL;

-- StockLedger
CREATE TYPE "StockChangeReason" AS ENUM ('PURCHASE_ORDER_RECEIVED','ORDER_PLACED','ORDER_CANCELLED','ORDER_REFUNDED','ADJUSTMENT_MANUAL','ADJUSTMENT_COUNT','DAMAGE','LOSS','RETURN');

CREATE TABLE "StockLedger" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "change" INTEGER NOT NULL,
  "reason" "StockChangeReason" NOT NULL,
  "refType" TEXT,
  "refId" TEXT,
  "note" TEXT,
  "actorUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockLedger_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StockLedger_tenantId_variantId_createdAt_idx" ON "StockLedger"("tenantId","variantId","createdAt");
CREATE INDEX "StockLedger_tenantId_refType_refId_idx" ON "StockLedger"("tenantId","refType","refId");
ALTER TABLE "StockLedger" ADD CONSTRAINT "StockLedger_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
ALTER TABLE "StockLedger" ADD CONSTRAINT "StockLedger_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE;
