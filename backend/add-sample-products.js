const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CORPORATE_ACCOUNT_ID = '83fbff07-2859-425b-bbe2-26478d548fe0';

// Sample products data
const sampleProducts = [
  {
    name: 'Smart Phone',
    nameEn: 'Smart Phone',
    nameBn: 'স্মার্ট ফোন',
    sku: 'SP-001',
    slug: 'smart-phone',
    shortDescription: 'Latest smartphone with advanced features',
    description: 'A powerful smartphone with cutting-edge technology, featuring a high-resolution display, advanced camera system, and long-lasting battery life.',
    regularPrice: 45000,
    salePrice: 42000,
    costPrice: 38000,
    stockQuantity: 50,
    lowStockThreshold: 10,
    status: 'active',
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    warrantyPeriod: 12,
    warrantyType: 'months',
    taxRate: 5,
    discountPercent: 10,
    specialPrice: 40500
  },
  {
    name: 'Laptop',
    nameEn: 'Laptop',
    nameBn: 'ল্যাপটপ',
    sku: 'LP-002',
    slug: 'laptop',
    shortDescription: 'High-performance laptop for work and gaming',
    description: 'A versatile laptop designed for both professional work and gaming, featuring powerful processor, ample RAM, and fast SSD storage.',
    regularPrice: 85000,
    salePrice: 80000,
    costPrice: 72000,
    stockQuantity: 30,
    lowStockThreshold: 5,
    status: 'active',
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    warrantyPeriod: 24,
    warrantyType: 'months',
    taxRate: 5,
    discountPercent: 8,
    specialPrice: 78200
  },
  {
    name: 'Wireless Headphones',
    nameEn: 'Wireless Headphones',
    nameBn: 'ওয়্যারলেস হেডফোন',
    sku: 'WH-003',
    slug: 'wireless-headphones',
    shortDescription: 'Premium wireless headphones with noise cancellation',
    description: 'Experience crystal-clear audio with these premium wireless headphones featuring active noise cancellation and long battery life.',
    regularPrice: 12000,
    salePrice: 11000,
    costPrice: 9000,
    stockQuantity: 100,
    lowStockThreshold: 20,
    status: 'active',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: true,
    warrantyPeriod: 12,
    warrantyType: 'months',
    taxRate: 5,
    discountPercent: 15,
    specialPrice: 10200
  },
  {
    name: 'Smart Watch',
    nameEn: 'Smart Watch',
    nameBn: 'স্মার্ট ওয়াচ',
    sku: 'SW-004',
    slug: 'smart-watch',
    shortDescription: 'Feature-rich smartwatch with health monitoring',
    description: 'Stay connected and track your health with this advanced smartwatch featuring heart rate monitoring, GPS, and water resistance.',
    regularPrice: 18000,
    salePrice: 16500,
    costPrice: 14000,
    stockQuantity: 75,
    lowStockThreshold: 15,
    status: 'active',
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    warrantyPeriod: 12,
    warrantyType: 'months',
    taxRate: 5,
    discountPercent: 12,
    specialPrice: 15840
  },
  {
    name: 'Tablet',
    nameEn: 'Tablet',
    nameBn: 'ট্যাবলেট',
    sku: 'TB-005',
    slug: 'tablet',
    shortDescription: 'Versatile tablet for work and entertainment',
    description: 'A powerful tablet perfect for both work and entertainment, featuring a stunning display and long battery life.',
    regularPrice: 35000,
    salePrice: 32000,
    costPrice: 28000,
    stockQuantity: 40,
    lowStockThreshold: 8,
    status: 'active',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: true,
    warrantyPeriod: 12,
    warrantyType: 'months',
    taxRate: 5,
    discountPercent: 10,
    specialPrice: 31500
  }
];

