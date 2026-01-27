/**
 * Product Variant Service
 * 
 * This service handles all business logic related to product variants including
 * CRUD operations, validation, stock management, and pricing logic.
 */

import { PrismaClient } from '@prisma/client';
import {
  ProductVariant,
  CreateProductVariantRequest,
  UpdateProductVariantRequest
} from '../types/product.types';

const prisma = new PrismaClient();

/**
 * Custom error class for Product Variant Service
 */
export class ProductVariantServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public field?: string
  ) {
    super(message);
    this.name = 'ProductVariantServiceError';
  }
}

/**
 * Product Variant Service Class
 */
export class ProductVariantService {
  /**
   * Get all variants for a product
   * 
   * @param productId - The product ID
   * @param includeInactive - Whether to include inactive variants
   * @returns Array of product variants
   */
  async getProductVariants(
    productId: string,
    includeInactive: boolean = false
  ): Promise<ProductVariant[]> {
    try {
      const where: any = { productId };
      if (!includeInactive) {
        where.isActive = true;
      }

      const variants = await prisma.productVariant.findMany({
        where,
        orderBy: { name: 'asc' }
      });

      return variants;
    } catch (error) {
      console.error('Error fetching product variants:', error);
      throw new ProductVariantServiceError(
        'Failed to fetch product variants',
        500
      );
    }
  }

