-- Fix product image URLs from host.docker.internal to localhost
-- This fixes the NS_BINDING_ABORTED error when loading product images

-- Update original URLs
UPDATE product_images
SET original_url = REPLACE(original_url, 'http://host.docker.internal:3001', 'http://localhost:3001')
WHERE original_url LIKE '%host.docker.internal:3001%';

-- Update optimized URLs
UPDATE product_images
SET optimized_url = REPLACE(optimized_url, 'http://host.docker.internal:3001', 'http://localhost:3001')
WHERE optimized_url LIKE '%host.docker.internal:3001%';

-- Update thumbnail URLs
UPDATE product_images
SET thumbnail_url = REPLACE(thumbnail_url, 'http://host.docker.internal:3001', 'http://localhost:3001')
WHERE thumbnail_url LIKE '%host.docker.internal:3001%';

-- Display how many records were updated
SELECT 
  COUNT(*) as total_images,
  SUM(CASE WHEN original_url LIKE '%localhost:3001%' THEN 1 ELSE 0 END) as updated_images,
  SUM(CASE WHEN original_url LIKE '%host.docker.internal:3001%' THEN 1 ELSE 0 END) as remaining_old_urls
FROM product_images;
