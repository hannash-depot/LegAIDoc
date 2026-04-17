-- Catch-up migration: brings production DB in line with schema.prisma.
-- Adds the Category.icon column, the NotificationType enum, and three tables
-- (notifications, invoice_counters, processed_webhook_events) that were added
-- to schema.prisma after the initial migration snapshot without a matching
-- migration. All statements are idempotent-friendly (IF NOT EXISTS where
-- supported) so re-running against a partially-applied DB is safe.

-- AlterTable: add icon column to categories
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "icon" TEXT;

-- CreateEnum: NotificationType
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
        CREATE TYPE "NotificationType" AS ENUM (
            'SIGNATURE_REQUESTED',
            'SIGNATURE_COMPLETED',
            'SIGNATURE_EXPIRED',
            'DOCUMENT_SHARED',
            'DOCUMENT_COMMENT',
            'ANALYSIS_COMPLETE',
            'PAYMENT_RECEIPT',
            'SUBSCRIPTION_EXPIRING',
            'USAGE_LIMIT_APPROACHING',
            'ADMIN_TEMPLATE_UPDATED'
        );
    END IF;
END$$;

-- CreateTable: invoice_counters
CREATE TABLE IF NOT EXISTS "invoice_counters" (
    "year" INTEGER NOT NULL,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "invoice_counters_pkey" PRIMARY KEY ("year")
);

-- CreateTable: processed_webhook_events
CREATE TABLE IF NOT EXISTS "processed_webhook_events" (
    "id" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "processed_webhook_events_processedAt_idx"
    ON "processed_webhook_events"("processedAt");

-- CreateTable: notifications
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "titleKey" TEXT NOT NULL,
    "bodyKey" TEXT NOT NULL,
    "params" JSONB,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_userId_read_createdAt_idx"
    ON "notifications"("userId", "read", "createdAt");

CREATE INDEX IF NOT EXISTS "notifications_userId_createdAt_idx"
    ON "notifications"("userId", "createdAt");

-- AddForeignKey: notifications.userId -> users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notifications_userId_fkey'
    ) THEN
        ALTER TABLE "notifications"
            ADD CONSTRAINT "notifications_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;
