/**
 * Product Specification Service
 * 
 * This service handles all business logic related to product specifications including
 * CRUD operations, validation, and ordering.
 */

import { PrismaClient } from '@prisma/client';
import {
  ProductSpecification,
  CreateProductSpecificationRequest,
  UpdateProductSpecificationRequest
} from '../types/product.types';

const prisma = new PrismaClient();

/**
 * Custom error class for Product Specification Service
 */
export class ProductSpecificationServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public field?: string
  ) {
    super(message);
    this.name = 'ProductSpecificationServiceError';
  }
}

/**
 * Product Specification Service Class
 */
export class ProductSpecificationService {
  /**
   * Get all specifications for a product
   * 
   * @param productId - The product ID
   * @returns Array of product specifications ordered by sortOrder
   */
  async getProductSpecifications(productId: string): Promise<ProductSpecification[]> {
    try {
      const specifications = await prisma.productSpecification.findMany({
        where: { productId },
        orderBy: { sortOrder: 'asc' }
      });

      return specifications;
    } catch (error) {
      console.error('Error fetching product specifications:', error);
      throw new ProductSpecificationServiceError(
        'Failed to fetch product specifications',
        500
      );
    }
  }

  /**
   * Get a single product specification by ID
   * 
   * @param specificationId - The specification ID
   * @returns Product specification or null if not found
   */
  async getProductSpecificationById(
    specificationId: string
  ): Promise<ProductSpecification | null> {
    try {
      const specification = await prisma.productSpecification.findUnique({
        where: { id: specificationId }
      });

      return specification;
    } catch (error) {
      console.error('Error fetching product specification:', error);
      throw new ProductSpecificationServiceError(
        'Failed to fetch product specification',
        500
      );
    }
  }

