const path = require('path');
const fs = require('fs');

/**
 * Test Environment Configuration
 * Manages different test environments and configurations
 */
class TestEnvironment {
  constructor() {
    this.environments = {
      development: {
        name: 'Development',
        description: 'Local development environment with mock database',
        database: {
          useMock: true,
          url: 'postgresql://dev_user:dev_pass@localhost:5432/smart_ecommerce_dev'
        },
        api: {
          baseUrl: 'http://localhost:3001',
          timeout: 30000
        },
        features: {
          hotReload: true,
          debugLogging: true,
          autoSeedData: true,
          performanceTests: false
        }
      },
      
      testing: {
        name: 'Testing',
        description: 'CI/CD testing environment with mock database',
        database: {
          useMock: true,
          url: 'postgresql://test_user:test_pass@localhost:5432/smart_ecommerce_test'
        },
        api: {
          baseUrl: 'http://localhost:3001',
          timeout: 15000
        },
        features: {
          hotReload: false,
          debugLogging: true,
          autoSeedData: true,
          performanceTests: true
        }
      },
      
      staging: {
        name: 'Staging',
        description: 'Pre-production environment with real database',
        database: {
          useMock: false,
          url: process.env.STAGING_DATABASE_URL || 'postgresql://staging_user:staging_pass@localhost:5432/smart_ecommerce_staging'
        },
        api: {
          baseUrl: 'https://staging-api.smarttech.bd',
          timeout: 20000
        },
        features: {
          hotReload: false,
          debugLogging: false,
          autoSeedData: false,
          performanceTests: true
        }
      },
      
      production: {
        name: 'Production',
        description: 'Production environment with real database',
        database: {
          useMock: false,
          url: process.env.PROD_DATABASE_URL || 'postgresql://prod_user:prod_pass@localhost:5432/smart_ecommerce_prod'
        },
        api: {
          baseUrl: 'https://api.smarttech.bd',
          timeout: 10000
        },
        features: {
          hotReload: false,
          debugLogging: false,
          autoSeedData: false,
          performanceTests: false
        }
      }
    };
    
    this.currentEnvironment = this.detectEnvironment();
    this.config = this.environments[this.currentEnvironment];
  }

  detectEnvironment() {
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();
    const testEnv = process.env.TEST_ENV?.toLowerCase();
    
    if (testEnv && this.environments[testEnv]) {
      return testEnv;
    }
    
    if (nodeEnv && this.environments[nodeEnv]) {
      return nodeEnv;
    }
    
    // Default to development
    return 'development';
  }

  getCurrentEnvironment() {
    return this.currentEnvironment;
  }

  getConfig() {
    return { ...this.config };
  }

  getDatabaseConfig() {
    return { ...this.config.database };
  }

  getAPIConfig() {
    return { ...this.config.api };
  }

  getFeatureConfig() {
    return { ...this.config.features };
  }

  setEnvironment(envName) {
    if (!this.environments[envName]) {
      throw new Error(`Unknown environment: ${envName}`);
    }
    
    this.currentEnvironment = envName;
    this.config = this.environments[envName];
    
    // Update environment variables
    process.env.NODE_ENV = envName.toUpperCase();
    process.env.TEST_ENV = envName.toUpperCase();
    
    if (this.config.database.useMock) {
      process.env.USE_MOCK_DB = 'true';
    } else {
      process.env.USE_MOCK_DB = 'false';
      process.env.DATABASE_URL = this.config.database.url;
    }
    
    console.log(`🌍 Environment switched to: ${this.config.name}`);
  }

  createEnvironmentFile(envName, filePath = '.env.test') {
    if (!this.environments[envName]) {
      throw new Error(`Unknown environment: ${envName}`);
    }
    
    const env = this.environments[envName];
    const envContent = this.generateEnvFileContent(env);
    
    try {
      fs.writeFileSync(filePath, envContent, 'utf8');
      console.log(`✅ Environment file created: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to create environment file: ${error.message}`);
      throw error;
    }
  }

