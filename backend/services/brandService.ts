/**
 * Brand Service
 * 
 * This service handles all business logic related to brands including
 * CRUD operations, validation, and brand-product relationship management.
 */

import { PrismaClient } from '@prisma/client';
import {
  Brand,
  BrandWithRelations,
  CreateBrandRequest,
  UpdateBrandRequest,
  BrandSearchFilter,
  BrandProductCount
} from '../types/brand.types';

const prisma = new PrismaClient();

/**
 * Custom error class for Brand Service
 */
export class BrandServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public field?: string
  ) {
    super(message);
    this.name = 'BrandServiceError';
  }
}

/**
 * Brand Service Class
 */
export class BrandService {
  /**
   * Get all brands
   * 
   * @param filter - Search and filter options
   * @returns Array of brands
   */
  async getBrands(filter?: BrandSearchFilter): Promise<BrandWithRelations[]> {
    try {
      const where: any = {};

      if (filter) {
        if (!filter.includeInactive) {
          where.isActive = true;
        }

        if (filter.search) {
          where.OR = [
            { name: { contains: filter.search, mode: 'insensitive' } },
            { description: { contains: filter.search, mode: 'insensitive' } }
          ];
        }
      }

      const brands = await prisma.brand.findMany({
        where,
        include: {
          _count: {
            select: {
              products: true
            }
          }
        },
        orderBy: {
          name: filter?.sortOrder || 'asc'
        }
      });

      return brands as BrandWithRelations[];
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw new BrandServiceError(
        'Failed to fetch brands',
        500
      );
    }
  }

