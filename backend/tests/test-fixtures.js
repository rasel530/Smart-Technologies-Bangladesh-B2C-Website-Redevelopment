/**
 * Test Data Fixtures and Seeders
 * Provides comprehensive test data for all entities
 */
class TestDataFixtures {
  constructor() {
    this.fixtures = {
      users: [],
      addresses: [],
      categories: [],
      brands: [],
      products: [],
      orders: [],
      reviews: [],
      coupons: [],
      cartItems: [],
      wishlistItems: []
    };
    
    this.generateFixtures();
  }

  generateFixtures() {
    this.generateUsers();
    this.generateAddresses();
    this.generateCategories();
    this.generateBrands();
    this.generateProducts();
    this.generateOrders();
    this.generateReviews();
    this.generateCoupons();
    this.generateCartItems();
    this.generateWishlistItems();
  }

  generateUsers() {
    this.fixtures.users = [
      {
        id: 'user-admin',
        email: 'admin@smarttech.bd',
        phone: '+8801712345678',
        password: '$2a$12$hashed_admin_password',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        lastLoginAt: new Date('2024-12-15T10:00:00Z')
      },
      {
        id: 'user-customer-1',
        email: 'customer1@example.com',
        phone: '+8801812345678',
        password: '$2a$12$hashed_customer_password',
        firstName: 'আমিন',
        lastName: 'খান',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        createdAt: new Date('2024-02-15T00:00:00Z'),
        updatedAt: new Date('2024-02-15T00:00:00Z'),
        lastLoginAt: new Date('2024-12-15T09:00:00Z')
      },
      {
        id: 'user-customer-2',
        email: 'customer2@example.com',
        phone: '+8801912345678',
        password: '$2a$12$hashed_customer_password_2',
        firstName: 'Rahim',
        lastName: 'Karim',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        createdAt: new Date('2024-03-15T00:00:00Z'),
        updatedAt: new Date('2024-03-15T00:00:00Z'),
        lastLoginAt: new Date('2024-12-14T15:30:00Z')
      },
      {
        id: 'user-manager',
        email: 'manager@smarttech.bd',
        phone: '+8801711111111',
        password: '$2a$12$hashed_manager_password',
        firstName: 'Manager',
        lastName: 'User',
        role: 'MANAGER',
        status: 'ACTIVE',
        createdAt: new Date('2024-01-15T00:00:00Z'),
        updatedAt: new Date('2024-01-15T00:00:00Z'),
        lastLoginAt: new Date('2024-12-15T08:00:00Z')
      }
    ];
  }

  generateAddresses() {
    this.fixtures.addresses = [
      {
        id: 'addr-dhaka-1',
        userId: 'user-customer-1',
        type: 'SHIPPING',
        firstName: 'আমিন',
        lastName: 'খান',
        phone: '+8801812345678',
        address: '123, Dhanmondi Road 8',
        addressLine2: 'Apartment 4A',
        city: 'Dhaka',
        district: 'Dhaka',
        division: 'DHAKA',
        upazila: 'Dhanmondi',
        postalCode: '1209',
        isDefault: true
      },
      {
        id: 'addr-chittagong-1',
        userId: 'user-customer-2',
        type: 'SHIPPING',
        firstName: 'Rahim',
        lastName: 'Karim',
        phone: '+8801912345678',
        address: '456, Agrabad',
        city: 'Chittagong',
        district: 'Chittagong',
        division: 'CHITTAGONG',
        upazila: 'Agrabad',
        postalCode: '4000',
        isDefault: true
      },
      {
        id: 'addr-billing-1',
        userId: 'user-customer-1',
        type: 'BILLING',
        firstName: 'আমিন',
        lastName: 'খান',
        phone: '+8801812345678',
        address: '789, Gulshan Avenue',
        city: 'Dhaka',
        district: 'Dhaka',
        division: 'DHAKA',
        upazila: 'Gulshan',
        postalCode: '1213',
        isDefault: false
      }
    ];
  }

