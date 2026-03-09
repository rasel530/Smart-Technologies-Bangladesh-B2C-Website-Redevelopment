/**
 * Category Service
 * 
 * This service handles all business logic related to categories including
 * CRUD operations, validation, category tree building, and hierarchy validation.
 */

import { PrismaClient } from '@prisma/client';
import {
  Category,
  CategoryWithRelations,
  CategoryTreeNode,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategorySearchFilter,
  CategoryHierarchyValidationResult,
  CategoryProductCount,
  CategoryMoveOperation,
  CategoryMoveResult
} from '../types/category.types';

const prisma = new PrismaClient();

/**
 * Custom error class for Category Service
 */
export class CategoryServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public field?: string
  ) {
    super(message);
    this.name = 'CategoryServiceError';
  }
}

/**
 * Category Service Class
 */
export class CategoryService {
  /**
   * Get all categories
   * 
   * @param filter - Search and filter options
   * @returns Array of categories
   */
  async getCategories(filter?: CategorySearchFilter): Promise<CategoryWithRelations[]> {
    try {
      const where: any = {};

      if (filter) {
        if (!filter.includeInactive) {
          where.isActive = true;
        }

        if (filter.parentOnly) {
          where.parentId = null;
        }

        if (filter.search) {
          where.OR = [
            { name: { contains: filter.search, mode: 'insensitive' } },
            { description: { contains: filter.search, mode: 'insensitive' } }
          ];
        }
      }

      const categories = await prisma.categories.findMany({
        where,
        include: {
          parentCategory: {
            select: { id: true, name: true, slug: true }
          },
          subcategories: {
            where: filter?.includeInactive ? {} : { isActive: true },
            select: { id: true, name: true, slug: true, isActive: true }
          }
        },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ]
      });

      return categories as CategoryWithRelations[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new CategoryServiceError(
        'Failed to fetch categories',
        500
      );
    }
  }

  /**
   * Get a category by ID
   * 
   * @param categoryId - The category ID
   * @returns Category with relations or null if not found
   */
  async getCategoryById(categoryId: string): Promise<CategoryWithRelations | null> {
    try {
      const category = await prisma.categories.findUnique({
        where: { id: categoryId },
        include: {
          parentCategory: {
            select: { id: true, name: true, slug: true }
          },
          subcategories: {
            where: { isActive: true },
            include: {
              _count: {
                select: {
                  products: true
                }
              }
            },
            orderBy: [
              { sortOrder: 'asc' },
              { name: 'asc' }
            ]
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
          },
          _count: {
            select: {
              products: true,
              subcategories: true
            }
          }
        }
      });

      return category as CategoryWithRelations | null;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw new CategoryServiceError(
        'Failed to fetch category',
        500
      );
    }
  }

  /**
   * Get a category by slug
   * 
   * @param slug - The category slug
   * @returns Category with relations or null if not found
   */
  async getCategoryBySlug(slug: string): Promise<CategoryWithRelations | null> {
    try {
      const category = await prisma.categories.findUnique({
        where: { slug },
        include: {
          parentCategory: {
            select: { id: true, name: true, slug: true }
          },
          subcategories: {
            where: { isActive: true },
            include: {
              _count: {
                select: {
                  products: true
                }
              }
            },
            orderBy: [
              { sortOrder: 'asc' },
              { name: 'asc' }
            ]
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
          },
          _count: {
            select: {
              products: true,
              subcategories: true
            }
          }
        }
      });

      return category as CategoryWithRelations | null;
    } catch (error) {
      console.error('Error fetching category by slug:', error);
      throw new CategoryServiceError(
        'Failed to fetch category',
        500
      );
    }
  }

