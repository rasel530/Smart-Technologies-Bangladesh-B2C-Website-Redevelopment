/**
 * Elasticsearch Backup Repository Setup Script
 * 
 * This script verifies and configures the Elasticsearch snapshot repository for backups.
 * It checks if a repository already exists, creates one if not, and verifies accessibility.
 * 
 * Usage:
 *   node scripts/setup-elasticsearch-backup-repository.js
 * 
 * Environment Variables:
 *   ELASTICSEARCH_NODE - Elasticsearch node URL (default: http://localhost:9200)
 *   BACKUP_REPOSITORY_NAME - Repository name (default: smarttech_backups)
 *   BACKUP_LOCATION - Backup directory path (default: /usr/share/elasticsearch/backups)
 */

const { Client } = require('@elastic/elasticsearch');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  elasticsearchNode: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  repositoryName: process.env.BACKUP_REPOSITORY_NAME || 'smarttech_backups',
  backupLocation: process.env.BACKUP_LOCATION || '/usr/share/elasticsearch/backups',
  verify: process.env.VERIFY !== 'false',
  maxRetries: 3,
  retryDelay: 5000
};

// Simple logger
const logger = {
  info: (msg, data = {}) => console.log(`[INFO] ${msg}`, data),
  error: (msg, data = {}) => console.error(`[ERROR] ${msg}`, data),
  warn: (msg, data = {}) => console.warn(`[WARN] ${msg}`, data),
  success: (msg, data = {}) => console.log(`[SUCCESS] ${msg}`, data)
};

/**
 * Initialize Elasticsearch client
 */
function initializeClient() {
  logger.info('Initializing Elasticsearch client', {
    node: config.elasticsearchNode
  });

  return new Client({
    node: config.elasticsearchNode,
    requestTimeout: 60000,
    maxRetries: config.maxRetries
  });
}

/**
 * Wait for a specified time
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if Elasticsearch is ready
 */
async function checkElasticsearchReady(client) {
  logger.info('Checking Elasticsearch readiness...');

  for (let i = 0; i < config.maxRetries; i++) {
    try {
      const health = await client.cluster.health();
      
      if (health.status === 'green' || health.status === 'yellow') {
        logger.success('Elasticsearch is ready', {
          status: health.status,
          clusterName: health.cluster_name,
          numberOfNodes: health.number_of_nodes
        });
        return true;
      }
      
      logger.warn(`Elasticsearch health status: ${health.status}, retrying...`);
    } catch (error) {
      logger.error(`Failed to check Elasticsearch health (attempt ${i + 1}/${config.maxRetries})`, {
        error: error.message
      });
    }

    if (i < config.maxRetries - 1) {
      await sleep(config.retryDelay);
    }
  }

  throw new Error('Elasticsearch is not ready after maximum retries');
}

/**
 * Check if a snapshot repository exists
 */
async function checkRepositoryExists(client, repositoryName) {
  try {
    logger.info(`Checking if repository '${repositoryName}' exists...`);

    const result = await client.snapshot.getRepository({
      repository: repositoryName
    });

    logger.success(`Repository '${repositoryName}' exists`, {
      type: result[repositoryName]?.type,
      settings: result[repositoryName]?.settings
    });

    return {
      exists: true,
      repository: result[repositoryName]
    };
  } catch (error) {
    if (error.meta?.statusCode === 404) {
      logger.info(`Repository '${repositoryName}' does not exist`);
      return { exists: false };
    }
    throw error;
  }
}

/**
 * Create a shared file system snapshot repository
 */
async function createRepository(client, repositoryName, backupLocation) {
  try {
    logger.info(`Creating snapshot repository '${repositoryName}'`, {
      type: 'fs',
      location: backupLocation
    });

    const result = await client.snapshot.createRepository({
      repository: repositoryName,
      body: {
        type: 'fs',
        settings: {
          location: backupLocation,
          compress: true,
          max_snapshot_bytes_per_sec: '100mb',
          max_restore_bytes_per_sec: '100mb'
        }
      }
    });

    if (result.acknowledged) {
      logger.success(`Repository '${repositoryName}' created successfully`, {
        location: backupLocation,
        compress: true
      });
      return { success: true, acknowledged: true };
    }

    throw new Error('Repository creation was not acknowledged');
  } catch (error) {
    logger.error(`Failed to create repository '${repositoryName}'`, {
      error: error.message,
      details: error.meta?.body?.error
    });
    throw error;
  }
}