  generateCategories() {
    this.fixtures.categories = [
      {
        id: 'cat-electronics',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and accessories',
        isActive: true,
        parentId: null,
        bannerImage: '/images/categories/electronics-banner.jpg',
        icon: 'electronics-icon',
        sortOrder: 1
      },
      {
        id: 'cat-mobile',
        name: 'Mobile Phones',
        slug: 'mobile-phones',
        description: 'Smartphones and mobile devices',
        isActive: true,
        parentId: 'cat-electronics',
        bannerImage: '/images/categories/mobile-banner.jpg',
        icon: 'mobile-icon',
        sortOrder: 1
      },
      {
        id: 'cat-computers',
        name: 'Computers',
        slug: 'computers',
        description: 'Laptops, desktops and computer accessories',
        isActive: true,
        parentId: 'cat-electronics',
        bannerImage: '/images/categories/computers-banner.jpg',
        icon: 'computer-icon',
        sortOrder: 2
      },
      {
        id: 'cat-clothing',
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel',
        isActive: true,
        parentId: null,
        bannerImage: '/images/categories/clothing-banner.jpg',
        icon: 'clothing-icon',
        sortOrder: 2
      },
      {
        id: 'cat-men-clothing',
        name: 'Men\'s Clothing',
        slug: 'mens-clothing',
        description: 'Clothing for men',
        isActive: true,
        parentId: 'cat-clothing',
        bannerImage: '/images/categories/mens-clothing-banner.jpg',
        icon: 'mens-clothing-icon',
        sortOrder: 1
      }
    ];
  }

  generateBrands() {
    this.fixtures.brands = [
      {
        id: 'brand-samsung',
        name: 'Samsung',
        slug: 'samsung',
        description: 'Samsung Electronics Bangladesh',
        website: 'https://www.samsung.com/bd',
        isActive: true
      },
      {
        id: 'brand-apple',
        name: 'Apple',
        slug: 'apple',
        description: 'Apple Inc. Official Store Bangladesh',
        website: 'https://www.apple.com/bd',
        isActive: true
      },
      {
        id: 'brand-xiaomi',
        name: 'Xiaomi',
        slug: 'xiaomi',
        description: 'Xiaomi Bangladesh Official',
        website: 'https://www.mi.com/bd',
        isActive: true
      },
      {
        id: 'brand-walton',
        name: 'Walton',
        slug: 'walton',
        description: 'Walton Bangladesh - Local Electronics Brand',
        website: 'https://www.waltonbd.com',
        isActive: true
      }
    ];
  }

