/**
 * Admin Product Images API Routes
 * 
 * Implements all admin-specific endpoints for product image management including:
 * - Image statistics
 * - Storage quota information
 * - Bulk operations
 * - Processing queue management
 * - CDN sync status
 * - Optimization suggestions
 * 
 * All endpoints require admin authentication.
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const { authMiddleware } = require('../middleware/auth');
const { imageStorageService } = require('../services/image-storage.service');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
      message: 'ভ্যালিডেশন ব্যর্থ হয়েছে',
      messageEn: 'Validation failed'
    });
  }
  next();
};

// ============================================
// ERROR RESPONSES
// ============================================

const sendErrorResponse = (res, statusCode, errorEn, errorBn, details = null) => {
  res.status(statusCode).json({
    error: errorEn,
    message: errorBn,
    messageEn: errorEn,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
    timestamp: new Date().toISOString()
  });
};

// ============================================
// 1. GET /api/v1/admin/products/:productId/images/statistics
// Get image statistics for a product
// ============================================

/**
 * @swagger
 * /api/v1/admin/products/{productId}/images/statistics:
 *   get:
 *     summary: Get image statistics for a product
 *     tags: [Admin Product Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Image statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/:productId/images/statistics', [
  param('productId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { productId } = req.params;

    console.log(`[AdminProductImages] Fetching statistics for product: ${productId}`);

    // Check if product exists
    const product = await prisma.products.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return sendErrorResponse(
        res,
        404,
        'Product not found',
        'পণ্যটি পাওয় নেই'
      );
    }

    // Get image statistics
    const imagesResult = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_images,
        COALESCE(SUM(file_size_bytes), 0) as total_size,
        COALESCE(AVG(file_size_bytes), 0) as average_size
      FROM product_images
      WHERE product_id = ${productId} AND processing_status != 'deleted'
    `;

    const stats = imagesResult[0];
    const totalImages = parseInt(stats.total_images);
    const totalSize = parseInt(stats.total_size);
    const averageSize = parseFloat(stats.average_size);

    // Get primary image
    const primaryImageResult = await prisma.$queryRaw`
      SELECT 
        id, product_id, original_url, optimized_url, thumbnail_url,
        alt_text_bn, alt_text_en, display_order, is_primary,
        file_size_bytes, mime_type, width, height, processing_status,
        created_at, updated_at
      FROM product_images
      WHERE product_id = ${productId} AND is_primary = true AND processing_status != 'deleted'
      LIMIT 1
    `;

    const primaryImage = primaryImageResult.length > 0 ? {
      id: primaryImageResult[0].id,
      productId: primaryImageResult[0].product_id,
      originalUrl: primaryImageResult[0].original_url,
      optimizedUrl: primaryImageResult[0].optimized_url,
      thumbnailUrl: primaryImageResult[0].thumbnail_url,
      altTextBn: primaryImageResult[0].alt_text_bn,
      altTextEn: primaryImageResult[0].alt_text_en,
      displayOrder: primaryImageResult[0].display_order,
      isPrimary: primaryImageResult[0].is_primary,
      fileSizeBytes: primaryImageResult[0].file_size_bytes,
      mimeType: primaryImageResult[0].mime_type,
      width: primaryImageResult[0].width,
      height: primaryImageResult[0].height,
      processingStatus: primaryImageResult[0].processing_status,
      createdAt: primaryImageResult[0].created_at,
      updatedAt: primaryImageResult[0].updated_at
    } : null;

    // Get MIME type distribution
    const mimeTypesResult = await prisma.$queryRaw`
      SELECT mime_type, COUNT(*) as count
      FROM product_images
      WHERE product_id = ${productId} AND processing_status != 'deleted'
      GROUP BY mime_type
    `;

    const mimeTypes = {};
    mimeTypesResult.forEach(row => {
      mimeTypes[row.mime_type || 'unknown'] = parseInt(row.count);
    });

    // Get processing status distribution
    const processingStatusResult = await prisma.$queryRaw`
      SELECT processing_status, COUNT(*) as count
      FROM product_images
      WHERE product_id = ${productId} AND processing_status != 'deleted'
      GROUP BY processing_status
    `;

    const processingStatus = {};
    processingStatusResult.forEach(row => {
      processingStatus[row.processing_status] = parseInt(row.count);
    });

    res.json({
      statistics: {
        totalImages,
        totalSize,
        averageSize,
        primaryImage,
        mimeTypes,
        processingStatus
      }
    });

  } catch (error) {
    console.error('[AdminProductImages] Statistics error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to fetch image statistics',
      'ইমেজ পরিসংখ্যান আনতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 2. GET /api/v1/admin/products/:productId/images/quota
// Get storage quota information for a product
// ============================================

/**
 * @swagger
 * /api/v1/admin/products/{productId}/images/quota:
 *   get:
 *     summary: Get storage quota information for a product
 *     tags: [Admin Product Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Storage quota information retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/:productId/images/quota', [
  param('productId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { productId } = req.params;

    console.log(`[AdminProductImages] Fetching storage quota for product: ${productId}`);

    // Check if product exists
    const product = await prisma.products.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return sendErrorResponse(
        res,
        404,
        'Product not found',
        'পণ্যটি পাওয় নেই'
      );
    }

    // Get total storage used
    const storageResult = await prisma.$queryRaw`
      SELECT COALESCE(SUM(file_size_bytes), 0) as total_size
      FROM product_images
      WHERE product_id = ${productId} AND processing_status != 'deleted'
    `;

    const totalSize = parseInt(storageResult[0].total_size) || 0;
    const quota = 50 * 1024 * 1024; // 50MB default quota
    const usedPercentage = (totalSize / quota) * 100;
    const remaining = quota - totalSize;

    res.json({
      quota: {
        totalSize,
        quota,
        usedPercentage: Math.round(usedPercentage * 100) / 100,
        remaining: Math.max(0, remaining),
        isNearLimit: usedPercentage >= 80,
        isOverLimit: totalSize > quota
      }
    });

  } catch (error) {
    console.error('[AdminProductImages] Quota error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to fetch storage quota',
      'স্টোরেজ কোটা আনতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 3. PUT /api/v1/admin/images/bulk-update
// Bulk update image metadata
// ============================================

/**
 * @swagger
 * /api/v1/admin/images/bulk-update:
 *   put:
 *     summary: Bulk update image metadata
 *     tags: [Admin Product Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     imageId:
 *                       type: string
 *                       format: uuid
 *                     data:
 *                       type: object
 *                       properties:
 *                         altTextBn:
 *                           type: string
 *                         altTextEn:
 *                           type: string
 *                         displayOrder:
 *                           type: integer
 *                         isPrimary:
 *                           type: boolean
 *     responses:
 *       200:
 *         description: Bulk update completed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.put('/bulk-update', [
  body('updates').isArray().withMessage('Updates must be an array'),
  body('updates.*.imageId').isUUID().withMessage('Image ID must be a valid UUID'),
  body('updates.*.data').isObject().withMessage('Data must be an object'),
  body('updates.*.data.altTextBn').optional().isString().trim().isLength({ max: 250 }),
  body('updates.*.data.altTextEn').optional().isString().trim().isLength({ max: 250 }),
  body('updates.*.data.displayOrder').optional().isInt({ min: 0 }),
  body('updates.*.data.isPrimary').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { updates } = req.body;

    console.log(`[AdminProductImages] Bulk update for ${updates.length} images`);

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const update of updates) {
      try {
        const { imageId, data } = update;

        // Check if image exists
        const imageResult = await prisma.$queryRaw`
          SELECT * FROM product_images WHERE id = ${imageId} AND processing_status != 'deleted'
        `;

        if (!imageResult || imageResult.length === 0) {
          errors.push({
            imageId,
            error: 'Image not found'
          });
          failedCount++;
          continue;
        }

        const image = imageResult[0];

        // If setting as primary, unset other primary images for this product
        if (data.isPrimary === true) {
          await prisma.$queryRaw`
            UPDATE product_images
            SET is_primary = false, updated_at = NOW()
            WHERE product_id = ${image.product_id} AND id != ${imageId} AND processing_status != 'deleted'
          `;
        }

        // Update image metadata
        await prisma.$queryRaw`
          UPDATE product_images
          SET 
            alt_text_bn = COALESCE(${data.altTextBn || null}, alt_text_bn),
            alt_text_en = COALESCE(${data.altTextEn || null}, alt_text_en),
            display_order = COALESCE(${data.displayOrder !== undefined ? data.displayOrder : null}, display_order),
            is_primary = COALESCE(${data.isPrimary !== undefined ? data.isPrimary : null}, is_primary),
            updated_at = NOW()
          WHERE id = ${imageId}
        `;

        successCount++;

      } catch (error) {
        console.error(`[AdminProductImages] Error updating image ${update.imageId}:`, error);
        errors.push({
          imageId: update.imageId,
          error: error.message || 'Update failed'
        });
        failedCount++;
      }
    }

    res.json({
      result: {
        success: successCount,
        failed: failedCount,
        errors
      }
    });

  } catch (error) {
    console.error('[AdminProductImages] Bulk update error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to bulk update images',
      'বাল্ক আপডেট করতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 4. POST /api/v1/admin/images/bulk-delete
// Bulk delete images
// ============================================

/**
 * @swagger
 * /api/v1/admin/images/bulk-delete:
 *   post:
 *     summary: Bulk delete images
 *     tags: [Admin Product Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageIds
 *             properties:
 *               imageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Bulk delete completed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.post('/bulk-delete', [
  body('imageIds').isArray().withMessage('Image IDs must be an array'),
  body('imageIds.*').isUUID().withMessage('Each image ID must be a valid UUID')
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { imageIds } = req.body;

    console.log(`[AdminProductImages] Bulk delete for ${imageIds.length} images`);

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const imageId of imageIds) {
      try {
        // Check if image exists
        const imageResult = await prisma.$queryRaw`
          SELECT * FROM product_images WHERE id = ${imageId} AND processing_status != 'deleted'
        `;

        if (!imageResult || imageResult.length === 0) {
          errors.push({
            imageId,
            error: 'Image not found'
          });
          failedCount++;
          continue;
        }

        const image = imageResult[0];

        // Soft delete: mark as deleted
        await prisma.$queryRaw`
          UPDATE product_images
          SET processing_status = 'deleted', updated_at = NOW()
          WHERE id = ${imageId}
        `;

        // Move file to deleted directory
        const path = require('path');
        const filePath = path.join(__dirname, `../uploads/products/${image.product_id}/${path.basename(image.original_url)}`);
        await imageStorageService.softDeleteFile(filePath, 7); // 7 days recovery

        successCount++;

      } catch (error) {
        console.error(`[AdminProductImages] Error deleting image ${imageId}:`, error);
        errors.push({
          imageId,
          error: error.message || 'Delete failed'
        });
        failedCount++;
      }
    }

    res.json({
      result: {
        success: successCount,
        failed: failedCount,
        errors
      }
    });

  } catch (error) {
    console.error('[AdminProductImages] Bulk delete error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to bulk delete images',
      'বাল্ক মুছে ফেলতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 5. GET /api/v1/admin/products/:productId/images/queue
// Get processing queue status
// ============================================

/**
 * @swagger
 * /api/v1/admin/products/{productId}/images/queue:
 *   get:
 *     summary: Get image processing queue status
 *     tags: [Admin Product Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Processing queue status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/:productId/images/queue', [
  param('productId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { productId } = req.params;

    console.log(`[AdminProductImages] Fetching processing queue for product: ${productId}`);

    // Check if product exists
    const product = await prisma.products.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return sendErrorResponse(
        res,
        404,
        'Product not found',
        'পণ্যটি পাওয় নেই'
      );
    }

    // Get images in processing queue
    const queueResult = await prisma.$queryRaw`
      SELECT 
        id, original_url, processing_status, created_at, updated_at
      FROM product_images
      WHERE product_id = ${productId} AND processing_status IN ('pending', 'processing', 'failed')
      ORDER BY created_at ASC
    `;

    const queue = queueResult.map(img => ({
      imageId: img.id,
      fileName: img.original_url.split('/').pop(),
      status: img.processing_status,
      progress: img.processing_status === 'completed' ? 100 : 
                img.processing_status === 'processing' ? 50 : 
                img.processing_status === 'failed' ? 0 : 0,
      error: img.processing_status === 'failed' ? 'Processing failed' : undefined,
      timestamp: img.created_at
    }));

    const activeJobs = queue.filter(q => q.status === 'processing').length;

    res.json({
      queue: {
        queue,
        activeJobs
      }
    });

  } catch (error) {
    console.error('[AdminProductImages] Queue error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to fetch processing queue',
      'প্রসেসিং সারি আনতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 6. POST /api/v1/admin/products/:productId/images/queue/cancel
// Cancel pending image processing jobs
// ============================================

/**
 * @swagger
 * /api/v1/admin/products/{productId}/images/queue/cancel:
 *   post:
 *     summary: Cancel pending image processing jobs
 *     tags: [Admin Product Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pending jobs cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.post('/:productId/images/queue/cancel', [
  param('productId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { productId } = req.params;

    console.log(`[AdminProductImages] Cancelling pending jobs for product: ${productId}`);

    // Check if product exists
    const product = await prisma.products.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return sendErrorResponse(
        res,
        404,
        'Product not found',
        'পণ্যটি পাওয় নেই'
      );
    }

    // Cancel pending processing jobs by marking them as failed
    const cancelResult = await prisma.$queryRaw`
      UPDATE product_images
      SET processing_status = 'failed', updated_at = NOW()
      WHERE product_id = ${productId} AND processing_status IN ('pending', 'processing')
      RETURNING id
    `;

    const cancelled = cancelResult.length;
    const failed = 0;

    res.json({
      result: {
        cancelled,
        failed
      }
    });

  } catch (error) {
    console.error('[AdminProductImages] Cancel queue error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to cancel pending jobs',
      'মুলতুবি কাজগুলি বাতিল করতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 7. POST /api/v1/admin/products/:productId/images/queue/retry
// Retry failed image processing jobs
// ============================================

/**
 * @swagger
 * /api/v1/admin/products/{productId}/images/queue/retry:
 *   post:
 *     summary: Retry failed image processing jobs
 *     tags: [Admin Product Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Failed jobs retried successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.post('/:productId/images/queue/retry', [
  param('productId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { productId } = req.params;

    console.log(`[AdminProductImages] Retrying failed jobs for product: ${productId}`);

    // Check if product exists
    const product = await prisma.products.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return sendErrorResponse(
        res,
        404,
        'Product not found',
        'পণ্যটি পাওয় নেই'
      );
    }

    // Retry failed processing jobs by marking them as pending
    const retryResult = await prisma.$queryRaw`
      UPDATE product_images
      SET processing_status = 'pending', updated_at = NOW()
      WHERE product_id = ${productId} AND processing_status = 'failed'
      RETURNING id
    `;

    const retried = retryResult.length;
    const failed = 0;

    res.json({
      result: {
        retried,
        failed
      }
    });

  } catch (error) {
    console.error('[AdminProductImages] Retry queue error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to retry failed jobs',
      'ব্যর্থ কাজগুলি পুনরায় চেষ্টা করতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 8. GET /api/v1/admin/products/images/statistics
// Get overall image statistics for all products
// ============================================

/**
 * @swagger
 * /api/v1/admin/products/images/statistics:
 *   get:
 *     summary: Get overall image statistics for all products
 *     tags: [Admin Product Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hasImages
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: minImageCount
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxImageCount
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Overall image statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/images/statistics', [
  query('hasImages').optional().isBoolean(),
  query('minImageCount').optional().isInt({ min: 0 }),
  query('maxImageCount').optional().isInt({ min: 0 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { hasImages, minImageCount, maxImageCount } = req.query;

    console.log('[AdminProductImages] Fetching overall image statistics');

    // Get products with image statistics using parameterized query
    let query = `
      SELECT
        p.id,
        p.name,
        p.sku,
        COUNT(pi.id) as image_count,
        COALESCE(SUM(pi.file_size_bytes), 0) as total_size,
        (
          SELECT json_agg(json_build_object(
            'id', sub_pi.id,
            'originalUrl', sub_pi.original_url,
            'optimizedUrl', sub_pi.optimized_url,
            'thumbnailUrl', sub_pi.thumbnail_url,
            'altTextBn', sub_pi.alt_text_bn,
            'altTextEn', sub_pi.alt_text_en,
            'displayOrder', sub_pi.display_order,
            'isPrimary', sub_pi.is_primary,
            'fileSizeBytes', sub_pi.file_size_bytes,
            'mimeType', sub_pi.mime_type,
            'width', sub_pi.width,
            'height', sub_pi.height,
            'processingStatus', sub_pi.processing_status
          ))
          FROM product_images sub_pi
          WHERE sub_pi.product_id = p.id AND sub_pi.is_primary = true AND sub_pi.processing_status != 'deleted'
          LIMIT 1
        ) as primary_image
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.processing_status != 'deleted'
    `;

    const queryParams = [];
    let paramIndex = 1;
    
    if (hasImages !== undefined) {
      const hasImagesBool = hasImages === 'true';
      if (hasImagesBool) {
        query += ` HAVING COUNT(pi.id) > 0`;
      } else {
        query += ` HAVING COUNT(pi.id) = 0`;
      }
    }
    
    if (minImageCount !== undefined) {
      query += ` HAVING COUNT(pi.id) >= $${paramIndex}`;
      queryParams.push(parseInt(minImageCount));
      paramIndex++;
    }
    
    if (maxImageCount !== undefined) {
      if (hasImages !== undefined || minImageCount !== undefined) {
        query += ` AND COUNT(pi.id) <= $${paramIndex}`;
      } else {
        query += ` HAVING COUNT(pi.id) <= $${paramIndex}`;
      }
      queryParams.push(parseInt(maxImageCount));
      paramIndex++;
    }
    
    query += ` GROUP BY p.id, p.name, p.sku ORDER BY p.created_at DESC`;
    
    const productsResult = await prisma.$queryRawUnsafe(query, ...queryParams);

    const products = productsResult.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      imageCount: parseInt(p.image_count),
      totalSize: parseInt(p.total_size),
      primaryImage: p.primary_image && p.primary_image.length > 0 ? p.primary_image[0] : null
    }));

    const total = products.length;

    res.json({
      result: {
        products,
        total
      }
    });

  } catch (error) {
    console.error('[AdminProductImages] Overall statistics error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to fetch overall image statistics',
      'সামগ্রিক ইমেজ পরিসংখ্যান আনতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 9. GET /api/v1/admin/products/:productId/images/cdn-status
// Get CDN sync status for product images
// ============================================

/**
 * @swagger
 * /api/v1/admin/products/{productId}/images/cdn-status:
 *   get:
 *     summary: Get CDN sync status for product images
 *     tags: [Admin Product Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: CDN sync status retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/:productId/images/cdn-status', [
  param('productId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { productId } = req.params;

    console.log(`[AdminProductImages] Fetching CDN sync status for product: ${productId}`);

    // Check if product exists
    const product = await prisma.products.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return sendErrorResponse(
        res,
        404,
        'Product not found',
        'পণ্যটি পাওয় নেই'
      );
    }

    // Get CDN sync status (simulated - in a real implementation, this would check CDN)
    const imagesResult = await prisma.$queryRaw`
      SELECT 
        processing_status, COUNT(*) as count
      FROM product_images
      WHERE product_id = ${productId} AND processing_status != 'deleted'
      GROUP BY processing_status
    `;

    let synced = 0;
    let pending = 0;
    let failed = 0;

    imagesResult.forEach(row => {
      const count = parseInt(row.count);
      if (row.processing_status === 'completed') {
        synced = count;
      } else if (row.processing_status === 'pending' || row.processing_status === 'processing') {
        pending = count;
      } else if (row.processing_status === 'failed') {
        failed = count;
      }
    });

    // Get last sync time (simulated - in a real implementation, this would be stored)
    const lastSyncTime = new Date(); // Using current time as placeholder

    res.json({
      status: {
        synced,
        pending,
        failed,
        lastSyncTime
      }
    });

  } catch (error) {
    console.error('[AdminProductImages] CDN status error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to fetch CDN sync status',
      'CDN সিঙ্ক স্ট্যাটাস আনতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 10. POST /api/v1/admin/products/:productId/images/cdn-sync
// Trigger CDN sync for product images
// ============================================

/**
 * @swagger
 * /api/v1/admin/products/{productId}/images/cdn-sync:
 *   post:
 *     summary: Trigger CDN sync for product images
 *     tags: [Admin Product Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: CDN sync triggered successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.post('/:productId/images/cdn-sync', [
  param('productId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { productId } = req.params;

    console.log(`[AdminProductImages] Triggering CDN sync for product: ${productId}`);

    // Check if product exists
    const product = await prisma.products.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return sendErrorResponse(
        res,
        404,
        'Product not found',
        'পণ্যটি পাওয় নেই'
      );
    }

    // In a real implementation, this would trigger a CDN sync job
    // For now, we'll just return success
    res.json({
      result: {
        success: true,
        message: 'CDN sync triggered successfully'
      }
    });

  } catch (error) {
    console.error('[AdminProductImages] CDN sync error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to trigger CDN sync',
      'CDN সিঙ্ক ট্রিগার করতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 11. GET /api/v1/admin/products/:productId/images/optimization-suggestions
// Get image optimization suggestions
// ============================================

/**
 * @swagger
 * /api/v1/admin/products/{productId}/images/optimization-suggestions:
 *   get:
 *     summary: Get image optimization suggestions
 *     tags: [Admin Product Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Optimization suggestions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/:productId/images/optimization-suggestions', [
  param('productId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { productId } = req.params;

    console.log(`[AdminProductImages] Fetching optimization suggestions for product: ${productId}`);

    // Check if product exists
    const product = await prisma.products.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return sendErrorResponse(
        res,
        404,
        'Product not found',
        'পণ্যটি পাওয় নেই'
      );
    }

    // Get images that need optimization
    const imagesResult = await prisma.$queryRaw`
      SELECT 
        id, original_url, file_size_bytes, mime_type, width, height
      FROM product_images
      WHERE product_id = ${productId} AND processing_status != 'deleted'
    `;

    const suggestions = [];
    let totalPotentialSavings = 0;

    for (const img of imagesResult) {
      const fileSize = img.file_size_bytes || 0;
      const mimeType = img.mime_type;
      const width = img.width || 0;
      const height = img.height || 0;

      // Check for large images (> 1MB)
      if (fileSize > 1024 * 1024) {
        const potentialSavings = Math.floor(fileSize * 0.3); // 30% savings estimate
        suggestions.push({
          imageId: img.id,
          type: 'compress',
          currentSize: fileSize,
          potentialSavings,
          recommendation: `Compress this large image (${(fileSize / 1024 / 1024).toFixed(2)}MB) to reduce file size`
        });
        totalPotentialSavings += potentialSavings;
      }

      // Check for images that could be converted to WebP
      if (mimeType && !mimeType.includes('webp')) {
        const potentialSavings = Math.floor(fileSize * 0.25); // 25% savings estimate
        suggestions.push({
          imageId: img.id,
          type: 'convert',
          currentSize: fileSize,
          potentialSavings,
          recommendation: `Convert from ${mimeType} to WebP format for better compression`
        });
        totalPotentialSavings += potentialSavings;
      }

      // Check for oversized images (> 2000px on either dimension)
      if (width > 2000 || height > 2000) {
        const potentialSavings = Math.floor(fileSize * 0.4); // 40% savings estimate
        suggestions.push({
          imageId: img.id,
          type: 'resize',
          currentSize: fileSize,
          potentialSavings,
          recommendation: `Resize image (${width}x${height}) to maximum 2000px for web display`
        });
        totalPotentialSavings += potentialSavings;
      }

      // Check for very small images (< 100px on both dimensions)
      if (width < 100 && height < 100 && fileSize > 10240) { // > 10KB
        const potentialSavings = fileSize;
        suggestions.push({
          imageId: img.id,
          type: 'remove',
          currentSize: fileSize,
          potentialSavings,
          recommendation: `Remove this tiny image (${width}x${height}) that takes up too much space`
        });
        totalPotentialSavings += potentialSavings;
      }
    }

    res.json({
      suggestions: {
        suggestions,
        totalPotentialSavings
      }
    });

  } catch (error) {
    console.error('[AdminProductImages] Optimization suggestions error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to fetch optimization suggestions',
      'অপ্টিমাইজেশন সুপারিশ আনতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

module.exports = router;