  /**
   * Get a single product variant by ID
   * 
   * @param variantId - The variant ID
   * @returns Product variant or null if not found
   */
  async getProductVariantById(
    variantId: string
  ): Promise<ProductVariant | null> {
    try {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId }
      });

      return variant;
    } catch (error) {
      console.error('Error fetching product variant:', error);
      throw new ProductVariantServiceError(
        'Failed to fetch product variant',
        500
      );
    }
  }

  /**
   * Get a product variant by SKU
   * 
   * @param sku - The variant SKU
   * @returns Product variant or null if not found
   */
  async getProductVariantBySku(sku: string): Promise<ProductVariant | null> {
    try {
      const variant = await prisma.productVariant.findUnique({
        where: { sku }
      });

      return variant;
    } catch (error) {
      console.error('Error fetching product variant by SKU:', error);
      throw new ProductVariantServiceError(
        'Failed to fetch product variant',
        500
      );
    }
  }

  /**
   * Create a new product variant
   * 
   * @param productId - The product ID
   * @param variantData - The variant data
   * @returns Created product variant
   */
  async createProductVariant(
    productId: string,
    variantData: CreateProductVariantRequest
  ): Promise<ProductVariant> {
    try {
      // Validate product exists
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new ProductVariantServiceError(
          'Product not found',
          404,
          'productId'
        );
      }

      // Validate variant name
      this.validateVariantName(variantData.name);

      // Validate SKU
      this.validateSku(variantData.sku);

      // Check if SKU already exists
      const existingSku = await prisma.productVariant.findUnique({
        where: { sku: variantData.sku }
      });

      if (existingSku) {
        throw new ProductVariantServiceError(
          'Variant with this SKU already exists',
          409,
          'sku'
        );
      }

      // Validate price
      this.validatePrice(variantData.price);

      // Validate compare price if provided
      if (variantData.comparePrice !== undefined) {
        this.validateComparePrice(variantData.comparePrice, variantData.price);
      }

      // Validate stock
      const stock = variantData.stock !== undefined ? variantData.stock : 0;
      this.validateStock(stock);

      // Create variant
      const variant = await prisma.productVariant.create({
        data: {
          productId,
          name: variantData.name,
          sku: variantData.sku,
          price: variantData.price,
          comparePrice: variantData.comparePrice,
          stock,
          isActive: variantData.isActive !== undefined ? variantData.isActive : true
        }
      });

      return variant;
    } catch (error) {
      if (error instanceof ProductVariantServiceError) {
        throw error;
      }
      console.error('Error creating product variant:', error);
      throw new ProductVariantServiceError(
        'Failed to create product variant',
        500
      );
    }
  }

  /**
   * Update a product variant
   * 
   * @param variantId - The variant ID
   * @param variantData - The variant data to update
   * @returns Updated product variant
   */
  async updateProductVariant(
    variantId: string,
    variantData: UpdateProductVariantRequest
  ): Promise<ProductVariant> {
    try {
      // Check if variant exists
      const existingVariant = await prisma.productVariant.findUnique({
        where: { id: variantId }
      });

      if (!existingVariant) {
        throw new ProductVariantServiceError(
          'Product variant not found',
          404
        );
      }

      // Validate variant name if provided
      if (variantData.name) {
        this.validateVariantName(variantData.name);
      }

      // Validate SKU if provided
      if (variantData.sku) {
        this.validateSku(variantData.sku);

        // Check if SKU conflicts with another variant
        const skuConflict = await prisma.productVariant.findFirst({
          where: { sku: variantData.sku, NOT: { id: variantId } }
        });

        if (skuConflict) {
          throw new ProductVariantServiceError(
            'Variant with this SKU already exists',
            409,
            'sku'
          );
        }
      }

      // Validate price if provided
      if (variantData.price !== undefined) {
        this.validatePrice(variantData.price);
      }

      // Validate compare price if provided
      if (variantData.comparePrice !== undefined) {
        const price = variantData.price !== undefined ? variantData.price : existingVariant.price;
        this.validateComparePrice(variantData.comparePrice, price);
      }

      // Validate stock if provided
      if (variantData.stock !== undefined) {
        this.validateStock(variantData.stock);
      }

      // Update variant
      const variant = await prisma.productVariant.update({
        where: { id: variantId },
        data: variantData
      });

      return variant;
    } catch (error) {
      if (error instanceof ProductVariantServiceError) {
        throw error;
      }
      console.error('Error updating product variant:', error);
      throw new ProductVariantServiceError(
        'Failed to update product variant',
        500
      );
    }
  }

  /**
   * Delete a product variant
   * 
   * @param variantId - The variant ID
   * @returns Deleted product variant
   */
  async deleteProductVariant(variantId: string): Promise<ProductVariant> {
    try {
      // Check if variant exists
      const existingVariant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: {
          _count: {
            select: {
              orderItems: true,
              cartItems: true
            }
          }
        }
      });

      if (!existingVariant) {
        throw new ProductVariantServiceError(
          'Product variant not found',
          404
        );
      }

      // Check if variant is referenced in orders
      if (existingVariant._count.orderItems > 0) {
        throw new ProductVariantServiceError(
          'Cannot delete variant with existing orders. Consider deactivating it instead.',
          400
        );
      }

      // Delete variant
      const variant = await prisma.productVariant.delete({
        where: { id: variantId }
      });

      return variant;
    } catch (error) {
      if (error instanceof ProductVariantServiceError) {
        throw error;
      }
      console.error('Error deleting product variant:', error);
      throw new ProductVariantServiceError(
        'Failed to delete product variant',
        500
      );
    }
  }

  /**
   * Update variant stock
   * 
   * @param variantId - The variant ID
   * @param quantity - The quantity to add (positive) or subtract (negative)
   * @returns Updated product variant
   */
  async updateVariantStock(
    variantId: string,
    quantity: number
  ): Promise<ProductVariant> {
    try {
      // Check if variant exists
      const existingVariant = await prisma.productVariant.findUnique({
        where: { id: variantId }
      });

      if (!existingVariant) {
        throw new ProductVariantServiceError(
          'Product variant not found',
          404
        );
      }

      const newStock = existingVariant.stock + quantity;

      // Validate new stock
      this.validateStock(newStock);

      // Update stock
      const variant = await prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: newStock }
      });

      return variant;
    } catch (error) {
      if (error instanceof ProductVariantServiceError) {
        throw error;
      }
      console.error('Error updating variant stock:', error);
      throw new ProductVariantServiceError(
        'Failed to update variant stock',
        500
      );
    }
  }

  /**
   * Set variant active status
   * 
   * @param variantId - The variant ID
   * @param isActive - Whether the variant should be active
   * @returns Updated product variant
   */
  async setVariantActive(
    variantId: string,
    isActive: boolean
  ): Promise<ProductVariant> {
    try {
      const variant = await prisma.productVariant.update({
        where: { id: variantId },
        data: { isActive }
      });

      return variant;
    } catch (error) {
      console.error('Error setting variant active status:', error);
      throw new ProductVariantServiceError(
        'Failed to set variant active status',
        500
      );
    }
  }

  /**
   * Delete all variants for a product
   * 
   * @param productId - The product ID
   * @returns Number of deleted variants
   */
  async deleteAllProductVariants(productId: string): Promise<number> {
    try {
      const result = await prisma.productVariant.deleteMany({
        where: { productId }
      });

      return result.count;
    } catch (error) {
      console.error('Error deleting product variants:', error);
      throw new ProductVariantServiceError(
        'Failed to delete product variants',
        500
      );
    }
  }

  /**
   * Get low stock variants for a product
   * 
   * @param productId - The product ID
   * @param threshold - The low stock threshold
   * @returns Array of low stock variants
   */
  async getLowStockVariants(
    productId: string,
    threshold: number = 10
  ): Promise<ProductVariant[]> {
    try {
      const variants = await prisma.productVariant.findMany({
        where: {
          productId,
          stock: { lte: threshold },
          isActive: true
        },
        orderBy: { stock: 'asc' }
      });

      return variants;
    } catch (error) {
      console.error('Error fetching low stock variants:', error);
      throw new ProductVariantServiceError(
        'Failed to fetch low stock variants',
        500
      );
    }
  }

  /**
   * Get out of stock variants for a product
   * 
   * @param productId - The product ID
   * @returns Array of out of stock variants
   */
  async getOutOfStockVariants(productId: string): Promise<ProductVariant[]> {
    try {
      const variants = await prisma.productVariant.findMany({
        where: {
          productId,
          stock: 0,
          isActive: true
        },
        orderBy: { name: 'asc' }
      });

      return variants;
    } catch (error) {
      console.error('Error fetching out of stock variants:', error);
      throw new ProductVariantServiceError(
        'Failed to fetch out of stock variants',
        500
      );
    }
  }

  /**
   * Calculate variant price with discount
   * 
   * @param variantId - The variant ID
   * @returns Price calculation result
   */
  async calculateVariantPrice(variantId: string): Promise<{
    regularPrice: number;
    salePrice: number | null;
    finalPrice: number;
    discountAmount: number;
    discountPercentage: number;
  }> {
    try {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId }
      });

      if (!variant) {
        throw new ProductVariantServiceError(
          'Product variant not found',
          404
        );
      }

      const regularPrice = Number(variant.price);
      const salePrice = variant.comparePrice ? Number(variant.comparePrice) : null;
      const finalPrice = salePrice ? Math.min(regularPrice, salePrice) : regularPrice;
      const discountAmount = salePrice && salePrice < regularPrice ? regularPrice - salePrice : 0;
      const discountPercentage = discountAmount > 0 ? (discountAmount / regularPrice) * 100 : 0;

      return {
        regularPrice,
        salePrice,
        finalPrice,
        discountAmount,
        discountPercentage
      };
    } catch (error) {
      if (error instanceof ProductVariantServiceError) {
        throw error;
      }
      console.error('Error calculating variant price:', error);
      throw new ProductVariantServiceError(
        'Failed to calculate variant price',
        500
      );
    }
  }

  /**
   * Validate variant name
   * 
   * @param name - The variant name to validate
   * @throws ProductVariantServiceError if name is invalid
   */
  private validateVariantName(name: string): void {
    if (!name || name.trim() === '') {
      throw new ProductVariantServiceError(
        'Variant name is required',
        400,
        'name'
      );
    }

    if (name.length > 255) {
      throw new ProductVariantServiceError(
        'Variant name cannot exceed 255 characters',
        400,
        'name'
      );
    }
  }

  /**
   * Validate SKU
   * 
   * @param sku - The SKU to validate
   * @throws ProductVariantServiceError if SKU is invalid
   */
  private validateSku(sku: string): void {
    if (!sku || sku.trim() === '') {
      throw new ProductVariantServiceError(
        'SKU is required',
        400,
        'sku'
      );
    }

    if (sku.length > 100) {
      throw new ProductVariantServiceError(
        'SKU cannot exceed 100 characters',
        400,
        'sku'
      );
    }
  }

  /**
   * Validate price
   * 
   * @param price - The price to validate
   * @throws ProductVariantServiceError if price is invalid
   */
  private validatePrice(price: number): void {
    if (price < 0) {
      throw new ProductVariantServiceError(
        'Price must be a non-negative number',
        400,
        'price'
      );
    }
  }

  /**
   * Validate compare price
   * 
   * @param comparePrice - The compare price to validate
   * @param regularPrice - The regular price
   * @throws ProductVariantServiceError if compare price is invalid
   */
  private validateComparePrice(comparePrice: number, regularPrice: number): void {
    if (comparePrice < 0) {
      throw new ProductVariantServiceError(
        'Compare price must be a non-negative number',
        400,
        'comparePrice'
      );
    }
  }

  /**
   * Validate stock
   * 
   * @param stock - The stock to validate
   * @throws ProductVariantServiceError if stock is invalid
   */
  private validateStock(stock: number): void {
    if (!Number.isInteger(stock)) {
      throw new ProductVariantServiceError(
        'Stock must be an integer',
        400,
        'stock'
      );
    }

    if (stock < 0) {
      throw new ProductVariantServiceError(
        'Stock must be a non-negative number',
        400,
        'stock'
      );
    }
  }

  /**
   * Bulk create product variants
   * 
   * @param productId - The product ID
   * @param variantsData - Array of variant data
   * @returns Created product variants
   */
  async bulkCreateProductVariants(
    productId: string,
    variantsData: CreateProductVariantRequest[]
  ): Promise<ProductVariant[]> {
    try {
      // Validate product exists
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new ProductVariantServiceError(
          'Product not found',
          404,
          'productId'
        );
      }

      // Validate all variants
      variantsData.forEach((variantData, index) => {
        this.validateVariantName(variantData.name);
        this.validateSku(variantData.sku);
        this.validatePrice(variantData.price);
        if (variantData.comparePrice !== undefined) {
          this.validateComparePrice(variantData.comparePrice, variantData.price);
        }
        const stock = variantData.stock !== undefined ? variantData.stock : 0;
        this.validateStock(stock);
      });

      // Check for duplicate SKUs
      const skus = variantsData.map(v => v.sku);
      const duplicateSkus = skus.filter(
        (sku, index) => skus.indexOf(sku) !== index
      );
      if (duplicateSkus.length > 0) {
        throw new ProductVariantServiceError(
          `Duplicate SKUs found: ${duplicateSkus.join(', ')}`,
          400,
          'sku'
        );
      }

      // Create variants in a transaction
      const variants = await prisma.$transaction(
        variantsData.map(variantData =>
          prisma.productVariant.create({
            data: {
              productId,
              name: variantData.name,
              sku: variantData.sku,
              price: variantData.price,
              comparePrice: variantData.comparePrice,
              stock: variantData.stock !== undefined ? variantData.stock : 0,
              isActive: variantData.isActive !== undefined ? variantData.isActive : true
            }
          })
        )
      );

      return variants;
    } catch (error) {
      if (error instanceof ProductVariantServiceError) {
        throw error;
      }
      console.error('Error bulk creating product variants:', error);
      throw new ProductVariantServiceError(
        'Failed to bulk create product variants',
        500
      );
    }
  }

  /**
   * Bulk update product variants
   * 
   * @param variantIds - Array of variant IDs
   * @param updates - The updates to apply to all variants
   * @returns Updated product variants
   */
  async bulkUpdateProductVariants(
    variantIds: string[],
    updates: Partial<UpdateProductVariantRequest>
  ): Promise<ProductVariant[]> {
    try {
      // Validate updates
      if (updates.name) {
        this.validateVariantName(updates.name);
      }
      if (updates.sku) {
        this.validateSku(updates.sku);
      }
      if (updates.price !== undefined) {
        this.validatePrice(updates.price);
      }
      if (updates.comparePrice !== undefined) {
        const price = updates.price !== undefined ? updates.price : 0;
        this.validateComparePrice(updates.comparePrice, price);
      }
      if (updates.stock !== undefined) {
        this.validateStock(updates.stock);
      }

      // Update variants in a transaction
      const updatedVariants = await prisma.$transaction(
        variantIds.map(variantId =>
          prisma.productVariant.update({
            where: { id: variantId },
            data: updates
          })
        )
      );

      return updatedVariants;
    } catch (error) {
      if (error instanceof ProductVariantServiceError) {
        throw error;
      }
      console.error('Error bulk updating product variants:', error);
      throw new ProductVariantServiceError(
        'Failed to bulk update product variants',
        500
      );
    }
  }

  /**
   * Bulk delete product variants
   * 
   * @param variantIds - Array of variant IDs
   * @returns Number of deleted variants
   */
  async bulkDeleteProductVariants(variantIds: string[]): Promise<number> {
    try {
      const result = await prisma.productVariant.deleteMany({
        where: { id: { in: variantIds } }
      });

      return result.count;
    } catch (error) {
      console.error('Error bulk deleting product variants:', error);
      throw new ProductVariantServiceError(
        'Failed to bulk delete product variants',
        500
      );
    }
  }
}

// Export singleton instance
export const productVariantService = new ProductVariantService();