  generateEnvFileContent(env) {
    const lines = [
      '# Smart Technologies Bangladesh - Test Environment Configuration',
      `# Environment: ${env.name}`,
      `# Description: ${env.description}`,
      '',
      '# Database Configuration',
      `USE_MOCK_DB=${env.database.useMock}`,
      `DATABASE_URL=${env.database.url}`,
      '',
      '# API Configuration',
      `API_BASE_URL=${env.api.baseUrl}`,
      `API_TIMEOUT=${env.api.timeout}`,
      '',
      '# Feature Flags',
      `HOT_RELOAD=${env.features.hotReload}`,
      `DEBUG_LOGGING=${env.features.debugLogging}`,
      `AUTO_SEED_DATA=${env.features.autoSeedData}`,
      `PERFORMANCE_TESTS=${env.features.performanceTests}`,
      '',
      '# Bangladesh-Specific Settings',
      'DEFAULT_CURRENCY=BDT',
      'DEFAULT_TIMEZONE=Asia/Dhaka',
      'SUPPORT_BANGLA_LANGUAGE=true',
      'ENABLE_LOCAL_PAYMENT_METHODS=true',
      '',
      '# Test Settings',
      'NODE_ENV=' + (env.name === 'Production' ? 'production' : 'development'),
      'TEST_ENV=' + env.name.toUpperCase(),
      ''
    ];
    
    return lines.join('\n');
  }

