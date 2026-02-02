ALTER TABLE "product_images" DROP CONSTRAINT IF EXISTS "product_images_productId_fkey";
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
