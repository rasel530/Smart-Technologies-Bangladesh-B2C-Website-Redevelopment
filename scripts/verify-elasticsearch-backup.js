/**
 * Elasticsearch Backup Verification Script
 * 
 * This script tests the Elasticsearch backup system by:
 * - Verifying repository health
 * - Creating a test snapshot
 * - Listing existing snapshots
 * - Restoring from a snapshot (optional)
 * - Cleaning up test snapshots
 * 
 * Usage:
 *   node scripts/verify-elasticsearch-backup.js
 * 
 * Environment Variables:
 *   ELASTICSEARCH_NODE - Elasticsearch node URL (default: http://localhost:9200)
 *   BACKUP_REPOSITORY_NAME - Repository name (default: smarttech_backups)
 *   TEST_SNAPSHOT_NAME - Test snapshot name (default: verification-snapshot)
 *   TEST_INDICES - Indices to include in test (default: none, creates test index)
 *   SKIP_RESTORE - Skip restore test (default: false)
 *   SKIP_CLEANUP - Skip cleanup of test snapshots (default: false)
 */

const { Client } = require('@elastic/elasticsearch');

// Configuration
const config = {
  elasticsearchNode: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  repositoryName: process.env.BACKUP_REPOSITORY_NAME || 'smarttech_backups',
  testSnapshotName: process.env.TEST_SNAPSHOT_NAME || 'verification-snapshot',
  testIndices: process.env.TEST_INDICES ? process.env.TEST_INDICES.split(',') : [],
  skipRestore: process.env.SKIP_RESTORE === 'true',
  skipCleanup: process.env.SKIP_CLEANUP === 'false',
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
    requestTimeout: 120000,
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
 * Verify repository health
 */
async function verifyRepositoryHealth(client, repositoryName) {
  try {
    logger.info(`Verifying repository '${repositoryName}' health...`);

    const result = await client.snapshot.verifyRepository({
      repository: repositoryName
    });

    const nodes = result.nodes || {};
    const nodeNames = Object.keys(nodes);
    
    logger.success(`Repository '${repositoryName}' is healthy`, {
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
 * List all snapshots in the repository
 */
async function listSnapshots(client, repositoryName) {
  try {
    logger.info(`Listing snapshots in repository '${repositoryName}'...`);

    const result = await client.snapshot.get({
      repository: repositoryName,
      snapshot: '*'
    });

    const snapshots = result.snapshots || [];
    
    logger.success(`Found ${snapshots.length} snapshots`, {
      snapshots: snapshots.map(s => ({
        name: s.snapshot,
        state: s.state,
        startTime: s.start_time,
        endTime: s.end_time,
        indices: s.indices?.length || 0
      }))
    });

    return {
      success: true,
      snapshots,
      count: snapshots.length
    };
  } catch (error) {
    if (error.meta?.statusCode === 404) {
      logger.info('No snapshots found in repository');
      return { success: true, snapshots: [], count: 0 };
    }
    throw error;
  }
}

/**
 * Get snapshot status
 */
async function getSnapshotStatus(client, repositoryName, snapshotName) {
  try {
    logger.info(`Getting snapshot '${snapshotName}' status...`);

    const result = await client.snapshot.status({
      repository: repositoryName,
      snapshot: snapshotName
    });

    const snapshots = result.snapshots || [];
    const snapshot = snapshots.find(s => s.snapshot === snapshotName);
    
    if (snapshot) {
      logger.success(`Snapshot '${snapshotName}' status retrieved`, {
        state: snapshot.state,
        startTime: snapshot.start_time,
        endTime: snapshot.end_time,
        stats: snapshot.stats
      });
    }

    return {
      success: true,
      snapshot
    };
  } catch (error) {
    if (error.meta?.statusCode === 404) {
      logger.info(`Snapshot '${snapshotName}' not found`);
      return { success: true, snapshot: null };
    }
    throw error;
  }
}

/**
 * Create a test snapshot
 */
async function createSnapshot(client, repositoryName, snapshotName, indices = []) {
  try {
    logger.info(`Creating snapshot '${snapshotName}'...`, {
      repository: repositoryName,
      indices: indices.length > 0 ? indices : 'all indices'
    });

    const body = {
      snapshot: snapshotName,
      repository: repositoryName,
      wait_for_completion: true
    };

    if (indices.length > 0) {
      body.indices = indices.join(',');
    }

    const result = await client.snapshot.create(body);

    if (result.snapshot?.state === 'SUCCESS') {
      logger.success(`Snapshot '${snapshotName}' created successfully`, {
        state: result.snapshot.state,
        startTime: result.snapshot.start_time,
        endTime: result.snapshot.end_time,
        indices: result.snapshot.indices?.length || 0,
        shards: result.snapshot.shards
      });
      return {
        success: true,
        snapshot: result.snapshot
      };
    }

    throw new Error(`Snapshot creation failed with state: ${result.snapshot?.state}`);
  } catch (error) {
    logger.error(`Failed to create snapshot '${snapshotName}'`, {
      error: error.message,
      details: error.meta?.body?.error
    });
    throw error;
  }
}

/**
 * Restore from a snapshot
 */
async function restoreSnapshot(client, repositoryName, snapshotName, indices = []) {
  try {
    logger.info(`Restoring from snapshot '${snapshotName}'...`, {
      repository: repositoryName,
      indices: indices.length > 0 ? indices : 'all indices'
    });

    const body = {
      snapshot: snapshotName,
      repository: repositoryName,
      wait_for_completion: true
    };

    if (indices.length > 0) {
      body.indices = indices.join(',');
    }

    const result = await client.snapshot.restore(body);

    logger.success(`Snapshot '${snapshotName}' restored successfully`, {
      snapshot: result.snapshot
    });
    return {
      success: true,
      snapshot: result.snapshot
    };
  } catch (error) {
    logger.error(`Failed to restore snapshot '${snapshotName}'`, {
      error: error.message,
      details: error.meta?.body?.error
    });
    throw error;
  }
}

/**
 * Delete a snapshot
 */
async function deleteSnapshot(client, repositoryName, snapshotName) {
  try {
    logger.info(`Deleting snapshot '${snapshotName}'...`, {
      repository: repositoryName
    });

    const result = await client.snapshot.delete({
      repository: repositoryName,
      snapshot: snapshotName
    });

    logger.success(`Snapshot '${snapshotName}' deleted successfully`, {
      acknowledged: result.acknowledged
    });
    return {
      success: true,
      acknowledged: result.acknowledged
    };
  } catch (error) {
    logger.error(`Failed to delete snapshot '${snapshotName}'`, {
      error: error.message,
      details: error.meta?.body?.error
    });
    throw error;
  }
}

/**
 * Create a test index for backup testing
 */
async function createTestIndex(client) {
  const testIndexName = `test-backup-verification-${Date.now()}`;
  
  try {
    logger.info(`Creating test index '${testIndexName}'...`);

    await client.indices.create({
      index: testIndexName,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1
        },
        mappings: {
          properties: {
            message: { type: 'text' },
            timestamp: { type: 'date' }
          }
        }
      }
    });

    // Add some test documents
    await client.index({
      index: testIndexName,
      id: '1',
      body: {
        message: 'Test document for backup verification',
        timestamp: new Date().toISOString()
      }
    });

    await client.indices.refresh({ index: testIndexName });

    logger.success(`Test index '${testIndexName}' created with test document`);
    return testIndexName;
  } catch (error) {
    logger.error(`Failed to create test index`, {
      error: error.message
    });
    throw error;
  }
}

/**
 * Delete test index
 */
async function deleteTestIndex(client, indexName) {
  try {
    logger.info(`Deleting test index '${indexName}'...`);

    await client.indices.delete({
      index: indexName
    });

    logger.success(`Test index '${indexName}' deleted`);
  } catch (error) {
    logger.warn(`Failed to delete test index '${indexName}'`, {
      error: error.message
    });
  }
}

/**
 * Get repository information
 */
async function getRepositoryInfo(client, repositoryName) {
  try {
    logger.info(`Getting repository '${repositoryName}' information...`);

    const result = await client.snapshot.getRepository({
      repository: repositoryName
    });

    const repository = result[repositoryName];
    
    logger.success(`Repository '${repositoryName}' information retrieved`, {
      type: repository?.type,
      settings: repository?.settings
    });

    return {
      success: true,
      repository
    };
  } catch (error) {
    logger.error(`Failed to get repository '${repositoryName}' information`, {
      error: error.message
    });
    throw error;
  }
}

/**
 * Main verification function
 */
async function verifyBackupSystem() {
  logger.info('=== Elasticsearch Backup Verification ===');
  logger.info('Configuration', config);

  let client;
  let testIndexName = null;
  let testSnapshotCreated = false;

  try {
    // Initialize client
    client = initializeClient();

    // Check Elasticsearch readiness
    await checkElasticsearchReady(client);

    // Get repository information
    await getRepositoryInfo(client, config.repositoryName);

    // Verify repository health
    await verifyRepositoryHealth(client, config.repositoryName);

    // List existing snapshots
    await listSnapshots(client, config.repositoryName);

    // Create test index if no indices specified
    let indicesToBackup = [...config.testIndices];
    if (indicesToBackup.length === 0) {
      testIndexName = await createTestIndex(client);
      indicesToBackup = [testIndexName];
    }

    // Create test snapshot
    logger.info('=== Creating Test Snapshot ===');
    await createSnapshot(client, config.repositoryName, config.testSnapshotName, indicesToBackup);
    testSnapshotCreated = true;

    // List snapshots again to verify
    await listSnapshots(client, config.repositoryName);

    // Get snapshot status
    await getSnapshotStatus(client, config.repositoryName, config.testSnapshotName);

    // Restore from snapshot (optional)
    if (!config.skipRestore) {
      logger.info('=== Restoring from Snapshot ===');
      
      // First, delete the test index to test restore
      if (testIndexName) {
        await deleteTestIndex(client, testIndexName);
        await sleep(2000); // Wait for index deletion to complete
      }

      await restoreSnapshot(client, config.repositoryName, config.testSnapshotName, indicesToBackup);
      logger.success('Restore test completed successfully');
    }

    // Cleanup
    if (testSnapshotCreated && config.skipCleanup) {
      logger.info('=== Cleaning Up Test Snapshot ===');
      await deleteSnapshot(client, config.repositoryName, config.testSnapshotName);
      
      // Delete test index if it exists
      if (testIndexName) {
        await deleteTestIndex(client, testIndexName);
      }
    }

    logger.success('=== Backup verification completed successfully ===');
    
    return {
      success: true,
      repositoryName: config.repositoryName,
      testSnapshotName: config.testSnapshotName,
      testSnapshotCreated,
      restoreTested: !config.skipRestore,
      cleanedUp: config.skipCleanup
    };

  } catch (error) {
    logger.error('=== Backup verification failed ===', {
      error: error.message,
      stack: error.stack
    });

    // Attempt cleanup on failure
    if (testSnapshotCreated && config.skipCleanup) {
      try {
        logger.info('Attempting cleanup after failure...');
        await deleteSnapshot(client, config.repositoryName, config.testSnapshotName);
        if (testIndexName) {
          await deleteTestIndex(client, testIndexName);
        }
      } catch (cleanupError) {
        logger.error('Cleanup failed', { error: cleanupError.message });
      }
    }
    
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      logger.info('Elasticsearch client closed');
    }
  }
}

// Run verification
if (require.main === module) {
  verifyBackupSystem()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Unhandled error', { error: error.message });
      process.exit(1);
    });
}

module.exports = {
  verifyBackupSystem,
  verifyRepositoryHealth,
  listSnapshots,
  createSnapshot,
  restoreSnapshot,
  deleteSnapshot,
  getSnapshotStatus,
  getRepositoryInfo
};
