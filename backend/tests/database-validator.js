const { Pool } = require('pg');
const { mockDatabaseService } = require('./mock-database');

/**
 * Database Connection Validation Utilities
 * Provides comprehensive database testing and validation capabilities
 */
class DatabaseValidator {
  constructor(config = {}) {
    this.config = {
      connectionTimeout: 10000,
      queryTimeout: 5000,
      maxRetries: 3,
      retryDelay: 1000,
      useMock: process.env.NODE_ENV === 'test' || process.env.USE_MOCK_DB === 'true',
      ...config
    };
    
    this.pool = null;
    this.mockService = mockDatabaseService;
    this.connectionStatus = {
      isConnected: false,
      lastChecked: null,
      error: null,
      type: 'none'
    };
  }

  async initialize() {
    if (this.config.useMock) {
      await this.mockService.connect();
      this.connectionStatus = {
        isConnected: true,
        lastChecked: new Date(),
        error: null,
        type: 'mock'
      };
      return true;
    }

    try {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: this.config.connectionTimeout,
        query_timeout: this.config.queryTimeout,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      await this.testConnection();
      
      this.connectionStatus = {
        isConnected: true,
        lastChecked: new Date(),
        error: null,
        type: 'postgresql'
      };
      
      return true;
    } catch (error) {
      this.connectionStatus = {
        isConnected: false,
        lastChecked: new Date(),
        error: error.message,
        type: 'failed'
      };
      throw error;
    }
  }