  /**
   * Get category tree
   * 
   * @param includeInactive - Whether to include inactive categories
   * @returns Category tree structure
   */
  async getCategoryTree(includeInactive: boolean = false): Promise<CategoryTreeNode[]> {
    try {
      const categories = await prisma.categories.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ]
      });

      const tree = this.buildCategoryTree(categories);
      return tree;
    } catch (error) {
      console.error('Error fetching category tree:', error);
      throw new CategoryServiceError(
        'Failed to fetch category tree',
        500
      );
    }
  }

  /**
   * Build category tree from flat list
   * 
   * @param categories - Flat list of categories
   * @param parentId - Parent category ID (for recursion)
   * @param level - Current level in tree (for recursion)
   * @returns Category tree nodes
   */
  private buildCategoryTree(
    categories: Category[],
    parentId: string | null = null,
    level: number = 0
  ): CategoryTreeNode[] {
    return categories
      .filter(cat => cat.parentId === parentId)
      .map(cat => ({
        ...cat,
        children: this.buildCategoryTree(categories, cat.id, level + 1),
        level,
        path: this.buildCategoryPath(categories, cat.id)
      }));
  }

  /**
   * Build category path (breadcrumb)
   * 
   * @param categories - Flat list of categories
   * @param categoryId - The category ID
   * @returns Array of category IDs in path
   */
  private buildCategoryPath(categories: Category[], categoryId: string): string[] {
    const path: string[] = [];
    let currentCategory: Category | undefined = categories.find(cat => cat.id === categoryId);

    while (currentCategory) {
      path.unshift(currentCategory.id);
      if (currentCategory.parentId) {
        currentCategory = categories.find(cat => cat.id === currentCategory!.parentId);
      } else {
        currentCategory = undefined;
      }
    }

    return path;
  }

  /**
   * Create a new category
   * 
   * @param categoryData - The category data
   * @returns Created category
   */
  async createCategory(categoryData: CreateCategoryRequest): Promise<Category> {
    try {
      // Validate category name
      this.validateCategoryName(categoryData.name);

      // Validate slug
      this.validateSlug(categoryData.slug);

      // Check if slug already exists
      const existingCategory = await prisma.categories.findUnique({
        where: { slug: categoryData.slug }
      });

      if (existingCategory) {
        throw new CategoryServiceError(
          'Category with this slug already exists',
          409,
          'slug'
        );
      }

      // Validate parent category if provided
      if (categoryData.parentId) {
        const parentCategory = await prisma.categories.findUnique({
          where: { id: categoryData.parentId }
        });

        if (!parentCategory) {
          throw new CategoryServiceError(
            'Parent category not found',
            400,
            'parentId'
          );
        }
      }

      // Validate sortOrder
      const sortOrder = categoryData.sortOrder !== undefined ? categoryData.sortOrder : 0;
      if (sortOrder < 0) {
        throw new CategoryServiceError(
          'Sort order must be a non-negative number',
          400,
          'sortOrder'
        );
      }

      // Create category
      const category = await prisma.categories.create({
        data: {
          name: categoryData.name,
          slug: categoryData.slug,
          description: categoryData.description,
          parentId: categoryData.parentId,
          sortOrder,
          bannerImage: categoryData.bannerImage,
          icon: categoryData.icon,
          isActive: categoryData.isActive !== undefined ? categoryData.isActive : true
        }
      });

      return category;
    } catch (error) {
      if (error instanceof CategoryServiceError) {
        throw error;
      }
      console.error('Error creating category:', error);
      throw new CategoryServiceError(
        'Failed to create category',
        500
      );
    }
  }

  /**
   * Update a category
   * 
   * @param categoryId - The category ID
   * @param categoryData - The category data to update
   * @returns Updated category
   */
  async updateCategory(
    categoryId: string,
    categoryData: UpdateCategoryRequest
  ): Promise<Category> {
    try {
      // Check if category exists
      const existingCategory = await prisma.categories.findUnique({
        where: { id: categoryId }
      });

      if (!existingCategory) {
        throw new CategoryServiceError(
          'Category not found',
          404
        );
      }

      // Validate category name if provided
      if (categoryData.name) {
        this.validateCategoryName(categoryData.name);
      }

      // Validate slug if provided
      if (categoryData.slug) {
        this.validateSlug(categoryData.slug);

        // Check if slug conflicts with another category
        const slugConflict = await prisma.categories.findFirst({
          where: { slug: categoryData.slug, NOT: { id: categoryId } }
        });

        if (slugConflict) {
          throw new CategoryServiceError(
            'Category with this slug already exists',
            409,
            'slug'
          );
        }
      }

      // Validate parent category if provided
      if (categoryData.parentId !== undefined) {
        if (categoryData.parentId) {
          const parentCategory = await prisma.categories.findUnique({
            where: { id: categoryData.parentId }
          });

          if (!parentCategory) {
            throw new CategoryServiceError(
              'Parent category not found',
              400,
              'parentId'
            );
          }

          // Prevent circular reference
          if (categoryData.parentId === categoryId) {
            throw new CategoryServiceError(
              'Category cannot be its own parent',
              400,
              'parentId'
            );
          }

          // Check for circular references
          const hierarchyValidation = await this.validateCategoryHierarchy(
            categoryId,
            categoryData.parentId
          );

          if (!hierarchyValidation.isValid) {
            throw new CategoryServiceError(
              hierarchyValidation.error || 'Circular reference detected in category hierarchy',
              400,
              'parentId'
            );
          }
        }
      }

      // Validate sortOrder if provided
      if (categoryData.sortOrder !== undefined && categoryData.sortOrder < 0) {
        throw new CategoryServiceError(
          'Sort order must be a non-negative number',
          400,
          'sortOrder'
        );
      }

      // Update category
      const category = await prisma.categories.update({
        where: { id: categoryId },
        data: categoryData
      });

      return category;
    } catch (error) {
      if (error instanceof CategoryServiceError) {
        throw error;
      }
      console.error('Error updating category:', error);
      throw new CategoryServiceError(
        'Failed to update category',
        500
      );
    }
  }

  /**
   * Delete a category
   * 
   * @param categoryId - The category ID
   * @returns Deleted category
   */
  async deleteCategory(categoryId: string): Promise<Category> {
    try {
      // Check if category exists
      const category = await prisma.categories.findUnique({
        where: { id: categoryId },
        include: {
          _count: {
            select: {
              products: true,
              subcategories: true
            }
          }
        }
      });

      if (!category) {
        throw new CategoryServiceError(
          'Category not found',
          404
        );
      }

      // Check if category has products or subcategories
      if (category._count.products > 0 || category._count.subcategories > 0) {
        throw new CategoryServiceError(
          'Cannot delete category with existing products or subcategories. Consider deactivating it instead.',
          400
        );
      }

      // Delete category
      const deletedCategory = await prisma.categories.delete({
        where: { id: categoryId }
      });

      return deletedCategory;
    } catch (error) {
      if (error instanceof CategoryServiceError) {
        throw error;
      }
      console.error('Error deleting category:', error);
      throw new CategoryServiceError(
        'Failed to delete category',
        500
      );
    }
  }

  /**
   * Move a category to a new parent
   * 
   * @param operation - Move operation details
   * @returns Move result
   */
  async moveCategory(operation: CategoryMoveOperation): Promise<CategoryMoveResult> {
    try {
      // Check if category exists
      const category = await prisma.categories.findUnique({
        where: { id: operation.categoryId }
      });

      if (!category) {
        return {
          success: false,
          error: 'Category not found'
        };
      }

      // Validate new parent if provided
      if (operation.newParentId) {
        const parentCategory = await prisma.categories.findUnique({
          where: { id: operation.newParentId }
        });

        if (!parentCategory) {
          return {
            success: false,
            error: 'Parent category not found'
          };
        }

        // Prevent circular reference
        if (operation.newParentId === operation.categoryId) {
          return {
            success: false,
            error: 'Category cannot be its own parent'
          };
        }

        // Check for circular references
        const hierarchyValidation = await this.validateCategoryHierarchy(
          operation.categoryId,
          operation.newParentId
        );

        if (!hierarchyValidation.isValid) {
          return {
            success: false,
            error: hierarchyValidation.error || 'Circular reference detected in category hierarchy'
          };
        }
      }

      // Update category
      const updatedCategory = await prisma.categories.update({
        where: { id: operation.categoryId },
        data: {
          parentId: operation.newParentId,
          sortOrder: operation.newSortOrder
        }
      });

      return {
        success: true,
        category: updatedCategory as CategoryWithRelations
      };
    } catch (error) {
      console.error('Error moving category:', error);
      return {
        success: false,
        error: 'Failed to move category'
      };
    }
  }

  /**
   * Activate or deactivate a category
   * 
   * @param categoryId - The category ID
   * @param isActive - Whether category should be active
   * @returns Updated category
   */
  async setCategoryActive(categoryId: string, isActive: boolean): Promise<Category> {
    try {
      const category = await prisma.categories.update({
        where: { id: categoryId },
        data: { isActive }
      });

      return category;
    } catch (error) {
      console.error('Error setting category active status:', error);
      throw new CategoryServiceError(
        'Failed to set category active status',
        500
      );
    }
  }

  /**
   * Validate category hierarchy for circular references
   * 
   * @param categoryId - The category ID to move
   * @param newParentId - The new parent category ID
   * @returns Validation result
   */
  async validateCategoryHierarchy(
    categoryId: string,
    newParentId: string
  ): Promise<CategoryHierarchyValidationResult> {
    try {
      // Get all descendants of the category being moved
      const descendants = await this.getAllDescendants(categoryId);

      // Check if new parent is a descendant
      if (descendants.includes(newParentId)) {
        return {
          isValid: false,
          hasCircularReference: true,
          error: 'Cannot move category to its own descendant',
          circularPath: [categoryId, ...descendants, newParentId]
        };
      }

      return {
        isValid: true,
        hasCircularReference: false
      };
    } catch (error) {
      console.error('Error validating category hierarchy:', error);
      return {
        isValid: false,
        hasCircularReference: false,
        error: 'Failed to validate category hierarchy'
      };
    }
  }

  /**
   * Get all descendants of a category
   * 
   * @param categoryId - The category ID
   * @returns Array of descendant category IDs
   */
  private async getAllDescendants(categoryId: string): Promise<string[]> {
    const descendants: string[] = [];
    const queue = [categoryId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await prisma.categories.findMany({
        where: { parentId: currentId },
        select: { id: true }
      });

      children.forEach(child => {
        descendants.push(child.id);
        queue.push(child.id);
      });
    }

    return descendants;
  }

  /**
   * Get product count for all categories
   * 
   * @returns Array of category product counts
   */
  async getCategoryProductCounts(): Promise<CategoryProductCount[]> {
    try {
      const categories = await prisma.categories.findMany({
        include: {
          _count: {
            select: {
              products: true,
              subcategories: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return categories.map(category => ({
        categoryId: category.id,
        categoryName: category.name,
        totalProducts: category._count.products,
        activeProducts: category.isActive ? category._count.products : 0,
        inactiveProducts: category.isActive ? 0 : category._count.products,
        subcategoryCount: category._count.subcategories
      }));
    } catch (error) {
      console.error('Error fetching category product counts:', error);
      throw new CategoryServiceError(
        'Failed to fetch category product counts',
        500
      );
    }
  }

  /**
   * Validate category name
   * 
   * @param name - The category name to validate
   * @throws CategoryServiceError if name is invalid
   */
  private validateCategoryName(name: string): void {
    if (!name || name.trim() === '') {
      throw new CategoryServiceError(
        'Category name is required',
        400,
        'name'
      );
    }

    if (name.length > 255) {
      throw new CategoryServiceError(
        'Category name cannot exceed 255 characters',
        400,
        'name'
      );
    }
  }

  /**
   * Validate slug
   * 
   * @param slug - The slug to validate
   * @throws CategoryServiceError if slug is invalid
   */
  private validateSlug(slug: string): void {
    if (!slug || slug.trim() === '') {
      throw new CategoryServiceError(
        'Slug is required',
        400,
        'slug'
      );
    }

    // Validate slug format (lowercase, alphanumeric, hyphens)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      throw new CategoryServiceError(
        'Slug must contain only lowercase letters, numbers, and hyphens',
        400,
        'slug'
      );
    }

    if (slug.length > 255) {
      throw new CategoryServiceError(
        'Slug cannot exceed 255 characters',
        400,
        'slug'
      );
    }
  }

  /**
   * Bulk update categories
   * 
   * @param categoryIds - Array of category IDs
   * @param updates - The updates to apply to all categories
   * @returns Updated categories
   */
  async bulkUpdateCategories(
    categoryIds: string[],
    updates: Partial<UpdateCategoryRequest>
  ): Promise<Category[]> {
    try {
      // Validate updates
      if (updates.name) {
        this.validateCategoryName(updates.name);
      }
      if (updates.slug) {
        this.validateSlug(updates.slug);
      }
      if (updates.sortOrder !== undefined && updates.sortOrder < 0) {
        throw new CategoryServiceError(
          'Sort order must be a non-negative number',
          400,
          'sortOrder'
        );
      }

      // Update categories in a transaction
      const updatedCategories = await prisma.$transaction(
        categoryIds.map(categoryId =>
          prisma.category.update({
            where: { id: categoryId },
            data: updates
          })
        )
      );

      return updatedCategories;
    } catch (error) {
      if (error instanceof CategoryServiceError) {
        throw error;
      }
      console.error('Error bulk updating categories:', error);
      throw new CategoryServiceError(
        'Failed to bulk update categories',
        500
      );
    }
  }

  /**
   * Bulk delete categories
   * 
   * @param categoryIds - Array of category IDs
   * @returns Number of deleted categories
   */
  async bulkDeleteCategories(categoryIds: string[]): Promise<number> {
    try {
      // Check if any category has products or subcategories
      const categories = await prisma.categories.findMany({
        where: { id: { in: categoryIds } },
        include: {
          _count: {
            select: {
              products: true,
              subcategories: true
            }
          }
        }
      });

      const categoriesWithDependencies = categories.filter(
        c => c._count.products > 0 || c._count.subcategories > 0
      );
      if (categoriesWithDependencies.length > 0) {
        throw new CategoryServiceError(
          `Cannot delete categories with existing products or subcategories: ${categoriesWithDependencies.map(c => c.name).join(', ')}`,
          400
        );
      }

      const result = await prisma.categories.deleteMany({
        where: { id: { in: categoryIds } }
      });

      return result.count;
    } catch (error) {
      if (error instanceof CategoryServiceError) {
        throw error;
      }
      console.error('Error bulk deleting categories:', error);
      throw new CategoryServiceError(
        'Failed to bulk delete categories',
        500
      );
    }
  }
}

// Export singleton instance
export const categoryService = new CategoryService();
