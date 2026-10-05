-- Migration: add Supplier model and link to Product

CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Supplier_isActive_idx" ON "Supplier"("isActive");

ALTER TABLE "Product" ADD COLUMN "supplierId" TEXT;
ALTER TABLE "Product" ADD COLUMN "costPrice" DECIMAL(10,2);

CREATE INDEX "Product_supplierId_idx" ON "Product"("supplierId");

ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
