import { PrismaClient } from '@prisma/client';
import { Division, UserRole, AddressType, OrderStatus, PaymentStatus, CouponType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  try {
    // Create sample categories
    const electronicsCategory = await prisma.category.upsert({
      where: { slug: 'electronics' },
      update: { name: 'Electronics', description: 'Electronic devices and accessories' },
      create: { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories' },
    });

    const clothingCategory = await prisma.category.upsert({
      where: { slug: 'clothing' },
      update: { name: 'Clothing', description: 'Fashion and apparel' },
      create: { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel' },
    });

    const homeApplianceCategory = await prisma.category.upsert({
      where: { slug: 'home-appliances' },
      update: { name: 'Home Appliances', description: 'Home and kitchen appliances' },
      create: { name: 'Home Appliances', slug: 'home-appliances', description: 'Home and kitchen appliances' },
    });

    // Create sample brands
    const samsungBrand = await prisma.brand.upsert({
      where: { slug: 'samsung' },
      update: { name: 'Samsung', description: 'Samsung Electronics', website: 'https://www.samsung.com' },
      create: { name: 'Samsung', slug: 'samsung', description: 'Samsung Electronics', website: 'https://www.samsung.com' },
    });

    const appleBrand = await prisma.brand.upsert({
      where: { slug: 'apple' },
      update: { name: 'Apple', description: 'Apple Inc.', website: 'https://www.apple.com' },
      create: { name: 'Apple', slug: 'apple', description: 'Apple Inc.', website: 'https://www.apple.com' },
    });

    // Create sample products
    const smartphone = await prisma.product.upsert({
      where: { sku: 'SGS24-128GB' },
      update: {
        name: 'Samsung Galaxy S24', slug: 'samsung-galaxy-s24', description: 'Latest Samsung smartphone with advanced features',
        shortDesc: 'Flagship Android smartphone', price: 89999, comparePrice: 99999, costPrice: 75000,
        stock: 50, minStock: 5, weight: 0.167, dimensions: '162.3 x 78.5 x 8.0 mm',
        categoryId: electronicsCategory.id, brandId: samsungBrand.id, isFeatured: true,
      },
      create: {
        name: 'Samsung Galaxy S24', slug: 'samsung-galaxy-s24', description: 'Latest Samsung smartphone with advanced features',
        shortDesc: 'Flagship Android smartphone', sku: 'SGS24-128GB', price: 89999, comparePrice: 99999, costPrice: 75000,
        stock: 50, minStock: 5, weight: 0.167, dimensions: '162.3 x 78.5 x 8.0 mm',
        categoryId: electronicsCategory.id, brandId: samsungBrand.id, isFeatured: true,
      },
    });

    const laptop = await prisma.product.upsert({
      where: { sku: 'MBP14-M3-512GB' },
      update: {
        name: 'MacBook Pro 14"', slug: 'macbook-pro-14', description: 'Apple MacBook Pro with M3 chip',
        shortDesc: 'Professional laptop with M3 processor', price: 189999, comparePrice: 199999, costPrice: 160000,
        stock: 25, minStock: 3, weight: 1.6, dimensions: '31.26 x 22.12 x 1.55 cm',
        categoryId: electronicsCategory.id, brandId: appleBrand.id, isFeatured: true,
      },
      create: {
        name: 'MacBook Pro 14"', slug: 'macbook-pro-14', description: 'Apple MacBook Pro with M3 chip',
        shortDesc: 'Professional laptop with M3 processor', sku: 'MBP14-M3-512GB', price: 189999, comparePrice: 199999, costPrice: 160000,
        stock: 25, minStock: 3, weight: 1.6, dimensions: '31.26 x 22.12 x 1.55 cm',
        categoryId: electronicsCategory.id, brandId: appleBrand.id, isFeatured: true,
      },
    });

    // Create sample users
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@smarttech.com' },
      update: { firstName: 'Admin', lastName: 'User', phone: '+8801712345678', role: UserRole.ADMIN },
      create: { email: 'admin@smarttech.com', password: '$2b$12$exampleHash', firstName: 'Admin', lastName: 'User', phone: '+8801712345678', role: UserRole.ADMIN },
    });

    const customerUser = await prisma.user.upsert({
      where: { email: 'customer@example.com' },
      update: { firstName: 'John', lastName: 'Doe', phone: '+8801812345678', role: UserRole.CUSTOMER },
      create: { email: 'customer@example.com', password: '$2b$12$exampleHash', firstName: 'John', lastName: 'Doe', phone: '+8801812345678', role: UserRole.CUSTOMER },
    });

    // Create sample addresses
    await prisma.address.createMany({
      data: [
        {
          userId: customerUser.id, type: AddressType.SHIPPING, firstName: 'John', lastName: 'Doe', phone: '+8801812345678',
          address: '123 Main Street, Apt 4B', city: 'Dhaka', district: 'Dhaka', division: Division.DHAKA, postalCode: '1000', isDefault: true,
        },
        {
          userId: customerUser.id, type: AddressType.BILLING, firstName: 'John', lastName: 'Doe', phone: '+8801812345678',
          address: '456 Office Plaza, Floor 12', city: 'Dhaka', district: 'Dhaka', division: Division.DHAKA, postalCode: '1000', isDefault: false,
        },
      ],
    });

    // Create sample coupons
    await prisma.coupon.upsert({
      where: { code: 'WELCOME10' },
      update: {
        type: CouponType.PERCENTAGE, value: 10, minAmount: 1000, maxDiscount: 500, usageLimit: 100,
        expiresAt: new Date('2024-12-31T23:59:59Z'),
      },
      create: {
        code: 'WELCOME10', type: CouponType.PERCENTAGE, value: 10, minAmount: 1000, maxDiscount: 500, usageLimit: 100,
        expiresAt: new Date('2024-12-31T23:59:59Z'),
      },
    });

    console.log('Seeding finished successfully.');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    // @ts-ignore
    if (typeof process !== 'undefined') {
      process.exit(1);
    }
  })
  .finally(async () => {
    await prisma.$disconnect();
  });