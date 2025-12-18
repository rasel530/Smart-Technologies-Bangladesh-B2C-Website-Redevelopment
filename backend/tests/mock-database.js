const { EventEmitter } = require('events');

/**
 * Mock Database Service for Testing
 * Provides a complete in-memory database simulation without requiring PostgreSQL
 */
class MockDatabaseService extends EventEmitter {
  constructor() {
    super();
    this.data = {
      users: new Map(),
      addresses: new Map(),
      products: new Map(),
      categories: new Map(),
      brands: new Map(),
      orders: new Map(),
      cartItems: new Map(),
      wishlists: new Map(),
      reviews: new Map(),
      coupons: new Map(),
      productImages: new Map(),
      productSpecifications: new Map(),
      productVariants: new Map(),
      userSessions: new Map(),
      userSocialAccounts: new Map(),
      transactions: new Map(),
      orderItems: new Map(),
      carts: new Map(),
      wishlistItems: new Map()
    };
    
    this.isConnected = false;
    this.queryLog = [];
    this.setupInitialData();
  }

  setupInitialData() {
    // Setup initial Bangladesh-specific data
    this.data.categories.set('cat-1', {
      id: 'cat-1',
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      isActive: true,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.data.categories.set('cat-2', {
      id: 'cat-2',
      name: 'Mobile Phones',
      slug: 'mobile-phones',
      description: 'Smartphones and mobile devices',
      isActive: true,
      parentId: 'cat-1',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.data.brands.set('brand-1', {
      id: 'brand-1',
      name: 'Samsung',
      slug: 'samsung',
      description: 'Samsung Electronics',
      website: 'https://www.samsung.com',
      isActive: true
    });

    this.data.products.set('prod-1', {
      id: 'prod-1',
      sku: 'SAMSUNG-GALAXY-S21',
      name: 'Samsung Galaxy S21',
      nameEn: 'Samsung Galaxy S21',
      nameBn: 'স্যামসাং গ্যালাক্সি S21',
      slug: 'samsung-galaxy-s21',
      shortDescription: 'Latest Samsung flagship smartphone',
      description: 'Powerful smartphone with advanced features',
      categoryId: 'cat-2',
      brandId: 'brand-1',
      regularPrice: 85000,
      salePrice: 75000,
      costPrice: 65000,
      taxRate: 15,
      stockQuantity: 50,
      lowStockThreshold: 10,
      status: 'ACTIVE',
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date()
    });

    this.data.users.set('user-1', {
      id: 'user-1',
      email: 'test@example.com',
      phone: '+8801234567890',
      password: '$2a$12$hashedpassword',
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    });
  }

  async connect() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isConnected = true;
        this.emit('connected');
        console.log('✅ Mock Database connected successfully');
        resolve(true);
      }, 100);
    });
  }

  async disconnect() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isConnected = false;
        this.emit('disconnected');
        console.log('✅ Mock Database disconnected successfully');
        resolve(true);
      }, 50);
    });
  }

  async healthCheck() {
    return {
      status: this.isConnected ? 'healthy' : 'unhealthy',
      database: this.isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      type: 'mock'
    };
  }

  async getStats() {
    return {
      users: this.data.users.size,
      products: this.data.products.size,
      categories: this.data.categories.size,
      brands: this.data.brands.size,
      orders: this.data.orders.size,
      reviews: this.data.reviews.size,
      coupons: this.data.coupons.size,
      timestamp: new Date().toISOString()
    };
  }

  // Generic CRUD operations
  async find(model, where = {}, options = {}) {
    const collection = this.data[model];
    if (!collection) throw new Error(`Model ${model} not found`);

    let results = Array.from(collection.values());

    // Apply filters
    if (where.id) {
      results = results.filter(item => item.id === where.id);
    }
    if (where.email) {
      results = results.filter(item => item.email === where.email);
    }
    if (where.status) {
      results = results.filter(item => item.status === where.status);
    }
    if (where.categoryId) {
      results = results.filter(item => item.categoryId === where.categoryId);
    }
    if (where.brandId) {
      results = results.filter(item => item.brandId === where.brandId);
    }

    // Apply pagination
    if (options.skip) {
      results = results.slice(options.skip);
    }
    if (options.take) {
      results = results.slice(0, options.take);
    }

    this.logQuery(`find ${model}`, { where, options });
    return options.first ? results[0] : results;
  }

  async create(model, data) {
    const collection = this.data[model];
    if (!collection) throw new Error(`Model ${model} not found`);

    const newItem = {
      id: this.generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    collection.set(newItem.id, newItem);
    this.logQuery(`create ${model}`, { data: newItem });
    return newItem;
  }

  async update(model, where, data) {
    const collection = this.data[model];
    if (!collection) throw new Error(`Model ${model} not found`);

    const items = await this.find(model, where);
    const updatedItems = [];

    for (const item of items) {
      const updatedItem = {
        ...item,
        ...data,
        updatedAt: new Date()
      };
      collection.set(item.id, updatedItem);
      updatedItems.push(updatedItem);
    }

    this.logQuery(`update ${model}`, { where, data });
    return updatedItems;
  }

  async delete(model, where) {
    const collection = this.data[model];
    if (!collection) throw new Error(`Model ${model} not found`);

    const items = await this.find(model, where);
    for (const item of items) {
      collection.delete(item.id);
    }

    this.logQuery(`delete ${model}`, { where });
    return items.length;
  }

  async count(model, where = {}) {
    const results = await this.find(model, where);
    this.logQuery(`count ${model}`, { where });
    return results.length;
  }

  // Bangladesh-specific methods
  async getDivisions() {
    return [
      'DHAKA', 'CHITTAGONG', 'RAJSHAHI', 'SYLHET', 
      'KHULNA', 'BARISHAL', 'RANGPUR', 'MYMENSINGH'
    ];
  }

  async getPaymentMethods() {
    return [
      'CREDIT_CARD', 'BANK_TRANSFER', 'CASH_ON_DELIVERY', 
      'BKASH', 'NAGAD', 'ROCKET'
    ];
  }

  // Transaction support
  async transaction(callback) {
    const originalData = JSON.parse(JSON.stringify(Object.fromEntries(
      Object.entries(this.data).map(([key, value]) => [key, Array.from(value.entries())])
    )));

    try {
      const result = await callback(this);
      return result;
    } catch (error) {
      // Rollback
      this.data = {};
      for (const [key, entries] of Object.entries(originalData)) {
        this.data[key] = new Map(entries);
      }
      throw error;
    }
  }

  // Raw query simulation
  async query(sql, params = []) {
    this.logQuery('raw query', { sql, params });
    
    // Simple simulation for common queries
    if (sql.includes('SELECT 1')) {
      return [{ result: 1 }];
    }
    if (sql.includes('COUNT')) {
      const model = sql.match(/FROM (\w+)/)?.[1];
      if (model) {
        return [{ count: this.data[model]?.size || 0 }];
      }
    }
    
    return [];
  }

  // Helper methods
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  logQuery(operation, details) {
    const logEntry = {
      operation,
      details,
      timestamp: new Date().toISOString()
    };
    this.queryLog.push(logEntry);
    
    // Keep only last 100 queries
    if (this.queryLog.length > 100) {
      this.queryLog = this.queryLog.slice(-100);
    }
  }

  getQueryLog() {
    return [...this.queryLog];
  }

  clearQueryLog() {
    this.queryLog = [];
  }

  // Reset all data
  reset() {
    for (const key of Object.keys(this.data)) {
      this.data[key].clear();
    }
    this.setupInitialData();
    this.queryLog = [];
  }

  // Seed test data
  async seedTestData() {
    const testUser = {
      email: 'test@smarttech.bd',
      phone: '+8801234567890',
      firstName: 'Test',
      lastName: 'User',
      role: 'CUSTOMER',
      status: 'ACTIVE'
    };

    const testProduct = {
      sku: 'TEST-PRODUCT-001',
      name: 'Test Product',
      nameEn: 'Test Product',
      nameBn: 'পরীক্ষা পণ্য',
      slug: 'test-product',
      shortDescription: 'A test product for development',
      description: 'This is a test product used for development and testing purposes',
      categoryId: 'cat-1',
      brandId: 'brand-1',
      regularPrice: 1000,
      salePrice: 800,
      costPrice: 600,
      taxRate: 15,
      stockQuantity: 100,
      lowStockThreshold: 10,
      status: 'ACTIVE',
      isFeatured: false,
      isNewArrival: false,
      isBestSeller: false
    };

    await this.create('users', testUser);
    await this.create('products', testProduct);

    console.log('✅ Test data seeded successfully');
  }
}

// Create singleton instance
const mockDatabaseService = new MockDatabaseService();

module.exports = {
  MockDatabaseService,
  mockDatabaseService
};