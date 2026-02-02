/**
 * Elasticsearch Index Lifecycle Management (ILM) Service
 * 
 * This module provides index lifecycle management for the Smart Tech B2C e-commerce platform,
 * including rollover policies, retention policies, and lifecycle management services.
 */

const { loggerService } = require('../logger');

/**
 * ILM Policy configuration for product indices
 * Defines the lifecycle stages for product indices
 */
const productILMPolicy = {
  policy: {
    phases: {
      // Hot phase: Active indexing and searching
      hot: {
        actions: {
          rollover: {
            max_size: '50GB',
            max_age: '30d',
            max_docs: 10000000
          },
          set_priority: {
            priority: 100
          }
        }
      },
      
      // Warm phase: Reduced indexing, still searchable
      warm: {
        min_age: '30d',
        actions: {
          forcemerge: {
            max_num_segments: 1
          },
          shrink: {
            number_of_shards: 1
          },
          set_priority: {
            priority: 50
          }
        }
      },
      
      // Cold phase: Read-only, archived with snapshot backup
      cold: {
        min_age: '90d',
        actions: {
          freeze: {},
          snapshot: {
            repository: 'smarttech_backups'
          },
          set_priority: {
            priority: 0
          }
        }
      },
      
      // Delete phase: Remove old indices
      delete: {
        min_age: '365d',
        actions: {
          delete: {}
        }
      }
    }
  }
};

/**
 * ILM Policy configuration for category indices
 * Less frequent updates, longer retention
 */
const categoryILMPolicy = {
  policy: {
    phases: {
      hot: {
        actions: {
          rollover: {
            max_size: '10GB',
            max_age: '90d',
            max_docs: 1000000
          },
          set_priority: {
            priority: 100
          }
        }
      },
      warm: {
        min_age: '90d',
        actions: {
          forcemerge: {
            max_num_segments: 1
          },
          shrink: {
            number_of_shards: 1
          },
          set_priority: {
            priority: 50
          }
        }
      },
      cold: {
        min_age: '180d',
        actions: {
          freeze: {},
          snapshot: {
            repository: 'smarttech_backups'
          },
          set_priority: {
            priority: 0
          }
        }
      },
      delete: {
        min_age: '730d',
        actions: {
          delete: {}
        }
      }
    }
  }
};

/**
 * ILM Policy configuration for brand indices
 * Similar to category indices
 */
const brandILMPolicy = {
  policy: {
    phases: {
      hot: {
        actions: {
          rollover: {
            max_size: '10GB',
            max_age: '90d',
            max_docs: 1000000
          },
          set_priority: {
            priority: 100
          }
        }
      },
      warm: {
        min_age: '90d',
        actions: {
          forcemerge: {
            max_num_segments: 1
          },
          shrink: {
            number_of_shards: 1
          },
          set_priority: {
            priority: 50
          }
        }
      },
      cold: {
        min_age: '180d',
        actions: {
          freeze: {},
          snapshot: {
            repository: 'smarttech_backups'
          },
          set_priority: {
            priority: 0
          }
        }
      },
      delete: {
        min_age: '730d',
        actions: {
          delete: {}
        }
      }
    }
  }
};

/**
 * ILM Policy configuration for log indices
 * Shorter retention for logs
 */
const logILMPolicy = {
  policy: {
    phases: {
      hot: {
        actions: {
          rollover: {
            max_size: '5GB',
            max_age: '1d',
            max_docs: 500000
          },
          set_priority: {
            priority: 100
          }
        }
      },
      warm: {
        min_age: '7d',
        actions: {
          forcemerge: {
            max_num_segments: 1
          },
          shrink: {
            number_of_shards: 1
          },
          set_priority: {
            priority: 50
          }
        }
      },
      delete: {
        min_age: '30d',
        actions: {
          delete: {}
        }
      }
    }
  }
};

/**
 * Get ILM policy for a specific index type
 * @param {string} indexType - The type of index (product, category, brand, log)
 * @returns {Object} The ILM policy configuration
 */
