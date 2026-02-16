-- Migration: Add Cart Audit Tables
-- Date: 2026-02-10
-- Purpose: Add CartNote and CartAuditLog tables for cart audit logging and notes

-- Create CartNote table
CREATE TABLE IF NOT EXISTS "CartNote" (
    id TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    content TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CartNote_pkey" PRIMARY KEY (id)
);

-- Create index for CartNote
CREATE INDEX IF NOT EXISTS "CartNote_cartId_idx" ON "CartNote"("cartId");

-- Create CartAuditLog table
CREATE TABLE IF NOT EXISTS "CartAuditLog" (
    id TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    action TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "previousValue" JSONB,
    "newValue" JSONB,
    "performedBy" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    metadata JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CartAuditLog_pkey" PRIMARY KEY (id)
);

-- Create indexes for CartAuditLog
CREATE INDEX IF NOT EXISTS "CartAuditLog_cartId_idx" ON "CartAuditLog"("cartId");
CREATE INDEX IF NOT EXISTS "CartAuditLog_action_idx" ON "CartAuditLog"(action);
CREATE INDEX IF NOT EXISTS "CartAuditLog_performedBy_idx" ON "CartAuditLog"("performedBy");
CREATE INDEX IF NOT EXISTS "CartAuditLog_createdAt_idx" ON "CartAuditLog"("createdAt");

-- Add foreign key constraints (will only work if Cart table exists)
-- These are informational; Prisma will handle the relations

-- Comment on tables
COMMENT ON TABLE "CartNote" IS 'Notes added to carts by admins';
COMMENT ON TABLE "CartAuditLog" IS 'Audit log of all cart modifications';
