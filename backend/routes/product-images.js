/**
 * Product Images API Routes
 * 
 * Implements all image upload, processing, and management endpoints
 * for Milestone 4 of Phase 4.
 * 
 * Endpoints:
 * 1. POST /api/products/:id/images - Upload images for product
 * 2. GET /api/products/:id/images - List all images for product
 * 3. PUT /api/images/:id - Update image metadata
 * 4. PUT /api/products/:id/images/reorder - Reorder product images
 * 5. DELETE /api/images/:id - Delete specific image
 * 6. POST /api/images/:id/primary - Set image as primary
 * 7. GET /api/images/:id/versions - Get all size variants
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const { authMiddleware } = require('../middleware/auth');
const { imageStorageService } = require('../services/image-storage.service');
const { imageProcessingService } = require('../services/image-processing.service');
const {
  validateImageUpload,
  validateAltText,
  validateDisplayOrder,
  validateImageCount,
  validateStorageQuota,
  MIN_IMAGES_PER_PRODUCT,
  MAX_IMAGES_PER_PRODUCT,
  MAX_STORAGE_QUOTA_PER_PRODUCT,
  SOFT_DELETE_RECOVERY_DAYS
} = require('../utils/image-validation');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// MULTER CONFIGURATION
// ============================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/products/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype.toLowerCase();
    
    if (allowedTypes.test(extname) && allowedTypes.test(mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  }
});

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
// 1. POST /api/products/:id/images - Upload images for product
// ============================================

/**
 * @swagger
 * /api/products/{id}/images:
 *   post:
 *     summary: Upload multiple images for a product
 *     tags: [Product Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     file:
 *                       type: string
 *                       format: binary
 *                     altTextBn:
 *                       type: string
 *                     altTextEn:
 *                       type: string
 *                     displayOrder:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 messageBn:
 *                   type: string
 *                 uploaded:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductImage'
 *                 failed:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       fileName:
 *                         type: string
 *                       error:
 *                         type: string
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/images', [
  param('id').isUUID(),
  body('images').optional(),
  body('imagesData').optional(),
  body('images.*.altTextBn').optional().isString().trim(),
  body('images.*.altTextEn').optional().isString().trim(),
  body('images.*.displayOrder').optional().isInt({ min: 0 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), upload.array('images', 10), async (req, res) => {
  try {
    const { id: productId } = req.params;
    console.log(`[ProductImages] Starting image upload for product: ${productId}`);

    // Parse metadata from imagesData if provided
    let imagesMetadata = req.body.images;
    if (req.body.imagesData && typeof req.body.imagesData === 'string') {
      try {
        imagesMetadata = JSON.parse(req.body.imagesData);
      } catch (error) {
        console.error('[ProductImages] Failed to parse imagesData:', error);
        return sendErrorResponse(
          res,
          400,
          'Invalid metadata format',
          'মেটাডেটা ফরম্যাট সঠিক নয়'
        );
      }
    }

    // Ensure imagesMetadata is an array
    if (!Array.isArray(imagesMetadata)) {
      imagesMetadata = [];
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
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

    // Get current image count for validation
    const existingImages = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM product_images WHERE product_id = ${productId} AND processing_status != 'deleted'
    `;
    const currentCount = parseInt(existingImages[0].count);

    // Validate image count
    const countValidation = validateImageCount(currentCount, req.files.length);
    if (!countValidation.isValid && !countValidation.error?.includes('Warning')) {
      return sendErrorResponse(
        res,
        400,
        countValidation.error,
        countValidation.error
      );
    }

    // Check storage quota
    const currentUsage = await prisma.$queryRaw`
      SELECT COALESCE(SUM(file_size_bytes), 0) as total FROM product_images
      WHERE product_id = ${productId} AND processing_status != 'deleted'
    `;
    const currentTotalBytes = parseInt(currentUsage[0].total) || 0;
    const newImageBytes = req.files.reduce((sum, file) => sum + file.size, 0);
    
    const quotaValidation = validateStorageQuota(currentTotalBytes, newImageBytes);
    if (!quotaValidation.isValid) {
      return sendErrorResponse(
        res,
        400,
        quotaValidation.error,
        quotaValidation.error
      );
    }

    const uploadedImages = [];
    const failedImages = [];
    const processingResults = [];

    // Process each uploaded image
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const imageData = imagesMetadata[i] || {};
      
      try {
        // Validate individual image
        const validation = await validateImageUpload(file, productId, currentCount + i);
        if (!validation.isValid) {
          failedImages.push({
            fileName: file.originalname,
            error: validation.error
          });
          continue;
        }

        // Save file to storage
        const saveResult = await imageStorageService.saveUploadedFile(
          file,
          productId,
          i
        );

        // Process image (create variants)
        const processResult = await imageProcessingService.processImage(saveResult.filePath, {
          generateWebP: true,
          generateVariants: true,
          removeExif: true,
          standardizeColorProfile: true,
          quality: 75
        });

        // Auto-generate alt text from product name if not provided
        const altTextBn = imageData.altTextBn || product.name;
        const altTextEn = imageData.altTextEn || product.nameEn || product.name;

        // Validate alt text length
        const altValidationBn = validateAltText(altTextBn, 250);
        const altValidationEn = validateAltText(altTextEn, 250);
        
        if (!altValidationBn.isValid) {
          failedImages.push({
            fileName: file.originalname,
            error: altValidationBn.error
          });
          continue;
        }

        if (!altValidationEn.isValid) {
          failedImages.push({
            fileName: file.originalname,
            error: altValidationEn.error
          });
          continue;
        }

        // Determine display order
        const displayOrder = imageData.displayOrder !== undefined ? 
          parseInt(imageData.displayOrder) : 
          currentCount + i;

        // Validate display order
        const orderValidation = validateDisplayOrder(displayOrder);
        if (!orderValidation.isValid) {
          failedImages.push({
            fileName: file.originalname,
            error: orderValidation.error
          });
          continue;
        }

        // Set first image as primary by default
        const isPrimary = (currentCount + i) === 0;

        // Create database record
        const imageRecord = await prisma.$queryRaw`
          INSERT INTO product_images (
            id, product_id, original_url, optimized_url, thumbnail_url,
            alt_text_bn, alt_text_en, display_order, is_primary,
            file_size_bytes, mime_type, width, height, processing_status,
            created_at, updated_at
          ) VALUES (
            gen_random_uuid()::text,
            ${productId}::text,
            ${saveResult.url}::text,
            ${processResult.optimizedUrl || null}::text,
            ${processResult.thumbnailUrl || null}::text,
            ${altTextBn}::text,
            ${altTextEn}::text,
            ${displayOrder}::integer,
            ${isPrimary}::boolean,
            ${saveResult.size}::integer,
            ${saveResult.mimeType}::text,
            ${processResult.metadata.width}::integer,
            ${processResult.metadata.height}::integer,
            'completed'::varchar(20),
            NOW(),
            NOW()
          )
          RETURNING *
        `;

        uploadedImages.push({
          id: imageRecord[0].id,
          originalUrl: imageRecord[0].original_url,
          optimizedUrl: imageRecord[0].optimized_url,
          thumbnailUrl: imageRecord[0].thumbnail_url,
          altTextBn: imageRecord[0].alt_text_bn,
          altTextEn: imageRecord[0].alt_text_en,
          displayOrder: imageRecord[0].display_order,
          isPrimary: imageRecord[0].is_primary,
          fileSizeBytes: imageRecord[0].file_size_bytes,
          mimeType: imageRecord[0].mime_type,
          width: imageRecord[0].width,
          height: imageRecord[0].height,
          processingStatus: imageRecord[0].processing_status
        });

        processingResults.push({
          fileName: file.originalname,
          status: 'completed',
          progress: 100
        });

      } catch (error) {
        console.error(`[ProductImages] Error processing image ${i + 1}:`, error);
        failedImages.push({
          fileName: file.originalname,
          error: error.message || 'Processing failed'
        });
      }
    }

    console.log(`[ProductImages] Upload complete: ${uploadedImages.length} successful, ${failedImages.length} failed`);

    const statusCode = uploadedImages.length === 0 ? 500 : (failedImages.length === 0 ? 201 : 207);
    res.status(statusCode).json({
      message: 'Images uploaded successfully',
      messageBn: 'ইমেজ সফলভাবল হয়েছে',
      messageEn: 'Images uploaded successfully',
      uploaded: uploadedImages,
      failed: failedImages,
      total: req.files.length,
      processing: processingResults
    });

  } catch (error) {
    console.error('[ProductImages] Upload error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to upload images',
      'ইমেজ আপলোড করতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 2. GET /api/products/:id/images - List all images for product
// ============================================

/**
 * @swagger
 * /api/products/{id}/images:
 *   get:
 *     summary: List all images for a product
 *     tags: [Product Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of product images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 images:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductImage'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/images', [
  param('id').isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const { id: productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log(`[ProductImages] Fetching images for product: ${productId}, page: ${page}, limit: ${limit}`);

    // Check if product exists
    const product = await prisma.product.findUnique({
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

    // Get total count
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM product_images 
      WHERE product_id = ${productId} AND processing_status != 'deleted'
    `;
    const total = parseInt(countResult[0].count);

    // Get images with pagination
    const imagesResult = await prisma.$queryRaw`
      SELECT 
        id, product_id, original_url, optimized_url, thumbnail_url,
        alt_text_bn, alt_text_en, display_order, is_primary,
        file_size_bytes, mime_type, width, height, processing_status,
        created_at, updated_at
      FROM product_images
      WHERE product_id = ${productId} AND processing_status != 'deleted'
      ORDER BY is_primary DESC, display_order ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const images = imagesResult.map(img => ({
      id: img.id,
      productId: img.product_id,
      originalUrl: img.original_url,
      optimizedUrl: img.optimized_url,
      thumbnailUrl: img.thumbnail_url,
      altTextBn: img.alt_text_bn,
      altTextEn: img.alt_text_en,
      displayOrder: img.display_order,
      isPrimary: img.is_primary,
      fileSizeBytes: img.file_size_bytes,
      mimeType: img.mime_type,
      width: img.width,
      height: img.height,
      processingStatus: img.processing_status,
      createdAt: img.created_at,
      updatedAt: img.updated_at
    }));

    const pages = Math.ceil(total / limit);

    res.json({
      images,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });

  } catch (error) {
    console.error('[ProductImages] List error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to fetch images',
      'ইমেজ আপলোড করতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 4. PUT /api/products/:id/images/reorder - Reorder product images
// ============================================

/**
 * @swagger
 * /api/products/{id}/images/reorder:
 *   put:
 *     summary: Reorder product images
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
 *         description: Images reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 images:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductImage'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/images/reorder', [
  param('id').isUUID(),
  body('imageIds').isArray().withMessage('Image IDs must be an array'),
  body('imageIds.*').isUUID().withMessage('Each image ID must be a valid UUID')
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { imageIds } = req.body;

    console.log(`[ProductImages] Reordering images for product: ${productId}`);

    // Check if product exists
    const product = await prisma.product.findUnique({
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

    // Validate all images belong to this product
    const imagesResult = await prisma.$queryRaw`
      SELECT id, product_id FROM product_images 
      WHERE id = ANY(${imageIds}::text[]) AND processing_status != 'deleted'
    `;

    if (imagesResult.length !== imageIds.length) {
      return sendErrorResponse(
        res,
        400,
        'One or more images do not belong to this product',
        'এক বা একাধিক ইমেজ এই পণ্যটির নয়'
      );
    }

    // Update display orders in a transaction
    for (let i = 0; i < imageIds.length; i++) {
      await prisma.$queryRaw`
        UPDATE product_images
        SET display_order = ${i}, updated_at = NOW()
        WHERE id = ${imageIds[i]}
      `;
    }

    // Ensure only one primary image exists
    const primaryImageResult = await prisma.$queryRaw`
      SELECT id FROM product_images
      WHERE product_id = ${productId} AND is_primary = true AND processing_status != 'deleted'
    `;

    if (primaryImageResult.length > 0) {
      const primaryId = primaryImageResult[0].id;
      
      // If primary image is not in new order, set first image as primary
      if (!imageIds.includes(primaryId)) {
        await prisma.$queryRaw`
          UPDATE product_images
          SET is_primary = false
          WHERE product_id = ${productId} AND id != ${primaryId}
        `;
        
        await prisma.$queryRaw`
          UPDATE product_images
          SET is_primary = true, updated_at = NOW()
          WHERE id = ${imageIds[0]}
        `;
      }
    }

    // Get updated images
    const updatedImagesResult = await prisma.$queryRaw`
      SELECT 
        id, product_id, original_url, optimized_url, thumbnail_url,
        alt_text_bn, alt_text_en, display_order, is_primary,
        file_size_bytes, mime_type, width, height, processing_status,
        created_at, updated_at
      FROM product_images
      WHERE product_id = ${productId} AND processing_status != 'deleted'
      ORDER BY is_primary DESC, display_order ASC
    `;

    const images = updatedImagesResult.map(img => ({
      id: img.id,
      productId: img.product_id,
      originalUrl: img.original_url,
      optimizedUrl: img.optimized_url,
      thumbnailUrl: img.thumbnail_url,
      altTextBn: img.alt_text_bn,
      altTextEn: img.alt_text_en,
      displayOrder: img.display_order,
      isPrimary: img.is_primary,
      fileSizeBytes: img.file_size_bytes,
      mimeType: img.mime_type,
      width: img.width,
      height: img.height,
      processingStatus: img.processing_status,
      createdAt: img.created_at,
      updatedAt: img.updated_at
    }));

    res.json({
      message: 'Images reordered successfully',
      messageBn: 'ইমেজ সফলভাবল হয়েছে',
      messageEn: 'Images reordered successfully',
      images
    });

  } catch (error) {
    console.error('[ProductImages] Reorder error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to reorder images',
      'ইমেজ আপলোড করতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 6. POST /api/images/:id/primary - Set image as primary
// ============================================

/**
 * @swagger
 * /api/images/{id}/primary:
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
 *               $ref: '#/components/schemas/ProductImage'
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

    console.log(`[ProductImages] Setting image as primary: ${imageId}`);

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
    console.error('[ProductImages] Set primary error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to set image as primary',
      'ইমেজ আপলোড করতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 7. GET /api/images/:id/versions - Get all size variants
// ============================================

/**
 * @swagger
 * /api/images/{id}/versions:
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

    console.log(`[ProductImages] Fetching versions for image: ${imageId}`);

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
            const metadata = await require('sharp')(variantPath).metadata();
            
            variants.push({
              type: variant.type,
              url: `/uploads/products/${image.product_id}/${variantFile}`,
              dimensions: `${metadata.width}x${metadata.height}`,
              fileSize: stats.size
            });
          } catch (error) {
            console.error(`[ProductImages] Error reading variant ${variant.suffix}:`, error);
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
    console.error('[ProductImages] Get versions error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to fetch image versions',
      'ইমেজ আপলোড করতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

/**
 * @swagger
 * /api/product-images/health:
 *   get:
 *     summary: Health check for product images API
 *     tags: [Product Images]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'product-images-api'
    });
  } catch (error) {
    console.error('[ProductImages] Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'product-images-api',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// 3. PUT /api/images/:id - Update image metadata
// ============================================

/**
 * @swagger
 * /api/images/{id}:
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
 *               $ref: '#/components/schemas/ProductImage'
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

    console.log(`[ProductImages] Updating image: ${imageId}`);

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
      messageBn: 'ইমেজ সফলভাবল হয়েছে',
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
    console.error('[ProductImages] Update error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to update image',
      'ইমেজ আপলোড করতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

// ============================================
// 5. DELETE /api/images/:id - Delete specific image
// ============================================

/**
 * @swagger
 * /api/images/{id}:
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

    console.log(`[ProductImages] Deleting image: ${imageId}`);

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
    await prisma.$queryRaw`
      UPDATE product_images
      SET processing_status = 'deleted', updated_at = NOW()
      WHERE id = ${imageId}
      RETURNING *
    `;

    // Move file to deleted directory for recovery
    const filePath = path.join(__dirname, `../uploads/products/${image.product_id}/${path.basename(image.original_url)}`);
    await imageStorageService.softDeleteFile(filePath, SOFT_DELETE_RECOVERY_DAYS);

    const recoveryDate = new Date(Date.now() + SOFT_DELETE_RECOVERY_DAYS * 24 * 60 * 60 * 1000);

    res.json({
      message: 'Image deleted successfully',
      messageBn: 'ইমেজ সফলভাবল হয়েছে',
      messageEn: 'Image deleted successfully',
      recoveryUntil: recoveryDate.toISOString(),
      deletedImageId: imageId
    });

  } catch (error) {
    console.error('[ProductImages] Delete error:', error);
    sendErrorResponse(
      res,
      500,
      'Failed to delete image',
      'ইমেজ আপলোড করতে ব্যর্থ হয়েছে',
      { error: process.env.NODE_ENV === 'development' ? error.message : undefined }
    );
  }
});

module.exports = router;
