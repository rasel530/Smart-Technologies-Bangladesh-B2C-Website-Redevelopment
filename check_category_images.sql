SELECT id, name, "imageUrl", "iconUrl" 
FROM "Category" 
WHERE "imageUrl" IS NOT NULL OR "iconUrl" IS NOT NULL 
LIMIT 5;