  validateEnvironment(envName) {
    if (!this.environments[envName]) {
      return { valid: false, errors: [`Unknown environment: ${envName}`] };
    }
    
    const env = this.environments[envName];
    const errors = [];
    
    // Validate database configuration
    if (!env.database.useMock && !env.database.url) {
      errors.push('Database URL is required for real database environments');
    }
    
    // Validate API configuration
    if (!env.api.baseUrl) {
      errors.push('API base URL is required');
    }
    
    if (env.api.timeout && (env.api.timeout < 1000 || env.api.timeout > 60000)) {
      errors.push('API timeout should be between 1000ms and 60000ms');
    }
    
    // Validate feature configuration
    const requiredFeatures = ['hotReload', 'debugLogging', 'autoSeedData', 'performanceTests'];
    for (const feature of requiredFeatures) {
      if (typeof env.features[feature] !== 'boolean') {
        errors.push(`Feature ${feature} must be a boolean`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  listEnvironments() {
    return Object.keys(this.environments).map(key => ({
      key,
      name: this.environments[key].name,
      description: this.environments[key].description,
      isCurrent: key === this.currentEnvironment
    }));
  }

  getEnvironmentInfo(envName = this.currentEnvironment) {
    if (!this.environments[envName]) {
      throw new Error(`Unknown environment: ${envName}`);
    }
    
    const env = this.environments[envName];
    return {
      name: env.name,
      description: env.description,
      database: {
        type: env.database.useMock ? 'Mock' : 'PostgreSQL',
        url: env.database.useMock ? 'Mock Database' : env.database.url
      },
      api: {
        baseUrl: env.api.baseUrl,
        timeout: `${env.api.timeout}ms`
      },
      features: env.features,
      bangladeshSpecific: {
        currency: 'BDT',
        timezone: 'Asia/Dhaka',
        languageSupport: true,
        localPaymentMethods: true
      }
    };
  }

  setupEnvironment(envName) {
    console.log(`🔧 Setting up ${envName} environment...`);
    
    const validation = this.validateEnvironment(envName);
    if (!validation.valid) {
      throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Set environment
    this.setEnvironment(envName);
    
    // Create environment file
    const envFilePath = path.join(process.cwd(), `.env.${envName}`);
    this.createEnvironmentFile(envName, envFilePath);
    
    // Log environment info
    const info = this.getEnvironmentInfo(envName);
    console.log(`✅ Environment setup complete:`);
    console.log(`   Database: ${info.database.type}`);
    console.log(`   API: ${info.api.baseUrl}`);
    console.log(`   Features: ${Object.keys(info.features).filter(f => info.features[f]).join(', ')}`);
    
    return info;
  }

  createDockerCompose(envName, outputPath = 'docker-compose.test.yml') {
    if (!this.environments[envName]) {
      throw new Error(`Unknown environment: ${envName}`);
    }
    
    const env = this.environments[envName];
    const dockerCompose = {
      version: '3.8',
      services: {
        backend: {
          build: {
            context: './backend',
            dockerfile: 'Dockerfile'
          },
          container_name: `smarttech_backend_${envName}`,
          restart: 'unless-stopped',
          ports: [`${envName === 'development' ? '3001' : '3002'}:3000`],
          environment: [
            `NODE_ENV=${envName}`,
            `PORT=3000`,
            `USE_MOCK_DB=${env.database.useMock}`,
            `DATABASE_URL=${env.database.url}`,
            `API_BASE_URL=${env.api.baseUrl}`,
            `DEBUG_LOGGING=${env.features.debugLogging}`,
            `AUTO_SEED_DATA=${env.features.autoSeedData}`,
            `PERFORMANCE_TESTS=${env.features.performanceTests}`,
            'DEFAULT_CURRENCY=BDT',
            'DEFAULT_TIMEZONE=Asia/Dhaka',
            'SUPPORT_BANGLA_LANGUAGE=true',
            'ENABLE_LOCAL_PAYMENT_METHODS=true'
          ],
          networks: ['smarttech_test_network'],
          depends_on: env.database.useMock ? [] : ['postgres_test'],
          healthcheck: {
            test: ['CMD', 'node', 'healthcheck.js'],
            interval: '30s',
            timeout: '10s',
            retries: 3,
            start_period: '40s'
          }
        }
      },
      networks: {
        smarttech_test_network: {
          driver: 'bridge'
        }
      }
    };
    
    // Add PostgreSQL service for real database environments
    if (!env.database.useMock) {
      dockerCompose.services.postgres_test = {
        image: 'postgres:15-alpine',
        container_name: `smarttech_postgres_${envName}`,
        restart: 'unless-stopped',
        environment: [
          'POSTGRES_DB=smart_ecommerce_test',
          'POSTGRES_USER=test_user',
          'POSTGRES_PASSWORD=test_pass',
          'PGDATA=/var/lib/postgresql/data/pgdata'
        ],
        ports: ['5433:5432'],
        volumes: [`postgres_test_data:/var/lib/postgresql/data`],
        networks: ['smarttech_test_network'],
        healthcheck: {
          test: ['CMD-SHELL', 'pg_isready -U test_user -d smart_ecommerce_test'],
          interval: '30s',
          timeout: '10s',
          retries: 3
        }
      };
      
      dockerCompose.volumes = {
        postgres_test_data: {
          driver: 'local'
        }
      };
    }
    
    // Convert to YAML string
    const yamlContent = this.convertToYAML(dockerCompose);
    
    try {
      fs.writeFileSync(outputPath, yamlContent, 'utf8');
      console.log(`✅ Docker Compose file created: ${outputPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to create Docker Compose file: ${error.message}`);
      throw error;
    }
  }

  convertToYAML(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        continue;
      }
      
      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n`;
            yaml += this.convertToYAML(item, indent + 3).replace(/^\s+/, '');
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else if (typeof value === 'object') {
        yaml += `${spaces}${key}:\n`;
        yaml += this.convertToYAML(value, indent + 1);
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return yaml;
  }

  // Bangladesh-specific environment configurations
  getBangladeshConfig() {
    return {
      currency: {
        code: 'BDT',
        symbol: '৳',
        decimalPlaces: 2
      },
      timezone: 'Asia/Dhaka',
      language: {
        primary: 'en',
        secondary: 'bn',
        supportBengali: true
      },
      payment: {
        localMethods: ['BKASH', 'NAGAD', 'ROCKET'],
        internationalMethods: ['CREDIT_CARD', 'BANK_TRANSFER'],
        cashOnDelivery: true
      },
      shipping: {
        divisions: [
          'DHAKA', 'CHITTAGONG', 'RAJSHAHI', 'SYLHET',
          'KHULNA', 'BARISHAL', 'RANGPUR', 'MYMENSINGH'
        ],
        supportsSameDayDelivery: true,
        supportsExpressDelivery: true
      },
      localization: {
        dateFormat: 'DD/MM/YYYY',
        numberFormat: 'en-IN',
        weekendDays: ['Friday', 'Saturday']
      }
    };
  }

  // Environment comparison utility
  compareEnvironments(env1, env2) {
    if (!this.environments[env1] || !this.environments[env2]) {
      throw new Error('One or both environments not found');
    }
    
    const e1 = this.environments[env1];
    const e2 = this.environments[env2];
    
    return {
      database: {
        sameType: e1.database.useMock === e2.database.useMock,
        urlChanged: e1.database.url !== e2.database.url
      },
      api: {
        baseUrlChanged: e1.api.baseUrl !== e2.api.baseUrl,
        timeoutChanged: e1.api.timeout !== e2.api.timeout
      },
      features: {
        differences: Object.keys(e1.features).filter(
          key => e1.features[key] !== e2.features[key]
        )
      }
    };
  }
}

module.exports = {
  TestEnvironment
};