  /**
   * Create a new product specification
   * 
   * @param productId - The product ID
   * @param specificationData - The specification data
   * @returns Created product specification
   */
  async createProductSpecification(
    productId: string,
    specificationData: CreateProductSpecificationRequest
  ): Promise<ProductSpecification> {
    try {
      // Validate product exists
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new ProductSpecificationServiceError(
          'Product not found',
          404,
          'productId'
        );
      }

      // Validate specification name
      this.validateSpecificationName(specificationData.name);

      // Validate specification value
      this.validateSpecificationValue(specificationData.value);

      // Validate sortOrder
      const sortOrder = specificationData.sortOrder !== undefined ? specificationData.sortOrder : 0;
      if (sortOrder < 0) {
        throw new ProductSpecificationServiceError(
          'Sort order must be a non-negative number',
          400,
          'sortOrder'
        );
      }

      // Create specification
      const specification = await prisma.productSpecification.create({
        data: {
          productId,
          name: specificationData.name,
          value: specificationData.value,
          sortOrder
        }
      });

      return specification;
    } catch (error) {
      if (error instanceof ProductSpecificationServiceError) {
        throw error;
      }
      console.error('Error creating product specification:', error);
      throw new ProductSpecificationServiceError(
        'Failed to create product specification',
        500
      );
    }
  }

  /**
   * Update a product specification
   * 
   * @param specificationId - The specification ID
   * @param specificationData - The specification data to update
   * @returns Updated product specification
   */
  async updateProductSpecification(
    specificationId: string,
    specificationData: UpdateProductSpecificationRequest
  ): Promise<ProductSpecification> {
    try {
      // Check if specification exists
      const existingSpecification = await prisma.productSpecification.findUnique({
        where: { id: specificationId }
      });

      if (!existingSpecification) {
        throw new ProductSpecificationServiceError(
          'Product specification not found',
          404
        );
      }

      // Validate specification name if provided
      if (specificationData.name) {
        this.validateSpecificationName(specificationData.name);
      }

      // Validate specification value if provided
      if (specificationData.value) {
        this.validateSpecificationValue(specificationData.value);
      }

      // Validate sortOrder if provided
      if (specificationData.sortOrder !== undefined && specificationData.sortOrder < 0) {
        throw new ProductSpecificationServiceError(
          'Sort order must be a non-negative number',
          400,
          'sortOrder'
        );
      }

      // Update specification
      const specification = await prisma.productSpecification.update({
        where: { id: specificationId },
        data: specificationData
      });

      return specification;
    } catch (error) {
      if (error instanceof ProductSpecificationServiceError) {
        throw error;
      }
      console.error('Error updating product specification:', error);
      throw new ProductSpecificationServiceError(
        'Failed to update product specification',
        500
      );
    }
  }

  /**
   * Delete a product specification
   * 
   * @param specificationId - The specification ID
   * @returns Deleted product specification
   */
  async deleteProductSpecification(
    specificationId: string
  ): Promise<ProductSpecification> {
    try {
      // Check if specification exists
      const existingSpecification = await prisma.productSpecification.findUnique({
        where: { id: specificationId }
      });

      if (!existingSpecification) {
        throw new ProductSpecificationServiceError(
          'Product specification not found',
          404
        );
      }

      // Delete specification
      const specification = await prisma.productSpecification.delete({
        where: { id: specificationId }
      });

      return specification;
    } catch (error) {
      if (error instanceof ProductSpecificationServiceError) {
        throw error;
      }
      console.error('Error deleting product specification:', error);
      throw new ProductSpecificationServiceError(
        'Failed to delete product specification',
        500
      );
    }
  }

  /**
   * Reorder product specifications
   * 
   * @param productId - The product ID
   * @param specificationOrders - Array of specification IDs with their new sort orders
   * @returns Updated product specifications
   */
  async reorderProductSpecifications(
    productId: string,
    specificationOrders: Array<{ specificationId: string; sortOrder: number }>
  ): Promise<ProductSpecification[]> {
    try {
      // Validate product exists
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new ProductSpecificationServiceError(
          'Product not found',
          404,
          'productId'
        );
      }

      // Validate all specifications belong to this product
      const specificationIds = specificationOrders.map(so => so.specificationId);
      const specifications = await prisma.productSpecification.findMany({
        where: { id: { in: specificationIds } }
      });

      const invalidSpecifications = specifications.filter(
        spec => spec.productId !== productId
      );
      if (invalidSpecifications.length > 0) {
        throw new ProductSpecificationServiceError(
          'One or more specifications do not belong to this product',
          400
        );
      }

      // Update sort orders in a transaction
      const updatedSpecifications = await prisma.$transaction(
        specificationOrders.map(({ specificationId, sortOrder }) =>
          prisma.productSpecification.update({
            where: { id: specificationId },
            data: { sortOrder }
          })
        )
      );

      return updatedSpecifications;
    } catch (error) {
      if (error instanceof ProductSpecificationServiceError) {
        throw error;
      }
      console.error('Error reordering product specifications:', error);
      throw new ProductSpecificationServiceError(
        'Failed to reorder product specifications',
        500
      );
    }
  }

  /**
   * Delete all specifications for a product
   * 
   * @param productId - The product ID
   * @returns Number of deleted specifications
   */
  async deleteAllProductSpecifications(productId: string): Promise<number> {
    try {
      const result = await prisma.productSpecification.deleteMany({
        where: { productId }
      });

      return result.count;
    } catch (error) {
      console.error('Error deleting product specifications:', error);
      throw new ProductSpecificationServiceError(
        'Failed to delete product specifications',
        500
      );
    }
  }

  /**
   * Validate specification name
   * 
   * @param name - The specification name to validate
   * @throws ProductSpecificationServiceError if name is invalid
   */
  private validateSpecificationName(name: string): void {
    if (!name || name.trim() === '') {
      throw new ProductSpecificationServiceError(
        'Specification name is required',
        400,
        'name'
      );
    }

    if (name.length > 255) {
      throw new ProductSpecificationServiceError(
        'Specification name cannot exceed 255 characters',
        400,
        'name'
      );
    }
  }

  /**
   * Validate specification value
   * 
   * @param value - The specification value to validate
   * @throws ProductSpecificationServiceError if value is invalid
   */
  private validateSpecificationValue(value: string): void {
    if (!value || value.trim() === '') {
      throw new ProductSpecificationServiceError(
        'Specification value is required',
        400,
        'value'
      );
    }

    if (value.length > 1000) {
      throw new ProductSpecificationServiceError(
        'Specification value cannot exceed 1000 characters',
        400,
        'value'
      );
    }
  }

  /**
   * Bulk create product specifications
   * 
   * @param productId - The product ID
   * @param specificationsData - Array of specification data
   * @returns Created product specifications
   */
  async bulkCreateProductSpecifications(
    productId: string,
    specificationsData: CreateProductSpecificationRequest[]
  ): Promise<ProductSpecification[]> {
    try {
      // Validate product exists
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new ProductSpecificationServiceError(
          'Product not found',
          404,
          'productId'
        );
      }

      // Validate all specifications
      specificationsData.forEach((specData, index) => {
        this.validateSpecificationName(specData.name);
        this.validateSpecificationValue(specData.value);
      });

      // Create specifications in a transaction
      const specifications = await prisma.$transaction(
        specificationsData.map(specData =>
          prisma.productSpecification.create({
            data: {
              productId,
              name: specData.name,
              value: specData.value,
              sortOrder: specData.sortOrder !== undefined ? specData.sortOrder : 0
            }
          })
        )
      );

      return specifications;
    } catch (error) {
      if (error instanceof ProductSpecificationServiceError) {
        throw error;
      }
      console.error('Error bulk creating product specifications:', error);
      throw new ProductSpecificationServiceError(
        'Failed to bulk create product specifications',
        500
      );
    }
  }

  /**
   * Bulk update product specifications
   * 
   * @param specificationIds - Array of specification IDs
   * @param updates - The updates to apply to all specifications
   * @returns Updated product specifications
   */
  async bulkUpdateProductSpecifications(
    specificationIds: string[],
    updates: Partial<UpdateProductSpecificationRequest>
  ): Promise<ProductSpecification[]> {
    try {
      // Validate updates
      if (updates.name) {
        this.validateSpecificationName(updates.name);
      }
      if (updates.value) {
        this.validateSpecificationValue(updates.value);
      }
      if (updates.sortOrder !== undefined && updates.sortOrder < 0) {
        throw new ProductSpecificationServiceError(
          'Sort order must be a non-negative number',
          400,
          'sortOrder'
        );
      }

      // Update specifications in a transaction
      const updatedSpecifications = await prisma.$transaction(
        specificationIds.map(specificationId =>
          prisma.productSpecification.update({
            where: { id: specificationId },
            data: updates
          })
        )
      );

      return updatedSpecifications;
    } catch (error) {
      if (error instanceof ProductSpecificationServiceError) {
        throw error;
      }
      console.error('Error bulk updating product specifications:', error);
      throw new ProductSpecificationServiceError(
        'Failed to bulk update product specifications',
        500
      );
    }
  }

  /**
   * Bulk delete product specifications
   * 
   * @param specificationIds - Array of specification IDs
   * @returns Number of deleted specifications
   */
  async bulkDeleteProductSpecifications(
    specificationIds: string[]
  ): Promise<number> {
    try {
      const result = await prisma.productSpecification.deleteMany({
        where: { id: { in: specificationIds } }
      });

      return result.count;
    } catch (error) {
      console.error('Error bulk deleting product specifications:', error);
      throw new ProductSpecificationServiceError(
        'Failed to bulk delete product specifications',
        500
      );
    }
  }
}

// Export singleton instance
export const productSpecificationService = new ProductSpecificationService();
