const { PrismaClient } = require('@prisma/client');

class DatabaseService {
  constructor() {
    this.connectionPool = {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      maxConnections: 20,
      connectionTimeout: 30000,
      idleTimeout: 10000,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
      connectionStartTime: null,
      queryCount: 0,
      errorCount: 0
    };
    
    // Track connection status
    this.isConnected = false;
    
    this.prisma = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        }
      ],
      // Enhanced connection configuration
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        }
      },
      // Connection pool settings
      __internal: {
        engine: {
          connectionLimit: this.connectionPool.maxConnections,
          poolTimeout: this.connectionPool.acquireTimeoutMillis,
          idleTimeout: this.connectionPool.idleTimeout,
          connectionTimeout: this.connectionPool.connectionTimeout
        }
      }
    });
    
    // Set up event listeners for connection monitoring
    this.setupEventListeners();
  }

  async connect() {
    const startTime = Date.now();
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.prisma.$connect();
        this.isConnected = true;
        const connectionTime = Date.now() - startTime;
        console.log(`✅ Database connected successfully (attempt ${attempt}, ${connectionTime}ms)`);
        
        // Log connection pool status
        const poolStats = this.getConnectionPoolStats();
        console.log('🔍 Database connection pool stats:', poolStats);
        
        return true;
      } catch (error) {
        console.error(`❌ Database connection attempt ${attempt} failed:`, {
          error: error.message,
          code: error.code,
          attempt,
          maxRetries,
          timestamp: new Date().toISOString()
        });
        
        if (attempt < maxRetries) {
          console.log(`🔄 Retrying database connection in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          // Log final failure with diagnostic info
          console.error('💥 All database connection attempts failed:', {
            totalAttempts: maxRetries,
            totalDuration: Date.now() - startTime,
            databaseUrl: this.config?.DATABASE_URL ? 'CONFIGURED' : 'MISSING',
            environment: process.env.NODE_ENV || 'unknown'
          });
          throw error;
        }
      }
    }
  }

  async disconnect() {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }

  async healthCheck() {
    const startTime = Date.now();
    try {
      // Enhanced query with NOW() for better timing measurement
      const result = await this.prisma.$queryRaw`SELECT 1 as status, NOW() as server_time`;
      const responseTime = Date.now() - startTime;
      const poolStats = this.getConnectionPoolStats();
      
      return {
        status: 'healthy',
        database: 'connected',
        responseTime: `${responseTime}ms`,
        connectionPool: poolStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Try to reconnect if health check fails
      if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        console.warn('Database connection lost, attempting to reconnect...');
        try {
          await this.connect();
          // Retry health check after reconnection
          return await this.healthCheck();
        } catch (reconnectError) {
          console.error('Database reconnection failed:', reconnectError.message);
        }
      }
      
      return {
        status: 'unhealthy',
        database: 'disconnected',
        responseTime: `${responseTime}ms`,
        error: error.message,
        connectionPool: this.getConnectionPoolStats(),
        timestamp: new Date().toISOString()
      };
    }
  }

  async getStats() {
    try {
      const [
        userCount,
        productCount,
        categoryCount,
        brandCount,
        orderCount,
        reviewCount,
        couponCount
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.product.count(),
        this.prisma.category.count(),
        this.prisma.brand.count(),
        this.prisma.order.count(),
        this.prisma.review.count(),
        this.prisma.coupon.count()
      ]);

      return {
        users: userCount,
        products: productCount,
        categories: categoryCount,
        brands: brandCount,
        orders: orderCount,
        reviews: reviewCount,
        coupons: couponCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      // Return fallback stats instead of throwing
      return {
        users: 0,
        products: 0,
        categories: 0,
        brands: 0,
        orders: 0,
        reviews: 0,
        coupons: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Transaction helper
  async transaction(callback) {
    try {
      return await this.prisma.$transaction(callback);
    } catch (error) {
      console.error('Database transaction failed:', error);
      // In production, don't fail the entire operation if database is unavailable
      if (process.env.NODE_ENV === 'production' && error.message.includes('connect')) {
        console.warn('Database unavailable, skipping transaction');
        return null;
      }
      throw error;
    }
  }

  // Get client instance (synchronous for backward compatibility)
  getClient() {
    // Check if database is connected (synchronous check)
    if (!this.isConnected) {
      console.warn('⚠️ getClient() called but database is not connected. Connection may not be established yet.');
      console.warn('⚠️ Prisma client may not have model methods available yet.');
    }
    
    // Add diagnostic logging
    console.log('[DatabaseService.getClient] Called, returning prisma client:', {
      isConnected: this.isConnected,
      prismaExists: !!this.prisma,
      prismaType: typeof this.prisma,
      prismaHasFindMany: this.prisma && typeof this.prisma.findMany === 'function',
      prismaHasOrderModel: this.prisma && !!this.prisma.order,
      prismaHasFindUnique: this.prisma && typeof this.prisma.findUnique === 'function',
      prismaHasFindFirst: this.prisma && typeof this.prisma.findFirst === 'function'
    });
    
    // Return the prisma client - it will have methods once connected
    return this.prisma;
  }

  // Get client with auto-connect (ensures database is connected first)
  async getClientWithAutoConnect() {
    // Ensure database is connected before returning client
    if (!this.isConnected) {
      console.log('[DatabaseService.getClientWithAutoConnect] Database not connected, connecting now...');
      await this.connect();
    }
    
    // Verify Prisma client has model methods
    if (!this.prisma || typeof this.prisma.findUnique !== 'function') {
      throw new Error('Prisma client is not properly initialized. Model methods are not available.');
    }
    
    return this.prisma;
  }
  
  // Get client with validation (async method for when you need to ensure connection)
  async getClientWithValidation() {
    // Ensure database is available before returning client
    const isAvailable = await this.isAvailable();
    if (!isAvailable) {
      throw new Error('Database connection is not available. Please ensure the database is connected.');
    }
    return this.prisma;
  }

  // Check if database is available
  async isAvailable() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.warn('Database availability check failed:', error.message);
      return false;
    }
  }

  // Raw query helper
  async query(sql, params = []) {
    try {
      return await this.prisma.$queryRaw`${sql}`;
    } catch (error) {
      console.error('Raw query error:', error);
      throw error;
    }
  }

  // Bangladesh-specific helpers
  async getDivisions() {
    try {
      const divisions = await this.prisma.$queryRaw`
        SELECT DISTINCT division FROM addresses 
        WHERE division IS NOT NULL 
        ORDER BY division
      `;
      return divisions.map(row => row.division);
    } catch (error) {
      console.error('Error getting divisions:', error);
      throw error;
    }
  }

  async getPaymentMethods() {
    try {
      const paymentMethods = await this.prisma.$queryRaw`
        SELECT DISTINCT paymentMethod FROM orders 
        WHERE paymentMethod IS NOT NULL 
        ORDER BY paymentMethod
      `;
      return paymentMethods.map(row => row.paymentMethod);
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  }
  // Get connection pool statistics for diagnostics
  getConnectionPoolStats() {
    try {
      const utilizationRate = this.connectionPool.maxConnections > 0
        ? (this.connectionPool.activeConnections / this.connectionPool.maxConnections * 100).toFixed(2)
        : 0;
      
      return {
        activeConnections: this.connectionPool.activeConnections,
        idleConnections: this.connectionPool.idleConnections,
        totalConnections: this.connectionPool.totalConnections,
        maxConnections: this.connectionPool.maxConnections,
        utilizationRate: `${utilizationRate}%`,
        timeouts: {
          connection: this.connectionPool.connectionTimeout,
          idle: this.connectionPool.idleTimeout,
          acquire: this.connectionPool.acquireTimeoutMillis
        },
        queryCount: this.connectionPool.queryCount,
        errorCount: this.connectionPool.errorCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to get connection pool stats:', error);
      return null;
    }
  }

  // Setup event listeners for Prisma events
  setupEventListeners() {
    try {
      // Monitor query events
      this.prisma.$on('query', (event) => {
        this.connectionPool.queryCount++;
        console.log('🔍 Query:', {
          query: event.query,
          params: event.params,
          duration: `${event.duration}ms`,
          timestamp: event.timestamp
        });
      });

      // Monitor error events
      this.prisma.$on('error', (event) => {
        this.connectionPool.errorCount++;
        console.error('❌ Database Error:', {
          target: event.target,
          message: event.message,
          timestamp: event.timestamp
        });
      });

      // Monitor info events
      this.prisma.$on('info', (event) => {
        console.log('ℹ️ Database Info:', {
          target: event.target,
          message: event.message,
          timestamp: event.timestamp
        });
      });

      // Monitor warning events
      this.prisma.$on('warn', (event) => {
        console.warn('⚠️ Database Warning:', {
          target: event.target,
          message: event.message,
          timestamp: event.timestamp
        });
      });

      // Handle process exit for graceful cleanup
      process.on('beforeExit', async () => {
        console.log('🔄 Process exiting, cleaning up database connections...');
        await this.cleanupConnections();
      });

      console.log('✅ Database event listeners setup completed');
    } catch (error) {
      console.error('❌ Failed to setup event listeners:', error);
    }
  }

  // Cleanup connections gracefully
  async cleanupConnections() {
    try {
      console.log('🧹 Starting connection cleanup...');
      
      // Reset connection tracking
      this.connectionPool.activeConnections = 0;
      this.connectionPool.idleConnections = 0;
      this.connectionPool.totalConnections = 0;
      this.isConnected = false;
      
      // Disconnect from database
      await this.prisma.$disconnect();
      
      console.log('✅ Database connections cleaned up successfully');
    } catch (error) {
      console.error('❌ Failed to cleanup connections:', error);
      throw error;
    }
  }
}

// Singleton instance
const databaseService = new DatabaseService();

module.exports = {
  DatabaseService,
  databaseService
};