  generateProducts() {
    this.fixtures.products = [
      {
        id: 'prod-samsung-s21',
        sku: 'SAMSUNG-GALAXY-S21-BD',
        name: 'Samsung Galaxy S21',
        nameEn: 'Samsung Galaxy S21',
        nameBn: 'স্যামসাং গ্যালাক্সি S21',
        slug: 'samsung-galaxy-s21-bd',
        shortDescription: 'Latest Samsung flagship smartphone with 5G',
        description: 'Powerful smartphone with advanced camera system and 5G connectivity',
        categoryId: 'cat-mobile',
        brandId: 'brand-samsung',
        regularPrice: 85000,
        salePrice: 75000,
        costPrice: 65000,
        taxRate: 15,
        stockQuantity: 50,
        lowStockThreshold: 10,
        status: 'ACTIVE',
        metaTitle: 'Samsung Galaxy S21 Price in Bangladesh',
        metaDescription: 'Buy Samsung Galaxy S21 at best price in Bangladesh',
        metaKeywords: 'samsung, galaxy, smartphone, 5g, bangladesh',
        isFeatured: true,
        isNewArrival: false,
        isBestSeller: true,
        warrantyPeriod: 12,
        warrantyType: 'Official Warranty',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        publishedAt: new Date('2024-01-01T00:00:00Z')
      },
      {
        id: 'prod-iphone-15',
        sku: 'APPLE-IPHONE-15-BD',
        name: 'iPhone 15',
        nameEn: 'iPhone 15',
        nameBn: 'আইফোন ১৫',
        slug: 'iphone-15-bd',
        shortDescription: 'Latest Apple iPhone with A17 Pro chip',
        description: 'Revolutionary iPhone with powerful A17 Pro chip and advanced camera system',
        categoryId: 'cat-mobile',
        brandId: 'brand-apple',
        regularPrice: 125000,
        salePrice: 115000,
        costPrice: 95000,
        taxRate: 15,
        stockQuantity: 30,
        lowStockThreshold: 5,
        status: 'ACTIVE',
        metaTitle: 'iPhone 15 Price in Bangladesh',
        metaDescription: 'Buy iPhone 15 at official price in Bangladesh',
        metaKeywords: 'iphone, apple, smartphone, a17 pro, bangladesh',
        isFeatured: true,
        isNewArrival: true,
        isBestSeller: false,
        warrantyPeriod: 12,
        warrantyType: 'Official Warranty',
        createdAt: new Date('2024-09-01T00:00:00Z'),
        updatedAt: new Date('2024-09-01T00:00:00Z'),
        publishedAt: new Date('2024-09-01T00:00:00Z')
      },
      {
        id: 'prod-xiaomi-13',
        sku: 'XIAOMI-13-BD',
        name: 'Xiaomi 13',
        nameEn: 'Xiaomi 13',
        nameBn: 'শাওমি ১৩',
        slug: 'xiaomi-13-bd',
        shortDescription: 'Premium Xiaomi smartphone with Leica camera',
        description: 'Flagship Xiaomi smartphone with professional Leica camera system',
        categoryId: 'cat-mobile',
        brandId: 'brand-xiaomi',
        regularPrice: 45000,
        salePrice: 40000,
        costPrice: 32000,
        taxRate: 15,
        stockQuantity: 75,
        lowStockThreshold: 15,
        status: 'ACTIVE',
        metaTitle: 'Xiaomi 13 Price in Bangladesh',
        metaDescription: 'Buy Xiaomi 13 at best price in Bangladesh',
        metaKeywords: 'xiaomi, smartphone, leica camera, bangladesh',
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: true,
        warrantyPeriod: 12,
        warrantyType: 'Official Warranty',
        createdAt: new Date('2024-03-01T00:00:00Z'),
        updatedAt: new Date('2024-03-01T00:00:00Z'),
        publishedAt: new Date('2024-03-01T00:00:00Z')
      },
      {
        id: 'prod-walton-laptop',
        sku: 'WALTON-LAPTOP-PREMIUM-BD',
        name: 'Walton Premium Laptop',
        nameEn: 'Walton Premium Laptop',
        nameBn: 'ওয়ালটন প্রিমিয়াম ল্যাপটপ',
        slug: 'walton-premium-laptop-bd',
        shortDescription: 'Bangladeshi made premium laptop',
        description: 'High-quality laptop manufactured in Bangladesh with local support',
        categoryId: 'cat-computers',
        brandId: 'brand-walton',
        regularPrice: 55000,
        salePrice: 50000,
        costPrice: 40000,
        taxRate: 15,
        stockQuantity: 25,
        lowStockThreshold: 5,
        status: 'ACTIVE',
        metaTitle: 'Walton Premium Laptop Price in Bangladesh',
        metaDescription: 'Buy Walton Premium Laptop - Made in Bangladesh',
        metaKeywords: 'walton, laptop, computer, made in bangladesh, local',
        isFeatured: false,
        isNewArrival: true,
        isBestSeller: false,
        warrantyPeriod: 24,
        warrantyType: 'Local Warranty',
        createdAt: new Date('2024-06-01T00:00:00Z'),
        updatedAt: new Date('2024-06-01T00:00:00Z'),
        publishedAt: new Date('2024-06-01T00:00:00Z')
      }
    ];
  }

  generateOrders() {
    this.fixtures.orders = [
      {
        id: 'order-001',
        orderNumber: 'ORD-2024-001',
        userId: 'user-customer-1',
        addressId: 'addr-dhaka-1',
        subtotal: 75000,
        tax: 11250,
        shippingCost: 200,
        discount: 5000,
        total: 81450,
        paymentMethod: 'BKASH',
        paymentStatus: 'COMPLETED',
        paidAt: new Date('2024-12-10T14:30:00Z'),
        status: 'DELIVERED',
        notes: 'Customer requested express delivery',
        internalNotes: 'Priority customer - handle with care',
        createdAt: new Date('2024-12-10T10:00:00Z'),
        updatedAt: new Date('2024-12-15T16:00:00Z'),
        confirmedAt: new Date('2024-12-10T11:00:00Z'),
        shippedAt: new Date('2024-12-12T14:00:00Z'),
        deliveredAt: new Date('2024-12-15T16:00:00Z')
      },
      {
        id: 'order-002',
        orderNumber: 'ORD-2024-002',
        userId: 'user-customer-2',
        addressId: 'addr-chittagong-1',
        subtotal: 40000,
        tax: 6000,
        shippingCost: 300,
        discount: 0,
        total: 46300,
        paymentMethod: 'CASH_ON_DELIVERY',
        paymentStatus: 'PENDING',
        paidAt: null,
        status: 'PROCESSING',
        notes: 'Regular delivery requested',
        internalNotes: 'New customer - verify payment on delivery',
        createdAt: new Date('2024-12-14T09:00:00Z'),
        updatedAt: new Date('2024-12-14T09:00:00Z'),
        confirmedAt: new Date('2024-12-14T10:00:00Z'),
        shippedAt: null,
        deliveredAt: null
      }
    ];
  }