/**
 * Verify repository is accessible and working
 */
async function verifyRepository(client, repositoryName) {
  try {
    logger.info(`Verifying repository '${repositoryName}'...`);

    const result = await client.snapshot.verifyRepository({
      repository: repositoryName
    });

    // The verify API returns nodes with their verification status
    const nodes = result.nodes || {};
    const nodeNames = Object.keys(nodes);
    
    logger.success(`Repository '${repositoryName}' verified successfully`, {
      nodesVerified: nodeNames.length,
      nodeNames
    });

    return {
      success: true,
      nodes: nodeNames,
      details: nodes
    };
  } catch (error) {
    logger.error(`Failed to verify repository '${repositoryName}'`, {
      error: error.message,
      details: error.meta?.body?.error
    });
    throw error;
  }
}

/**
 * Get repository status
 */
async function getRepositoryStatus(client, repositoryName) {
  try {
    logger.info(`Getting repository '${repositoryName}' status...`);

    const result = await client.snapshot.getRepository({
      repository: repositoryName
    });

    const repository = result[repositoryName];
    
    logger.success(`Repository '${repositoryName}' status retrieved`, {
      type: repository?.type,
      settings: repository?.settings
    });

    return {
      success: true,
      repository
    };
  } catch (error) {
    logger.error(`Failed to get repository '${repositoryName}' status`, {
      error: error.message
    });
    throw error;
  }
}

/**
 * List all repositories
 */
async function listRepositories(client) {
  try {
    logger.info('Listing all snapshot repositories...');

    const result = await client.snapshot.getRepository({
      repository: '*'
    });

    const repositories = Object.keys(result);
    
    logger.success(`Found ${repositories.length} repositories`, {
      repositories
    });

    return {
      success: true,
      repositories,
      details: result
    };
  } catch (error) {
    if (error.meta?.statusCode === 404) {
      logger.info('No repositories found');
      return { success: true, repositories: [], details: {} };
    }
    throw error;
  }
}

/**
 * Main setup function
 */
async function setupBackupRepository() {
  logger.info('=== Elasticsearch Backup Repository Setup ===');
  logger.info('Configuration', config);

  let client;

  try {
    // Initialize client
    client = initializeClient();

    // Check Elasticsearch readiness
    await checkElasticsearchReady(client);

    // List existing repositories
    await listRepositories(client);

    // Check if repository exists
    const existingRepo = await checkRepositoryExists(client, config.repositoryName);

    if (existingRepo.exists) {
      logger.info(`Repository '${config.repositoryName}' already exists, skipping creation`);
      
      // Verify existing repository
      if (config.verify) {
        await verifyRepository(client, config.repositoryName);
        await getRepositoryStatus(client, config.repositoryName);
      }
    } else {
      // Create new repository
      await createRepository(client, config.repositoryName, config.backupLocation);
      
      // Verify new repository
      if (config.verify) {
        await verifyRepository(client, config.repositoryName);
        await getRepositoryStatus(client, config.repositoryName);
      }
    }

    logger.success('=== Backup repository setup completed successfully ===');
    
    return {
      success: true,
      repositoryName: config.repositoryName,
      backupLocation: config.backupLocation,
      existing: existingRepo.exists
    };

  } catch (error) {
    logger.error('=== Backup repository setup failed ===', {
      error: error.message,
      stack: error.stack
    });
    
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      logger.info('Elasticsearch client closed');
    }
  }
}

// Run the setup
if (require.main === module) {
  setupBackupRepository()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Unhandled error', { error: error.message });
      process.exit(1);
    });
}

module.exports = {
  setupBackupRepository,
  checkRepositoryExists,
  createRepository,
  verifyRepository,
  getRepositoryStatus,
  listRepositories
};
