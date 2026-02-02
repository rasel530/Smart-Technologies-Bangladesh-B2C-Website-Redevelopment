const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseCategoryBrandData() {
  console.log('='.repeat(80));
  console.log('DATABASE CATEGORY AND BRAND DATA DIAGNOSTIC REPORT');
  console.log('='.repeat(80));
  console.log(`Report generated at: ${new Date().toISOString()}\n`);

  const report = {
    timestamp: new Date().toISOString(),
    databaseConnection: { status: 'unknown', error: null },
    categories: { total: 0, active: 0, inactive: 0, sample: [], issues: [] },
    brands: { total: 0, active: 0, inactive: 0, sample: [], issues: [] },
    productCategoryAssociations: { total: 0, productsWithCategories: 0, productsWithoutCategories: 0, orphanedAssociations: 0 },
    productBrandAssociations: { total: 0, productsWithBrands: 0, productsWithoutBrands: 0, orphanedBrands: 0 },
    summary: { issues: [], recommendations: [] }
  };

  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    try {
      await prisma.$connect();
      report.databaseConnection.status = 'connected';
      console.log('   ✓ Database connection successful\n');
    } catch (error) {
      report.databaseConnection.status = 'failed';
      report.databaseConnection.error = error.message;
      console.log(`   ✗ Database connection failed: ${error.message}\n`);
      throw error;
    }

    // 2. Query categories table
    console.log('2. Checking categories table...');
    const allCategories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        parentId: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    report.categories.total = allCategories.length;
    report.categories.active = allCategories.filter(c => c.status === 'active').length;
    report.categories.inactive = allCategories.filter(c => c.status === 'inactive').length;

    console.log(`   Total categories: ${report.categories.total}`);
    console.log(`   Active categories: ${report.categories.active}`);
    console.log(`   Inactive categories: ${report.categories.inactive}`);

    // Sample data (first 5 categories)
    report.categories.sample = allCategories.slice(0, 5).map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      status: c.status,
      hasParent: !!c.parentId
    }));

    console.log('\n   Sample categories (first 5):');
    report.categories.sample.forEach((cat, idx) => {
      console.log(`   ${idx + 1}. ${cat.name} (${cat.slug}) - Status: ${cat.status}${cat.hasParent ? ' [Has Parent]' : ''}`);
    });

    // Check for category issues
    const categoriesWithoutSlug = allCategories.filter(c => !c.slug || c.slug.trim() === '');
    if (categoriesWithoutSlug.length > 0) {
      report.categories.issues.push({
        type: 'missing_slugs',
        count: categoriesWithoutSlug.length,
        details: categoriesWithoutSlug.map(c => ({ id: c.id, name: c.name }))
      });
      console.log(`\n   ⚠ Categories with missing slugs: ${categoriesWithoutSlug.length}`);
    }

    const inactiveCategories = allCategories.filter(c => c.status === 'inactive');
    if (inactiveCategories.length > 0) {
      report.categories.issues.push({
        type: 'inactive_categories',
        count: inactiveCategories.length,
        details: inactiveCategories.map(c => ({ id: c.id, name: c.name, slug: c.slug }))
      });
      console.log(`   ⚠ Inactive categories: ${inactiveCategories.length}`);
    }

    // Check for orphaned categories (parentId pointing to non-existent category)
    const categoryIds = new Set(allCategories.map(c => c.id));
    const orphanedCategories = allCategories.filter(c => c.parentId && !categoryIds.has(c.parentId));
    if (orphanedCategories.length > 0) {
      report.categories.issues.push({
        type: 'orphaned_parent',
        count: orphanedCategories.length,
        details: orphanedCategories.map(c => ({ id: c.id, name: c.name, parentId: c.parentId }))
      });
      console.log(`   ⚠ Categories with orphaned parent references: ${orphanedCategories.length}`);
    }

    console.log('');

    // 3. Query brands table
    console.log('3. Checking brands table...');
    const allBrands = await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    report.brands.total = allBrands.length;
    report.brands.active = allBrands.filter(b => b.status === 'active').length;
    report.brands.inactive = allBrands.filter(b => b.status === 'inactive').length;

    console.log(`   Total brands: ${report.brands.total}`);
    console.log(`   Active brands: ${report.brands.active}`);
    console.log(`   Inactive brands: ${report.brands.inactive}`);

    // Sample data (first 5 brands)
    report.brands.sample = allBrands.slice(0, 5).map(b => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      status: b.status
    }));

    console.log('\n   Sample brands (first 5):');
    report.brands.sample.forEach((brand, idx) => {
      console.log(`   ${idx + 1}. ${brand.name} (${brand.slug}) - Status: ${brand.status}`);
    });

    // Check for brand issues
    const brandsWithoutSlug = allBrands.filter(b => !b.slug || b.slug.trim() === '');
    if (brandsWithoutSlug.length > 0) {
      report.brands.issues.push({
        type: 'missing_slugs',
        count: brandsWithoutSlug.length,
        details: brandsWithoutSlug.map(b => ({ id: b.id, name: b.name }))
      });
      console.log(`\n   ⚠ Brands with missing slugs: ${brandsWithoutSlug.length}`);
    }

    const inactiveBrands = allBrands.filter(b => b.status === 'inactive');
    if (inactiveBrands.length > 0) {
      report.brands.issues.push({
        type: 'inactive_brands',
        count: inactiveBrands.length,
        details: inactiveBrands.map(b => ({ id: b.id, name: b.name, slug: b.slug }))
      });
      console.log(`   ⚠ Inactive brands: ${inactiveBrands.length}`);
    }

    console.log('');

    // 4. Check product-category associations
    console.log('4. Checking product-category associations...');
    const productCategories = await prisma.productCategory.findMany({
      select: {
        id: true,
        productId: true,
        categoryId: true,
        isPrimary: true
      }
    });

    report.productCategoryAssociations.total = productCategories.length;
    console.log(`   Total product-category associations: ${productCategories.length}`);

    // Count unique products with categories
    const productsWithCategories = new Set(productCategories.map(pc => pc.productId));
    report.productCategoryAssociations.productsWithCategories = productsWithCategories.size;
    console.log(`   Products with category associations: ${productsWithCategories.size}`);

    // Check for products without categories
    const allProducts = await prisma.product.findMany({
      select: { id: true, name: true, status: true, visibility: true }
    });
    const productsWithoutCategories = allProducts.filter(p => !productsWithCategories.has(p.id));
    report.productCategoryAssociations.productsWithoutCategories = productsWithoutCategories.length;
    console.log(`   Products without category associations: ${productsWithoutCategories.length}`);

    if (productsWithoutCategories.length > 0) {
      console.log('\n   Sample products without categories (first 5):');
      productsWithoutCategories.slice(0, 5).forEach((p, idx) => {
        console.log(`   ${idx + 1}. ${p.name} (${p.status}, ${p.visibility})`);
      });
    }

    // Check for orphaned category associations (categoryId pointing to non-existent category)
    const orphanedCategoryAssociations = productCategories.filter(pc => !categoryIds.has(pc.categoryId));
    report.productCategoryAssociations.orphanedAssociations = orphanedCategoryAssociations.length;
    if (orphanedCategoryAssociations.length > 0) {
      console.log(`\n   ⚠ Orphaned category associations: ${orphanedCategoryAssociations.length}`);
    }

    console.log('');

    // 5. Check product-brand associations
    console.log('5. Checking product-brand associations...');
    const brandIds = new Set(allBrands.map(b => b.id));

    // Count products with valid brand associations
    const productsWithValidBrands = allProducts.filter(p => brandIds.has(p.brandId));
    report.productBrandAssociations.productsWithBrands = productsWithValidBrands.length;
    console.log(`   Products with valid brand associations: ${productsWithValidBrands.length}`);

    // Count products without brand associations (brandId null or pointing to non-existent brand)
    const productsWithoutBrands = allProducts.filter(p => !p.brandId || !brandIds.has(p.brandId));
    report.productBrandAssociations.productsWithoutBrands = productsWithoutBrands.length;
    console.log(`   Products without valid brand associations: ${productsWithoutBrands.length}`);

    if (productsWithoutBrands.length > 0) {
      console.log('\n   Sample products without valid brands (first 5):');
      productsWithoutBrands.slice(0, 5).forEach((p, idx) => {
        console.log(`   ${idx + 1}. ${p.name} - brandId: ${p.brandId || 'null'}`);
      });
    }

    // Check for orphaned brand references (brandId pointing to non-existent brand)
    const orphanedBrandReferences = allProducts.filter(p => p.brandId && !brandIds.has(p.brandId));
    report.productBrandAssociations.orphanedBrands = orphanedBrandReferences.length;
    if (orphanedBrandReferences.length > 0) {
      console.log(`\n   ⚠ Products with orphaned brand references: ${orphanedBrandReferences.length}`);
    }

    console.log('');

    // 6. Summary and recommendations
    console.log('='.repeat(80));
    console.log('SUMMARY AND RECOMMENDATIONS');
    console.log('='.repeat(80));

    // Collect all issues
    if (categoriesWithoutSlug.length > 0) {
      report.summary.issues.push(`${categoriesWithoutSlug.length} categories missing slugs`);
      report.summary.recommendations.push('Generate slugs for categories without them using name-based slug generation');
    }

    if (brandsWithoutSlug.length > 0) {
      report.summary.issues.push(`${brandsWithoutSlug.length} brands missing slugs`);
      report.summary.recommendations.push('Generate slugs for brands without them using name-based slug generation');
    }

    if (inactiveCategories.length > 0) {
      report.summary.issues.push(`${inactiveCategories.length} inactive categories`);
      report.summary.recommendations.push('Review inactive categories and either activate them or remove from frontend navigation');
    }

    if (inactiveBrands.length > 0) {
      report.summary.issues.push(`${inactiveBrands.length} inactive brands`);
      report.summary.recommendations.push('Review inactive brands and either activate them or remove from frontend navigation');
    }

    if (productsWithoutCategories.length > 0) {
      report.summary.issues.push(`${productsWithoutCategories.length} products without category associations`);
      report.summary.recommendations.push('Assign categories to products that are missing them');
    }

    if (productsWithoutBrands.length > 0) {
      report.summary.issues.push(`${productsWithoutBrands.length} products without valid brand associations`);
      report.summary.recommendations.push('Assign valid brands to products that are missing them');
    }

    if (orphanedCategories.length > 0) {
      report.summary.issues.push(`${orphanedCategories.length} categories with orphaned parent references`);
      report.summary.recommendations.push('Fix category parent references to point to valid parent categories');
    }

    if (orphanedCategoryAssociations.length > 0) {
      report.summary.issues.push(`${orphanedCategoryAssociations.length} orphaned category associations`);
      report.summary.recommendations.push('Remove or fix product-category associations pointing to non-existent categories');
    }

    if (orphanedBrandReferences.length > 0) {
      report.summary.issues.push(`${orphanedBrandReferences.length} products with orphaned brand references`);
      report.summary.recommendations.push('Fix product brand references to point to valid brands');
    }

    // Print summary
    if (report.summary.issues.length === 0) {
      console.log('\n✓ No data issues found. Database is in good health!');
    } else {
      console.log('\nISSUES FOUND:');
      report.summary.issues.forEach((issue, idx) => {
        console.log(`  ${idx + 1}. ${issue}`);
      });

      console.log('\nRECOMMENDATIONS:');
      report.summary.recommendations.forEach((rec, idx) => {
        console.log(`  ${idx + 1}. ${rec}`);
      });
    }

    // Additional statistics
    console.log('\n' + '='.repeat(80));
    console.log('ADDITIONAL STATISTICS');
    console.log('='.repeat(80));
    console.log(`Total products in database: ${allProducts.length}`);
    console.log(`Active products: ${allProducts.filter(p => p.status === 'active').length}`);
    console.log(`Public visibility products: ${allProducts.filter(p => p.visibility === 'public').length}`);
    console.log(`Products with both category and brand: ${allProducts.filter(p => productsWithCategories.has(p.id) && brandIds.has(p.brandId)).length}`);

    // Category distribution
    console.log('\nCategory product distribution:');
    const categoryProductCounts = await prisma.category.findMany({
      select: {
        name: true,
        slug: true,
        status: true,
        _count: {
          select: { productCategories: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    categoryProductCounts.forEach(cat => {
      const count = cat._count.productCategories;
      if (count > 0) {
        console.log(`  ${cat.name} (${cat.slug}): ${count} product(s) [${cat.status}]`);
      }
    });

    // Brand distribution
    console.log('\nBrand product distribution:');
    const brandProductCounts = await prisma.brand.findMany({
      select: {
        name: true,
        slug: true,
        status: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    brandProductCounts.forEach(brand => {
      const count = brand._count.products;
      if (count > 0) {
        console.log(`  ${brand.name} (${brand.slug}): ${count} product(s) [${brand.status}]`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSTIC COMPLETE');
    console.log('='.repeat(80));

    // Save report to file
    const reportPath = './category-brand-diagnostic-report.json';
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nFull report saved to: ${reportPath}`);

  } catch (error) {
    console.error('\n✗ Diagnostic failed with error:', error);
    report.summary.issues.push(`Diagnostic error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }

  return report;
}

// Run the diagnostic
diagnoseCategoryBrandData()
  .then(report => {
    process.exit(report.summary.issues.length > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
