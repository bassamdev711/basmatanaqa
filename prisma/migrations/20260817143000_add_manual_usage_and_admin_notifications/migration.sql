-- Manual usage plans, storage metering, and admin notification controls
CREATE TABLE "UsagePlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "databaseLimitBytes" BIGINT NOT NULL,
    "blobLimitBytes" BIGINT NOT NULL,
    "bandwidthLimitBytes" BIGINT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UsagePlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UsagePlan_slug_key" ON "UsagePlan"("slug");

CREATE TABLE "StoreSubscription" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "planId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewsAt" TIMESTAMP(3),
    "graceUntil" TIMESTAMP(3),
    "notes" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoreSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UsageSnapshot" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "usedBytes" BIGINT NOT NULL,
    "limitBytes" BIGINT NOT NULL,
    "source" TEXT NOT NULL,
    "confidence" TEXT NOT NULL DEFAULT 'measured',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3),
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UsageSnapshot_resource_periodStart_key" ON "UsageSnapshot"("resource", "periodStart");
CREATE INDEX "UsageSnapshot_resource_measuredAt_idx" ON "UsageSnapshot"("resource", "measuredAt");

CREATE TABLE "StorageObject" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "sizeBytes" BIGINT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'other',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "reservedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "StorageObject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StorageObject_url_key" ON "StorageObject"("url");
CREATE INDEX "StorageObject_kind_isDeleted_idx" ON "StorageObject"("kind", "isDeleted");
CREATE INDEX "StorageObject_createdAt_idx" ON "StorageObject"("createdAt");

CREATE TABLE "AdminNotificationPreference" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "orderNotifications" BOOLEAN NOT NULL DEFAULT true,
    "limitNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminNotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InAppNotification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InAppNotification_dedupeKey_key" ON "InAppNotification"("dedupeKey");
CREATE INDEX "InAppNotification_readAt_createdAt_idx" ON "InAppNotification"("readAt", "createdAt");
CREATE INDEX "InAppNotification_type_createdAt_idx" ON "InAppNotification"("type", "createdAt");

ALTER TABLE "StoreSubscription"
ADD CONSTRAINT "StoreSubscription_planId_fkey"
FOREIGN KEY ("planId") REFERENCES "UsagePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
