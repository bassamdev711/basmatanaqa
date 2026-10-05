-- Add reusable store branding and localization fields
ALTER TABLE "StoreSettings"
  ADD COLUMN "storeNameLatin" TEXT,
  ADD COLUMN "storeTagline" TEXT,
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'ar',
  ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'YER';