  generateReviews() {
    this.fixtures.reviews = [
      {
        id: 'review-001',
        productId: 'prod-samsung-s21',
        userId: 'user-customer-1',
        rating: 5,
        title: 'Excellent Phone!',
        comment: 'Great camera quality and fast performance. Very satisfied with the purchase.',
        isVerified: true,
        isApproved: true,
        createdAt: new Date('2024-12-12T15:30:00Z'),
        updatedAt: new Date('2024-12-12T15:30:00Z')
      },
      {
        id: 'review-002',
        productId: 'prod-iphone-15',
        userId: 'user-customer-2',
        rating: 4,
        title: 'Good but expensive',
        comment: 'Premium quality phone but the price is quite high. Overall good experience.',
        isVerified: true,
        isApproved: true,
        createdAt: new Date('2024-12-13T11:20:00Z'),
        updatedAt: new Date('2024-12-13T11:20:00Z')
      },
      {
        id: 'review-003',
        productId: 'prod-xiaomi-13',
        userId: 'user-customer-1',
        rating: 4,
        title: 'Value for money',
        comment: 'Great features for the price point. Camera is impressive.',
        isVerified: false,
        isApproved: false,
        createdAt: new Date('2024-12-14T09:15:00Z'),
        updatedAt: new Date('2024-12-14T09:15:00Z')
      }
    ];
  }

  generateCoupons() {
    this.fixtures.coupons = [
      {
        id: 'coupon-newyear',
        code: 'NEWYEAR2025',
        type: 'PERCENTAGE',
        value: 15.00,
        minAmount: 5000,
        maxDiscount: 3000,
        usageLimit: 1000,
        usedCount: 125,
        isActive: true,
        expiresAt: new Date('2025-01-31T23:59:59Z'),
        createdAt: new Date('2024-12-01T00:00:00Z'),
        updatedAt: new Date('2024-12-01T00:00:00Z')
      },
      {
        id: 'coupon-fixed',
        code: 'FLAT500',
        type: 'FIXED_AMOUNT',
        value: 500.00,
        minAmount: 10000,
        maxDiscount: 500,
        usageLimit: 500,
        usedCount: 45,
        isActive: true,
        expiresAt: new Date('2024-12-31T23:59:59Z'),
        createdAt: new Date('2024-12-01T00:00:00Z'),
        updatedAt: new Date('2024-12-01T00:00:00Z')
      },
      {
        id: 'coupon-ramadan',
        code: 'RAMADAN2024',
        type: 'PERCENTAGE',
        value: 20.00,
        minAmount: 3000,
        maxDiscount: 2000,
        usageLimit: 2000,
        usedCount: 0,
        isActive: true,
        expiresAt: new Date('2024-04-30T23:59:59Z'),
        createdAt: new Date('2024-03-01T00:00:00Z'),
        updatedAt: new Date('2024-03-01T00:00:00Z')
      }
    ];
  }

  generateCartItems() {
    this.fixtures.cartItems = [
      {
        id: 'cart-item-001',
        cartId: 'cart-user-1',
        userId: 'user-customer-1',
        productId: 'prod-samsung-s21',
        variantId: null,
        quantity: 1,
        unitPrice: 75000,
        totalPrice: 75000,
        addedAt: new Date('2024-12-15T10:00:00Z')
      },
      {
        id: 'cart-item-002',
        cartId: 'cart-user-2',
        userId: 'user-customer-2',
        productId: 'prod-xiaomi-13',
        variantId: null,
        quantity: 2,
        unitPrice: 40000,
        totalPrice: 80000,
        addedAt: new Date('2024-12-14T14:30:00Z')
      }
    ];
  }

  generateWishlistItems() {
    this.fixtures.wishlistItems = [
      {
        id: 'wishlist-item-001',
        wishlistId: 'wishlist-user-1',
        userId: 'user-customer-1',
        productId: 'prod-iphone-15',
        addedAt: new Date('2024-12-10T12:00:00Z')
      },
      {
        id: 'wishlist-item-002',
        wishlistId: 'wishlist-user-2',
        userId: 'user-customer-2',
        productId: 'prod-walton-laptop',
        addedAt: new Date('2024-12-12T16:45:00Z')
      }
    ];
  }

