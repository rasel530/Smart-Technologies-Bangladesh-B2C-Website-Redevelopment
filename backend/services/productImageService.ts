/**
 * Product Image Service
 * 
 * This service handles all business logic related to product images including
 * CRUD operations, validation, ordering, and default image handling.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import {
  ProductImage,
  CreateProductImageRequest,
  UpdateProductImageRequest
} from '../types/product.types';

const prisma = new PrismaClient();

/**
 * Custom error class for Product Image Service
 */
export class ProductImageServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public field?: string
  ) {
    super(message);
    this.name = 'ProductImageServiceError';
  }
}

/**
 * Product Image Service Class
 */
export class ProductImageService {
  /**
   * Get all images for a product
   * 
   * @param productId - The product ID
   * @returns Array of product images ordered by sortOrder
   */
  async getProductImages(productId: string): Promise<ProductImage[]> {
    try {
      const images = await prisma.productImage.findMany({
        where: { productId },
        orderBy: { sortOrder: 'asc' }
      });

      return images;
    } catch (error) {
      console.error('Error fetching product images:', error);
      throw new ProductImageServiceError(
        'Failed to fetch product images',
        500
      );
    }
  }

  /**
   * Get a single product image by ID
   * 
   * @param imageId - The image ID
   * @returns Product image or null if not found
   */
  async getProductImageById(imageId: string): Promise<ProductImage | null> {
    try {
      const image = await prisma.productImage.findUnique({
        where: { id: imageId }
      });

      return image;
    } catch (error) {
      console.error('Error fetching product image:', error);
      throw new ProductImageServiceError(
        'Failed to fetch product image',
        500
      );
    }
  }

