const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create divisions (Bangladesh-specific data)
    const divisions = [
      { name: 'DHAKA' },
      { name: 'CHITTAGONG' },
      { name: 'RAJSHAHI' },
      { name: 'SYLHET' },
      { name: 'KHULNA' },
      { name: 'BARISHAL' },
      { name: 'RANGPUR' },
      { name: 'MYMENSINGH' }
    ];

    console.log('📍 Creating divisions...');
    for (const division of divisions) {
      await prisma.division.upsert({
        where: { name: division.name },
        update: {},
        create: division
      });
    }

    // Create categories
    console.log('📂 Creating categories...');
    const categories = [
      { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets' },
      { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel' },
      { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Home appliances and kitchen items' },
      { name: 'Books', slug: 'books', description: 'Books and educational materials' },
      { name: 'Sports', slug: 'sports', description: 'Sports equipment and accessories' }
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {},
        create: category
      });
    }

    // Create brands
    console.log('🏷️ Creating brands...');
    const brands = [
      { name: 'Samsung', slug: 'samsung', website: 'https://www.samsung.com' },
      { name: 'Apple', slug: 'apple', website: 'https://www.apple.com' },
      { name: 'Xiaomi', slug: 'xiaomi', website: 'https://www.mi.com' },
      { name: 'Walton', slug: 'walton', website: 'https://www.waltonbd.com' },
      { name: 'Vision', slug: 'vision', website: 'https://www.vision.com.bd' }
    ];

    for (const brand of brands) {
      await prisma.brand.upsert({
        where: { slug: brand.slug },
        update: {},
        create: brand
      });
    }

    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@smarttech.com' },
      update: {},
      create: {
        email: 'admin@smarttech.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    // Create test customer user
    console.log('👤 Creating test customer...');
    const customerPassword = await bcrypt.hash('customer123', 12);
    
    const customerUser = await prisma.user.upsert({
      where: { email: 'customer@example.com' },
      update: {},
      create: {
        email: 'customer@example.com',
        phone: '+8801700000001',
        password: customerPassword,
        firstName: 'Test',
        lastName: 'Customer',
        role: 'CUSTOMER',
        status: 'ACTIVE'
      }
    });

    // Get created entities for relationships
    const electronicsCategory = await prisma.category.findUnique({ where: { slug: 'electronics' } });
    const samsungBrand = await prisma.brand.findUnique({ where: { slug: 'samsung' } });

    // Create sample products
    console.log('📱 Creating sample products...');
    const products = [
      {
        sku: 'SAMSUNG-GALAXY-S23-001',
        name: 'Samsung Galaxy S23',
        nameEn: 'Samsung Galaxy S23',
        nameBn: 'স্যামসাং গ্যালাক্সি S23',
        slug: 'samsung-galaxy-s23',
        shortDescription: 'Latest Samsung flagship smartphone',
        description: 'Powerful smartphone with advanced camera and display',
        categoryId: electronicsCategory.id,
        brandId: samsungBrand.id,
        regularPrice: 89999,
        salePrice: 79999,
        costPrice: 65000,
        stockQuantity: 50,
        lowStockThreshold: 10,
        status: 'ACTIVE',
        isFeatured: true,
        isNewArrival: true,
        warrantyPeriod: 12,
        warrantyType: 'Official Warranty'
      },
      {
        sku: 'SAMSUNG-GALAXY-A54-001',
        name: 'Samsung Galaxy A54',
        nameEn: 'Samsung Galaxy A54',
        nameBn: 'স্যামসাং গ্যালাক্সি A54',
        slug: 'samsung-galaxy-a54',
        shortDescription: 'Mid-range Samsung smartphone',
        description: 'Great value smartphone with solid features',
        categoryId: electronicsCategory.id,
        brandId: samsungBrand.id,
        regularPrice: 44999,
        salePrice: 39999,
        costPrice: 32000,
        stockQuantity: 100,
        lowStockThreshold: 15,
        status: 'ACTIVE',
        warrantyPeriod: 12,
        warrantyType: 'Official Warranty'
      }
    ];

    for (const product of products) {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product
      });
    }

    // Get created products for images and specifications
    const galaxyS23 = await prisma.product.findUnique({ where: { sku: 'SAMSUNG-GALAXY-S23-001' } });
    const galaxyA54 = await prisma.product.findUnique({ where: { sku: 'SAMSUNG-GALAXY-A54-001' } });

    // Create product images
    console.log('🖼️ Creating product images...');
    if (galaxyS23) {
      await prisma.productImage.createMany({
        data: [
          {
            productId: galaxyS23.id,
            url: '/images/products/samsung-galaxy-s23-1.jpg',
            alt: 'Samsung Galaxy S23 - Front view',
            sortOrder: 0
          },
          {
            productId: galaxyS23.id,
            url: '/images/products/samsung-galaxy-s23-2.jpg',
            alt: 'Samsung Galaxy S23 - Back view',
            sortOrder: 1
          }
        ]
      });

      // Create product specifications
      await prisma.productSpecification.createMany({
        data: [
          {
            productId: galaxyS23.id,
            name: 'Display',
            value: '6.1" Dynamic AMOLED 2X',
            sortOrder: 0
          },
          {
            productId: galaxyS23.id,
            name: 'Processor',
            value: 'Snapdragon 8 Gen 2',
            sortOrder: 1
          },
          {
            productId: galaxyS23.id,
            name: 'RAM',
            value: '8GB',
            sortOrder: 2
          },
          {
            productId: galaxyS23.id,
            name: 'Storage',
            value: '256GB',
            sortOrder: 3
          },
          {
            productId: galaxyS23.id,
            name: 'Camera',
            value: '50MP + 10MP + 12MP',
            sortOrder: 4
          },
          {
            productId: galaxyS23.id,
            name: 'Battery',
            value: '3900mAh',
            sortOrder: 5
          }
        ]
      });
    }

    if (galaxyA54) {
      await prisma.productImage.createMany({
        data: [
          {
            productId: galaxyA54.id,
            url: '/images/products/samsung-galaxy-a54-1.jpg',
            alt: 'Samsung Galaxy A54 - Front view',
            sortOrder: 0
          },
          {
            productId: galaxyA54.id,
            url: '/images/products/samsung-galaxy-a54-2.jpg',
            alt: 'Samsung Galaxy A54 - Back view',
            sortOrder: 1
          }
        ]
      });

      // Create product specifications
      await prisma.productSpecification.createMany({
        data: [
          {
            productId: galaxyA54.id,
            name: 'Display',
            value: '6.4" Super AMOLED',
            sortOrder: 0
          },
          {
            productId: galaxyA54.id,
            name: 'Processor',
            value: 'Exynos 1380',
            sortOrder: 1
          },
          {
            productId: galaxyA54.id,
            name: 'RAM',
            value: '6GB',
            sortOrder: 2
          },
          {
            productId: galaxyA54.id,
            name: 'Storage',
            value: '128GB',
            sortOrder: 3
          },
          {
            productId: galaxyA54.id,
            name: 'Camera',
            value: '50MP + 12MP + 5MP',
            sortOrder: 4
          },
          {
            productId: galaxyA54.id,
            name: 'Battery',
            value: '5000mAh',
            sortOrder: 5
          }
        ]
      });
    }

    // Create sample coupons
    console.log('🎫 Creating sample coupons...');
    const coupons = [
      {
        code: 'WELCOME10',
        type: 'PERCENTAGE',
        value: 10,
        minAmount: 1000,
        maxDiscount: 500,
        usageLimit: 100,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        code: 'FLAT500',
        type: 'FIXED_AMOUNT',
        value: 500,
        minAmount: 5000,
        maxDiscount: 500,
        usageLimit: 50,
        isActive: true,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
      }
    ];

    for (const coupon of coupons) {
      await prisma.coupon.upsert({
        where: { code: coupon.code },
        update: {},
        create: coupon
      });
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Users: ${await prisma.user.count()}`);
    console.log(`   - Categories: ${await prisma.category.count()}`);
    console.log(`   - Brands: ${await prisma.brand.count()}`);
    console.log(`   - Products: ${await prisma.product.count()}`);
    console.log(`   - Coupons: ${await prisma.coupon.count()}`);
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('   Admin: admin@smarttech.com / admin123');
    console.log('   Customer: customer@example.com / customer123');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });