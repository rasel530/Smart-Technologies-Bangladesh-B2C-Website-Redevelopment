-- Create comparison_share_tokens table to store share tokens
-- BUG-CRIT-001: Share tokens generated but not stored in database
-- BUG-CRIT-002: No validation that share tokens exist

CREATE TABLE "comparison_share_tokens" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "comparison_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comparison_share_tokens_pkey" PRIMARY KEY ("id")
);

-- Create unique index on token
CREATE UNIQUE INDEX "comparison_share_tokens_token_key" ON "comparison_share_tokens"("token");

-- Create indexes for performance
CREATE INDEX "comparison_share_tokens_comparison_id_idx" ON "comparison_share_tokens"("comparison_id");
CREATE INDEX "comparison_share_tokens_expires_at_idx" ON "comparison_share_tokens"("expires_at");

-- Add foreign key constraint
ALTER TABLE "comparison_share_tokens" 
ADD CONSTRAINT "comparison_share_tokens_comparison_id_fkey" 
FOREIGN KEY ("comparison_id") REFERENCES "product_comparisons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add comment
COMMENT ON TABLE "comparison_share_tokens" IS 'Stores share tokens for product comparisons to enable sharing functionality';
COMMENT ON COLUMN "comparison_share_tokens"."token" IS 'Unique token used to access shared comparison';
COMMENT ON COLUMN "comparison_share_tokens"."expires_at" IS 'Token expiration date - should match comparison expiration';