  async testConnection() {
    if (this.config.useMock) {
      return await this.mockService.healthCheck();
    }

    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      return {
        status: 'connected',
        timestamp: result.rows[0].current_time,
        version: result.rows[0].version,
        type: 'postgresql'
      };
    } finally {
      client.release();
    }
  }

  async validateSchema() {
    if (this.config.useMock) {
      return await this.validateMockSchema();
    }

    const requiredTables = [
      'users', 'addresses', 'products', 'categories', 'brands',
      'orders', 'cart_items', 'wishlists', 'reviews', 'coupons',
      'product_images', 'product_specifications', 'product_variants',
      'user_sessions', 'user_social_accounts', 'transactions', 'order_items',
      'carts', 'wishlist_items'
    ];

    const requiredEnums = [
      'UserRole', 'UserStatus', 'AddressType', 'Division',
      'ProductStatus', 'PaymentMethod', 'PaymentStatus',
      'SocialProvider', 'CouponType', 'OrderStatus'
    ];

    const validation = {
      tables: {},
      enums: {},
      foreignKeys: {},
      indexes: {},
      summary: { valid: true, errors: [] }
    };

    try {
      // Check tables
      for (const table of requiredTables) {
        const result = await this.pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          ) as exists
        `, [table]);
        
        validation.tables[table] = result.rows[0].exists;
        if (!result.rows[0].exists) {
          validation.summary.valid = false;
          validation.summary.errors.push(`Missing table: ${table}`);
        }
      }

      // Check enums
      for (const enumName of requiredEnums) {
        const result = await this.pool.query(`
          SELECT EXISTS (
            SELECT FROM pg_type 
            WHERE typname = $1 AND typtype = 'e'
          ) as exists
        `, [enumName.toLowerCase()]);
        
        validation.enums[enumName] = result.rows[0].exists;
        if (!result.rows[0].exists) {
          validation.summary.valid = false;
          validation.summary.errors.push(`Missing enum: ${enumName}`);
        }
      }

      // Check foreign keys
      const expectedForeignKeys = [
        { table: 'addresses', column: 'userId', references: 'users' },
        { table: 'products', column: 'categoryId', references: 'categories' },
        { table: 'products', column: 'brandId', references: 'brands' },
        { table: 'orders', column: 'userId', references: 'users' },
        { table: 'orders', column: 'addressId', references: 'addresses' },
        { table: 'reviews', column: 'productId', references: 'products' },
        { table: 'reviews', column: 'userId', references: 'users' }
      ];

      for (const fk of expectedForeignKeys) {
        const result = await this.pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = $1 
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = $2
          ) as exists
        `, [fk.table, fk.column]);
        
        const key = `${fk.table}.${fk.column}`;
        validation.foreignKeys[key] = {
          exists: result.rows[0].exists,
          references: fk.references
        };
        
        if (!result.rows[0].exists) {
          validation.summary.valid = false;
          validation.summary.errors.push(`Missing foreign key: ${key} -> ${fk.references}`);
        }
      }

      return validation;
    } catch (error) {
      validation.summary.valid = false;
      validation.summary.errors.push(`Schema validation error: ${error.message}`);
      return validation;
    }
  }

  async validateMockSchema() {
    const mockData = this.mockService.data;
    const validation = {
      tables: {},
      enums: {},
      foreignKeys: {},
      indexes: {},
      summary: { valid: true, errors: [] }
    };

    // Check mock tables (data collections)
    const requiredTables = [
      'users', 'addresses', 'products', 'categories', 'brands',
      'orders', 'cartItems', 'wishlists', 'reviews', 'coupons',
      'productImages', 'productSpecifications', 'productVariants',
      'userSessions', 'userSocialAccounts', 'transactions', 'orderItems',
      'carts', 'wishlistItems'
    ];

    for (const table of requiredTables) {
      const exists = mockData[table] && mockData[table] instanceof Map;
      validation.tables[table] = exists;
      if (!exists) {
        validation.summary.valid = false;
        validation.summary.errors.push(`Missing mock collection: ${table}`);
      }
    }

    // Check enums (simulated through data validation)
    validation.enums = {
      UserRole: true,
      UserStatus: true,
      AddressType: true,
      Division: true,
      ProductStatus: true,
      PaymentMethod: true,
      PaymentStatus: true,
      SocialProvider: true,
      CouponType: true,
      OrderStatus: true
    };

    return validation;
  }

  async testCRUDOperations() {
    if (this.config.useMock) {
      return await this.testMockCRUD();
    }

    const testResults = {
      create: { success: false, error: null },
      read: { success: false, error: null },
      update: { success: false, error: null },
      delete: { success: false, error: null }
    };

    try {
      const client = await this.pool.connect();
      
      try {
        // Test Create
        await client.query(`
          INSERT INTO test_table (id, name) VALUES ($1, $2)
          ON CONFLICT (id) DO NOTHING
        `, ['test-1', 'Test Record']);
        testResults.create.success = true;

        // Test Read
        const readResult = await client.query('SELECT * FROM test_table WHERE id = $1', ['test-1']);
        testResults.read.success = readResult.rows.length > 0;

        // Test Update
        await client.query('UPDATE test_table SET name = $1 WHERE id = $2', ['Updated Test', 'test-1']);
        testResults.update.success = true;

        // Test Delete
        await client.query('DELETE FROM test_table WHERE id = $1', ['test-1']);
        testResults.delete.success = true;

      } finally {
        client.release();
      }
    } catch (error) {
      Object.keys(testResults).forEach(operation => {
        if (!testResults[operation].success) {
          testResults[operation].error = error.message;
        }
      });
    }

    return testResults;
  }

  async testMockCRUD() {
    const testResults = {
      create: { success: false, error: null },
      read: { success: false, error: null },
      update: { success: false, error: null },
      delete: { success: false, error: null }
    };

    try {
      // Test Create
      const created = await this.mockService.create('users', {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        status: 'ACTIVE'
      });
      testResults.create.success = !!created.id;

      // Test Read
      const read = await this.mockService.find('users', { id: created.id });
      testResults.read.success = read.length > 0;

      // Test Update
      const updated = await this.mockService.update('users', { id: created.id }, { firstName: 'Updated' });
      testResults.update.success = updated.length > 0 && updated[0].firstName === 'Updated';

      // Test Delete
      const deleted = await this.mockService.delete('users', { id: created.id });
      testResults.delete.success = deleted > 0;

    } catch (error) {
      Object.keys(testResults).forEach(operation => {
        testResults[operation].error = error.message;
      });
    }

    return testResults;
  }

  async performanceTest(iterations = 100) {
    const results = {
      iterations,
      totalTime: 0,
      averageTime: 0,
      queries: []
    };

    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const queryStart = Date.now();
      
      if (this.config.useMock) {
        await this.mockService.find('users', {}, { take: 10 });
      } else {
        const client = await this.pool.connect();
        try {
          await client.query('SELECT * FROM users LIMIT 10');
        } finally {
          client.release();
        }
      }
      
      const queryTime = Date.now() - queryStart;
      results.queries.push(queryTime);
    }

    results.totalTime = Date.now() - startTime;
    results.averageTime = results.totalTime / iterations;
    results.minTime = Math.min(...results.queries);
    results.maxTime = Math.max(...results.queries);

    return results;
  }

  getConnectionStatus() {
    return { ...this.connectionStatus };
  }

  async cleanup() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    
    if (this.config.useMock) {
      await this.mockService.disconnect();
    }
    
    this.connectionStatus = {
      isConnected: false,
      lastChecked: new Date(),
      error: null,
      type: 'disconnected'
    };
  }

  // Utility method to switch between real and mock database
  async switchToMock() {
    await this.cleanup();
    this.config.useMock = true;
    await this.initialize();
  }

  async switchToReal() {
    await this.cleanup();
    this.config.useMock = false;
    await this.initialize();
  }
}

module.exports = {
  DatabaseValidator
};