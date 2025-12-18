
/**
 * API Test Utilities and Helpers
 * 
 * This file provides common utilities, helpers, and mock data
 * for testing API endpoints across the Smart Technologies Bangladesh B2C Website.
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Initialize Prisma client for testing
const prisma = new PrismaClient();

/**
 * Test configuration constants
 */
const TEST_CONFIG = {
  BASE_URL: '/api/v1',
  JWT_SECRET: process.env.JWT_SECRET || 'test_secret_key',
  TEST_USER: {
    email: 'test@example.com',
    password: 'test123456',
    firstName: 'Test',
    lastName: 'User',
    phone: '+8801234567890'
  },
  TEST_ADMIN: {
    email: 'admin@example.com',
    password: 'admin123456',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN'
  }
};

/**
 * Generate JWT token for testing
 * @param {Object} user - User object
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
const generateTestToken = (user, expiresIn = '7d') => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role || 'CUSTOMER' 
    },
    TEST_CONFIG.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Create test user in database
 * @param {Object} userData - User data override
 * @returns {Object} Created user with token
 */
const createTestUser = async (userData = {}) => {
  const hashedPassword = await bcrypt.hash(
    userData.password || TEST_CONFIG.TEST_USER.password, 
    10
  );

  const user = await prisma.user.create({
    data: {
      email: userData.email || TEST_CONFIG.TEST_USER.email,
      password: hashedPassword,
      firstName: userData.firstName || TEST_CONFIG.TEST_USER.firstName,
      lastName: userData.lastName || TEST_CONFIG.TEST_USER.lastName,
      phone: userData.phone || TEST_CONFIG.TEST_USER.phone,
      role: userData.role || 'CUSTOMER',
      status: 'ACTIVE'
    }
  });

  const token = generateTestToken(user);
  return { user, token };
};

/**
 * Create test admin user in database
 * @param {Object} adminData - Admin data override
 * @returns {Object} Created admin with token
 */
const createTestAdmin = async (adminData = {}) => {
  return createTestUser({
    ...TEST_CONFIG.TEST_ADMIN,
    ...adminData,
    role: 'ADMIN'
  });
};

/**
 * Create test category
 * @param {Object} categoryData - Category data override
 * @returns {Object} Created category
 */
const createTestCategory = async (categoryData = {}) => {
  return prisma.category.create({
    data: {
      name: categoryData.name || 'Test Category',
      slug: categoryData.slug || 'test-category',
      description: categoryData.description || 'Test category description',
      isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
      sortOrder: categoryData.sortOrder || 0
    }
  });
};

/**
 * Create test brand
 * @param {Object} brandData - Brand data override
 * @returns {Object} Created brand
 */
const createTestBrand = async (brandData = {}) => {
  return prisma.brand.create({
    data: {
      name: brandData.name || 'Test Brand',
      slug: brandData.slug || 'test-brand',
      description: brandData.description || 'Test brand description',
      isActive: brandData.isActive !== undefined ? brandData.isActive : true
    }
  });
};

/**
 * Create test product
 * @param {Object} productData - Product data override
 * @returns {Object} Created product with relations
 */
const createTestProduct = async (productData = {}) => {
  // Create or use existing category and brand
  const category = productData.category || await createTestCategory();
  const brand = productData.brand || await createTestBrand();

  return prisma.product.create({
    data: {
      sku: productData.sku || 'TEST-SKU-' + Date.now(),
      name: productData.name || 'Test Product',
      nameEn: productData.nameEn || 'Test Product English',
      nameBn: productData.nameBn || 'টেস্ট পণ্য',
      slug: productData.slug || 'test-product-' + Date.now(),
      shortDescription: productData.shortDescription || 'Test product short description',
      description: productData.description || 'Test product description',
      categoryId: category.id,
      brandId: brand.id,
      regularPrice: productData.regularPrice || 99.99,
      salePrice: productData.salePrice || null,
      costPrice: productData.costPrice || 50.00,
      stockQuantity: productData.stockQuantity || 100,
      lowStockThreshold: productData.lowStockThreshold || 10,
      status: productData.status || 'ACTIVE',
      warrantyPeriod: productData.warrantyPeriod || 12,
      warrantyType: productData.warrantyType || 'Manufacturer Warranty'
    },
    include: {
      category: true,
      brand: true
    }
  });
};