function getILMPolicy(indexType) {
  switch (indexType) {
    case 'product':
      return productILMPolicy;
    case 'category':
      return categoryILMPolicy;
    case 'brand':
      return brandILMPolicy;
    case 'log':
      return logILMPolicy;
    default:
      loggerService.error(`Unknown ILM policy requested: ${indexType}`);
      throw new Error(`Unknown ILM policy type: ${indexType}`);
  }
}

/**
 * Get all ILM policies
 * @returns {Object} All ILM policy configurations
 */
function getAllILMPolicies() {
  return {
    product: productILMPolicy,
    category: categoryILMPolicy,
    brand: brandILMPolicy,
    log: logILMPolicy
  };
}

/**
 * Create ILM policy name based on index type
 * @param {string} indexType - The type of index
 * @returns {string} The ILM policy name
 */
function getILMPolicyName(indexType) {
  return `smarttech-${indexType}-ilm-policy`;
}

/**
 * Get index lifecycle policy for Elasticsearch API
 * @param {string} indexType - The type of index
 * @returns {Object} Complete ILM policy configuration
 */
function getIndexLifecyclePolicy(indexType) {
  const policy = getILMPolicy(indexType);
  const policyName = getILMPolicyName(indexType);
  
  return {
    name: policyName,
    ...policy
  };
}

/**
 * Validate ILM policy structure
 * @param {Object} policy - The policy to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateILMPolicy(policy) {
  if (!policy || typeof policy !== 'object') {
    loggerService.error('ILM policy is not an object');
    return false;
  }

  if (!policy.policy || !policy.policy.phases) {
    loggerService.error('ILM policy does not have required structure');
    return false;
  }

  const validPhases = ['hot', 'warm', 'cold', 'delete'];
  for (const phase of Object.keys(policy.policy.phases)) {
    if (!validPhases.includes(phase)) {
      loggerService.error(`Invalid ILM phase: ${phase}`);
      return false;
    }
  }

  return true;
}

/**
 * Get ILM policy description
 * @param {string} indexType - The type of index
 * @returns {Object} ILM policy description
 */
function getILMPolicyDescription(indexType) {
  const policy = getILMPolicy(indexType);
  const phases = policy.policy.phases;
  
  return {
    indexType,
    policyName: getILMPolicyName(indexType),
    phases: {
      hot: {
        description: 'Active indexing and searching',
        rollover: phases.hot.actions.rollover,
        priority: phases.hot.actions.set_priority.priority
      },
      warm: phases.warm ? {
        description: 'Reduced indexing, still searchable',
        minAge: phases.warm.min_age,
        actions: Object.keys(phases.warm.actions),
        priority: phases.warm.actions.set_priority?.priority
      } : null,
      cold: phases.cold ? {
        description: 'Read-only, archived',
        minAge: phases.cold.min_age,
        actions: Object.keys(phases.cold.actions),
        priority: phases.cold.actions.set_priority?.priority
      } : null,
      delete: phases.delete ? {
        description: 'Remove old indices',
        minAge: phases.delete.min_age,
        retention: phases.delete.min_age
      } : null
    }
  };
}

/**
 * Get all ILM policy descriptions
 * @returns {Object} All ILM policy descriptions
 */
function getAllILMPolicyDescriptions() {
  return {
    product: getILMPolicyDescription('product'),
    category: getILMPolicyDescription('category'),
    brand: getILMPolicyDescription('brand'),
    log: getILMPolicyDescription('log')
  };
}

/**
 * Get ILM policy retention period
 * @param {string} indexType - The type of index
 * @returns {string} Retention period
 */
function getRetentionPeriod(indexType) {
  const policy = getILMPolicy(indexType);
  const deletePhase = policy.policy.phases.delete;
  
  if (!deletePhase) {
    return 'indefinite';
  }
  
  return deletePhase.min_age || 'indefinite';
}

/**
 * Get ILM policy rollover configuration
 * @param {string} indexType - The type of index
 * @returns {Object} Rollover configuration
 */
function getRolloverConfig(indexType) {
  const policy = getILMPolicy(indexType);
  const hotPhase = policy.policy.phases.hot;
  
  return hotPhase.actions.rollover || {};
}

/**
 * Create custom ILM policy
 * @param {Object} config - Custom policy configuration
 * @returns {Object} Custom ILM policy
 */
