# Image Migration Guide

This guide provides instructions for fixing critical issues with product image URLs and orphaned image records.

## Overview

Testing revealed two critical issues:

1. **Relative URLs**: Existing database images have relative URLs (uploaded before the fix was applied)
2. **Missing Files**: Image files are missing from disk (uploads directory is empty)

This guide provides scripts to:

- Update all image URLs to absolute format
- Clean up orphaned image records (records without corresponding files)

## Prerequisites

Before running any migration scripts, ensure:

1. **Environment Variables**: Set the following in `backend/.env`:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/your_database
   BACKEND_URL=http://localhost:3001
   ```

2. **Database Connection**: Ensure your PostgreSQL database is running and accessible

3. **Node.js**: Ensure Node.js is installed (v14 or higher recommended)

## Script 1: Update Image URLs to Absolute Format

### Purpose

Converts all relative image URLs to absolute URLs using the `BACKEND_URL` environment variable.

### URL Conversion Rules

The script handles different URL formats:

| Input Format                   | Output Format                                      |
| ------------------------------ | -------------------------------------------------- |
| `/uploads/products/image.jpg`  | `http://localhost:3001/uploads/products/image.jpg` |
| `uploads/products/image.jpg`   | `http://localhost:3001/uploads/products/image.jpg` |
| `products/image.jpg`           | `http://localhost:3001/uploads/products/image.jpg` |
| `http://example.com/image.jpg` | `http://example.com/image.jpg` (unchanged)         |

### Running the Migration

#### From the project root:

```bash
node backend/migrations/update-image-urls-to-absolute.js
```

#### From the backend directory:

```bash
cd backend
node migrations/update-image-urls-to-absolute.js
```

### Expected Output

```
============================================================
Image URL Migration: Relative to Absolute Format
============================================================

Backend URL: http://localhost:3001

Connecting to database...
✓ Database connected successfully

Querying product images...
Found 15 product images

Processing images...

  [abc-123...] originalUrl: /uploads/products/image1.jpg → http://localhost:3001/uploads/products/image1.jpg
  [abc-123...] optimizedUrl: /uploads/products/image1-optimized.jpg → http://localhost:3001/uploads/products/image1-optimized.jpg
  ...

============================================================
Migration Summary
============================================================
Total images processed: 15
Images updated: 12
  - originalUrl updated: 4
  - optimizedUrl updated: 4
  - thumbnailUrl updated: 4

✓ Migration completed successfully
```

### Idempotency

This script is **idempotent** - it can be run multiple times safely. URLs that are already in absolute format will not be modified.

### Production Considerations

For production environments:

1. Set `BACKEND_URL` to your actual production backend URL:

   ```env
   BACKEND_URL=https://api.yourdomain.com
   ```

2. Run the migration during a maintenance window if possible

3. Consider backing up the database before running:
   ```bash
   pg_dump your_database > backup_before_migration.sql
   ```

## Script 2: Clean Up Orphaned Image Records

### Purpose

Identifies and removes product image records from the database when the corresponding image files do not exist on disk.

### Understanding Orphaned Records

An image record is considered "orphaned" if:

- The `originalUrl` file does not exist
- The `optimizedUrl` file does not exist (if provided)
- The `thumbnailUrl` file does not exist (if provided)

### Running the Cleanup

#### Dry Run (Preview Mode)

Always run in dry-run mode first to see what would be deleted:

```bash
node backend/scripts/cleanup-orphaned-images.js --dry-run
```

#### Actual Cleanup

After reviewing the dry-run output, run without the flag to perform the actual cleanup:

```bash
node backend/scripts/cleanup-orphaned-images.js
```

### Expected Output (Dry Run)

```
============================================================
Orphaned Image Records Cleanup
============================================================

DRY RUN MODE: No records will be deleted

Uploads Directory: e:/Drive_D_Backup/Smart_Tech_B2C_Website_Redevelopment/backend/uploads/products

Connecting to database...
✓ Database connected successfully

Querying product images...
Found 15 product images

Checking for orphaned images...

  [ORPHANED] abc-123-def-456
    Product ID: prod-789
    Original URL: /uploads/products/image1.jpg
    Optimized URL: /uploads/products/image1-optimized.jpg
    Thumbnail URL: /uploads/products/image1-thumb.jpg
    Created At: 2026-01-28T10:30:00.000Z

  ...

============================================================
Summary
============================================================
Total images: 15
Valid images (files exist): 8
Orphaned images (files missing): 7

DRY RUN: The following records would be deleted:

  - abc-123-def-456 (Product: prod-789)
  - ...

Run without --dry-run flag to actually delete these records.
```

