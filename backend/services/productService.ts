/**
 * Product Service
 * 
 * This service handles all business logic related to products including
 * CRUD operations, search and filtering, relationship management,
 * status management, inventory management, and SEO field management.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import {
  Product,
  ProductWithRelations,
  CreateProductRequest,
  UpdateProductRequest,
  ProductSearchFilter,
  ProductSearchResponse,
  ProductInventoryStatus,
  ProductPriceCalculation,
  ProductSEOData,
  ProductDuplicateCheckResult
} from '../types/product.types';
import { productImageService } from './productImageService';
import { productSpecificationService } from './productSpecificationService';
import { productVariantService } from './productVariantService';

const prisma = new PrismaClient();

/**
 * Custom error class for Product Service
 */
export class ProductServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public field?: string
  ) {
    super(message);
    this.name = 'ProductServiceError';
  }
}

/**
 * Product Service Class
 */
export class ProductService {
  /**
   * Get products with filtering and pagination
   * 
   * @param filter - Search and filter options
   * @returns Product search response
   */
  async getProducts(filter?: ProductSearchFilter): Promise<ProductSearchResponse> {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        brand,
        search,
        minPrice,
        maxPrice,
        status = 'active',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        isFeatured,
        isNewArrival,
        isBestSeller
      } = filter || {};

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = { status };