function createCustomILMPolicy(config) {
  const {
    name = 'custom-policy',
    maxSize = '50GB',
    maxAge = '30d',
    maxDocs = 10000000,
    warmMinAge = '30d',
    coldMinAge = '90d',
    deleteMinAge = '365d',
    priority = 100
  } = config;

  return {
    policy: {
      phases: {
        hot: {
          actions: {
            rollover: {
              max_size: maxSize,
              max_age: maxAge,
              max_docs: maxDocs
            },
            set_priority: {
              priority
            }
          }
        },
        warm: {
          min_age: warmMinAge,
          actions: {
            forcemerge: {
              max_num_segments: 1
            },
            shrink: {
              number_of_shards: 1
            },
            set_priority: {
              priority: Math.floor(priority / 2)
            }
          }
        },
        cold: {
          min_age: coldMinAge,
          actions: {
            freeze: {},
            set_priority: {
              priority: 0
            }
          }
        },
        delete: {
          min_age: deleteMinAge,
          actions: {
            delete: {}
          }
        }
      }
    }
  };
}

/**
 * ILM Service class for managing index lifecycle
 */
class ILMService {
  constructor(elasticsearchClient) {
    this.client = elasticsearchClient;
  }

  /**
   * Create ILM policy
   * @param {string} indexType - The type of index
   * @returns {Promise<Object>} Result of the operation
   */
  async createPolicy(indexType) {
    try {
      const policyName = getILMPolicyName(indexType);
      const policy = getILMPolicy(indexType);

      loggerService.info(`Creating ILM policy: ${policyName}`, {
        indexType
      });

      const result = await this.client.ilm.putLifecycle({
        policy: policyName,
        ...policy
      });

      loggerService.info(`ILM policy created successfully: ${policyName}`);

      return {
        success: true,
        policyName,
        indexType,
        acknowledged: result.acknowledged
      };

    } catch (error) {
      loggerService.error(`Failed to create ILM policy for index type: ${indexType}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        indexType
      };
    }
  }

  /**
   * Get ILM policy
   * @param {string} policyName - The policy name
   * @returns {Promise<Object>} Result of the operation
   */
  async getPolicy(policyName) {
    try {
      loggerService.info(`Getting ILM policy: ${policyName}`);

      const result = await this.client.ilm.getLifecycle({
        policy: policyName
      });

      loggerService.info(`ILM policy retrieved successfully: ${policyName}`);

      return {
        success: true,
        policyName,
        policy: result[policyName]
      };

    } catch (error) {
      loggerService.error(`Failed to get ILM policy: ${policyName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        policyName
      };
    }
  }

  /**
   * Delete ILM policy
   * @param {string} policyName - The policy name
   * @returns {Promise<Object>} Result of the operation
   */
  async deletePolicy(policyName) {
    try {
      loggerService.info(`Deleting ILM policy: ${policyName}`);

      const result = await this.client.ilm.deleteLifecycle({
        policy: policyName
      });

      loggerService.info(`ILM policy deleted successfully: ${policyName}`);

      return {
        success: true,
        policyName,
        acknowledged: result.acknowledged
      };

    } catch (error) {
      loggerService.error(`Failed to delete ILM policy: ${policyName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        policyName
      };
    }
  }

  /**
   * Explain ILM for an index
   * @param {string} indexName - The index name
   * @returns {Promise<Object>} Result of the operation
   */
  async explainIndex(indexName) {
    try {
      loggerService.info(`Explaining ILM for index: ${indexName}`);

      const result = await this.client.ilm.explainLifecycle({
        index: indexName
      });

      loggerService.info(`ILM explanation retrieved for index: ${indexName}`);

      return {
        success: true,
        indexName,
        explanation: result.indices[indexName]
      };

    } catch (error) {
      loggerService.error(`Failed to explain ILM for index: ${indexName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        indexName
      };
    }
  }

  /**
   * Move index to a different ILM step
   * @param {string} indexName - The index name
   * @param {string} currentPhase - Current phase
   * @param {string} currentAction - Current action
   * @param {string} currentStep - Current step
   * @returns {Promise<Object>} Result of the operation
   */
  async moveToStep(indexName, currentPhase, currentAction, currentStep) {
    try {
      loggerService.info(`Moving index to ILM step: ${indexName}`, {
        currentPhase,
        currentAction,
        currentStep
      });

      const result = await this.client.ilm.moveToStep({
        index: indexName,
        current_phase: currentPhase,
        current_action: currentAction,
        current_step: currentStep
      });

      loggerService.info(`Index moved to ILM step successfully: ${indexName}`);

      return {
        success: true,
        indexName,
        acknowledged: result.acknowledged
      };

    } catch (error) {
      loggerService.error(`Failed to move index to ILM step: ${indexName}`, {
        error: error.message,
        stack: error.stack,
        currentPhase,
        currentAction,
        currentStep
      });

      return {
        success: false,
        error: error.message,
        indexName
      };
    }
  }

  /**
   * Retry ILM for an index
   * @param {string} indexName - The index name
   * @returns {Promise<Object>} Result of the operation
   */
  async retryIndex(indexName) {
    try {
      loggerService.info(`Retrying ILM for index: ${indexName}`);

      const result = await this.client.ilm.retry({
        index: indexName
      });

      loggerService.info(`ILM retry successful for index: ${indexName}`);

      return {
        success: true,
        indexName,
        acknowledged: result.acknowledged
      };

    } catch (error) {
      loggerService.error(`Failed to retry ILM for index: ${indexName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        indexName
      };
    }
  }

  /**
   * Get ILM status
   * @returns {Promise<Object>} Result of the operation
   */
  async getStatus() {
    try {
      loggerService.info('Getting ILM status');

      const result = await this.client.ilm.getStatus();

      loggerService.info('ILM status retrieved successfully');

      return {
        success: true,
        status: result.operation_mode
      };

    } catch (error) {
      loggerService.error('Failed to get ILM status', {
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
   * Create a snapshot for an index
   * @param {string} repositoryName - The repository name
   * @param {string} snapshotName - The snapshot name
   * @param {string[]} indices - The indices to snapshot
   * @returns {Promise<Object>} Result of the operation
   */
  async createSnapshot(repositoryName, snapshotName, indices = []) {
    try {
      loggerService.info(`Creating snapshot '${snapshotName}'`, {
        repository: repositoryName,
        indices
      });

      const body = {
        snapshot: snapshotName,
        repository: repositoryName,
        wait_for_completion: false
      };

      if (indices.length > 0) {
        body.indices = indices.join(',');
      }

      const result = await this.client.snapshot.create(body);

      loggerService.info(`Snapshot creation initiated: ${snapshotName}`);

      return {
        success: true,
        snapshotName,
        repositoryName,
        accepted: result.accepted
      };

    } catch (error) {
      loggerService.error(`Failed to create snapshot: ${snapshotName}`, {
        error: error.message,
        stack: error.stack,
        repositoryName,
        indices
      });

      return {
        success: false,
        error: error.message,
        snapshotName,
        repositoryName
      };
    }
  }

  /**
   * Get snapshot status
   * @param {string} repositoryName - The repository name
   * @param {string} snapshotName - The snapshot name
   * @returns {Promise<Object>} Result of the operation
   */
  async getSnapshotStatus(repositoryName, snapshotName) {
    try {
      loggerService.info(`Getting snapshot status: ${snapshotName}`, {
        repository: repositoryName
      });

      const result = await this.client.snapshot.status({
        repository: repositoryName,
        snapshot: snapshotName
      });

      const snapshots = result.snapshots || [];
      const snapshot = snapshots.find(s => s.snapshot === snapshotName);

      loggerService.info(`Snapshot status retrieved: ${snapshotName}`);

      return {
        success: true,
        snapshotName,
        snapshot
      };

    } catch (error) {
      loggerService.error(`Failed to get snapshot status: ${snapshotName}`, {
        error: error.message,
        stack: error.stack,
        repositoryName
      });

      return {
        success: false,
        error: error.message,
        snapshotName,
        repositoryName
      };
    }
  }

  /**
   * List all snapshots in a repository
   * @param {string} repositoryName - The repository name
   * @returns {Promise<Object>} Result of the operation
   */
  async listSnapshots(repositoryName) {
    try {
      loggerService.info(`Listing snapshots in repository: ${repositoryName}`);

      const result = await this.client.snapshot.get({
        repository: repositoryName,
        snapshot: '*'
      });

      const snapshots = result.snapshots || [];

      loggerService.info(`Found ${snapshots.length} snapshots in repository: ${repositoryName}`);

      return {
        success: true,
        repositoryName,
        snapshots,
        count: snapshots.length
      };

    } catch (error) {
      loggerService.error(`Failed to list snapshots in repository: ${repositoryName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        repositoryName
      };
    }
  }

  /**
   * Delete a snapshot
   * @param {string} repositoryName - The repository name
   * @param {string} snapshotName - The snapshot name
   * @returns {Promise<Object>} Result of the operation
   */
  async deleteSnapshot(repositoryName, snapshotName) {
    try {
      loggerService.info(`Deleting snapshot: ${snapshotName}`, {
        repository: repositoryName
      });

      const result = await this.client.snapshot.delete({
        repository: repositoryName,
        snapshot: snapshotName
      });

      loggerService.info(`Snapshot deleted successfully: ${snapshotName}`);

      return {
        success: true,
        snapshotName,
        repositoryName,
        acknowledged: result.acknowledged
      };

    } catch (error) {
      loggerService.error(`Failed to delete snapshot: ${snapshotName}`, {
        error: error.message,
        stack: error.stack,
        repositoryName
      });

      return {
        success: false,
        error: error.message,
        snapshotName,
        repositoryName
      };
    }
  }

  /**
   * Restore from a snapshot
   * @param {string} repositoryName - The repository name
   * @param {string} snapshotName - The snapshot name
   * @param {string[]} indices - The indices to restore (empty = all)
   * @returns {Promise<Object>} Result of the operation
   */
  async restoreSnapshot(repositoryName, snapshotName, indices = []) {
    try {
      loggerService.info(`Restoring from snapshot: ${snapshotName}`, {
        repository: repositoryName,
        indices
      });

      const body = {
        snapshot: snapshotName,
        repository: repositoryName,
        wait_for_completion: false
      };

      if (indices.length > 0) {
        body.indices = indices.join(',');
      }

      const result = await this.client.snapshot.restore(body);

      loggerService.info(`Snapshot restoration initiated: ${snapshotName}`);

      return {
        success: true,
        snapshotName,
        repositoryName,
        accepted: result.accepted
      };

    } catch (error) {
      loggerService.error(`Failed to restore snapshot: ${snapshotName}`, {
        error: error.message,
        stack: error.stack,
        repositoryName,
        indices
      });

      return {
        success: false,
        error: error.message,
        snapshotName,
        repositoryName
      };
    }
  }

  /**
   * Verify a snapshot repository
   * @param {string} repositoryName - The repository name
   * @returns {Promise<Object>} Result of the operation
   */
  async verifyRepository(repositoryName) {
    try {
      loggerService.info(`Verifying repository: ${repositoryName}`);

      const result = await this.client.snapshot.verifyRepository({
        repository: repositoryName
      });

      const nodes = result.nodes || {};
      const nodeNames = Object.keys(nodes);

      loggerService.info(`Repository verified successfully: ${repositoryName}`, {
        nodesVerified: nodeNames.length
      });

      return {
        success: true,
        repositoryName,
        nodes: nodeNames,
        details: nodes
      };

    } catch (error) {
      loggerService.error(`Failed to verify repository: ${repositoryName}`, {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        repositoryName
      };
    }
  }
}

module.exports = {
  // ILM policies
  productILMPolicy,
  categoryILMPolicy,
  brandILMPolicy,
  logILMPolicy,
  
  // Functions
  getILMPolicy,
  getAllILMPolicies,
  getILMPolicyName,
  getIndexLifecyclePolicy,
  validateILMPolicy,
  getILMPolicyDescription,
  getAllILMPolicyDescriptions,
  getRetentionPeriod,
  getRolloverConfig,
  createCustomILMPolicy,
  
  // ILM Service class
  ILMService
};