/**
 * Create test order
 * @param {Object} orderData - Order data override
 * @returns {Object} Created order with relations
 */
const createTestOrder = async (orderData = {}) => {
  const user = orderData.user || await createTestUser();
  const product = orderData.product || await createTestProduct();
  
  // Create test address
  const address = await prisma.address.create({
    data: {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '+8801234567890',
      address: '123 Test Street',
      city: 'Dhaka',
      district: 'Dhaka',
      division: 'DHAKA',
      postalCode: '1000',
      type: 'SHIPPING',
      isDefault: true
    }
  });

  const subtotal = parseFloat(product.regularPrice);
  const tax = subtotal * 0.15;
  const shippingCost = 100;
  const total = subtotal + tax + shippingCost;

  return prisma.order.create({
    data: {
      orderNumber: 'TEST-' + Date.now(),
      userId: user.id,
      addressId: address.id,
      subtotal,
      tax,
      shippingCost,
      discount: 0,
      total,
      paymentMethod: orderData.paymentMethod || 'CASH_ON_DELIVERY',
      status: orderData.status || 'PENDING',
      items: {
        create: {
          productId: product.id,
          quantity: 1,
          unitPrice: parseFloat(product.regularPrice),
          totalPrice: parseFloat(product.regularPrice)
        }
      }
    },
    include: {
      user: true,
      address: true,
      items: {
        include: {
          product: true
        }
      }
    }
  });
};

/**
 * Create test cart
 * @param {Object} cartData - Cart data override
 * @returns {Object} Created cart with items
 */
const createTestCart = async (cartData = {}) => {
  const user = cartData.user || null;
  const product = cartData.product || await createTestProduct();

  const cart = await prisma.cart.create({
    data: {
      userId: user?.id || null,
      sessionId: cartData.sessionId || 'test-session-' + Date.now()
    }
  });

  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: product.id,
      quantity: cartData.quantity || 1,
      unitPrice: parseFloat(product.regularPrice),
      totalPrice: parseFloat(product.regularPrice) * (cartData.quantity || 1)
    }
  });

  return prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });
};

/**
 * Create test wishlist
 * @param {Object} wishlistData - Wishlist data override
 * @returns {Object} Created wishlist with items
 */
const createTestWishlist = async (wishlistData = {}) => {
  const user = wishlistData.user || await createTestUser();
  const product = wishlistData.product || await createTestProduct();

  const wishlist = await prisma.wishlist.create({
    data: {
      userId: user.id,
      name: wishlistData.name || 'My Wishlist',
      isPrivate: wishlistData.isPrivate !== undefined ? wishlistData.isPrivate : false
    }
  });

  await prisma.wishlistItem.create({
    data: {
      wishlistId: wishlist.id,
      productId: product.id
    }
  });

  return prisma.wishlist.findUnique({
    where: { id: wishlist.id },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });
};

/**
 * Create test review
 * @param {Object} reviewData - Review data override
 * @returns {Object} Created review
 */
const createTestReview = async (reviewData = {}) => {
  const user = reviewData.user || await createTestUser();
  const product = reviewData.product || await createTestProduct();

  return prisma.review.create({
    data: {
      productId: product.id,
      userId: user.id,
      rating: reviewData.rating || 5,
      title: reviewData.title || 'Great Product',
      comment: reviewData.comment || 'This is a great product!',
      isVerified: reviewData.isVerified !== undefined ? reviewData.isVerified : true,
      isApproved: reviewData.isApproved !== undefined ? reviewData.isApproved : true
    },
    include: {
      user: true,
      product: true
    }
  });
};