  /**
   * Get a brand by ID
   * 
   * @param brandId - The brand ID
   * @returns Brand with relations or null if not found
   */
  async getBrandById(brandId: string): Promise<BrandWithRelations | null> {
    try {
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
        include: {
          _count: {
            select: {
              products: true
            }
          },
          products: {
            where: { status: 'active' },
            take: 10,
            include: {
              images: {
                where: { sortOrder: 0 },
                take: 1,
                select: { id: true, url: true, alt: true }
              },
              _count: {
                select: {
                  reviews: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return brand as BrandWithRelations | null;
    } catch (error) {
      console.error('Error fetching brand:', error);
      throw new BrandServiceError(
        'Failed to fetch brand',
        500
      );
    }
  }

  /**
   * Get a brand by slug
   * 
   * @param slug - The brand slug
   * @returns Brand with relations or null if not found
   */
  async getBrandBySlug(slug: string): Promise<BrandWithRelations | null> {
    try {
      const brand = await prisma.brand.findUnique({
        where: { slug },
        include: {
          _count: {
            select: {
              products: true
            }
          },
          products: {
            where: { status: 'active' },
            take: 10,
            include: {
              images: {
                where: { sortOrder: 0 },
                take: 1,
                select: { id: true, url: true, alt: true }
              },
              _count: {
                select: {
                  reviews: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return brand as BrandWithRelations | null;
    } catch (error) {
      console.error('Error fetching brand by slug:', error);
      throw new BrandServiceError(
        'Failed to fetch brand',
        500
      );
    }
  }

  /**
   * Create a new brand
   * 
   * @param brandData - The brand data
   * @returns Created brand
   */
  async createBrand(brandData: CreateBrandRequest): Promise<Brand> {
    try {
      // Validate brand name
      this.validateBrandName(brandData.name);

      // Validate slug
      this.validateSlug(brandData.slug);

      // Check if slug already exists
      const existingBrand = await prisma.brand.findUnique({
        where: { slug: brandData.slug }
      });

      if (existingBrand) {
        throw new BrandServiceError(
          'Brand with this slug already exists',
          409,
          'slug'
        );
      }

      // Validate website if provided
      if (brandData.website) {
        this.validateWebsite(brandData.website);
      }

      // Create brand
      const brand = await prisma.brand.create({
        data: {
          name: brandData.name,
          slug: brandData.slug,
          description: brandData.description,
          website: brandData.website,
          isActive: brandData.isActive !== undefined ? brandData.isActive : true
        }
      });

      return brand;
    } catch (error) {
      if (error instanceof BrandServiceError) {
        throw error;
      }
      console.error('Error creating brand:', error);
      throw new BrandServiceError(
        'Failed to create brand',
        500
      );
    }
  }

  /**
   * Update a brand
   * 
   * @param brandId - The brand ID
   * @param brandData - The brand data to update
   * @returns Updated brand
   */
  async updateBrand(
    brandId: string,
    brandData: UpdateBrandRequest
  ): Promise<Brand> {
    try {
      // Check if brand exists
      const existingBrand = await prisma.brand.findUnique({
        where: { id: brandId }
      });

      if (!existingBrand) {
        throw new BrandServiceError(
          'Brand not found',
          404
        );
      }

      // Validate brand name if provided
      if (brandData.name) {
        this.validateBrandName(brandData.name);
      }

      // Validate slug if provided
      if (brandData.slug) {
        this.validateSlug(brandData.slug);

        // Check if slug conflicts with another brand
        const slugConflict = await prisma.brand.findFirst({
          where: { slug: brandData.slug, NOT: { id: brandId } }
        });

        if (slugConflict) {
          throw new BrandServiceError(
            'Brand with this slug already exists',
            409,
            'slug'
          );
        }
      }

      // Validate website if provided
      if (brandData.website) {
        this.validateWebsite(brandData.website);
      }

      // Update brand
      const brand = await prisma.brand.update({
        where: { id: brandId },
        data: brandData
      });

      return brand;
    } catch (error) {
      if (error instanceof BrandServiceError) {
        throw error;
      }
      console.error('Error updating brand:', error);
      throw new BrandServiceError(
        'Failed to update brand',
        500
      );
    }
  }

  /**
   * Delete a brand
   * 
   * @param brandId - The brand ID
   * @returns Deleted brand
   */
  async deleteBrand(brandId: string): Promise<Brand> {
    try {
      // Check if brand exists
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      });

      if (!brand) {
        throw new BrandServiceError(
          'Brand not found',
          404
        );
      }

      // Check if brand has products
      if (brand._count.products > 0) {
        throw new BrandServiceError(
          'Cannot delete brand with existing products. Consider deactivating it instead.',
          400
        );
      }

      // Delete brand
      const deletedBrand = await prisma.brand.delete({
        where: { id: brandId }
      });

      return deletedBrand;
    } catch (error) {
      if (error instanceof BrandServiceError) {
        throw error;
      }
      console.error('Error deleting brand:', error);
      throw new BrandServiceError(
        'Failed to delete brand',
        500
      );
    }
  }

  /**
   * Activate or deactivate a brand
   * 
   * @param brandId - The brand ID
   * @param isActive - Whether the brand should be active
   * @returns Updated brand
   */
  async setBrandActive(brandId: string, isActive: boolean): Promise<Brand> {
    try {
      const brand = await prisma.brand.update({
        where: { id: brandId },
        data: { isActive }
      });

      return brand;
    } catch (error) {
      console.error('Error setting brand active status:', error);
      throw new BrandServiceError(
        'Failed to set brand active status',
        500
      );
    }
  }

  /**
   * Get product count for all brands
   * 
   * @returns Array of brand product counts
   */
  async getBrandProductCounts(): Promise<BrandProductCount[]> {
    try {
      const brands = await prisma.brand.findMany({
        include: {
          _count: {
            select: {
              products: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return brands.map(brand => ({
        brandId: brand.id,
        brandName: brand.name,
        totalProducts: brand._count.products,
        activeProducts: brand.isActive ? brand._count.products : 0,
        inactiveProducts: brand.isActive ? 0 : brand._count.products
      }));
    } catch (error) {
      console.error('Error fetching brand product counts:', error);
      throw new BrandServiceError(
        'Failed to fetch brand product counts',
        500
      );
    }
  }

  /**
   * Validate brand name
   * 
   * @param name - The brand name to validate
   * @throws BrandServiceError if name is invalid
   */
  private validateBrandName(name: string): void {
    if (!name || name.trim() === '') {
      throw new BrandServiceError(
        'Brand name is required',
        400,
        'name'
      );
    }

    if (name.length > 255) {
      throw new BrandServiceError(
        'Brand name cannot exceed 255 characters',
        400,
        'name'
      );
    }
  }

  /**
   * Validate slug
   * 
   * @param slug - The slug to validate
   * @throws BrandServiceError if slug is invalid
   */
  private validateSlug(slug: string): void {
    if (!slug || slug.trim() === '') {
      throw new BrandServiceError(
        'Slug is required',
        400,
        'slug'
      );
    }

    // Validate slug format (lowercase, alphanumeric, hyphens)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      throw new BrandServiceError(
        'Slug must contain only lowercase letters, numbers, and hyphens',
        400,
        'slug'
      );
    }

    if (slug.length > 255) {
      throw new BrandServiceError(
        'Slug cannot exceed 255 characters',
        400,
        'slug'
      );
    }
  }

  /**
   * Validate website URL
   * 
   * @param website - The website URL to validate
   * @throws BrandServiceError if website is invalid
   */
  private validateWebsite(website: string): void {
    try {
      new URL(website);
    } catch {
      throw new BrandServiceError(
        'Invalid website URL format',
        400,
        'website'
      );
    }
  }

  /**
   * Bulk update brands
   * 
   * @param brandIds - Array of brand IDs
   * @param updates - The updates to apply to all brands
   * @returns Updated brands
   */
  async bulkUpdateBrands(
    brandIds: string[],
    updates: Partial<UpdateBrandRequest>
  ): Promise<Brand[]> {
    try {
      // Validate updates
      if (updates.name) {
        this.validateBrandName(updates.name);
      }
      if (updates.slug) {
        this.validateSlug(updates.slug);
      }
      if (updates.website) {
        this.validateWebsite(updates.website);
      }

      // Update brands in a transaction
      const updatedBrands = await prisma.$transaction(
        brandIds.map(brandId =>
          prisma.brand.update({
            where: { id: brandId },
            data: updates
          })
        )
      );

      return updatedBrands;
    } catch (error) {
      if (error instanceof BrandServiceError) {
        throw error;
      }
      console.error('Error bulk updating brands:', error);
      throw new BrandServiceError(
        'Failed to bulk update brands',
        500
      );
    }
  }

  /**
   * Bulk delete brands
   * 
   * @param brandIds - Array of brand IDs
   * @returns Number of deleted brands
   */
  async bulkDeleteBrands(brandIds: string[]): Promise<number> {
    try {
      // Check if any brand has products
      const brands = await prisma.brand.findMany({
        where: { id: { in: brandIds } },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      });

      const brandsWithProducts = brands.filter(b => b._count.products > 0);
      if (brandsWithProducts.length > 0) {
        throw new BrandServiceError(
          `Cannot delete brands with existing products: ${brandsWithProducts.map(b => b.name).join(', ')}`,
          400
        );
      }

      const result = await prisma.brand.deleteMany({
        where: { id: { in: brandIds } }
      });

      return result.count;
    } catch (error) {
      if (error instanceof BrandServiceError) {
        throw error;
      }
      console.error('Error bulk deleting brands:', error);
      throw new BrandServiceError(
        'Failed to bulk delete brands',
        500
      );
    }
  }
}

// Export singleton instance
export const brandService = new BrandService();
