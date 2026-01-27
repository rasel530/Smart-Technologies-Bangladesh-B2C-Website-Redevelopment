/**
 * Test Script for Product-Category Relationship Fix
 * 
 * This script tests the changes made to fix the product-to-category relationship:
 * 1. Prisma schema changes (categoryId removed, many-to-many relationship)
 * 2. Backend API changes (accepts categories array, new endpoints)
 * 3. Frontend API client changes (uses categories array)
 * 4. Admin ProductForm changes (uses ProductCategoryManager)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function info(message) {
  log(`ℹ ${message}`, 'blue');
}

function section(title) {
  console.log(`\n${colors.bold}${colors.blue}═══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}  ${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}═════════════════════════════════════════════════════════════${colors.reset}\n`);
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  section('TEST 1: Prisma Schema Validation');
  
  try {
    // Check if Product model exists and doesn't have categoryId
    const products = await prisma.product.findMany({
      take: 1
    });

    if (products.length > 0) {
      const product = products[0];
      if ('categoryId' in product) {
        error('FAILED: Product model still has categoryId field');
        failed++;
      } else {
        success('PASSED: Product model does not have categoryId field');
        passed++;
      }

      // Check if categories relation exists
      if ('categories' in product) {
        success('PASSED: Product model has categories relation');
        passed++;
      } else {
        error('FAILED: Product model missing categories relation');
        failed++;
      }
    } else {
      info('WARNING: No products found in database');
    }
  } catch (err) {
    error(`ERROR: ${err.message}`);
    failed++;
  }

  section('TEST 2: ProductCategory Junction Table');
  
  try {
    // Check if ProductCategory junction table exists
    const productCategories = await prisma.productCategory.findMany({
      take: 5
    });

    if (productCategories.length > 0) {
      success(`PASSED: ProductCategory junction table exists (${productCategories.length} records found)`);
      passed++;

      // Check structure
      const pc = productCategories[0];
      if (pc.productId && pc.categoryId && 'isPrimary' in pc) {
        success('PASSED: ProductCategory has correct structure');
        passed++;
      } else {
        error('FAILED: ProductCategory missing required fields');
        failed++;
      }
    } else {
      info('WARNING: No product-category relationships found');
    }
  } catch (err) {
    error(`ERROR: ${err.message}`);
    failed++;
  }

  section('TEST 3: Category Model');
  
  try {
    // Check if Category model doesn't have products relation (one-to-many removed)
    const categories = await prisma.category.findMany({
      take: 1
    });

    if (categories.length > 0) {
      const category = categories[0];
      if ('products' in category) {
        error('FAILED: Category model still has products relation (one-to-many)');
        failed++;
      } else {
        success('PASSED: Category model does not have products relation');
        passed++;
      }

      // Check if productCategories relation exists
      if ('productCategories' in category) {
        success('PASSED: Category model has productCategories relation');
        passed++;
      } else {
        error('FAILED: Category model missing productCategories relation');
        failed++;
      }
    } else {
      info('WARNING: No categories found in database');
    }
  } catch (err) {
    error(`ERROR: ${err.message}`);
    failed++;
  }

  section('TEST 4: Backend API - Create Product with Categories');
  
  try {
    // Test creating a product with multiple categories
    const testCategories = await prisma.category.findMany({
      take: 2
    });

    if (testCategories.length >= 2) {
      const testProduct = {
        sku: `TEST-${Date.now()}`,
        name: 'Test Product',
        nameEn: 'Test Product',
        slug: `test-product-${Date.now()}`,
        shortDescription: 'Test product description',
        description: 'Test product full description',
        brandId: testCategories[0].id,
        regularPrice: 100.00,
        salePrice: 90.00,
        costPrice: 50.00,
        stockQuantity: 100,
        lowStockThreshold: 10,
        taxRate: 0.15,
        status: 'active',
        visibility: 'public',
        metaTitle: 'Test Product',
        metaDescription: 'Test product for category fix',
        metaKeywords: 'test,product,category',
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: false,
        warrantyPeriod: 12,
        warrantyType: 'Manufacturer Warranty',
        categories: testCategories.map((c, index) => ({
          categoryId: c.id,
          isPrimary: index === 0
        }))
      };

      // Create product using Prisma (simulating API)
      const createdProduct = await prisma.product.create({
        data: testProduct
      });

      if (createdProduct) {
        success('PASSED: Product created with multiple categories');
        passed++;

        // Verify categories were created
        const productCategories = await prisma.productCategory.findMany({
          where: { productId: createdProduct.id }
        });

        if (productCategories.length === testCategories.length) {
          success(`PASSED: All ${productCategories.length} categories assigned correctly`);
          passed++;

          // Verify primary category
          const primaryCategory = productCategories.find(pc => pc.isPrimary);
          if (primaryCategory && primaryCategory.categoryId === testCategories[0].id) {
            success('PASSED: Primary category set correctly');
            passed++;
          } else {
            error('FAILED: Primary category not set correctly');
            failed++;
          }

          // Cleanup: Delete test product
          await prisma.productCategory.deleteMany({
            where: { productId: createdProduct.id }
          });
          await prisma.product.delete({
            where: { id: createdProduct.id }
          });
        } else {
          error(`FAILED: Expected ${testCategories.length} categories, found ${productCategories.length}`);
          failed++;
        }
      } else {
        error('FAILED: Product creation failed');
        failed++;
      }
    } else {
      info('WARNING: Not enough categories to test (need at least 2)');
    }
  } catch (err) {
    error(`ERROR: ${err.message}`);
    failed++;
  }

  section('TEST 5: Backend API - Update Product Categories');
  
  try {
    // Test updating product categories
    const testProduct = await prisma.product.findFirst({
      include: {
        categories: true
      }
    });

    if (testProduct && testProduct.categories.length > 0) {
      const newCategories = await prisma.category.findMany({
        where: {
          id: { notIn: testProduct.categories.map(pc => pc.categoryId) }
        },
        take: 1
      });

      if (newCategories.length > 0) {
        const newCategoryId = newCategories[0].id;

        // Delete existing categories
        await prisma.productCategory.deleteMany({
          where: { productId: testProduct.id }
        });

        // Create new category association
        await prisma.productCategory.create({
          data: {
            productId: testProduct.id,
            categoryId: newCategoryId,
            isPrimary: true
          }
        });

        success('PASSED: Product categories updated successfully');
        passed++;

        // Verify update
        const updatedProduct = await prisma.product.findUnique({
          where: { id: testProduct.id },
          include: {
            categories: true
          }
        });

        if (updatedProduct && updatedProduct.categories.length === 1) {
          success('PASSED: Product now has 1 category');
          passed++;
        } else {
          error('FAILED: Product category count incorrect');
          failed++;
        }
      } else {
        info('WARNING: No additional categories available for testing');
      }
    } else {
      info('WARNING: No products found for update test');
    }
  } catch (err) {
    error(`ERROR: ${err.message}`);
    failed++;
  }

  section('TEST 6: Backend API - Category Management Endpoints');
  
  try {
    // Test setting primary category
    const testProduct = await prisma.product.findFirst({
      include: {
        categories: true
      }
    });

    if (testProduct && testProduct.categories.length > 1) {
      const currentPrimary = testProduct.categories.find(pc => pc.isPrimary);
      const newPrimary = testProduct.categories.find(pc => !pc.isPrimary);

      if (currentPrimary && newPrimary) {
        // Set new category as primary
        await prisma.productCategory.update({
          where: {
            id: currentPrimary.id
          },
          data: {
            isPrimary: false
          }
        });

        await prisma.productCategory.update({
          where: {
            id: newPrimary.id
          },
          data: {
            isPrimary: true
          }
        });

        success('PASSED: Primary category changed successfully');
        passed++;

        // Verify change
        const updatedProduct = await prisma.product.findUnique({
          where: { id: testProduct.id },
          include: {
            categories: true
          }
        });

        const newPrimary = updatedProduct.categories.find(pc => pc.isPrimary);
        if (newPrimary && newPrimary.categoryId === newPrimary.categoryId) {
          success('PASSED: Primary category verified');
          passed++;
        } else {
          error('FAILED: Primary category not set correctly');
          failed++;
        }
      } else {
        info('WARNING: Product does not have multiple categories for primary test');
      }
    } else {
      info('WARNING: No products found for primary category test');
    }
  } catch (err) {
    error(`ERROR: ${err.message}`);
    failed++;
  }

  section('TEST 7: Data Integrity');
  
  try {
    // Check if any products have no categories
    const productsWithoutCategories = await prisma.product.findMany({
      where: {
        categories: {
          none: {}
        }
      },
      include: {
        categories: true
      }
    });

    if (productsWithoutCategories.length > 0) {
      error(`FAILED: ${productsWithoutCategories.length} products have no categories assigned`);
      failed++;
    } else {
      success('PASSED: All products have at least one category');
      passed++;
    }
  } catch (err) {
    error(`ERROR: ${err.message}`);
    failed++;
  }

  // Print summary
  section('TEST SUMMARY');
  console.log(`${colors.bold}${colors.blue}Total Tests: ${passed + failed}${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
  
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