/**
 * Create test coupon
 * @param {Object} couponData - Coupon data override
 * @returns {Object} Created coupon
 */
const createTestCoupon = async (couponData = {}) => {
  return prisma.coupon.create({
    data: {
      code: couponData.code || 'TEST' + Date.now(),
      name: couponData.name || 'Test Coupon',
      type: couponData.type || 'PERCENTAGE',
      value: couponData.value || 10.00,
      minAmount: couponData.minAmount || 100.00,
      maxDiscount: couponData.maxDiscount || 50.00,
      usageLimit: couponData.usageLimit || 100,
      isActive: couponData.isActive !== undefined ? couponData.isActive : true,
      expiresAt: couponData.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  });
};

/**
 * Clean up test data
 * @param {Array} models - Prisma models to clean
 */
const cleanupTestData = async (models = ['user', 'product', 'category', 'brand', 'order', 'cart', 'wishlist', 'review', 'coupon']) => {
  const deletePromises = models.map(model => {
    if (model === 'user') {
      return prisma.user.deleteMany({ where: { email: { contains: 'test' } } });
    } else if (model === 'product') {
      return prisma.product.deleteMany({ where: { sku: { contains: 'TEST' } } });
    } else if (model === 'category') {
      return prisma.category.deleteMany({ where: { slug: { contains: 'test' } } });
    } else if (model === 'brand') {
      return prisma.brand.deleteMany({ where: { slug: { contains: 'test' } } });
    } else if (model === 'order') {
      return prisma.order.deleteMany({ where: { orderNumber: { contains: 'TEST' } } });
    } else if (model === 'coupon') {
      return prisma.coupon.deleteMany({ where: { code: { contains: 'TEST' } } });
    } else {
      return prisma[model].deleteMany({});
    }
  });

  await Promise.all(deletePromises);
};

/**
 * Make authenticated API request
 * @param {Object} app - Express app
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request data
 * @param {string} token - Authentication token
 * @returns {Object} Supertest response
 */
const makeAuthenticatedRequest = async (app, method, endpoint, data = {}, token) => {
  const requestObj = request(app)[method.toLowerCase()](endpoint);
  
  if (token) {
    requestObj.set('Authorization', `Bearer ${token}`);
  }
  
  if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
    requestObj.send(data);
  }
  
  return requestObj;
};

/**
 * Test response structure validation
 * @param {Object} response - Supertest response
 * @param {number} expectedStatus - Expected HTTP status
 * @param {Object} expectedStructure - Expected response structure
 */
const validateResponseStructure = (response, expectedStatus, expectedStructure = {}) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
  
  if (Object.keys(expectedStructure).length > 0) {
    Object.keys(expectedStructure).forEach(key => {
      expect(response.body).toHaveProperty(key);
      if (typeof expectedStructure[key] === 'object' && expectedStructure[key] !== null) {
        validateResponseStructure({ body: response.body[key] }, 200, expectedStructure[key]);
      }
    });
  }
};

/**
 * Bangladesh-specific test data
 */
const BANGLADESH_TEST_DATA = {
  divisions: ['DHAKA', 'CHITTAGONG', 'RAJSHAHI', 'SYLHET', 'KHULNA', 'BARISHAL', 'RANGPUR', 'MYMENSINGH'],
  districts: ['Dhaka', 'Chittagong', 'Rajshahi', 'Sylhet', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh'],
  paymentMethods: ['CASH_ON_DELIVERY', 'BKASH', 'NAGAD', 'ROCKET'],
  phoneFormats: ['+8801xxxxxxxxx', '01xxxxxxxxx'],
  postalCodes: ['1000', '1200', '4000', '5000']
};

module.exports = {
  TEST_CONFIG,
  generateTestToken,
  createTestUser,
