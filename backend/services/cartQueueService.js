/**
 * Cart Queue Service
 * 
 * Queue system for cart operations with:
 * - Priority queue for critical operations
 * - Batch processing capabilities
 * - Retry mechanism with exponential backoff
 * - Dead letter queue for persistent failures
 * - Queue status monitoring
 * 
 * @module services/cartQueueService
 */

const { redisConnectionPool } = require('./redisConnectionPool');
const { loggerService } = require('./logger');
const { EventEmitter } = require('events');

class CartQueueService extends EventEmitter {
  constructor() {
    super();
    
    this.redis = null;
    this.logger = loggerService;
    this.isInitialized = false;
    this.isProcessing = false;
    this.processInterval = null;
    
    // Queue configuration
    this.config = {
      // Queue names
      queuePrefix: 'cart:queue',
      highPriorityQueue: 'cart:queue:high',
      normalPriorityQueue: 'cart:queue:normal',
      lowPriorityQueue: 'cart:queue:low',
      processingQueue: 'cart:queue:processing',
      deadLetterQueue: 'cart:queue:dead',
      
      // Processing settings
      processIntervalMs: parseInt(process.env.CART_QUEUE_INTERVAL) || 100, // 100ms
      batchSize: parseInt(process.env.CART_QUEUE_BATCH_SIZE) || 10,
      maxRetries: parseInt(process.env.CART_QUEUE_MAX_RETRIES) || 3,
      retryDelayMs: parseInt(process.env.CART_QUEUE_RETRY_DELAY) || 1000,
      maxProcessingTimeMs: parseInt(process.env.CART_QUEUE_MAX_PROCESSING_TIME) || 30000, // 30s
      
      // Dead letter settings
      deadLetterThreshold: parseInt(process.env.CART_QUEUE_DLQ_THRESHOLD) || 3,
      deadLetterRetentionHours: parseInt(process.env.CART_QUEUE_DLQ_RETENTION) || 168, // 7 days
    };
    
    // Statistics
    this.stats = {
      enqueued: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      retried: 0,
      deadLettered: 0,
      batched: 0,
      startTime: Date.now(),
    };
    
    // Operation handlers
    this.operationHandlers = new Map();
    
    // Initialize default handlers
    this._registerDefaultHandlers();
    
    this.initialize();
  }

  /**
   * Initialize the queue service
   */
  async initialize() {
    try {
      this.redis = redisConnectionPool.getClient('cartQueueService');
      this.isInitialized = !!this.redis;
      
      if (this.isInitialized) {
        this.logger.info('CartQueueService initialized successfully');
        this.startProcessing();
      } else {
        this.logger.warn('CartQueueService initialized without Redis');
      }
    } catch (error) {
      this.logger.error('Failed to initialize CartQueueService', { error: error.message });
      this.isInitialized = false;
    }
  }

  /**
   * Register default operation handlers
   */
  _registerDefaultHandlers() {
    // Built-in operation types
    const defaultOperations = [
      'ADD_ITEM',
      'UPDATE_ITEM',
      'REMOVE_ITEM',
      'CLEAR_CART',
      'MERGE_CARTS',
      'RECALCULATE_TOTALS',
      'APPLY_DISCOUNT',
      'REMOVE_DISCOUNT',
      'UPDATE_SHIPPING',
    ];
    
    defaultOperations.forEach(op => {
      this.operationHandlers.set(op, this._createDefaultHandler(op));
    });
  }

  /**
   * Create default handler for an operation
   */
  _createDefaultHandler(operationType) {
    return async (data) => {
      this.logger.debug(`Executing default handler for ${operationType}`, { data });
      // Default handler just logs - override with specific handlers
      return { success: true, operation: operationType, data };
    };
  }

  /**
   * Register a custom operation handler
   * 
   * @param {string} operation - Operation type
   * @param {Function} handler - Handler function
   */
  registerHandler(operation, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    
    this.operationHandlers.set(operation, handler);
    this.logger.info(`Registered handler for operation: ${operation}`);
  }

