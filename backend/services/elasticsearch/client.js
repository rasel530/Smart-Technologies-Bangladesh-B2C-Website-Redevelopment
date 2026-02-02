/**
 * Elasticsearch Client Service
 * 
 * This module provides a high-level Elasticsearch client service with cluster health monitoring,
 * connection status checking, error handling, and logging for the Smart Tech B2C e-commerce platform.
 */

const { elasticsearchConfig } = require('../../config/elasticsearch');
const { loggerService } = require('../logger');

class ElasticsearchClientService {
  constructor() {
    this.config = elasticsearchConfig;
    this.client = this.config.getClient();
    this.healthStatus = 'unknown';
    this.lastHealthCheck = null;
    this.monitoringInterval = null;
    this.monitoringEnabled = false;
  }

  /**
   * Initialize the Elasticsearch client service
   * @param {Object} options - Initialization options
   * @param {boolean} options.enableMonitoring - Enable automatic health monitoring
   * @param {number} options.monitoringInterval - Monitoring interval in milliseconds (default: 60000)
   */
  async initialize(options = {}) {
    try {
      const { enableMonitoring = true, monitoringInterval = 60000 } = options;

      loggerService.info('Initializing Elasticsearch Client Service', {
        enableMonitoring,
        monitoringInterval
      });

      // Perform initial health check
      await this.checkHealth();

      // Enable monitoring if requested
      if (enableMonitoring) {
        this.startMonitoring(monitoringInterval);
      }

      loggerService.info('Elasticsearch Client Service initialized successfully');

      return {
        success: true,
        message: 'Elasticsearch Client Service initialized successfully'
      };

    } catch (error) {
      loggerService.error('Failed to initialize Elasticsearch Client Service', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check Elasticsearch cluster health
   * @returns {Promise<Object>} Health status information
   */
  async checkHealth() {
    try {
      const healthResult = await this.config.checkHealth();

      if (healthResult.success) {
        this.healthStatus = healthResult.status;
        this.lastHealthCheck = new Date();

        loggerService.info('Elasticsearch cluster health check passed', {
          status: healthResult.status,
          clusterName: healthResult.clusterName,
          numberOfNodes: healthResult.numberOfNodes,
          activeShards: healthResult.activeShards,
          timestamp: this.lastHealthCheck.toISOString()
        });

        return {
          success: true,
          status: healthResult.status,
          clusterName: healthResult.clusterName,
          numberOfNodes: healthResult.numberOfNodes,
          activeShards: healthResult.activeShards,
          timestamp: this.lastHealthCheck.toISOString()
        };

      } else {
        this.healthStatus = 'unhealthy';
        this.lastHealthCheck = new Date();

        loggerService.error('Elasticsearch cluster health check failed', {
          error: healthResult.error,
          retryCount: healthResult.retryCount,
          maxRetries: healthResult.maxRetries,
          timestamp: this.lastHealthCheck.toISOString()
        });

        return {
          success: false,
          status: 'unhealthy',
          error: healthResult.error,
          retryCount: healthResult.retryCount,
          maxRetries: healthResult.maxRetries,
          timestamp: this.lastHealthCheck.toISOString()
        };
      }

    } catch (error) {
      this.healthStatus = 'error';
      this.lastHealthCheck = new Date();

      loggerService.error('Elasticsearch health check encountered an error', {
        error: error.message,
        stack: error.stack,
        timestamp: this.lastHealthCheck.toISOString()
      });

      return {
        success: false,
        status: 'error',
        error: error.message,
        timestamp: this.lastHealthCheck.toISOString()
      };
    }
  }

  /**
   * Check connection status to Elasticsearch
   * @returns {Promise<Object>} Connection status information
   */
  async checkConnectionStatus() {
    try {
      const connectionStatus = this.config.getConnectionStatus();
      const pingResult = await this.config.ping();

      const status = {
        isConnected: connectionStatus.isConnected && pingResult,
        connectionRetries: connectionStatus.connectionRetries,
        maxRetries: connectionStatus.maxRetries,
        node: connectionStatus.node,
        indexPrefix: connectionStatus.indexPrefix,
        pingSuccessful: pingResult,
        healthStatus: this.healthStatus,
        lastHealthCheck: this.lastHealthCheck ? this.lastHealthCheck.toISOString() : null,
        monitoringEnabled: this.monitoringEnabled
      };

      if (status.isConnected) {
        loggerService.info('Elasticsearch connection status: Connected', status);
      } else {
        loggerService.warn('Elasticsearch connection status: Disconnected', status);
      }

      return {
        success: true,
        ...status
      };

    } catch (error) {
      loggerService.error('Failed to check Elasticsearch connection status', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        isConnected: false,
        healthStatus: this.healthStatus
      };
    }
  }

  /**
   * Get detailed cluster information
   * @returns {Promise<Object>} Cluster information
   */
  async getClusterInfo() {
    try {
      const clusterInfo = await this.config.getClusterInfo();

      if (clusterInfo.success) {
        loggerService.info('Retrieved Elasticsearch cluster information', {
          version: clusterInfo.version,
          name: clusterInfo.name,
          clusterName: clusterInfo.clusterName
        });

        return {
          success: true,
          version: clusterInfo.version,
          name: clusterInfo.name,
          clusterName: clusterInfo.clusterName
        };

      } else {
        loggerService.error('Failed to retrieve Elasticsearch cluster information', {
          error: clusterInfo.error
        });

        return {
          success: false,
          error: clusterInfo.error
        };
      }

    } catch (error) {
      loggerService.error('Error retrieving Elasticsearch cluster information', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get the Elasticsearch client instance
   * @returns {Client} Elasticsearch client
   */
  getClient() {
    return this.client;
  }

  /**
   * Get the Elasticsearch configuration
   * @returns {ElasticsearchConfig} Elasticsearch configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Get current health status
   * @returns {string} Current health status
   */
  getHealthStatus() {
    return this.healthStatus;
  }

  /**
   * Get last health check timestamp
   * @returns {Date|null} Last health check timestamp
   */
  getLastHealthCheck() {
    return this.lastHealthCheck;
  }

  /**
   * Start automatic health monitoring
   * @param {number} interval - Monitoring interval in milliseconds
   */
  startMonitoring(interval = 60000) {
    if (this.monitoringInterval) {
      loggerService.warn('Elasticsearch monitoring is already running');
      return;
    }

    this.monitoringEnabled = true;
    this.monitoringInterval = setInterval(async () => {
      await this.checkHealth();
    }, interval);

    loggerService.info('Elasticsearch health monitoring started', {
      interval: `${interval}ms`
    });
  }

  /**
   * Stop automatic health monitoring
   */
  stopMonitoring() {
    if (!this.monitoringInterval) {
      loggerService.warn('Elasticsearch monitoring is not running');
      return;
    }

    clearInterval(this.monitoringInterval);
    this.monitoringInterval = null;
    this.monitoringEnabled = false;

    loggerService.info('Elasticsearch health monitoring stopped');
  }

  /**
   * Check if monitoring is enabled
   * @returns {boolean} Monitoring status
   */
  isMonitoringEnabled() {
    return this.monitoringEnabled;
  }

  /**
   * Execute an Elasticsearch operation with error handling and logging
   * @param {Function} operation - The Elasticsearch operation to execute
   * @param {string} operationName - Name of the operation for logging
   * @returns {Promise<any>} Result of the operation
   */
  async executeOperation(operation, operationName = 'unknown') {
    try {
      loggerService.debug(`Executing Elasticsearch operation: ${operationName}`);

      const result = await operation();

      loggerService.debug(`Elasticsearch operation completed successfully: ${operationName}`);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      loggerService.error(`Elasticsearch operation failed: ${operationName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        operationName
      };
    }
  }

  /**
   * Execute an Elasticsearch operation with graceful degradation
   * @param {Function} elasticsearchOperation - The Elasticsearch operation to execute
   * @param {Function} fallbackOperation - Fallback operation if Elasticsearch is unavailable
   * @param {string} operationName - Name of the operation for logging
   * @returns {Promise<any>} Result from either Elasticsearch or fallback operation
   */
  async executeWithGracefulDegradation(elasticsearchOperation, fallbackOperation, operationName = 'unknown') {
    try {
      loggerService.debug(`Executing Elasticsearch operation with graceful degradation: ${operationName}`);

      const result = await this.config.withGracefulDegradation(
        elasticsearchOperation,
        fallbackOperation
      );

      loggerService.debug(`Operation completed with graceful degradation: ${operationName}`);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      loggerService.error(`Operation with graceful degradation failed: ${operationName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        operationName
      };
    }
  }

  /**
   * Get comprehensive service status
   * @returns {Promise<Object>} Comprehensive service status
   */
  async getServiceStatus() {
    try {
      const connectionStatus = await this.checkConnectionStatus();
      const healthResult = await this.checkHealth();
      const clusterInfo = await this.getClusterInfo();

      return {
        success: true,
        connection: connectionStatus,
        health: healthResult,
        cluster: clusterInfo,
        monitoring: {
          enabled: this.monitoringEnabled,
          interval: this.monitoringInterval ? 'active' : 'inactive'
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      loggerService.error('Failed to get Elasticsearch service status', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Shutdown the Elasticsearch client service
   */
  async shutdown() {
    try {
      loggerService.info('Shutting down Elasticsearch Client Service');

      // Stop monitoring
      this.stopMonitoring();

      // Close client connection
      await this.config.close();

      loggerService.info('Elasticsearch Client Service shut down successfully');

      return {
        success: true,
        message: 'Elasticsearch Client Service shut down successfully'
      };

    } catch (error) {
      loggerService.error('Failed to shut down Elasticsearch Client Service', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
const elasticsearchClientService = new ElasticsearchClientService();

module.exports = {
  ElasticsearchClientService,
  elasticsearchClientService
};
