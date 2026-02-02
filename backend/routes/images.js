/**
 * Image Management API Routes
 * 
 * Implements image-specific endpoints that operate on individual images.
 * These routes are mounted at /api/v1/images
 * 
 * Endpoints:
 * 1. PUT /api/v1/images/:id - Update image metadata
 * 2. DELETE /api/v1/images/:id - Delete specific image
 * 3. POST /api/v1/images/:id/primary - Set image as primary
 * 4. GET /api/v1/images/:id/versions - Get all size variants
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const { authMiddleware } = require('../middleware/auth');
const { imageStorageService } = require('../services/image-storage.service');
const {
  validateAltText,
  validateDisplayOrder,
  SOFT_DELETE_RECOVERY_DAYS
} = require('../utils/image-validation');

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
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

// Error response helper
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
// 1. PUT /api/v1/images/:id - Update image metadata
// ============================================

/**
 * @swagger
 * /api/v1/images/{id}:
 *   put:
 *     summary: Update image metadata
 *     tags: [Product Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               altTextBn:
 *                 type: string
 *                 maxLength: 250
 *               altTextEn:
 *                 type: string
 *                 maxLength: 250
 *               displayOrder:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 image:
 *                   $ref: '#/components/schemas/ProductImage'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Image not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', [
  param('id').isUUID(),
  body('altTextBn').optional().isString().trim().isLength({ max: 250 }),
  body('altTextEn').optional().isString().trim().isLength({ max: 250 }),
  body('displayOrder').optional().isInt({ min: 0 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id: imageId } = req.params;
    const { altTextBn, altTextEn, displayOrder } = req.body;

    console.log(`[Images] Updating image: ${imageId}`);

    // Check if image exists
    const imageResult = await prisma.$queryRaw`
      SELECT * FROM product_images WHERE id = ${imageId} AND processing_status != 'deleted'
    `;

    if (!imageResult || imageResult.length === 0) {
      return sendErrorResponse(
        res,
        404,
        'Image not found',
        'ইমেজ পাওয় নেই'
      );
    }

    const existingImage = imageResult[0];

    // Update image metadata
    await prisma.$queryRaw`
      UPDATE product_images
      SET
        alt_text_bn = COALESCE(${altTextBn || null}, alt_text_bn),
        alt_text_en = COALESCE(${altTextEn || null}, alt_text_en),
        display_order = COALESCE(${displayOrder !== undefined ? displayOrder : null}, display_order),
        updated_at = NOW()
      WHERE id = ${imageId}
      RETURNING *
    `;

    const updatedImage = await prisma.$queryRaw`
      SELECT * FROM product_images WHERE id = ${imageId}
    `;

    res.json({
      message: 'Image updated successfully',
      messageBn: 'ইমেজ সফলভাবে হয়েছে',
      messageEn: 'Image updated successfully',
      image: {
        id: updatedImage[0].id,
        productId: updatedImage[0].product_id,
        originalUrl: updatedImage[0].original_url,
        optimizedUrl: updatedImage[0].optimized_url,
        thumbnailUrl: updatedImage[0].thumbnail_url,
        altTextBn: updatedImage[0].alt_text_bn,
        altTextEn: updatedImage[0].alt_text_en,
        displayOrder: updatedImage[0].display_order,
        isPrimary: updatedImage[0].is_primary,
        fileSizeBytes: updatedImage[0].file_size_bytes,
        mimeType: updatedImage[0].mime_type,
        width: updatedImage[0].width,
        height: updatedImage[0].height,
        processingStatus: updatedImage[0].processing_status,
        createdAt: updatedImage[0].created_at,
        updatedAt: updatedImage[0].updated_at
      }
    });

  } catch (error) {
    console.error('[Images] Update error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to update image',
      'ইমেজ আপডেট করতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 2. DELETE /api/v1/images/:id - Delete specific image
// ============================================

/**
 * @swagger
 * /api/v1/images/{id}:
 *   delete:
 *     summary: Delete specific image (soft delete)
 *     tags: [Product Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 recoveryUntil:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Image not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id: imageId } = req.params;

    console.log(`[Images] Deleting image: ${imageId}`);

    // Check if image exists
    const imageResult = await prisma.$queryRaw`
      SELECT * FROM product_images WHERE id = ${imageId} AND processing_status != 'deleted'
    `;

    if (!imageResult || imageResult.length === 0) {
      return sendErrorResponse(
        res,
        404,
        'Image not found',
        'ইমেজ পাওয় নেই'
      );
    }

    const image = imageResult[0];

    // Soft delete: mark as deleted and move to deleted directory
    console.log(`[Images] Starting soft delete for image: ${imageId}`);
    console.log(`[Images] Image details before deletion:`, {
      id: image.id,
      productId: image.product_id,
      processingStatus: image.processing_status,
      originalUrl: image.original_url
    });

    let updatedImage;
    try {
      console.log(`[Images] Executing Prisma update for image: ${imageId}`);
      updatedImage = await prisma.productImage.update({
        where: { id: imageId },
        data: { 
          processingStatus: 'deleted',
          updatedAt: new Date()
        }
      });
      console.log(`[Images] Successfully updated image ${imageId} to deleted status`);
      console.log(`[Images] Affected rows: 1`);
      console.log(`[Images] Updated image details:`, {
        id: updatedImage.id,
        productId: updatedImage.productId,
        processingStatus: updatedImage.processingStatus,
        updatedAt: updatedImage.updatedAt
      });
    } catch (updateError) {
      console.error(`[Images] Failed to update image ${imageId}:`, updateError);
      console.error(`[Images] Error details:`, {
        message: updateError.message,
        code: updateError.code,
        meta: updateError.meta
      });
      return sendErrorResponse(
        res,
        500,
        'Failed to delete image from database',
        'ডাটাবেস থেকে ইমেজ মুছে ফেলতে ব্যর্থ হয়েছে',
        { error: process.env.NODE_ENV === 'development' ? updateError.message : undefined }
      );
    }

    // Verify the update was successful
    if (!updatedImage || updatedImage.processingStatus !== 'deleted') {
      console.error(`[Images] Update verification failed for image ${imageId}`);
      console.error(`[Images] Expected processing_status: 'deleted', got:`, updatedImage?.processingStatus);
      return sendErrorResponse(
        res,
        500,
        'Image deletion verification failed',
        'ইমেজ ডিলিশন ভেরিফিকেশন ব্যর্থ হয়েছে',
        { 
          imageId,
          expectedStatus: 'deleted',
          actualStatus: updatedImage?.processingStatus
        }
      );
    }

    // Move file to deleted directory for recovery
    const filePath = path.join(__dirname, `../uploads/products/${image.product_id}/${path.basename(image.original_url)}`);
    console.log(`[Images] Moving file to deleted directory: ${filePath}`);
    await imageStorageService.softDeleteFile(filePath, SOFT_DELETE_RECOVERY_DAYS);

    const recoveryDate = new Date(Date.now() + SOFT_DELETE_RECOVERY_DAYS * 24 * 60 * 60 * 1000);
    
    // Validate the recovery date before converting to ISO string
    if (isNaN(recoveryDate.getTime())) {
      throw new Error('Invalid recovery date calculated');
    }

    console.log(`[Images] Image deletion completed successfully for: ${imageId}`);
    console.log(`[Images] Response includes updated image data for verification`);

    res.json({
      message: 'Image deleted successfully',
      messageBn: 'ইমেজ সফলভাবে মুছে ফেলা হয়েছে',
      messageEn: 'Image deleted successfully',
      recoveryUntil: recoveryDate.toISOString(),
      deletedImageId: imageId,
      image: {
        id: updatedImage.id,
        productId: updatedImage.productId,
        originalUrl: updatedImage.originalUrl,
        optimizedUrl: updatedImage.optimizedUrl,
        thumbnailUrl: updatedImage.thumbnailUrl,
        altTextBn: updatedImage.altTextBn,
        altTextEn: updatedImage.altTextEn,
        displayOrder: updatedImage.displayOrder,
        isPrimary: updatedImage.isPrimary,
        fileSizeBytes: updatedImage.fileSizeBytes,
        mimeType: updatedImage.mimeType,
        width: updatedImage.width,
        height: updatedImage.height,
        processingStatus: updatedImage.processingStatus,
        createdAt: updatedImage.createdAt,
        updatedAt: updatedImage.updatedAt
      }
    });

  } catch (error) {
    console.error('[Images] Delete error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to delete image',
      'ইমেজ মুছে ফেলতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 3. POST /api/v1/images/:id/primary - Set image as primary
// ============================================

/**
 * @swagger
 * /api/v1/images/{id}/primary:
 *   post:
 *     summary: Set image as primary
 *     tags: [Product Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Image set as primary successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 image:
 *                   $ref: '#/components/schemas/ProductImage'
 *       404:
 *         description: Image not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/primary', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id: imageId } = req.params;

    console.log(`[Images] Setting image as primary: ${imageId}`);

    // Check if image exists
    const imageResult = await prisma.$queryRaw`
      SELECT * FROM product_images WHERE id = ${imageId} AND processing_status != 'deleted'
    `;

    if (!imageResult || imageResult.length === 0) {
      return sendErrorResponse(
        res,
        404,
        'Image not found',
        'ইমেজ পাওয় নেই'
      );
    }

    const image = imageResult[0];
    const productId = image.product_id;

    // Set all other images for this product as non-primary
    await prisma.$queryRaw`
      UPDATE product_images
      SET is_primary = false, updated_at = NOW()
      WHERE product_id = ${productId} AND id != ${imageId} AND processing_status != 'deleted'
    `;

    // Set specified image as primary
    await prisma.$queryRaw`
      UPDATE product_images
      SET is_primary = true, updated_at = NOW()
      WHERE id = ${imageId}
      RETURNING *
    `;

    const updatedImageResult = await prisma.$queryRaw`
      SELECT * FROM product_images WHERE id = ${imageId}
    `;

    const updatedImage = {
      id: updatedImageResult[0].id,
      productId: updatedImageResult[0].product_id,
      originalUrl: updatedImageResult[0].original_url,
      optimizedUrl: updatedImageResult[0].optimized_url,
      thumbnailUrl: updatedImageResult[0].thumbnail_url,
      altTextBn: updatedImageResult[0].alt_text_bn,
      altTextEn: updatedImageResult[0].alt_text_en,
      displayOrder: updatedImageResult[0].display_order,
      isPrimary: updatedImageResult[0].is_primary,
      fileSizeBytes: updatedImageResult[0].file_size_bytes,
      mimeType: updatedImageResult[0].mime_type,
      width: updatedImageResult[0].width,
      height: updatedImageResult[0].height,
      processingStatus: updatedImageResult[0].processing_status,
      createdAt: updatedImageResult[0].created_at,
      updatedAt: updatedImageResult[0].updated_at
    };

    res.json({
      message: 'Image set as primary successfully',
      messageBn: 'ইমেজ প্রাইমারি হিসাবে করা হয়েছে',
      messageEn: 'Image set as primary successfully',
      image: updatedImage
    });

  } catch (error) {
    console.error('[Images] Set primary error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to set image as primary',
      'ইমেজ প্রাইমারি হিসাবে সেট করতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 4. GET /api/v1/images/:id/versions - Get all size variants
// ============================================

/**
 * @swagger
 * /api/v1/images/{id}/versions:
 *   get:
 *     summary: Get all size variants for an image
 *     tags: [Product Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Image variants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageId:
 *                   type: string
 *                 original:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     dimensions:
 *                       type: string
 *                     fileSize:
 *                       type: integer
 *                 optimized:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     dimensions:
 *                       type: string
 *                     fileSize:
 *                       type: integer
 *                 thumbnail:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     dimensions:
 *                       type: string
 *                     fileSize:
 *                       type: integer
 *                 variants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       url:
 *                         type: string
 *                       dimensions:
 *                         type: string
 *                       fileSize:
 *                         type: integer
 *       404:
 *         description: Image not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/versions', [
  param('id').isUUID()
], handleValidationErrors, async (req, res) => {
  try {
    const { id: imageId } = req.params;

    console.log(`[Images] Fetching versions for image: ${imageId}`);

    // Check if image exists
    const imageResult = await prisma.$queryRaw`
      SELECT * FROM product_images WHERE id = ${imageId} AND processing_status != 'deleted'
    `;

    if (!imageResult || imageResult.length === 0) {
      return sendErrorResponse(
        res,
        404,
        'Image not found',
        'ইমেজ পাওয় নেই'
      );
    }

    const image = imageResult[0];

    // Build variants array from available URLs
    const variants = [];

    // Original variant
    if (image.original_url) {
      variants.push({
        type: 'original',
        url: image.original_url,
        dimensions: `${image.width}x${image.height}`,
        fileSize: image.file_size_bytes
      });
    }

    // Optimized variant
    if (image.optimized_url) {
      variants.push({
        type: 'optimized',
        url: image.optimized_url,
        dimensions: `${image.width}x${image.height}`,
        fileSize: null // Would need to check file system
      });
    }

    // Thumbnail variant
    if (image.thumbnail_url) {
      variants.push({
        type: 'thumbnail',
        url: image.thumbnail_url,
        dimensions: '50x50', // Standard thumbnail size
        fileSize: null
      });
    }

    // Try to find additional size variants from file system
    const productDir = path.join(__dirname, `../uploads/products/${image.product_id}`);
    if (fs.existsSync(productDir)) {
      const files = fs.readdirSync(productDir);
      
      // Look for size variant files
      const sizeVariants = [
        { suffix: '_large', type: 'large', size: '1200x1200' },
        { suffix: '_medium', type: 'medium', size: '600x600' },
        { suffix: '_small', type: 'small', size: '150x150' }
      ];

      for (const variant of sizeVariants) {
        const variantFile = files.find(f => f.includes(variant.suffix));
        if (variantFile) {
          const variantPath = path.join(productDir, variantFile);
          try {
            const stats = fs.statSync(variantPath);
            const sharp = require('sharp');
            const metadata = await sharp(variantPath).metadata();
            
            variants.push({
              type: variant.type,
              url: `/uploads/products/${image.product_id}/${variantFile}`,
              dimensions: `${metadata.width}x${metadata.height}`,
              fileSize: stats.size
            });
          } catch (error) {
            console.error(`[Images] Error reading variant ${variant.suffix}:`, error);
          }
        }
      }
    }

    res.json({
      imageId,
      original: {
        url: image.original_url,
        dimensions: `${image.width}x${image.height}`,
        fileSize: image.file_size_bytes
      },
      optimized: image.optimized_url ? {
        url: image.optimized_url,
        dimensions: `${image.width}x${image.height}`,
        fileSize: null
      } : null,
      thumbnail: image.thumbnail_url ? {
        url: image.thumbnail_url,
        dimensions: '50x50',
        fileSize: null
      } : null,
      variants
    });

  } catch (error) {
    console.error('[Images] Get versions error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to fetch image versions',
      'ইমেজ ভার্সন আনতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

module.exports = router;
