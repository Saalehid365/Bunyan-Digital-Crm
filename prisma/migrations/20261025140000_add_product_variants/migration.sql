-- CreateTable
CREATE TABLE "ClientProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "quantity" INTEGER,
    "sku" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientProductVariant_productId_idx" ON "ClientProductVariant"("productId");

-- AddForeignKey
ALTER TABLE "ClientProductVariant" ADD CONSTRAINT "ClientProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ClientProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