async function addSampleProducts() {
  console.log('Starting to add sample products...');
  
  try {
    // Check if corporate account exists
    console.log(`\n[1/6] Checking corporate account: ${CORPORATE_ACCOUNT_ID}`);
    const corporateAccount = await prisma.corporateAccount.findUnique({
      where: { id: CORPORATE_ACCOUNT_ID }
    });
    
    if (!corporateAccount) {
      console.error(`❌ Corporate account not found: ${CORPORATE_ACCOUNT_ID}`);
      return;
    }
    console.log(`✓ Corporate account found: ${corporateAccount.companyName}`);

    // Get or create brand
    console.log('\n[2/6] Checking/creating brand...');
    let brand = await prisma.brand.findFirst({
      where: { name: 'TechBrand' }
    });
    
    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: 'TechBrand',
          slug: 'techbrand',
          description: 'Leading technology brand',
          website: 'https://techbrand.com',
          isActive: true
        }
      });
      console.log(`✓ Created brand: ${brand.name}`);
    } else {
      console.log(`✓ Using existing brand: ${brand.name}`);
    }

    // Get or create category
    console.log('\n[3/6] Checking/creating category...');
    let category = await prisma.category.findFirst({
      where: { name: 'Electronics' }
    });
    
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic devices and gadgets',
          isActive: true,
          sortOrder: 1
        }
      });
      console.log(`✓ Created category: ${category.name}`);
    } else {
      console.log(`✓ Using existing category: ${category.name}`);
    }

    // Add products and corporate pricing
    console.log('\n[4/6] Adding products and corporate pricing...');
    const addedProducts = [];
    
    for (const productData of sampleProducts) {
      // Check if product already exists by SKU
      const existingProduct = await prisma.product.findUnique({
        where: { sku: productData.sku }
      });
      
      if (existingProduct) {
        console.log(`⚠ Product already exists: ${productData.name} (SKU: ${productData.sku})`);
        
        // Check if corporate pricing exists
        const existingPricing = await prisma.corporatePricing.findUnique({
          where: {
            corporateAccountId_productId: {
              corporateAccountId: CORPORATE_ACCOUNT_ID,
              productId: existingProduct.id
            }
          }
        });
        
        if (!existingPricing) {
          // Add corporate pricing to existing product
          const pricing = await prisma.corporatePricing.create({
            data: {
              corporateAccountId: CORPORATE_ACCOUNT_ID,
              productId: existingProduct.id,
              discountPercent: productData.discountPercent,
              specialPrice: productData.specialPrice,
              validFrom: new Date(),
              validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
            }
          });
          console.log(`  ✓ Added corporate pricing to existing product`);
          addedProducts.push({ ...existingProduct, corporatePricing: pricing });
        } else {
          console.log(`  ✓ Corporate pricing already exists`);
          addedProducts.push({ ...existingProduct, corporatePricing: existingPricing });
        }
        continue;
      }
      
      // Create new product
      const product = await prisma.product.create({
        data: {
          sku: productData.sku,
          name: productData.name,
          nameEn: productData.nameEn,
          nameBn: productData.nameBn,
          slug: productData.slug,
          shortDescription: productData.shortDescription,
          description: productData.description,
          categoryId: category.id,
          brandId: brand.id,
          regularPrice: productData.regularPrice,
          salePrice: productData.salePrice,
          costPrice: productData.costPrice,
          taxRate: productData.taxRate,
          stockQuantity: productData.stockQuantity,
          lowStockThreshold: productData.lowStockThreshold,
          status: productData.status,
          isFeatured: productData.isFeatured,
          isNewArrival: productData.isNewArrival,
          isBestSeller: productData.isBestSeller,
          warrantyPeriod: productData.warrantyPeriod,
          warrantyType: productData.warrantyType,
          publishedAt: new Date()
        }
      });
      
      // Create corporate pricing
      const pricing = await prisma.corporatePricing.create({
        data: {
          corporateAccountId: CORPORATE_ACCOUNT_ID,
          productId: product.id,
          discountPercent: productData.discountPercent,
          specialPrice: productData.specialPrice,
          validFrom: new Date(),
          validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        }
      });
      
      console.log(`✓ Created product: ${product.name} (SKU: ${product.sku})`);
      console.log(`  - Regular Price: ৳${productData.regularPrice}`);
      console.log(`  - Corporate Price: ৳${productData.specialPrice} (${productData.discountPercent}% off)`);
      addedProducts.push({ ...product, corporatePricing: pricing });
    }

    // Verify the products were added
    console.log('\n[5/6] Verifying products...');
    const corporatePricingRecords = await prisma.corporatePricing.findMany({
      where: { corporateAccountId: CORPORATE_ACCOUNT_ID },
      include: {
        products: {
          include: {
            category: true,
            brand: true
          }
        }
      }
    });
    
    console.log(`✓ Total corporate pricing records: ${corporatePricingRecords.length}`);
    
    // Test the endpoint query
    console.log('\n[6/6] Testing endpoint query...');
    const endpointProducts = await prisma.product.findMany({
      include: {
        corporate_pricing: {
          where: {
            corporateAccountId: CORPORATE_ACCOUNT_ID,
            OR: [
              { validTo: null },
              { validTo: { gte: new Date() } }
            ]
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        brand: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    const productsWithPricing = endpointProducts.filter(p => p.corporate_pricing.length > 0);
    console.log(`✓ Products returned by endpoint query: ${productsWithPricing.length}`);
    
    if (productsWithPricing.length > 0) {
      console.log('\n=== Products Summary ===');
      productsWithPricing.forEach((p, index) => {
        const pricing = p.corporate_pricing[0];
        console.log(`\n${index + 1}. ${p.name}`);
        console.log(`   SKU: ${p.sku}`);
        console.log(`   Regular Price: ৳${p.regularPrice}`);
        console.log(`   Corporate Price: ৳${pricing.specialPrice}`);
        console.log(`   Discount: ${pricing.discountPercent}%`);
        console.log(`   Valid Until: ${pricing.validTo ? pricing.validTo.toISOString().split('T')[0] : 'No expiry'}`);
      });
    }
    
    console.log('\n✅ All sample products added successfully!');
    
  } catch (error) {
    console.error('\n❌ Error adding sample products:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
    console.log('\nDisconnected from database.');
  }
}

// Run the script
addSampleProducts();