### Expected Output (Actual Cleanup)

```
============================================================
Orphaned Image Records Cleanup
============================================================

Uploads Directory: e:/Drive_D_Backup/Smart_Tech_B2C_Website_Redevelopment/backend/uploads/products

Connecting to database...
✓ Database connected successfully

Querying product images...
Found 15 product images

Checking for orphaned images...

  [ORPHANED] abc-123-def-456
    Product ID: prod-789
    ...

============================================================
Summary
============================================================
Total images: 15
Valid images (files exist): 8
Orphaned images (files missing): 7

Deleting orphaned image records...

  ✓ Marked as deleted: abc-123-def-456
  ✓ Marked as deleted: def-456-ghi-789
  ...

============================================================
✓ Cleanup completed successfully
============================================================
Deleted 7 orphaned image records

Note: Records were marked with processing_status="deleted"
      rather than being permanently deleted from the database.
      This allows for potential recovery if needed.
```

### Safety Features

1. **Soft Delete**: Records are marked as `processing_status="deleted"` rather than permanently deleted
2. **Dry Run**: Preview what would be deleted before committing
3. **File Existence Check**: Verifies files don't exist before marking records as deleted

### Idempotency

This script is **idempotent** - it can be run multiple times safely. Records already marked as deleted will be skipped.

## Re-uploading Images

After cleaning up orphaned records, you may need to re-upload images through the admin interface:

### Steps to Re-upload Images

1. **Access Admin Panel**: Navigate to the admin product management interface
2. **Select Product**: Choose the product that needs images
3. **Upload Images**: Use the image upload functionality to add new images
4. **Verify**: Ensure images are uploaded correctly and display properly

### Notes on Re-uploading

- New uploads will automatically use absolute URLs
- Images will be saved to the `backend/uploads/products/` directory
- Multiple image formats (original, optimized, thumbnail) will be generated automatically

## Using NPM Scripts (Optional)

For convenience, you can add npm scripts to `backend/package.json`:

```json
{
  "scripts": {
    "migrate:image-urls": "node migrations/update-image-urls-to-absolute.js",
    "cleanup:orphaned-images": "node scripts/cleanup-orphaned-images.js",
    "cleanup:orphaned-images:dry-run": "node scripts/cleanup-orphaned-images.js --dry-run"
  }
}
```

### Using NPM Scripts

```bash
cd backend

# Update image URLs
npm run migrate:image-urls

# Preview orphaned image cleanup
npm run cleanup:orphaned-images:dry-run

# Clean up orphaned images
npm run cleanup:orphaned-images
```

## Troubleshooting

### Issue: "BACKEND_URL environment variable is not set"

**Solution**: Add `BACKEND_URL` to your `backend/.env` file:

```env
BACKEND_URL=http://localhost:3001
```

### Issue: "Uploads directory does not exist"

**Solution**: Create the uploads directory:

```bash
mkdir -p backend/uploads/products
```

### Issue: Database connection errors

**Solution**: Verify your `DATABASE_URL` in `backend/.env` is correct and the database is running:

```bash
# Test database connection
psql $DATABASE_URL
```

### Issue: "No images to migrate"

**Solution**: This is normal if:

- All images already have absolute URLs
- No images exist in the database
- All images have `processing_status="deleted"`

## Recovery

If you accidentally delete records and need to recover them:

1. **Check Database**: Records are soft-deleted (marked as `processing_status="deleted"`)
2. **Restore Status**: Update the `processing_status` back to its original value:
   ```sql
   UPDATE product_images
   SET processing_status = 'completed'
   WHERE processing_status = 'deleted';
   ```
3. **Restore Files**: If you have backup files, restore them to the uploads directory

## Best Practices

1. **Always backup before migration**: Create a database backup before running migration scripts
2. **Use dry-run first**: Always run the cleanup script in dry-run mode first
3. **Test in staging**: Test migrations in a staging environment before production
4. **Monitor logs**: Review script output for any warnings or errors
5. **Document changes**: Keep a record of when migrations were run and what changed

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Node.js File System Documentation](https://nodejs.org/api/fs.html)
- Project-specific documentation in the `backend/` directory

## Support

If you encounter issues not covered in this guide:

1. Check the script error messages for specific details
2. Review the database logs for any database-related errors
3. Verify all environment variables are set correctly
4. Ensure the uploads directory exists and has proper permissions