  /**
   * Enqueue a cart operation
   * 
   * @param {string} cartId - Cart ID
   * @param {string} operation - Operation type
   * @param {Object} data - Operation data
   * @param {Object} options - Queue options
   * @returns {Promise<Object>} Enqueue result
   */
  async enqueueOperation(cartId, operation, data = {}, options = {}) {
    if (!this.isInitialized || !this.redis) {
      return {
        success: false,
        error: 'Queue service not available',
        executed: false,
      };
    }

    const {
      priority = 'normal',
      delayMs = 0,
      maxRetries = this.config.maxRetries,
      idempotencyKey = null,
    } = options;

    const job = {
      id: this._generateJobId(),
      cartId,
      operation,
      data,
      priority,
      maxRetries,
      retries: 0,
      createdAt: Date.now(),
      delayUntil: delayMs > 0 ? Date.now() + delayMs : 0,
      idempotencyKey,
      status: 'pending',
    };

    try {
      // Check idempotency if key provided
      if (idempotencyKey) {
        const exists = await this._checkIdempotency(idempotencyKey);
        if (exists) {
          this.logger.debug('Idempotent operation already processed', { idempotencyKey });
          return {
            success: true,
            jobId: exists,
            duplicate: true,
          };
        }
      }

      // Serialize job
      const jobData = JSON.stringify(job);
      
      // Add to appropriate priority queue
      const queueName = this._getQueueName(priority);
      
      if (delayMs > 0) {
        // Use delayed queue (sorted set)
        await this.redis.zAdd(`${queueName}:delayed`, {
          score: job.delayUntil,
          value: jobData,
        });
      } else {
        // Add to regular queue (list)
        await this.redis.lPush(queueName, jobData);
      }
      
      // Store idempotency key if provided
      if (idempotencyKey) {
        await this._setIdempotency(idempotencyKey, job.id, 3600); // 1 hour TTL
      }
      
      this.stats.enqueued++;
      
      this.logger.debug('Operation enqueued', {
        jobId: job.id,
        cartId,
        operation,
        priority,
      });

      this.emit('enqueued', job);

      return {
        success: true,
        jobId: job.id,
        duplicate: false,
      };
    } catch (error) {
      this.logger.error('Error enqueuing operation', {
        cartId,
        operation,
        error: error.message,
      });
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Batch update cart with multiple operations
   * 
   * @param {string} cartId - Cart ID
   * @param {Array} operations - Array of operations
   * @param {Object} options - Batch options
   * @returns {Promise<Object>} Batch result
   */
  async batchUpdateCart(cartId, operations, options = {}) {
    if (!Array.isArray(operations) || operations.length === 0) {
      return {
        success: false,
        error: 'Operations array required',
      };
    }

    const {
      atomic = true,
      priority = 'normal',
      timeoutMs = 30000,
    } = options;

    const batchId = this._generateJobId();
    const results = [];
    const errors = [];

    this.logger.info('Starting batch update', {
      batchId,
      cartId,
      operationCount: operations.length,
    });

    try {
      if (atomic) {
        // Atomic batch - all or nothing
        const batchJob = {
          id: batchId,
          cartId,
          operation: 'BATCH',
          data: { operations },
          priority: 'high', // Batch operations are high priority
          isBatch: true,
          createdAt: Date.now(),
        };

        const enqueueResult = await this.enqueueOperation(
          cartId,
          'BATCH',
          { operations },
          { priority: 'high' }
        );

        if (!enqueueResult.success) {
          throw new Error(`Failed to enqueue batch: ${enqueueResult.error}`);
        }

        this.stats.batched++;

        return {
          success: true,
          batchId,
          jobId: enqueueResult.jobId,
          operationCount: operations.length,
        };
      } else {
        // Non-atomic batch - process individually
        for (const op of operations) {
          try {
            const result = await this.enqueueOperation(
              cartId,
              op.operation,
              op.data,
              { priority, ...op.options }
            );
            results.push(result);
          } catch (error) {
            errors.push({ operation: op, error: error.message });
          }
        }

        this.stats.batched++;

        return {
          success: errors.length === 0,
          batchId,
          results,
          errors,
          succeeded: results.length,
          failed: errors.length,
        };
      }
    } catch (error) {
      this.logger.error('Error in batch update', {
        batchId,
        cartId,
        error: error.message,
      });

      return {
        success: false,
        batchId,
        error: error.message,
      };
    }
  }

  /**
   * Start processing queue
   */
  startProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processInterval = setInterval(
      () => this.processQueue(),
      this.config.processIntervalMs
    );
    
    this.logger.info('Queue processing started', {
      interval: this.config.processIntervalMs,
      batchSize: this.config.batchSize,
    });
  }

  /**
   * Stop processing queue
   */
  stopProcessing() {
    this.isProcessing = false;
    
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
    
    this.logger.info('Queue processing stopped');
  }

  /**
   * Process queue items
   */
  async processQueue() {
    if (!this.isInitialized || !this.redis || !this.isProcessing) return;

    // CRITICAL FIX: Check if Redis client is open before processing
    if (!this.redis.isOpen) {
      this.logger.warn('Redis client not ready, skipping queue processing');
      return;
    }

    try {
      // Move delayed jobs that are ready to main queue
      await this._processDelayedJobs();

      // Process jobs from priority queues
      const priorities = ['high', 'normal', 'low'];
      let processedCount = 0;

      for (const priority of priorities) {
        if (processedCount >= this.config.batchSize) break;

        const queueName = this._getQueueName(priority);
        const remainingSlots = this.config.batchSize - processedCount;

        for (let i = 0; i < remainingSlots; i++) {
          const jobData = await this.redis.rPop(queueName);
          
          if (!jobData) break;

          const job = JSON.parse(jobData);
          await this._processJob(job);
          processedCount++;
        }
      }

      if (processedCount > 0) {
        this.stats.processed += processedCount;
      }
    } catch (error) {
      this.logger.error('Error processing queue', { error: error.message });
    }
  }

  /**
   * Process a single job
   */
  async _processJob(job) {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Processing job', {
        jobId: job.id,
        cartId: job.cartId,
        operation: job.operation,
      });

