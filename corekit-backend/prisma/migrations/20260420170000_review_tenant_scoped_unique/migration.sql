-- DropIndex
DROP INDEX "Review_productId_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Review_tenantId_productId_userId_key" ON "Review"("tenantId", "productId", "userId");