  // Methods to get specific fixtures
  getUsers() { return [...this.fixtures.users]; }
  getAddresses() { return [...this.fixtures.addresses]; }
  getCategories() { return [...this.fixtures.categories]; }
  getBrands() { return [...this.fixtures.brands]; }
  getProducts() { return [...this.fixtures.products]; }
  getOrders() { return [...this.fixtures.orders]; }
  getReviews() { return [...this.fixtures.reviews]; }
  getCoupons() { return [...this.fixtures.coupons]; }
  getCartItems() { return [...this.fixtures.cartItems]; }
  getWishlistItems() { return [...this.fixtures.wishlistItems]; }

  // Method to get all fixtures
  getAllFixtures() {
    return { ...this.fixtures };
  }

  // Method to get fixtures for a specific entity type
  getFixtures(entityType) {
    return this.fixtures[entityType] || [];
  }

  // Method to generate random test data
  generateRandomUser() {
    const firstNames = ['আমিন', 'রহিম', 'করিম', 'সালিম', 'Rahim', 'Karim', 'Jamal', 'Kamal'];
    const lastNames = ['খান', 'উদ্দিন', 'চৌধুরী', 'হাসান', 'Ahmed', 'Hossain', 'Khan', 'Rahman'];
    
    return {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      email: `user${Math.floor(Math.random() * 10000)}@example.com`,
      phone: `+8801${Math.floor(Math.random() * 900000000) + 100000000}`,
      password: '$2a$12$hashed_password',
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
      role: 'CUSTOMER',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  generateRandomProduct() {
    const categories = this.getCategories().filter(c => c.parentId !== null);
    const brands = this.getBrands();
    
    return {
      id: `prod-${Math.random().toString(36).substr(2, 9)}`,
      sku: `PROD-${Math.floor(Math.random() * 100000)}`,
      name: `Test Product ${Math.floor(Math.random() * 1000)}`,
      nameEn: `Test Product ${Math.floor(Math.random() * 1000)}`,
      nameBn: `পরীক্ষা পণ্য ${Math.floor(Math.random() * 1000)}`,
      slug: `test-product-${Math.random().toString(36).substr(2, 9)}`,
      shortDescription: 'A test product for development',
      description: 'This is a test product used for development and testing purposes',
      categoryId: categories[Math.floor(Math.random() * categories.length)].id,
      brandId: brands[Math.floor(Math.random() * brands.length)].id,
      regularPrice: Math.floor(Math.random() * 100000) + 1000,
      salePrice: Math.floor(Math.random() * 90000) + 500,
      costPrice: Math.floor(Math.random() * 80000) + 200,
      taxRate: 15,
      stockQuantity: Math.floor(Math.random() * 100) + 10,
      lowStockThreshold: 10,
      status: 'ACTIVE',
      isFeatured: Math.random() > 0.7,
      isNewArrival: Math.random() > 0.8,
      isBestSeller: Math.random() > 0.6,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date()
    };
  }

  // Method to seed database with fixtures
  async seedDatabase(databaseService) {
    console.log('🌱 Seeding database with test fixtures...');
    
    try {
      // Seed in order to respect foreign key constraints
      for (const category of this.fixtures.categories) {
        await databaseService.create('categories', category);
      }
      
      for (const brand of this.fixtures.brands) {
        await databaseService.create('brands', brand);
      }
      
      for (const user of this.fixtures.users) {
        await databaseService.create('users', user);
      }
      
      for (const address of this.fixtures.addresses) {
        await databaseService.create('addresses', address);
      }
      
      for (const product of this.fixtures.products) {
        await databaseService.create('products', product);
      }
      
      for (const order of this.fixtures.orders) {
        await databaseService.create('orders', order);
      }
      
      for (const review of this.fixtures.reviews) {
        await databaseService.create('reviews', review);
      }
      
      for (const coupon of this.fixtures.coupons) {
        await databaseService.create('coupons', coupon);
      }
      
      for (const cartItem of this.fixtures.cartItems) {
        await databaseService.create('cartItems', cartItem);
      }
      
      for (const wishlistItem of this.fixtures.wishlistItems) {
        await databaseService.create('wishlistItems', wishlistItem);
      }
      
      console.log('✅ Database seeded successfully with test fixtures');
      return true;
    } catch (error) {
      console.error('❌ Error seeding database:', error.message);
      throw error;
    }
  }
}

module.exports = {
  TestDataFixtures
};