      // Add to processing queue
      await this._addToProcessingQueue(job);

      // Get handler for operation
      const handler = this.operationHandlers.get(job.operation);
      
      if (!handler) {
        throw new Error(`No handler registered for operation: ${job.operation}`);
      }

      // Execute handler with timeout
      const result = await this._executeWithTimeout(
        () => handler(job.data),
        this.config.maxProcessingTimeMs
      );

      // Remove from processing queue
      await this._removeFromProcessingQueue(job);

      this.stats.succeeded++;

      this.emit('completed', {
        job,
        result,
        duration: Date.now() - startTime,
      });

      this.logger.debug('Job completed successfully', {
        jobId: job.id,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      await this._handleJobError(job, error);
    }
  }

  /**
   * Handle job error with retry logic
   */
  async _handleJobError(job, error) {
    this.logger.error('Job failed', {
      jobId: job.id,
      cartId: job.cartId,
      operation: job.operation,
      error: error.message,
      retries: job.retries,
    });

    // Remove from processing queue
    await this._removeFromProcessingQueue(job);

    if (job.retries < job.maxRetries) {
      // Retry with exponential backoff
      job.retries++;
      job.lastError = error.message;
      job.nextRetryAt = Date.now() + (this.config.retryDelayMs * Math.pow(2, job.retries - 1));
      
      // Re-queue with delay
      const queueName = this._getQueueName(job.priority);
      await this.redis.zAdd(`${queueName}:delayed`, {
        score: job.nextRetryAt,
        value: JSON.stringify(job),
      });
      
      this.stats.retried++;
      
      this.emit('retry', { job, error });
      
      this.logger.debug('Job scheduled for retry', {
        jobId: job.id,
        retryCount: job.retries,
        nextRetryAt: job.nextRetryAt,
      });
    } else {
      // Max retries exceeded - move to dead letter queue
      await this._moveToDeadLetter(job, error);
    }
  }