      if (category) where.categoryId = category;
      if (brand) where.brandId = brand;
      if (isFeatured !== undefined) where.isFeatured = isFeatured;
      if (isNewArrival !== undefined) where.isNewArrival = isNewArrival;
      if (isBestSeller !== undefined) where.isBestSeller = isBestSeller;

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { nameEn: { contains: search, mode: 'insensitive' } },
          { nameBn: { contains: search, mode: 'insensitive' } },
          { shortDescription: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.regularPrice = {};
        if (minPrice !== undefined) where.regularPrice.gte = parseFloat(minPrice.toString());
        if (maxPrice !== undefined) where.regularPrice.lte = parseFloat(maxPrice.toString());
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          include: {
            category: {
              select: { id: true, name: true, slug: true }
            },
            brand: {
              select: { id: true, name: true, slug: true }
            },
            images: {
              where: { sortOrder: 0 },
              take: 1,
              select: { id: true, url: true, alt: true }
            },
            _count: {
              select: {
                reviews: true,
                cartItems: true,
                orderItems: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.product.count({ where })
      ]);

      return {
        products: products as ProductWithRelations[],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new ProductServiceError(
        'Failed to fetch products',
        500
      );
    }
  }

  /**
   * Get a product by ID
   * 
   * @param productId - The product ID
   * @returns Product with relations or null if not found
   */
  async getProductById(productId: string): Promise<ProductWithRelations | null> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          brand: true,
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          specifications: {
            orderBy: { sortOrder: 'asc' }
          },
          variants: {
            where: { isActive: true },
            orderBy: { name: 'asc' }
          },
          reviews: {
            where: { isApproved: true },
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          _count: {
            select: {
              reviews: true
            }
          }
        }
      });

      if (!product) {
        return null;
      }

      // Calculate average rating
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0;

      return {
        ...product,
        avgRating: Math.round(avgRating * 10) / 10
      } as ProductWithRelations;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new ProductServiceError(
        'Failed to fetch product',
        500
      );
    }
  }

  /**
   * Get a product by slug
   * 
   * @param slug - The product slug
   * @returns Product with relations or null if not found
   */
  async getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
    try {
      const product = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: true,
          brand: true,
          images: {
            orderBy: { sortOrder: 'asc' }
          },
          specifications: {
            orderBy: { sortOrder: 'asc' }
          },
          variants: {
            where: { isActive: true },
            orderBy: { name: 'asc' }
          },
          reviews: {
            where: { isApproved: true },
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          _count: {
            select: {
              reviews: true
            }
          }
        }
      });

      if (!product) {
        return null;
      }

      // Calculate average rating
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0;

      return {
        ...product,
        avgRating: Math.round(avgRating * 10) / 10
      } as ProductWithRelations;
    } catch (error) {
      console.error('Error fetching product by slug:', error);
      throw new ProductServiceError(
        'Failed to fetch product',
        500
      );
    }
  }

  /**
   * Get featured products
   * 
   * @param limit - Maximum number of products to return
   * @returns Array of featured products
   */
  async getFeaturedProducts(limit: number = 20): Promise<ProductWithRelations[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          isFeatured: true,
          status: 'active'
        },
        include: {
          category: {
            select: { id: true, name: true, slug: true }
          },
          brand: {
            select: { id: true, name: true, slug: true }
          },
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
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return products as ProductWithRelations[];
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw new ProductServiceError(
        'Failed to fetch featured products',
        500
      );
    }
  }

  /**
   * Get new arrival products
   * 
   * @param limit - Maximum number of products to return
   * @returns Array of new arrival products
   */
  async getNewArrivalProducts(limit: number = 20): Promise<ProductWithRelations[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          isNewArrival: true,
          status: 'active'
        },
        include: {
          category: {
            select: { id: true, name: true, slug: true }
          },
          brand: {
            select: { id: true, name: true, slug: true }
          },
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
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return products as ProductWithRelations[];
    } catch (error) {
      console.error('Error fetching new arrival products:', error);
      throw new ProductServiceError(
        'Failed to fetch new arrival products',
        500
      );
    }
  }

  /**
   * Get best seller products
   * 
   * @param limit - Maximum number of products to return
   * @returns Array of best seller products
   */
  async getBestSellerProducts(limit: number = 20): Promise<ProductWithRelations[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          isBestSeller: true,
          status: 'active'
        },
        include: {
          category: {
            select: { id: true, name: true, slug: true }
          },
          brand: {
            select: { id: true, name: true, slug: true }
          },
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
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return products as ProductWithRelations[];
    } catch (error) {
      console.error('Error fetching best seller products:', error);
      throw new ProductServiceError(
        'Failed to fetch best seller products',
        500
      );
    }
  }

  /**
   * Create a new product
   * 
   * @param productData - The product data
   * @returns Created product
   */
  async createProduct(productData: CreateProductRequest): Promise<Product> {
    try {
      // Validate product data
      this.validateProductData(productData);

      // Check if SKU already exists
      const existingSku = await prisma.product.findUnique({
        where: { sku: productData.sku }
      });

      if (existingSku) {
        throw new ProductServiceError(
          'Product with this SKU already exists',
          409,
          'sku'
        );
      }

      // Check if slug already exists
      const existingSlug = await prisma.product.findUnique({
        where: { slug: productData.slug }
      });

      if (existingSlug) {
        throw new ProductServiceError(
          'Product with this slug already exists',
          409,
          'slug'
        );
      }

      // Validate category exists
      const category = await prisma.category.findUnique({
        where: { id: productData.categoryId }
      });

      if (!category) {
        throw new ProductServiceError(
          'Category not found',
          400,
          'categoryId'
        );
      }

      // Validate brand exists
      const brand = await prisma.brand.findUnique({
        where: { id: productData.brandId }
      });

      if (!brand) {
        throw new ProductServiceError(
          'Brand not found',
          400,
          'brandId'
        );
      }

      // Create product
      const product = await prisma.product.create({
        data: {
          sku: productData.sku,
          name: productData.name,
          nameEn: productData.nameEn,
          nameBn: productData.nameBn,
          slug: productData.slug,
          shortDescription: productData.shortDescription,
          description: productData.description,
          categoryId: productData.categoryId,
          brandId: productData.brandId,
          regularPrice: parseFloat(productData.regularPrice.toString()),
          salePrice: productData.salePrice ? parseFloat(productData.salePrice.toString()) : null,
          costPrice: parseFloat(productData.costPrice.toString()),
          taxRate: productData.taxRate !== undefined ? parseFloat(productData.taxRate.toString()) : 0,
          stockQuantity: parseInt(productData.stockQuantity.toString()),
          lowStockThreshold: productData.lowStockThreshold !== undefined ? parseInt(productData.lowStockThreshold.toString()) : 10,
          status: productData.status || 'active',
          metaTitle: productData.metaTitle,
          metaDescription: productData.metaDescription,
          metaKeywords: productData.metaKeywords,
          isFeatured: productData.isFeatured || false,
          isNewArrival: productData.isNewArrival || false,
          isBestSeller: productData.isBestSeller || false,
          warrantyPeriod: productData.warrantyPeriod,
          warrantyType: productData.warrantyType,
          publishedAt: productData.status === 'active' ? new Date() : undefined
        }
      });

      return product;
    } catch (error) {
      if (error instanceof ProductServiceError) {
        throw error;
      }
      console.error('Error creating product:', error);
      throw new ProductServiceError(
        'Failed to create product',
        500
      );
    }
  }

  /**
   * Update a product
   * 
   * @param productId - The product ID
   * @param productData - The product data to update
   * @returns Updated product
   */
  async updateProduct(
    productId: string,
    productData: UpdateProductRequest
  ): Promise<Product> {
    try {
      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!existingProduct) {
        throw new ProductServiceError(
          'Product not found',
          404
        );
      }

      // Validate SKU if provided
      if (productData.sku && productData.sku !== existingProduct.sku) {
        const skuConflict = await prisma.product.findFirst({
          where: { sku: productData.sku, NOT: { id: productId } }
        });

        if (skuConflict) {
          throw new ProductServiceError(
            'Product with this SKU already exists',
            409,
            'sku'
          );
        }
      }

      // Validate slug if provided
      if (productData.slug && productData.slug !== existingProduct.slug) {
        const slugConflict = await prisma.product.findFirst({
          where: { slug: productData.slug, NOT: { id: productId } }
        });

        if (slugConflict) {
          throw new ProductServiceError(
            'Product with this slug already exists',
            409,
            'slug'
          );
        }
      }

      // Validate category if provided
      if (productData.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: productData.categoryId }
        });

        if (!category) {
          throw new ProductServiceError(
            'Category not found',
            400,
            'categoryId'
          );
        }
      }

      // Validate brand if provided
      if (productData.brandId) {
        const brand = await prisma.brand.findUnique({
          where: { id: productData.brandId }
        });

        if (!brand) {
          throw new ProductServiceError(
            'Brand not found',
            400,
            'brandId'
          );
        }
      }

      // Clean update data
      const cleanUpdateData: any = {};
      Object.keys(productData).forEach(key => {
        if (productData[key as keyof UpdateProductRequest] !== undefined) {
          const value = productData[key as keyof UpdateProductRequest];
          if (['regularPrice', 'salePrice', 'costPrice'].includes(key)) {
            cleanUpdateData[key] = parseFloat(value!.toString());
          } else if (['stockQuantity', 'lowStockThreshold'].includes(key)) {
            cleanUpdateData[key] = parseInt(value!.toString());
          } else {
            cleanUpdateData[key] = value;
          }
        }
      });

      // Update product
      const product = await prisma.product.update({
        where: { id: productId },
        data: cleanUpdateData
      });

      return product;
    } catch (error) {
      if (error instanceof ProductServiceError) {
        throw error;
      }
      console.error('Error updating product:', error);
      throw new ProductServiceError(
        'Failed to update product',
        500
      );
    }
  }

  /**
   * Delete a product
   * 
   * @param productId - The product ID
   * @returns Deleted product
   */
  async deleteProduct(productId: string): Promise<Product> {
    try {
      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          _count: {
            select: {
              orderItems: true,
              cartItems: true,
              wishlistItems: true
            }
          }
        }
      });

      if (!product) {
        throw new ProductServiceError(
          'Product not found',
          404
        );
      }

      // Check if product is referenced in orders
      if (product._count.orderItems > 0) {
        throw new ProductServiceError(
          'Cannot delete product with existing orders. Consider discontinuing the product instead.',
          400
        );
      }

      // Delete product
      const deletedProduct = await prisma.product.delete({
        where: { id: productId }
      });

      return deletedProduct;
    } catch (error) {
      if (error instanceof ProductServiceError) {
        throw error;
      }
      console.error('Error deleting product:', error);
      throw new ProductServiceError(
        'Failed to delete product',
        500
      );
    }
  }

  /**
   * Update product status
   * 
   * @param productId - The product ID
   * @param status - The new status
   * @returns Updated product
   */
  async updateProductStatus(
    productId: string,
    status: 'active' | 'inactive' | 'out_of_stock' | 'discontinued'
  ): Promise<Product> {
    try {
      const product = await prisma.product.update({
        where: { id: productId },
        data: { status }
      });

      return product;
    } catch (error) {
      console.error('Error updating product status:', error);
      throw new ProductServiceError(
        'Failed to update product status',
        500
      );
    }
  }

  /**
   * Get inventory status for a product
   * 
   * @param productId - The product ID
   * @returns Product inventory status
   */
  async getProductInventoryStatus(productId: string): Promise<ProductInventoryStatus> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          lowStockThreshold: true
        }
      });

      if (!product) {
        throw new ProductServiceError(
          'Product not found',
          404
        );
      }

      const stock = product.stockQuantity;
      const threshold = product.lowStockThreshold;
      let status: 'in_stock' | 'low_stock' | 'out_of_stock';
      let needsRestock = false;

      if (stock === 0) {
        status = 'out_of_stock';
      } else if (stock <= threshold) {
        status = 'low_stock';
        needsRestock = true;
      } else {
        status = 'in_stock';
      }

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock: stock,
        lowStockThreshold: threshold,
        status,
        needsRestock
      };
    } catch (error) {
      if (error instanceof ProductServiceError) {
        throw error;
      }
      console.error('Error fetching product inventory status:', error);
      throw new ProductServiceError(
        'Failed to fetch product inventory status',
        500
      );
    }
  }

  /**
   * Get low stock products
   * 
   * @param threshold - The low stock threshold
   * @returns Array of low stock products
   */
  async getLowStockProducts(threshold?: number): Promise<ProductInventoryStatus[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          status: 'active'
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          lowStockThreshold: true
        },
        orderBy: { stockQuantity: 'asc' }
      });

      return products.map(product => {
        const stock = product.stockQuantity;
        const lowThreshold = threshold !== undefined ? threshold : product.lowStockThreshold;
        let status: 'in_stock' | 'low_stock' | 'out_of_stock';
        let needsRestock = false;

        if (stock === 0) {
          status = 'out_of_stock';
        } else if (stock <= lowThreshold) {
          status = 'low_stock';
          needsRestock = true;
        } else {
          status = 'in_stock';
        }

        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          currentStock: stock,
          lowStockThreshold: lowThreshold,
          status,
          needsRestock
        };
      });
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw new ProductServiceError(
        'Failed to fetch low stock products',
        500
      );
    }
  }

  /**
   * Get out of stock products
   * 
   * @returns Array of out of stock products
   */
  async getOutOfStockProducts(): Promise<ProductInventoryStatus[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          stockQuantity: 0,
          status: { in: ['active', 'out_of_stock'] }
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          lowStockThreshold: true
        },
        orderBy: { name: 'asc' }
      });

      return products.map(product => ({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        status: 'out_of_stock',
        needsRestock: true
      }));
    } catch (error) {
      console.error('Error fetching out of stock products:', error);
      throw new ProductServiceError(
        'Failed to fetch out of stock products',
        500
      );
    }
  }

  /**
   * Calculate product price with tax
   * 
   * @param productId - The product ID
   * @returns Price calculation result
   */
  async calculateProductPrice(productId: string): Promise<ProductPriceCalculation> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          regularPrice: true,
          salePrice: true,
          taxRate: true
        }
      });

      if (!product) {
        throw new ProductServiceError(
          'Product not found',
          404
        );
      }

      const regularPrice = Number(product.regularPrice);
      const salePrice = product.salePrice ? Number(product.salePrice) : null;
      const finalPrice = salePrice ? Math.min(regularPrice, salePrice) : regularPrice;
      const discountAmount = salePrice && salePrice < regularPrice ? regularPrice - salePrice : 0;
      const discountPercentage = discountAmount > 0 ? (discountAmount / regularPrice) * 100 : 0;
      const taxRate = Number(product.taxRate);
      const taxAmount = finalPrice * (taxRate / 100);
      const totalPrice = finalPrice + taxAmount;

      return {
        productId: product.id,
        regularPrice,
        salePrice,
        finalPrice,
        discountAmount,
        discountPercentage,
        taxRate,
        taxAmount,
        totalPrice
      };
    } catch (error) {
      if (error instanceof ProductServiceError) {
        throw error;
      }
      console.error('Error calculating product price:', error);
      throw new ProductServiceError(
        'Failed to calculate product price',
        500
      );
    }
  }

  /**
   * Get SEO data for a product
   * 
   * @param productId - The product ID
   * @returns Product SEO data
   */
  async getProductSEOData(productId: string): Promise<ProductSEOData> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          images: {
            where: { sortOrder: 0 },
            take: 1,
            select: { url: true }
          }
        }
      });

      if (!product) {
        throw new ProductServiceError(
          'Product not found',
          404
        );
      }

      const metaTitle = product.metaTitle || product.name;
      const metaDescription = product.metaDescription || product.shortDescription || product.description;
      const metaKeywords = product.metaKeywords || product.name;
      const ogImage = product.images[0]?.url;

      return {
        productId: product.id,
        productName: product.name,
        metaTitle,
        metaDescription: metaDescription || '',
        metaKeywords,
        slug: product.slug,
        canonicalUrl: `/products/${product.slug}`,
        ogTitle: metaTitle,
        ogDescription: metaDescription || '',
        ogImage
      };
    } catch (error) {
      if (error instanceof ProductServiceError) {
        throw error;
      }
      console.error('Error fetching product SEO data:', error);
      throw new ProductServiceError(
        'Failed to fetch product SEO data',
        500
      );
    }
  }

  /**
   * Check for duplicate SKU or slug
   * 
   * @param sku - The SKU to check
   * @param slug - The slug to check
   * @param excludeId - Product ID to exclude from check
   * @returns Duplicate check result
   */
  async checkProductDuplicates(
    sku: string,
    slug: string,
    excludeId?: string
  ): Promise<ProductDuplicateCheckResult> {
    try {
      const where: any = {
        OR: [
          { sku },
          { slug }
        ]
      };

      if (excludeId) {
        where.NOT = { id: excludeId };
      }

      const products = await prisma.product.findMany({
        where,
        select: {
          id: true,
          sku: true,
          slug: true
        }
      });

      const hasDuplicateSku = products.some(p => p.sku === sku);
      const hasDuplicateSlug = products.some(p => p.slug === slug);

      return {
        hasDuplicateSku,
        hasDuplicateSlug,
        duplicateSkuProduct: products.find(p => p.sku === sku) as Product | undefined,
        duplicateSlugProduct: products.find(p => p.slug === slug) as Product | undefined
      };
    } catch (error) {
      console.error('Error checking product duplicates:', error);
      throw new ProductServiceError(
        'Failed to check product duplicates',
        500
      );
    }
  }

  /**
   * Validate product data
   * 
   * @param productData - The product data to validate
   * @throws ProductServiceError if data is invalid
   */
  private validateProductData(productData: CreateProductRequest): void {
    // Validate required fields
    if (!productData.name || productData.name.trim() === '') {
      throw new ProductServiceError(
        'Product name is required',
        400,
        'name'
      );
    }

    if (!productData.nameEn || productData.nameEn.trim() === '') {
      throw new ProductServiceError(
        'Product English name is required',
        400,
        'nameEn'
      );
    }

    if (!productData.slug || productData.slug.trim() === '') {
      throw new ProductServiceError(
        'Product slug is required',
        400,
        'slug'
      );
    }

    if (!productData.sku || productData.sku.trim() === '') {
      throw new ProductServiceError(
        'Product SKU is required',
        400,
        'sku'
      );
    }

    if (!productData.categoryId) {
      throw new ProductServiceError(
        'Product category is required',
        400,
        'categoryId'
      );
    }

    if (!productData.brandId) {
      throw new ProductServiceError(
        'Product brand is required',
        400,
        'brandId'
      );
    }

    // Validate name length
    if (productData.name.length > 255) {
      throw new ProductServiceError(
        'Product name cannot exceed 255 characters',
        400,
        'name'
      );
    }

    if (productData.nameEn.length > 255) {
      throw new ProductServiceError(
        'Product English name cannot exceed 255 characters',
        400,
        'nameEn'
      );
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(productData.slug)) {
      throw new ProductServiceError(
        'Slug must contain only lowercase letters, numbers, and hyphens',
        400,
        'slug'
      );
    }

    if (productData.slug.length > 255) {
      throw new ProductServiceError(
        'Slug cannot exceed 255 characters',
        400,
        'slug'
      );
    }

    // Validate SKU length
    if (productData.sku.length > 100) {
      throw new ProductServiceError(
        'SKU cannot exceed 100 characters',
        400,
        'sku'
      );
    }

    // Validate prices
    if (productData.regularPrice < 0) {
      throw new ProductServiceError(
        'Regular price must be a non-negative number',
        400,
        'regularPrice'
      );
    }

    if (productData.salePrice !== undefined && productData.salePrice < 0) {
      throw new ProductServiceError(
        'Sale price must be a non-negative number',
        400,
        'salePrice'
      );
    }

    if (productData.costPrice < 0) {
      throw new ProductServiceError(
        'Cost price must be a non-negative number',
        400,
        'costPrice'
      );
    }

    // Validate stock
    if (!Number.isInteger(productData.stockQuantity)) {
      throw new ProductServiceError(
        'Stock quantity must be an integer',
        400,
        'stockQuantity'
      );
    }

    if (productData.stockQuantity < 0) {
      throw new ProductServiceError(
        'Stock quantity must be a non-negative number',
        400,
        'stockQuantity'
      );
    }

    // Validate tax rate
    if (productData.taxRate !== undefined && productData.taxRate < 0) {
      throw new ProductServiceError(
        'Tax rate must be a non-negative number',
        400,
        'taxRate'
      );
    }

    // Validate warranty
    if (productData.warrantyPeriod !== undefined && productData.warrantyPeriod < 0) {
      throw new ProductServiceError(
        'Warranty period must be a non-negative number',
        400,
        'warrantyPeriod'
      );
    }
  }

  /**
   * Bulk update products
   * 
   * @param productIds - Array of product IDs
   * @param updates - The updates to apply to all products
   * @returns Update result
   */
  async bulkUpdateProducts(
    productIds: string[],
    updates: Partial<UpdateProductRequest>
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ productId: string; error: string }>;
  }> {
    try {
      const errors: Array<{ productId: string; error: string }> = [];
      const successProducts: string[] = [];

      // Process each product
      for (const productId of productIds) {
        try {
          await this.updateProduct(productId, updates);
          successProducts.push(productId);
        } catch (error) {
          if (error instanceof ProductServiceError) {
            errors.push({
              productId,
              error: error.message
            });
          } else {
            errors.push({
              productId,
              error: 'Unknown error occurred'
            });
          }
        }
      }

      return {
        success: successProducts.length,
        failed: errors.length,
        errors
      };
    } catch (error) {
      console.error('Error bulk updating products:', error);
      throw new ProductServiceError(
        'Failed to bulk update products',
        500
      );
    }
  }

  /**
   * Bulk delete products
   * 
   * @param productIds - Array of product IDs
   * @returns Delete result
   */
  async bulkDeleteProducts(productIds: string[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ productId: string; error: string }>;
  }> {
    try {
      const errors: Array<{ productId: string; error: string }> = [];
      const successProducts: string[] = [];

      // Process each product
      for (const productId of productIds) {
        try {
          await this.deleteProduct(productId);
          successProducts.push(productId);
        } catch (error) {
          if (error instanceof ProductServiceError) {
            errors.push({
              productId,
              error: error.message
            });
          } else {
            errors.push({
              productId,
              error: 'Unknown error occurred'
            });
          }
        }
      }

      return {
        success: successProducts.length,
        failed: errors.length,
        errors
      };
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      throw new ProductServiceError(
        'Failed to bulk delete products',
        500
      );
    }
  }

  /**
   * Update product stock
   * 
   * @param productId - The product ID
   * @param quantity - The quantity to add (positive) or subtract (negative)
   * @returns Updated product
   */
  async updateProductStock(productId: string, quantity: number): Promise<Product> {
    try {
      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!existingProduct) {
        throw new ProductServiceError(
          'Product not found',
          404
        );
      }

      const newStock = existingProduct.stockQuantity + quantity;

      // Validate new stock
      if (!Number.isInteger(newStock)) {
        throw new ProductServiceError(
          'Stock quantity must be an integer',
          400
        );
      }

      if (newStock < 0) {
        throw new ProductServiceError(
          'Stock quantity cannot be negative',
          400
        );
      }

      // Update stock
      const product = await prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock }
      });

      // Update status based on stock
      if (newStock === 0 && existingProduct.status === 'active') {
        await this.updateProductStatus(productId, 'out_of_stock');
      } else if (newStock > 0 && existingProduct.status === 'out_of_stock') {
        await this.updateProductStatus(productId, 'active');
      }

      return product;
    } catch (error) {
      if (error instanceof ProductServiceError) {
        throw error;
      }
      console.error('Error updating product stock:', error);
      throw new ProductServiceError(
        'Failed to update product stock',
        500
      );
    }
  }

  /**
   * Set product as featured
   * 
   * @param productId - The product ID
   * @param isFeatured - Whether product should be featured
   * @returns Updated product
   */
  async setProductFeatured(productId: string, isFeatured: boolean): Promise<Product> {
    try {
      const product = await prisma.product.update({
        where: { id: productId },
        data: { isFeatured }
      });

      return product;
    } catch (error) {
      console.error('Error setting product featured:', error);
      throw new ProductServiceError(
        'Failed to set product featured',
        500
      );
    }
  }

  /**
   * Set product as new arrival
   * 
   * @param productId - The product ID
   * @param isNewArrival - Whether product should be new arrival
   * @returns Updated product
   */
  async setProductNewArrival(productId: string, isNewArrival: boolean): Promise<Product> {
    try {
      const product = await prisma.product.update({
        where: { id: productId },
        data: { isNewArrival }
      });

      return product;
    } catch (error) {
      console.error('Error setting product new arrival:', error);
      throw new ProductServiceError(
        'Failed to set product new arrival',
        500
      );
    }
  }

  /**
   * Set product as best seller
   * 
   * @param productId - The product ID
   * @param isBestSeller - Whether product should be best seller
   * @returns Updated product
   */
  async setProductBestSeller(productId: string, isBestSeller: boolean): Promise<Product> {
    try {
      const product = await prisma.product.update({
        where: { id: productId },
        data: { isBestSeller }
      });

      return product;
    } catch (error) {
      console.error('Error setting product best seller:', error);
      throw new ProductServiceError(
        'Failed to set product best seller',
        500
      );
    }
  }
}

// Export singleton instance
export const productService = new ProductService();
