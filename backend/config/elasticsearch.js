/**
 * Elasticsearch Client Configuration
 * 
 * This module provides a configured Elasticsearch client with connection management,
 * health checks, and error handling for the Smart Tech B2C e-commerce platform.
 */

const { Client } = require('@elastic/elasticsearch');
const { loggerService } = require('../services/logger');

class ElasticsearchConfig {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
    this.initializeClient();
  }

  /**
   * Initialize Elasticsearch client
   */
  initializeClient() {
    try {
      const node = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
      const username = process.env.ELASTICSEARCH_USERNAME;
      const password = process.env.ELASTICSEARCH_PASSWORD;
      const indexPrefix = process.env.ELASTICSEARCH_INDEX_PREFIX || 'smarttech_';

      // Build client configuration
      const clientConfig = {
        node,
        maxRetries: this.maxRetries,
        requestTimeout: 30000, // 30 seconds
        sniffOnStart: false,
        sniffInterval: false,
      };

      // Add authentication if credentials are provided
      if (username && password) {
        clientConfig.auth = {
          username,
          password
        };
      }

      // Create client instance
      this.client = new Client(clientConfig);

      // Set index prefix
      this.indexPrefix = indexPrefix;

      loggerService.info('Elasticsearch client initialized', {
        node,
        indexPrefix,
        hasAuth: !!(username && password)
      });

      // Perform initial health check
      this.checkHealth().catch(error => {
        loggerService.warn('Initial Elasticsearch health check failed', {
          error: error.message
        });
      });

    } catch (error) {
      loggerService.error('Failed to initialize Elasticsearch client', {
        error: error.message,
        stack: error.stack
      });
      this.isConnected = false;
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
   * Get the index prefix
   * @returns {string} Index prefix
   */
  getIndexPrefix() {
    return this.indexPrefix;
  }

  /**
   * Build full index name
   * @param {string} indexName - Base index name
   * @returns {string} Full index name with prefix
   */
  buildIndexName(indexName) {
    return `${this.indexPrefix}${indexName}`;
  }

  /**
   * Check Elasticsearch cluster health
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    try {
      const health = await this.client.cluster.health();
      this.isConnected = true;
      this.connectionRetries = 0;

      loggerService.info('Elasticsearch health check successful', {
        status: health.status,
        clusterName: health.cluster_name,
        numberOfNodes: health.number_of_nodes,
        activeShards: health.active_shards
      });

      return {
        success: true,
        status: health.status,
        clusterName: health.cluster_name,
        numberOfNodes: health.number_of_nodes,
        activeShards: health.active_shards
      };

    } catch (error) {
      this.isConnected = false;
      this.connectionRetries++;

      loggerService.error('Elasticsearch health check failed', {
        error: error.message,
        retryCount: this.connectionRetries,
        maxRetries: this.maxRetries
      });

      // Attempt to reconnect if we haven't exceeded max retries
      if (this.connectionRetries < this.maxRetries) {
        loggerService.info('Attempting to reconnect to Elasticsearch...', {
          retryAttempt: this.connectionRetries + 1,
          delay: this.retryDelay
        });

        setTimeout(() => {
          this.checkHealth().catch(err => {
            loggerService.error('Reconnection attempt failed', { error: err.message });
          });
        }, this.retryDelay);
      }

      return {
        success: false,
        error: error.message,
        retryCount: this.connectionRetries,
        maxRetries: this.maxRetries
      };
    }
  }

  /**
   * Check if Elasticsearch is available
   * @returns {boolean} Connection status
   */
  isAvailable() {
    return this.isConnected;
  }

  /**
   * Get connection status
   * @returns {Object} Connection status details
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionRetries: this.connectionRetries,
      maxRetries: this.maxRetries,
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      indexPrefix: this.indexPrefix
    };
  }

  /**
   * Ping Elasticsearch to check if it's responsive
   * @returns {Promise<boolean>} Ping result
   */
  async ping() {
    try {
      const response = await this.client.ping();
      this.isConnected = true;
      return response;
    } catch (error) {
      this.isConnected = false;
      loggerService.warn('Elasticsearch ping failed', { error: error.message });
      return false;
    }
  }

  /**
   * Get cluster info
   * @returns {Promise<Object>} Cluster information
   */
  async getClusterInfo() {
    try {
      const info = await this.client.info();
      return {
        success: true,
        version: info.version,
        name: info.name,
        clusterName: info.cluster_name
      };
    } catch (error) {
      loggerService.error('Failed to get cluster info', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Close the Elasticsearch client connection
   */
  async close() {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        loggerService.info('Elasticsearch client connection closed');
      }
    } catch (error) {
      loggerService.error('Failed to close Elasticsearch client', { error: error.message });
    }
  }

  /**
   * Graceful degradation helper - returns fallback data if Elasticsearch is unavailable
   * @param {Function} elasticsearchOperation - Operation to perform with Elasticsearch
   * @param {Function} fallbackOperation - Fallback operation if Elasticsearch is unavailable
   * @returns {Promise<any>} Result from either Elasticsearch or fallback operation
   */
  async withGracefulDegradation(elasticsearchOperation, fallbackOperation) {
    try {
      // Check if Elasticsearch is available
      if (!this.isAvailable()) {
        loggerService.warn('Elasticsearch unavailable, using fallback operation');
        return await fallbackOperation();
      }

      // Attempt Elasticsearch operation
      return await elasticsearchOperation();

    } catch (error) {
      // Log the error and use fallback
      loggerService.error('Elasticsearch operation failed, using fallback', {
        error: error.message,
        operation: elasticsearchOperation.name || 'unknown'
      });

      try {
        return await fallbackOperation();
      } catch (fallbackError) {
        loggerService.error('Fallback operation also failed', {
          error: fallbackError.message
        });
        throw fallbackError;
      }
    }
  }
}

// Singleton instance
const elasticsearchConfig = new ElasticsearchConfig();

module.exports = {
  ElasticsearchConfig,
  elasticsearchConfig
};