  /**
   * Move job to dead letter queue
   */
  async _moveToDeadLetter(job, error) {
    const deadLetterEntry = {
      ...job,
      failedAt: Date.now(),
      finalError: error.message,
      stack: error.stack,
    };

    try {
      await this.redis.lPush(
        this.config.deadLetterQueue,
        JSON.stringify(deadLetterEntry)
      );
      
      // Set expiration for dead letter entries
      await this.redis.expire(
        this.config.deadLetterQueue,
        this.config.deadLetterRetentionHours * 3600
      );
      
      this.stats.deadLettered++;
      
      this.emit('deadLetter', { job: deadLetterEntry, error });
      
      this.logger.warn('Job moved to dead letter queue', {
        jobId: job.id,
        cartId: job.cartId,
        operation: job.operation,
        error: error.message,
      });
    } catch (dlqError) {
      this.logger.error('Error moving job to dead letter queue', {
        jobId: job.id,
        error: dlqError.message,
      });
    }
  }

  /**
   * Process delayed jobs that are ready
   */
  async _processDelayedJobs() {
    const priorities = ['high', 'normal', 'low'];
    const now = Date.now();

    for (const priority of priorities) {
      const queueName = this._getQueueName(priority);
      const delayedQueue = `${queueName}:delayed`;

      try {
        // Get jobs that are ready to process
        const readyJobs = await this.redis.zRangeByScore(delayedQueue, 0, now);
        
        if (readyJobs && readyJobs.length > 0) {
          // Move to main queue
          const pipeline = this.redis.multi();
          
          readyJobs.forEach(jobData => {
            pipeline.lPush(queueName, jobData);
            pipeline.zRem(delayedQueue, jobData);
          });
          
          await pipeline.exec();
          
          this.logger.debug('Moved delayed jobs to queue', {
            priority,
            count: readyJobs.length,
          });
        }
      } catch (error) {
        this.logger.error('Error processing delayed jobs', {
          priority,
          error: error.message,
        });
      }
    }
  }

  /**
   * Execute function with timeout
   */
  async _executeWithTimeout(fn, timeoutMs) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const result = await fn();
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Get queue name based on priority
   */
  _getQueueName(priority) {
    switch (priority) {
      case 'high':
        return this.config.highPriorityQueue;
      case 'low':
        return this.config.lowPriorityQueue;
      case 'normal':
      default:
        return this.config.normalPriorityQueue;
    }
  }

  /**
   * Add job to processing queue
   */
  async _addToProcessingQueue(job) {
    const processingData = {
      ...job,
      startedAt: Date.now(),
    };
    
    await this.redis.hSet(
      this.config.processingQueue,
      job.id,
      JSON.stringify(processingData)
    );
  }

  /**
   * Remove job from processing queue
   */
  async _removeFromProcessingQueue(job) {
    await this.redis.hDel(this.config.processingQueue, job.id);
  }

  /**
   * Check idempotency key
   */
  async _checkIdempotency(key) {
    const result = await this.redis.get(`idempotency:${key}`);
    return result;
  }

  /**
   * Set idempotency key
   */
  async _setIdempotency(key, jobId, ttl) {
    await this.redis.setEx(`idempotency:${key}`, ttl, jobId);
  }