  /**
   * Create a new product image
   * 
   * @param productId - The product ID
   * @param imageData - The image data
   * @returns Created product image
   */
  async createProductImage(
    productId: string,
    imageData: CreateProductImageRequest
  ): Promise<ProductImage> {
    try {
      // Validate product exists
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new ProductImageServiceError(
          'Product not found',
          404,
          'productId'
        );
      }

      // Validate image URL
      this.validateImageUrl(imageData.url);

      // Validate alt text length
      if (imageData.alt && imageData.alt.length > 255) {
        throw new ProductImageServiceError(
          'Alt text cannot exceed 255 characters',
          400,
          'alt'
        );
      }

      // Validate sortOrder
      const sortOrder = imageData.sortOrder !== undefined ? imageData.sortOrder : 0;
      if (sortOrder < 0) {
        throw new ProductImageServiceError(
          'Sort order must be a non-negative number',
          400,
          'sortOrder'
        );
      }

      // Create image
      const image = await prisma.productImage.create({
        data: {
          productId,
          url: imageData.url,
          alt: imageData.alt,
          sortOrder
        }
      });

      return image;
    } catch (error) {
      if (error instanceof ProductImageServiceError) {
        throw error;
      }
      console.error('Error creating product image:', error);
      throw new ProductImageServiceError(
        'Failed to create product image',
        500
      );
    }
  }

  /**
   * Update a product image
   * 
   * @param imageId - The image ID
   * @param imageData - The image data to update
   * @returns Updated product image
   */
  async updateProductImage(
    imageId: string,
    imageData: UpdateProductImageRequest
  ): Promise<ProductImage> {
    try {
      // Check if image exists
      const existingImage = await prisma.productImage.findUnique({
        where: { id: imageId }
      });

      if (!existingImage) {
        throw new ProductImageServiceError(
          'Product image not found',
          404
        );
      }

      // Validate image URL if provided
      if (imageData.url) {
        this.validateImageUrl(imageData.url);
      }

      // Validate alt text length if provided
      if (imageData.alt && imageData.alt.length > 255) {
        throw new ProductImageServiceError(
          'Alt text cannot exceed 255 characters',
          400,
          'alt'
        );
      }

      // Validate sortOrder if provided
      if (imageData.sortOrder !== undefined && imageData.sortOrder < 0) {
        throw new ProductImageServiceError(
          'Sort order must be a non-negative number',
          400,
          'sortOrder'
        );
      }

      // Update image
      const image = await prisma.productImage.update({
        where: { id: imageId },
        data: imageData
      });

      return image;
    } catch (error) {
      if (error instanceof ProductImageServiceError) {
        throw error;
      }
      console.error('Error updating product image:', error);
      throw new ProductImageServiceError(
        'Failed to update product image',
        500
      );
    }
  }

  /**
   * Delete a product image
   * 
   * @param imageId - The image ID
   * @returns Deleted product image
   */
  async deleteProductImage(imageId: string): Promise<ProductImage> {
    try {
      // Check if image exists
      const existingImage = await prisma.productImage.findUnique({
        where: { id: imageId }
      });

      if (!existingImage) {
        throw new ProductImageServiceError(
          'Product image not found',
          404
        );
      }

      // Delete image
      const image = await prisma.productImage.delete({
        where: { id: imageId }
      });

      return image;
    } catch (error) {
      if (error instanceof ProductImageServiceError) {
        throw error;
      }
      console.error('Error deleting product image:', error);
      throw new ProductImageServiceError(
        'Failed to delete product image',
        500
      );
    }
  }

  /**
   * Set image as default (sortOrder = 0)
   * 
   * @param imageId - The image ID
   * @returns Updated product image
   */
  async setDefaultImage(imageId: string): Promise<ProductImage> {
    try {
      // Check if image exists
      const existingImage = await prisma.productImage.findUnique({
        where: { id: imageId }
      });

      if (!existingImage) {
        throw new ProductImageServiceError(
          'Product image not found',
          404
        );
      }

      // Update all other images for this product to have sortOrder > 0
      await prisma.productImage.updateMany({
        where: {
          productId: existingImage.productId,
          NOT: { id: imageId }
        },
        data: {
          sortOrder: { increment: 1 }
        }
      });

      // Set this image as default
      const image = await prisma.productImage.update({
        where: { id: imageId },
        data: { sortOrder: 0 }
      });

      return image;
    } catch (error) {
      if (error instanceof ProductImageServiceError) {
        throw error;
      }
      console.error('Error setting default image:', error);
      throw new ProductImageServiceError(
        'Failed to set default image',
        500
      );
    }
  }

  /**
   * Reorder product images
   * 
   * @param productId - The product ID
   * @param imageOrders - Array of image IDs with their new sort orders
   * @returns Updated product images
   */
  async reorderProductImages(
    productId: string,
    imageOrders: Array<{ imageId: string; sortOrder: number }>
  ): Promise<ProductImage[]> {
    try {
      // Validate product exists
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new ProductImageServiceError(
          'Product not found',
          404,
          'productId'
        );
      }

      // Validate all images belong to this product
      const imageIds = imageOrders.map(io => io.imageId);
      const images = await prisma.productImage.findMany({
        where: { id: { in: imageIds } }
      });

      const invalidImages = images.filter(img => img.productId !== productId);
      if (invalidImages.length > 0) {
        throw new ProductImageServiceError(
          'One or more images do not belong to this product',
          400
        );
      }

      // Update sort orders in a transaction
      const updatedImages = await prisma.$transaction(
        imageOrders.map(({ imageId, sortOrder }) =>
          prisma.productImage.update({
            where: { id: imageId },
            data: { sortOrder }
          })
        )
      );

      return updatedImages;
    } catch (error) {
      if (error instanceof ProductImageServiceError) {
        throw error;
      }
      console.error('Error reordering product images:', error);
      throw new ProductImageServiceError(
        'Failed to reorder product images',
        500
      );
    }
  }

  /**
   * Delete all images for a product
   * 
   * @param productId - The product ID
   * @returns Number of deleted images
   */
  async deleteAllProductImages(productId: string): Promise<number> {
    try {
      const result = await prisma.productImage.deleteMany({
        where: { productId }
      });

      return result.count;
    } catch (error) {
      console.error('Error deleting product images:', error);
      throw new ProductImageServiceError(
        'Failed to delete product images',
        500
      );
    }
  }

  /**
   * Get default image for a product
   * 
   * @param productId - The product ID
   * @returns Default product image or null if not found
   */
  async getDefaultProductImage(productId: string): Promise<ProductImage | null> {
    try {
      const image = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: { sortOrder: 'asc' }
      });

      return image;
    } catch (error) {
      console.error('Error fetching default product image:', error);
      throw new ProductImageServiceError(
        'Failed to fetch default product image',
        500
      );
    }
  }

  /**
   * Validate image URL format
   * 
   * @param url - The image URL to validate
   * @throws ProductImageServiceError if URL is invalid
   */
  private validateImageUrl(url: string): void {
    if (!url || url.trim() === '') {
      throw new ProductImageServiceError(
        'Image URL is required',
        400,
        'url'
      );
    }

    try {
      new URL(url);
    } catch {
      throw new ProductImageServiceError(
        'Invalid image URL format',
        400,
        'url'
      );
    }

    // Check for valid image extensions
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasValidExtension = validExtensions.some(ext =>
      url.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      throw new ProductImageServiceError(
        'Image URL must have a valid image extension (jpg, jpeg, png, gif, webp, svg)',
        400,
        'url'
      );
    }
  }

  /**
   * Bulk create product images
   * 
   * @param productId - The product ID
   * @param imagesData - Array of image data
   * @returns Created product images
   */
  async bulkCreateProductImages(
    productId: string,
    imagesData: CreateProductImageRequest[]
  ): Promise<ProductImage[]> {
    try {
      // Validate product exists
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new ProductImageServiceError(
          'Product not found',
          404,
          'productId'
        );
      }

      // Validate all images
      imagesData.forEach((imageData, index) => {
        this.validateImageUrl(imageData.url);
        if (imageData.alt && imageData.alt.length > 255) {
          throw new ProductImageServiceError(
            `Alt text for image ${index + 1} cannot exceed 255 characters`,
            400,
            'alt'
          );
        }
      });

      // Create images in a transaction
      const images = await prisma.$transaction(
        imagesData.map(imageData =>
          prisma.productImage.create({
            data: {
              productId,
              url: imageData.url,
              alt: imageData.alt,
              sortOrder: imageData.sortOrder !== undefined ? imageData.sortOrder : 0
            }
          })
        )
      );

      return images;
    } catch (error) {
      if (error instanceof ProductImageServiceError) {
        throw error;
      }
      console.error('Error bulk creating product images:', error);
      throw new ProductImageServiceError(
        'Failed to bulk create product images',
        500
      );
    }
  }
}

// Export singleton instance
export const productImageService = new ProductImageService();
