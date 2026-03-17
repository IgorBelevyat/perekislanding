-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE', 'COD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'COD');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'AWAITING_PAYMENT', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('RETAILCRM', 'NOVAPOSHTA', 'LIQPAY', 'GA4');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('SUCCESS', 'ERROR');

-- CreateTable
CREATE TABLE "bundle_map" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "base_offer_id" TEXT NOT NULL,
    "addon_offer_ids" JSONB NOT NULL DEFAULT '[]',
    "rules" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bundle_map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote" (
    "id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "calc_input" JSONB NOT NULL,
    "items_snapshot" JSONB NOT NULL,
    "totals_snapshot" JSONB NOT NULL,
    "pricing_version" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "retailcrm_order_id" TEXT,
    "customer" JSONB NOT NULL,
    "delivery" JSONB NOT NULL,
    "items_snapshot" JSONB NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_log" (
    "id" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "action" TEXT NOT NULL,
    "request_meta" JSONB,
    "response_meta" JSONB,
    "status" "IntegrationStatus" NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bundle_map_slug_key" ON "bundle_map"("slug");

-- CreateIndex
CREATE INDEX "quote_status_expires_at_idx" ON "quote"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "order_idempotency_key_key" ON "order"("idempotency_key");

-- CreateIndex
CREATE INDEX "order_retailcrm_order_id_idx" ON "order"("retailcrm_order_id");

-- CreateIndex
CREATE INDEX "order_payment_status_idx" ON "order"("payment_status");

-- CreateIndex
CREATE INDEX "integration_log_provider_action_created_at_idx" ON "integration_log"("provider", "action", "created_at");

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bundle_map"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