  /**
   * Generate unique job ID
   */
  _generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue status
   */
  async getQueueStatus() {
    if (!this.isInitialized || !this.redis) {
      return {
        available: false,
        stats: this.stats,
      };
    }

    try {
      const [
        highPriority,
        normalPriority,
        lowPriority,
        processing,
        deadLetter,
      ] = await Promise.all([
        this.redis.lLen(this.config.highPriorityQueue),
        this.redis.lLen(this.config.normalPriorityQueue),
        this.redis.lLen(this.config.lowPriorityQueue),
        this.redis.hLen(this.config.processingQueue),
        this.redis.lLen(this.config.deadLetterQueue),
      ]);

      // Get delayed job counts
      const now = Date.now();
      const [delayedHigh, delayedNormal, delayedLow] = await Promise.all([
        this.redis.zCount(`${this.config.highPriorityQueue}:delayed`, 0, Infinity),
        this.redis.zCount(`${this.config.normalPriorityQueue}:delayed`, 0, Infinity),
        this.redis.zCount(`${this.config.lowPriorityQueue}:delayed`, 0, Infinity),
      ]);

      return {
        available: true,
        isProcessing: this.isProcessing,
        queues: {
          highPriority: { immediate: highPriority || 0, delayed: delayedHigh || 0 },
          normalPriority: { immediate: normalPriority || 0, delayed: delayedNormal || 0 },
          lowPriority: { immediate: lowPriority || 0, delayed: delayedLow || 0 },
          processing: processing || 0,
          deadLetter: deadLetter || 0,
        },
        totalPending: (highPriority || 0) + (normalPriority || 0) + (lowPriority || 0) +
                      (delayedHigh || 0) + (delayedNormal || 0) + (delayedLow || 0),
        stats: this.stats,
        config: {
          processIntervalMs: this.config.processIntervalMs,
          batchSize: this.config.batchSize,
          maxRetries: this.config.maxRetries,
        },
      };
    } catch (error) {
      this.logger.error('Error getting queue status', { error: error.message });
      return {
        available: false,
        error: error.message,
        stats: this.stats,
      };
    }
  }

  /**
   * Get dead letter queue entries
   */
  async getDeadLetterEntries(limit = 100) {
    if (!this.isInitialized || !this.redis) {
      return [];
    }

    try {
      const entries = await this.redis.lRange(this.config.deadLetterQueue, 0, limit - 1);
      return entries.map(entry => JSON.parse(entry));
    } catch (error) {
      this.logger.error('Error getting dead letter entries', { error: error.message });
      return [];
    }
  }

  /**
   * Retry a dead letter entry
   */
  async retryDeadLetterEntry(entryId) {
    if (!this.isInitialized || !this.redis) {
      return { success: false, error: 'Queue not available' };
    }

    try {
      const entries = await this.getDeadLetterEntries(1000);
      const entry = entries.find(e => e.id === entryId);

      if (!entry) {
        return { success: false, error: 'Entry not found' };
      }

      // Remove from dead letter queue
      await this.redis.lRem(this.config.deadLetterQueue, 0, JSON.stringify(entry));

      // Reset retry count and re-queue
      entry.retries = 0;
      entry.status = 'pending';
      delete entry.failedAt;
      delete entry.finalError;
      delete entry.stack;

      await this.redis.lPush(this._getQueueName(entry.priority), JSON.stringify(entry));

      return { success: true, jobId: entry.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear all queues
   */
  async clearAllQueues() {
    if (!this.isInitialized || !this.redis) {
      return { success: false, error: 'Queue not available' };
    }

    try {
      const keys = [
        this.config.highPriorityQueue,
        this.config.normalPriorityQueue,
        this.config.lowPriorityQueue,
        `${this.config.highPriorityQueue}:delayed`,
        `${this.config.normalPriorityQueue}:delayed`,
        `${this.config.lowPriorityQueue}:delayed`,
        this.config.processingQueue,
        this.config.deadLetterQueue,
      ];

      await this.redis.del(keys);

      // Reset stats
      this.stats = {
        enqueued: 0,
        processed: 0,
        succeeded: 0,
        failed: 0,
        retried: 0,
        deadLettered: 0,
        batched: 0,
        startTime: Date.now(),
      };

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const cartQueueService = new CartQueueService();

module.exports = {
  cartQueueService,
  CartQueueService,
};
