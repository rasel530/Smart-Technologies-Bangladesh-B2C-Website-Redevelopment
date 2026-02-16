-- Drop problematic constraints that are blocking Prisma db push
ALTER TABLE "wishlists" DROP CONSTRAINT "wishlists_shareToken_key";
