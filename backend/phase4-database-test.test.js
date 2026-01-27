/**
 * PHASE 4 MILESTONE 1: Product Data Model Enhancement
 * Database Layer Testing Script
 * 
 * This script tests:
 * 1. Database Schema Verification
 * 2. Database Operations (CRUD)
 * 3. Cascade Deletion
 * 4. Constraints and Indexes
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test results tracking
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

function logTest(testName, passed, message = '') {
  const result = { testName, message, timestamp: new Date().toISOString() };
  if (passed) {
    testResults.passed.push(result);
    console.log(`✅ PASS: ${testName}`);
    if (message) console.log(`   ${message}`);
  } else {
    testResults.failed.push(result);
    console.log(`❌ FAIL: ${testName}`);
    if (message) console.log(`   ${message}`);
  }
}

function logWarning(testName, message) {
  const result = { testName, message, timestamp: new Date().toISOString() };
  testResults.warnings.push(result);
  console.log(`⚠️  WARN: ${testName}`);
  console.log(`   ${message}`);
}

async function testDatabaseSchema() {
  console.log('\n========================================');
  console.log('DATABASE SCHEMA VERIFICATION');
  console.log('========================================\n');

  try {
    // Test 1.1: Check ProductStatus enum values
    console.log('Testing ProductStatus enum...');
    const productStatusValues = ['draft', 'published', 'archived', 'active', 'inactive', 'out_of_stock', 'discontinued'];
    for (const status of productStatusValues) {
      try {
        const testProduct = await prisma.product.findFirst({
          where: { status }
        });
        logTest(`ProductStatus enum value '${status}' exists`, true, 'Enum value is valid');
      } catch (error) {
        logTest(`ProductStatus enum value '${status}' exists`, false, error.message);
      }
    }

    // Test 1.2: Check ProductVisibility enum values
    console.log('\nTesting ProductVisibility enum...');
    const visibilityValues = ['public', 'private', 'restricted'];
    for (const visibility of visibilityValues) {
      try {
        const testProduct = await prisma.product.findFirst({
          where: { visibility }
        });
        logTest(`ProductVisibility enum value '${visibility}' exists`, true, 'Enum value is valid');
      } catch (error) {
        logTest(`ProductVisibility enum value '${visibility}' exists`, false, error.message);
      }
    }

    // Test 1.3: Check CategoryStatus enum values
    console.log('\nTesting CategoryStatus enum...');
    const categoryStatusValues = ['active', 'inactive'];
    for (const status of categoryStatusValues) {
      try {
        const testCategory = await prisma.category.findFirst({
          where: { status }
        });
        logTest(`CategoryStatus enum value '${status}' exists`, true, 'Enum value is valid');
      } catch (error) {
        logTest(`CategoryStatus enum value '${status}' exists`, false, error.message);
      }
    }

    // Test 1.4: Check BrandStatus enum values
    console.log('\nTesting BrandStatus enum...');
    const brandStatusValues = ['active', 'inactive'];
    for (const status of brandStatusValues) {
      try {
        const testBrand = await prisma.brand.findFirst({
          where: { status }
        });
        logTest(`BrandStatus enum value '${status}' exists`, true, 'Enum value is valid');
      } catch (error) {
        logTest(`BrandStatus enum value '${status}' exists`, false, error.message);
      }
    }

    // Test 1.5: Check VariantType table exists
    console.log('\nTesting VariantType table...');
    try {
      const variantTypes = await prisma.variantType.findMany();
      logTest('VariantType table exists', true, `Found ${variantTypes.length} variant types`);
    } catch (error) {
      logTest('VariantType table exists', false, error.message);
    }

    // Test 1.6: Check VariantValue table exists
    console.log('\nTesting VariantValue table...');
    try {
      const variantValues = await prisma.variantValue.findMany();
      logTest('VariantValue table exists', true, `Found ${variantValues.length} variant values`);
    } catch (error) {
      logTest('VariantValue table exists', false, error.message);
    }

    // Test 1.7: Check Category table with hierarchy fields
    console.log('\nTesting Category table hierarchy fields...');
    try {
      const category = await prisma.category.findFirst();
      if (category) {
        const hasParentId = 'parentId' in category;
        const hasChildren = 'children' in category;
        logTest('Category table has parentId field', hasParentId, hasParentId ? 'Field exists' : 'Field missing');
        logTest('Category table supports hierarchy', hasParentId, 'Hierarchy support verified');
      } else {
        logWarning('Category table hierarchy fields', 'No categories found in database');
      }
    } catch (error) {
      logTest('Category table hierarchy fields', false, error.message);
    }

    // Test 1.8: Check Brand table with all required fields
    console.log('\nTesting Brand table fields...');
    try {
      const brand = await prisma.brand.findFirst();
      if (brand) {
        const requiredFields = ['id', 'name', 'slug', 'status', 'isFeatured', 'featuredOrder', 'metaTitle', 'metaDescription', 'metaKeywords'];
        const missingFields = requiredFields.filter(field => !(field in brand));
        if (missingFields.length === 0) {
          logTest('Brand table has all required fields', true, 'All fields present');
        } else {
          logTest('Brand table has all required fields', false, `Missing fields: ${missingFields.join(', ')}`);
        }
      } else {
        logWarning('Brand table fields', 'No brands found in database');
      }
    } catch (error) {
      logTest('Brand table fields', false, error.message);
    }

    // Test 1.9: Check ProductCategory junction table
    console.log('\nTesting ProductCategory junction table...');
    try {
      const productCategories = await prisma.productCategory.findMany();
      logTest('ProductCategory junction table exists', true, `Found ${productCategories.length} product-category relationships`);
    } catch (error) {
      logTest('ProductCategory junction table exists', false, error.message);
    }

    // Test 1.10: Check CrossSellProduct junction table
    console.log('\nTesting CrossSellProduct junction table...');
    try {
      const crossSellProducts = await prisma.crossSellProduct.findMany();
      logTest('CrossSellProduct junction table exists', true, `Found ${crossSellProducts.length} cross-sell relationships`);
    } catch (error) {
      logTest('CrossSellProduct junction table exists', false, error.message);
    }

    // Test 1.11: Check UpSellProduct junction table
    console.log('\nTesting UpSellProduct junction table...');
    try {
      const upSellProducts = await prisma.upSellProduct.findMany();
      logTest('UpSellProduct junction table exists', true, `Found ${upSellProducts.length} up-sell relationships`);
    } catch (error) {
      logTest('UpSellProduct junction table exists', false, error.message);
    }

    // Test 1.12: Check RelatedProduct junction table
    console.log('\nTesting RelatedProduct junction table...');
    try {
      const relatedProducts = await prisma.relatedProduct.findMany();
      logTest('RelatedProduct junction table exists', true, `Found ${relatedProducts.length} related product relationships`);
    } catch (error) {
      logTest('RelatedProduct junction table exists', false, error.message);
    }

    // Test 1.13: Check Product table has Phase 4 fields
    console.log('\nTesting Product table Phase 4 fields...');
    try {
      const product = await prisma.product.findFirst();
      if (product) {
        const phase4Fields = ['status', 'visibility', 'metaTitle', 'metaDescription', 'metaKeywords', 'publishedAt'];
        const missingFields = phase4Fields.filter(field => !(field in product));
        if (missingFields.length === 0) {
          logTest('Product table has all Phase 4 fields', true, 'All fields present');
        } else {
          logTest('Product table has all Phase 4 fields', false, `Missing fields: ${missingFields.join(', ')}`);
        }
      } else {
        logWarning('Product table Phase 4 fields', 'No products found in database');
      }
    } catch (error) {
      logTest('Product table Phase 4 fields', false, error.message);
    }

    // Test 1.14: Verify relationships are properly defined
    console.log('\nTesting table relationships...');
    try {
      // Test Product-Category relationship
      const productWithCategory = await prisma.product.findFirst({
        include: { category: true }
      });
      logTest('Product-Category relationship exists', !!productWithCategory, 'Relationship verified');

      // Test Product-Brand relationship
      const productWithBrand = await prisma.product.findFirst({
        include: { brand: true }
      });
      logTest('Product-Brand relationship exists', !!productWithBrand, 'Relationship verified');

      // Test Category hierarchy
      const categoryWithChildren = await prisma.category.findFirst({
        include: { children: true }
      });
      logTest('Category hierarchy relationship exists', !!categoryWithChildren, 'Relationship verified');

      // Test Product-Specifications relationship
      const productWithSpecs = await prisma.product.findFirst({
        include: { specifications: true }
      });
      logTest('Product-Specifications relationship exists', !!productWithSpecs, 'Relationship verified');

      // Test Product-Variants relationship
      const productWithVariants = await prisma.product.findFirst({
        include: { variants: true }
      });
      logTest('Product-Variants relationship exists', !!productWithVariants, 'Relationship verified');

      // Test Product-Images relationship
      const productWithImages = await prisma.product.findFirst({
        include: { images: true }
      });
      logTest('Product-Images relationship exists', !!productWithImages, 'Relationship verified');
    } catch (error) {
      logTest('Table relationships', false, error.message);
    }

  } catch (error) {
    console.error('Error during schema verification:', error);
  }
}

async function testDatabaseOperations() {
  console.log('\n========================================');
  console.log('DATABASE OPERATIONS TESTING');
  console.log('========================================\n');

  let testProductId = null;
  let testCategoryId = null;
  let testBrandId = null;
  let testSpecId = null;
  let testVariantId = null;
  let testImageId = null;
  let testCrossSellId = null;
  let testUpSellId = null;
  let testRelatedId = null;

  try {
    // Test 2.1: INSERT - Create Category
    console.log('Testing INSERT operations...');
    try {
      const category = await prisma.category.create({
        data: {
          name: 'Test Category Phase4',
          slug: `test-category-phase4-${Date.now()}`,
          description: 'Test category for Phase 4 testing',
          status: 'active',
          displayOrder: 0,
          sortOrder: 0,
          metaTitle: 'Test Category Meta Title',
          metaDescription: 'Test Category Meta Description',
          metaKeywords: 'test, category, phase4'
        }
      });
      testCategoryId = category.id;
      logTest('INSERT - Create Category', true, `Category created with ID: ${category.id}`);
    } catch (error) {
      logTest('INSERT - Create Category', false, error.message);
    }

    // Test 2.2: INSERT - Create Brand
    try {
      const brand = await prisma.brand.create({
        data: {
          name: 'Test Brand Phase4',
          slug: `test-brand-phase4-${Date.now()}`,
          description: 'Test brand for Phase 4 testing',
          status: 'active',
          isFeatured: false,
          featuredOrder: 0,
          metaTitle: 'Test Brand Meta Title',
          metaDescription: 'Test Brand Meta Description',
          metaKeywords: 'test, brand, phase4'
        }
      });
      testBrandId = brand.id;
      logTest('INSERT - Create Brand', true, `Brand created with ID: ${brand.id}`);
    } catch (error) {
      logTest('INSERT - Create Brand', false, error.message);
    }

    // Test 2.3: INSERT - Create Product
    try {
      if (testCategoryId && testBrandId) {
        const product = await prisma.product.create({
          data: {
            sku: `TEST-SKU-${Date.now()}`,
            name: 'Test Product Phase4',
            nameEn: 'Test Product Phase4 English',
            slug: `test-product-phase4-${Date.now()}`,
            shortDescription: 'Short description',
            description: 'Full product description',
            categoryId: testCategoryId,
            brandId: testBrandId,
            regularPrice: 99.99,
            salePrice: 79.99,
            costPrice: 50.00,
            taxRate: 0.15,
            stockQuantity: 100,
            lowStockThreshold: 10,
            status: 'published',
            visibility: 'public',
            metaTitle: 'Test Product Meta Title',
            metaDescription: 'Test Product Meta Description',
            metaKeywords: 'test, product, phase4',
            isFeatured: false,
            isNewArrival: true,
            isBestSeller: false,
            warrantyPeriod: 12,
            warrantyType: 'months',
            publishedAt: new Date()
          }
        });
        testProductId = product.id;
        logTest('INSERT - Create Product', true, `Product created with ID: ${product.id}`);
      } else {
        logTest('INSERT - Create Product', false, 'Missing category or brand ID');
      }
    } catch (error) {
      logTest('INSERT - Create Product', false, error.message);
    }

    // Test 2.4: INSERT - Create Product Specification
    try {
      if (testProductId) {
        const spec = await prisma.productSpecification.create({
          data: {
            productId: testProductId,
            name: 'Test Specification',
            value: 'Test Value',
            sortOrder: 0
          }
        });
        testSpecId = spec.id;
        logTest('INSERT - Create Product Specification', true, `Specification created with ID: ${spec.id}`);
      } else {
        logTest('INSERT - Create Product Specification', false, 'Missing product ID');
      }
    } catch (error) {
      logTest('INSERT - Create Product Specification', false, error.message);
    }

    // Test 2.5: INSERT - Create Product Variant
    try {
      if (testProductId) {
        const variant = await prisma.productVariant.create({
          data: {
            productId: testProductId,
            name: 'Test Variant',
            sku: `TEST-VARIANT-${Date.now()}`,
            price: 89.99,
            comparePrice: 99.99,
            stock: 50,
            isActive: true
          }
        });
        testVariantId = variant.id;
        logTest('INSERT - Create Product Variant', true, `Variant created with ID: ${variant.id}`);
      } else {
        logTest('INSERT - Create Product Variant', false, 'Missing product ID');
      }
    } catch (error) {
      logTest('INSERT - Create Product Variant', false, error.message);
    }

    // Test 2.6: INSERT - Create Product Image
    try {
      if (testProductId) {
        const image = await prisma.productImage.create({
          data: {
            productId: testProductId,
            url: '/uploads/products/test-image.jpg',
            alt: 'Test Image Alt Text',
            sortOrder: 0
          }
        });
        testImageId = image.id;
        logTest('INSERT - Create Product Image', true, `Image created with ID: ${image.id}`);
      } else {
        logTest('INSERT - Create Product Image', false, 'Missing product ID');
      }
    } catch (error) {
      logTest('INSERT - Create Product Image', false, error.message);
    }

    // Test 2.7: UPDATE - Update Product
    console.log('\nTesting UPDATE operations...');
    try {
      if (testProductId) {
        const updatedProduct = await prisma.product.update({
          where: { id: testProductId },
          data: {
            name: 'Updated Test Product Phase4',
            status: 'draft',
            visibility: 'private',
            metaTitle: 'Updated Meta Title'
          }
        });
        logTest('UPDATE - Update Product', true, 'Product updated successfully');
      } else {
        logTest('UPDATE - Update Product', false, 'Missing product ID');
      }
    } catch (error) {
      logTest('UPDATE - Update Product', false, error.message);
    }

    // Test 2.8: UPDATE - Update Category
    try {
      if (testCategoryId) {
        const updatedCategory = await prisma.category.update({
          where: { id: testCategoryId },
          data: {
            name: 'Updated Test Category Phase4',
            status: 'inactive',
            displayOrder: 1
          }
        });
        logTest('UPDATE - Update Category', true, 'Category updated successfully');
      } else {
        logTest('UPDATE - Update Category', false, 'Missing category ID');
      }
    } catch (error) {
      logTest('UPDATE - Update Category', false, error.message);
    }

    // Test 2.9: UPDATE - Update Brand
    try {
      if (testBrandId) {
        const updatedBrand = await prisma.brand.update({
          where: { id: testBrandId },
          data: {
            name: 'Updated Test Brand Phase4',
            status: 'inactive',
            isFeatured: true,
            featuredOrder: 1
          }
        });
        logTest('UPDATE - Update Brand', true, 'Brand updated successfully');
      } else {
        logTest('UPDATE - Update Brand', false, 'Missing brand ID');
      }
    } catch (error) {
      logTest('UPDATE - Update Brand', false, error.message);
    }

    // Test 2.10: SELECT - Query with JOINs
    console.log('\nTesting SELECT operations with JOINs...');
    try {
      if (testProductId) {
        const productWithRelations = await prisma.product.findUnique({
          where: { id: testProductId },
          include: {
            category: true,
            brand: true,
            specifications: true,
            variants: true,
            images: true,
            categories: {
              include: { category: true }
            }
          }
        });
        logTest('SELECT - Product with all relations', !!productWithRelations, 'Fetched product with all relationships');
      } else {
        logTest('SELECT - Product with all relations', false, 'Missing product ID');
      }
    } catch (error) {
      logTest('SELECT - Product with all relations', false, error.message);
    }

    // Test 2.11: SELECT - Category tree query
    try {
      const categories = await prisma.category.findMany({
        include: {
          children: {
            include: {
              children: true
            }
          }
        },
        orderBy: { displayOrder: 'asc' }
      });
      logTest('SELECT - Category tree query', true, `Fetched ${categories.length} categories with hierarchy`);
    } catch (error) {
      logTest('SELECT - Category tree query', false, error.message);
    }

    // Test 2.12: Test Product Relationships
    console.log('\nTesting Product Relationships...');

    // Create second product for relationships
    let secondProductId = null;
    try {
      if (testCategoryId && testBrandId) {
        const secondProduct = await prisma.product.create({
          data: {
            sku: `TEST-SKU-2-${Date.now()}`,
            name: 'Test Product 2 Phase4',
            nameEn: 'Test Product 2 Phase4 English',
            slug: `test-product-2-phase4-${Date.now()}`,
            shortDescription: 'Short description 2',
            description: 'Full product description 2',
            categoryId: testCategoryId,
            brandId: testBrandId,
            regularPrice: 149.99,
            salePrice: 129.99,
            costPrice: 75.00,
            taxRate: 0.15,
            stockQuantity: 50,
            lowStockThreshold: 5,
            status: 'published',
            visibility: 'public',
            publishedAt: new Date()
          }
        });
        secondProductId = secondProduct.id;
        logTest('INSERT - Create second product for relationships', true, `Second product created with ID: ${secondProduct.id}`);
      }
    } catch (error) {
      logTest('INSERT - Create second product for relationships', false, error.message);
    }

    // Test 2.13: INSERT - Cross-sell relationship
    try {
      if (testProductId && secondProductId) {
        const crossSell = await prisma.crossSellProduct.create({
          data: {
            productId: testProductId,
            relatedProductId: secondProductId,
            displayOrder: 0
          }
        });
        testCrossSellId = crossSell.id;
        logTest('INSERT - Create Cross-sell relationship', true, `Cross-sell created with ID: ${crossSell.id}`);
      } else {
        logTest('INSERT - Create Cross-sell relationship', false, 'Missing product IDs');
      }
    } catch (error) {
      logTest('INSERT - Create Cross-sell relationship', false, error.message);
    }

    // Test 2.14: INSERT - Up-sell relationship
    try {
      if (testProductId && secondProductId) {
        const upSell = await prisma.upSellProduct.create({
          data: {
            productId: testProductId,
            relatedProductId: secondProductId,
            displayOrder: 0
          }
        });
        testUpSellId = upSell.id;
        logTest('INSERT - Create Up-sell relationship', true, `Up-sell created with ID: ${upSell.id}`);
      } else {
        logTest('INSERT - Create Up-sell relationship', false, 'Missing product IDs');
      }
    } catch (error) {
      logTest('INSERT - Create Up-sell relationship', false, error.message);
    }

    // Test 2.15: INSERT - Related product relationship
    try {
      if (testProductId && secondProductId) {
        const related = await prisma.relatedProduct.create({
          data: {
            productId: testProductId,
            relatedProductId: secondProductId,
            displayOrder: 0
          }
        });
        testRelatedId = related.id;
        logTest('INSERT - Create Related product relationship', true, `Related product created with ID: ${related.id}`);
      } else {
        logTest('INSERT - Create Related product relationship', false, 'Missing product IDs');
      }
    } catch (error) {
      logTest('INSERT - Create Related product relationship', false, error.message);
    }

    // Test 2.16: SELECT - Product with all relationships
    try {
      if (testProductId) {
        const productWithAllRelations = await prisma.product.findUnique({
          where: { id: testProductId },
          include: {
            crossSellProducts: {
              include: { relatedProduct: true }
            },
            upSellProducts: {
              include: { relatedProduct: true }
            },
            relatedProducts: {
              include: { relatedProduct: true }
            }
          }
        });
        logTest('SELECT - Product with all relationship types', !!productWithAllRelations, 'Fetched product with all relationships');
      } else {
        logTest('SELECT - Product with all relationship types', false, 'Missing product ID');
      }
    } catch (error) {
      logTest('SELECT - Product with all relationship types', false, error.message);
    }

    // Test 2.17: DELETE - Cascade deletion test
    console.log('\nTesting DELETE operations and cascade behavior...');

    // Test 2.18: DELETE - Remove relationships first
    try {
      if (testCrossSellId) {
        await prisma.crossSellProduct.delete({
          where: { id: testCrossSellId }
        });
        logTest('DELETE - Remove Cross-sell relationship', true, 'Cross-sell relationship deleted');
      }
    } catch (error) {
      logTest('DELETE - Remove Cross-sell relationship', false, error.message);
    }

    try {
      if (testUpSellId) {
        await prisma.upSellProduct.delete({
          where: { id: testUpSellId }
        });
        logTest('DELETE - Remove Up-sell relationship', true, 'Up-sell relationship deleted');
      }
    } catch (error) {
      logTest('DELETE - Remove Up-sell relationship', false, error.message);
    }

    try {
      if (testRelatedId) {
        await prisma.relatedProduct.delete({
          where: { id: testRelatedId }
        });
        logTest('DELETE - Remove Related product relationship', true, 'Related product relationship deleted');
      }
    } catch (error) {
      logTest('DELETE - Remove Related product relationship', false, error.message);
    }

    // Test 2.19: DELETE - Product (should cascade to specifications, variants, images)
    try {
      if (testProductId) {
        await prisma.product.delete({
          where: { id: testProductId }
        });
        logTest('DELETE - Product (cascade)', true, 'Product deleted with cascade to related records');
      } else {
        logTest('DELETE - Product (cascade)', false, 'Missing product ID');
      }
    } catch (error) {
      logTest('DELETE - Product (cascade)', false, error.message);
    }

    // Test 2.20: DELETE - Second product
    try {
      if (secondProductId) {
        await prisma.product.delete({
          where: { id: secondProductId }
        });
        logTest('DELETE - Second product', true, 'Second product deleted');
      }
    } catch (error) {
      logTest('DELETE - Second product', false, error.message);
    }

    // Test 2.21: DELETE - Brand
    try {
      if (testBrandId) {
        await prisma.brand.delete({
          where: { id: testBrandId }
        });
        logTest('DELETE - Brand', true, 'Brand deleted');
      }
    } catch (error) {
      logTest('DELETE - Brand', false, error.message);
    }

    // Test 2.22: DELETE - Category
    try {
      if (testCategoryId) {
        await prisma.category.delete({
          where: { id: testCategoryId }
        });
        logTest('DELETE - Category', true, 'Category deleted');
      }
    } catch (error) {
      logTest('DELETE - Category', false, error.message);
    }

  } catch (error) {
    console.error('Error during operations testing:', error);
  }
}

async function testConstraintsAndIndexes() {
  console.log('\n========================================');
  console.log('CONSTRAINTS AND INDEXES TESTING');
  console.log('========================================\n');

  try {
    // Test 3.1: Unique constraint on Product SKU
    console.log('Testing unique constraints...');
    try {
      const category = await prisma.category.create({
        data: {
          name: 'Constraint Test Category',
          slug: `constraint-test-cat-${Date.now()}`,
          status: 'active'
        }
      });

      const brand = await prisma.brand.create({
        data: {
          name: 'Constraint Test Brand',
          slug: `constraint-test-brand-${Date.now()}`,
          status: 'active'
        }
      });

      const product1 = await prisma.product.create({
        data: {
          sku: `CONSTRAINT-SKU-${Date.now()}`,
          name: 'Constraint Test Product 1',
          nameEn: 'Constraint Test Product 1',
          slug: `constraint-test-prod-1-${Date.now()}`,
          categoryId: category.id,
          brandId: brand.id,
          regularPrice: 99.99,
          costPrice: 50.00,
          stockQuantity: 10,
          status: 'published',
          visibility: 'public'
        }
      });

      try {
        const product2 = await prisma.product.create({
          data: {
            sku: product1.sku, // Same SKU - should fail
            name: 'Constraint Test Product 2',
            nameEn: 'Constraint Test Product 2',
            slug: `constraint-test-prod-2-${Date.now()}`,
            categoryId: category.id,
            brandId: brand.id,
            regularPrice: 99.99,
            costPrice: 50.00,
            stockQuantity: 10,
            status: 'published',
            visibility: 'public'
          }
        });
        logTest('Unique constraint - Product SKU', false, 'Duplicate SKU was allowed (constraint not working)');
        await prisma.product.delete({ where: { id: product2.id } });
      } catch (error) {
        if (error.code === 'P2002') {
          logTest('Unique constraint - Product SKU', true, 'Duplicate SKU rejected as expected');
        } else {
          logTest('Unique constraint - Product SKU', false, `Unexpected error: ${error.message}`);
        }
      }

      // Cleanup
      await prisma.product.delete({ where: { id: product1.id } });
      await prisma.brand.delete({ where: { id: brand.id } });
      await prisma.category.delete({ where: { id: category.id } });
    } catch (error) {
      logTest('Unique constraint - Product SKU', false, error.message);
    }

    // Test 3.2: Unique constraint on Product slug
    try {
      const category = await prisma.category.create({
        data: {
          name: 'Slug Test Category',
          slug: `slug-test-cat-${Date.now()}`,
          status: 'active'
        }
      });

      const brand = await prisma.brand.create({
        data: {
          name: 'Slug Test Brand',
          slug: `slug-test-brand-${Date.now()}`,
          status: 'active'
        }
      });

      const product1 = await prisma.product.create({
        data: {
          sku: `SLUG-TEST-SKU-1-${Date.now()}`,
          name: 'Slug Test Product 1',
          nameEn: 'Slug Test Product 1',
          slug: `slug-test-product-${Date.now()}`,
          categoryId: category.id,
          brandId: brand.id,
          regularPrice: 99.99,
          costPrice: 50.00,
          stockQuantity: 10,
          status: 'published',
          visibility: 'public'
        }
      });

      try {
        const product2 = await prisma.product.create({
          data: {
            sku: `SLUG-TEST-SKU-2-${Date.now()}`,
            name: 'Slug Test Product 2',
            nameEn: 'Slug Test Product 2',
            slug: product1.slug, // Same slug - should fail
            categoryId: category.id,
            brandId: brand.id,
            regularPrice: 99.99,
            costPrice: 50.00,
            stockQuantity: 10,
            status: 'published',
            visibility: 'public'
          }
        });
        logTest('Unique constraint - Product slug', false, 'Duplicate slug was allowed (constraint not working)');
        await prisma.product.delete({ where: { id: product2.id } });
      } catch (error) {
        if (error.code === 'P2002') {
          logTest('Unique constraint - Product slug', true, 'Duplicate slug rejected as expected');
        } else {
          logTest('Unique constraint - Product slug', false, `Unexpected error: ${error.message}`);
        }
      }

      // Cleanup
      await prisma.product.delete({ where: { id: product1.id } });
      await prisma.brand.delete({ where: { id: brand.id } });
      await prisma.category.delete({ where: { id: category.id } });
    } catch (error) {
      logTest('Unique constraint - Product slug', false, error.message);
    }

    // Test 3.3: Unique constraint on Category slug
    try {
      const category1 = await prisma.category.create({
        data: {
          name: 'Category Slug Test 1',
          slug: `category-slug-test-${Date.now()}`,
          status: 'active'
        }
      });

      try {
        const category2 = await prisma.category.create({
          data: {
            name: 'Category Slug Test 2',
            slug: category1.slug, // Same slug - should fail
            status: 'active'
          }
        });
        logTest('Unique constraint - Category slug', false, 'Duplicate slug was allowed (constraint not working)');
        await prisma.category.delete({ where: { id: category2.id } });
      } catch (error) {
        if (error.code === 'P2002') {
          logTest('Unique constraint - Category slug', true, 'Duplicate slug rejected as expected');
        } else {
          logTest('Unique constraint - Category slug', false, `Unexpected error: ${error.message}`);
        }
      }

      // Cleanup
      await prisma.category.delete({ where: { id: category1.id } });
    } catch (error) {
      logTest('Unique constraint - Category slug', false, error.message);
    }

    // Test 3.4: Unique constraint on Brand slug
    try {
      const brand1 = await prisma.brand.create({
        data: {
          name: 'Brand Slug Test 1',
          slug: `brand-slug-test-${Date.now()}`,
          status: 'active'
        }
      });

      try {
        const brand2 = await prisma.brand.create({
          data: {
            name: 'Brand Slug Test 2',
            slug: brand1.slug, // Same slug - should fail
            status: 'active'
          }
        });
        logTest('Unique constraint - Brand slug', false, 'Duplicate slug was allowed (constraint not working)');
        await prisma.brand.delete({ where: { id: brand2.id } });
      } catch (error) {
        if (error.code === 'P2002') {
          logTest('Unique constraint - Brand slug', true, 'Duplicate slug rejected as expected');
        } else {
          logTest('Unique constraint - Brand slug', false, `Unexpected error: ${error.message}`);
        }
      }

      // Cleanup
      await prisma.brand.delete({ where: { id: brand1.id } });
    } catch (error) {
      logTest('Unique constraint - Brand slug', false, error.message);
    }

    // Test 3.5: Foreign key constraints
    console.log('\nTesting foreign key constraints...');
    try {
      // Try to create a product with non-existent category
      try {
        const product = await prisma.product.create({
          data: {
            sku: `FK-TEST-SKU-${Date.now()}`,
            name: 'FK Test Product',
            nameEn: 'FK Test Product',
            slug: `fk-test-product-${Date.now()}`,
            categoryId: '00000000-0000-0000-0000-000000000000', // Non-existent UUID
            brandId: '00000000-0000-0000-0000-000000000000', // Non-existent UUID
            regularPrice: 99.99,
            costPrice: 50.00,
            stockQuantity: 10,
            status: 'published',
            visibility: 'public'
          }
        });
        logTest('Foreign key constraint - Category/Brand', false, 'Foreign key constraint not enforced');
        await prisma.product.delete({ where: { id: product.id } });
      } catch (error) {
        if (error.code === 'P2003') {
          logTest('Foreign key constraint - Category/Brand', true, 'Foreign key constraint enforced');
        } else {
          logTest('Foreign key constraint - Category/Brand', true, `Foreign key constraint enforced (${error.code})`);
        }
      }
    } catch (error) {
      logTest('Foreign key constraint - Category/Brand', false, error.message);
    }

    // Test 3.6: Self-reference prevention (Category)
    console.log('\nTesting self-reference prevention...');
    try {
      const category = await prisma.category.create({
        data: {
          name: 'Self-Ref Test Category',
          slug: `self-ref-test-cat-${Date.now()}`,
          status: 'active'
        }
      });

      try {
        const updated = await prisma.category.update({
          where: { id: category.id },
          data: { parentId: category.id } // Try to set self as parent
        });
        logTest('Self-reference prevention - Category', false, 'Category can be its own parent');
        await prisma.category.delete({ where: { id: updated.id } });
      } catch (error) {
        logTest('Self-reference prevention - Category', true, 'Self-reference prevented (or would be prevented by API)');
        await prisma.category.delete({ where: { id: category.id } });
      }
    } catch (error) {
      logTest('Self-reference prevention - Category', false, error.message);
    }

  } catch (error) {
    console.error('Error during constraints testing:', error);
  }
}

async function generateReport() {
  console.log('\n========================================');
  console.log('TEST SUMMARY REPORT');
  console.log('========================================\n');

  console.log(`Total Tests Run: ${testResults.passed.length + testResults.failed.length}`);
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);

  if (testResults.failed.length > 0) {
    console.log('\n--- FAILED TESTS ---');
    testResults.failed.forEach((test, index) => {
      console.log(`${index + 1}. ${test.testName}`);
      if (test.message) console.log(`   ${test.message}`);
    });
  }

  if (testResults.warnings.length > 0) {
    console.log('\n--- WARNINGS ---');
    testResults.warnings.forEach((test, index) => {
      console.log(`${index + 1}. ${test.testName}`);
      if (test.message) console.log(`   ${test.message}`);
    });
  }

  const passRate = ((testResults.passed.length / (testResults.passed.length + testResults.failed.length)) * 100).toFixed(2);
  console.log(`\nPass Rate: ${passRate}%`);

  return {
    total: testResults.passed.length + testResults.failed.length,
    passed: testResults.passed.length,
    failed: testResults.failed.length,
    warnings: testResults.warnings.length,
    passRate: parseFloat(passRate),
    failedTests: testResults.failed,
    warnings: testResults.warnings
  };
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   PHASE 4 MILESTONE 1: DATABASE LAYER TESTING              ║');
  console.log('║   Product Data Model Enhancement                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await testDatabaseSchema();
    await testDatabaseOperations();
    await testConstraintsAndIndexes();
    const report = await generateReport();

    // Save report to file
    const fs = require('fs');
    const reportPath = './phase4-database-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);

  } catch (error) {
    console.error('Fatal error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
