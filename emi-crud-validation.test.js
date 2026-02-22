/**
 * EMI CRUD Validation Test Script
 * Comprehensive test suite for EMI Providers and EMI Plans CRUD operations
 */

const http = require('http');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_RESULTS = [];
const CREATED_RESOURCES = {
  providers: [],
  plans: []
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, url, testName, expectedStatus = 200, body = null, expectedFields = null) {
  return new Promise((resolve) => {
    log(`\n[TEST] ${testName}`, 'cyan');
    log(`Method: ${method}`, 'blue');
    log(`URL: ${url}`, 'blue');
    if (body) {
      log(`Body: ${JSON.stringify(body, null, 2)}`, 'magenta');
    }

    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    const req = http.request(url, options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const data = JSON.parse(responseBody);
          const statusCode = res.statusCode;

          log(`Status Code: ${statusCode}`, statusCode === expectedStatus ? 'green' : 'yellow');
          log(`Response: ${JSON.stringify(data, null, 2)}`, 'blue');

          // Determine if test passed
          let passed = statusCode === expectedStatus;

          // Check expected fields if specified
          if (expectedFields && data.data) {
            for (const field of expectedFields) {
              if (data.data[field] === undefined) {
                passed = false;
                log(`Expected field '${field}' not found in response`, 'red');
              }
            }
          }

          // Check success flag for successful operations
          if (expectedStatus < 300 && data.success !== true) {
            passed = false;
            log(`Expected success: true, got: ${data.success}`, 'red');
          }

          log(`Result: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'green' : 'red');

          TEST_RESULTS.push({
            testName,
            method,
            url,
            expectedStatus,
            actualStatus: statusCode,
            expectedFields,
            body,
            response: data,
            passed
          });

          resolve(data);
        } catch (error) {
          log(`Error parsing response: ${error.message}`, 'red');
          log(`Raw response: ${responseBody}`, 'yellow');

          TEST_RESULTS.push({
            testName,
            method,
            url,
            expectedStatus,
            actualStatus: res.statusCode,
            error: error.message,
            passed: false
          });

          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      log(`Request failed: ${error.message}`, 'red');

      TEST_RESULTS.push({
        testName,
        method,
        url,
        expectedStatus,
        error: error.message,
        passed: false
      });

      resolve(null);
    });

    req.on('timeout', () => {
      log('Request timed out', 'red');
      req.destroy();

      TEST_RESULTS.push({
        testName,
        method,
        url,
        expectedStatus,
        error: 'Timeout',
        passed: false
      });

      resolve(null);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  log('\n========================================', 'cyan');
  log('EMI CRUD VALIDATION TEST SUITE', 'cyan');
  log('========================================\n', 'cyan');

  // ============================================================================
  // EMI PROVIDERS CRUD TESTS
  // ============================================================================
  log('\n========================================', 'cyan');
  log('EMI PROVIDERS CRUD TESTS', 'cyan');
  log('========================================\n', 'cyan');

  // Test 1: GET all providers
  await makeRequest(
    'GET',
    `${BASE_URL}/api/v1/emi/providers`,
    'Test 1.1: GET all EMI providers',
    200,
    null,
    []
  );

  // Test 2: POST create new provider - Valid data
  const newProviderData = {
    name: 'Test Bank',
    logoUrl: 'https://example.com/logo.png',
    website: 'https://testbank.com',
    minAmount: 5000,
    maxAmount: 100000,
    processingFee: 100,
    interestRate: 12,
    isActive: true
  };
  const createdProvider = await makeRequest(
    'POST',
    `${BASE_URL}/api/v1/emi/providers`,
    'Test 1.2: POST create new EMI provider - Valid data',
    201,
    newProviderData,
    ['id', 'name', 'logoUrl', 'website', 'minAmount', 'maxAmount', 'processingFee', 'interestRate', 'isActive']
  );
  if (createdProvider && createdProvider.data && createdProvider.data.id) {
    CREATED_RESOURCES.providers.push(createdProvider.data.id);
  }

  // Test 3: POST create provider - Missing required field (name)
  await makeRequest(
    'POST',
    `${BASE_URL}/api/v1/emi/providers`,
    'Test 1.3: POST create provider - Missing required field (name)',
    400,
    {
      logoUrl: 'https://example.com/logo.png',
      website: 'https://testbank.com'
    }
  );

  // Test 4: POST create provider - Invalid URL
  await makeRequest(
    'POST',
    `${BASE_URL}/api/v1/emi/providers`,
    'Test 1.4: POST create provider - Invalid logo URL',
    400,
    {
      name: 'Invalid URL Provider',
      logoUrl: 'not-a-valid-url',
      website: 'https://testbank.com'
    }
  );

  // Test 5: POST create provider - Negative amounts
  await makeRequest(
    'POST',
    `${BASE_URL}/api/v1/emi/providers`,
    'Test 1.5: POST create provider - Negative minAmount',
    400,
    {
      name: 'Negative Amount Provider',
      minAmount: -1000,
      maxAmount: 100000
    }
  );

  // Test 6: POST create provider - Min >= Max
  await makeRequest(
    'POST',
    `${BASE_URL}/api/v1/emi/providers`,
    'Test 1.6: POST create provider - Min amount >= Max amount',
    400,
    {
      name: 'Invalid Range Provider',
      minAmount: 100000,
      maxAmount: 50000
    }
  );

  // Test 7: GET provider by ID (valid)
  if (CREATED_RESOURCES.providers.length > 0) {
    await makeRequest(
      'GET',
      `${BASE_URL}/api/v1/emi/providers/${CREATED_RESOURCES.providers[0]}`,
      'Test 1.7: GET provider by ID - Valid ID',
      200,
      null,
      ['id', 'name', 'logoUrl', 'website', 'minAmount', 'maxAmount', 'processingFee', 'interestRate', 'isActive']
    );
  }

  // Test 8: GET provider by ID (invalid UUID)
  await makeRequest(
    'GET',
    `${BASE_URL}/api/v1/emi/providers/not-a-uuid`,
    'Test 1.8: GET provider by ID - Invalid UUID',
    400
  );

  // Test 9: GET provider by ID (non-existent)
  await makeRequest(
    'GET',
    `${BASE_URL}/api/v1/emi/providers/00000000-0000-0000-0000-000000000000`,
    'Test 1.9: GET provider by ID - Non-existent provider',
    404
  );

  // Test 10: PUT update provider (valid)
  if (CREATED_RESOURCES.providers.length > 0) {
    const updatedProviderData = {
      name: 'Test Bank Updated',
      processingFee: 150,
      interestRate: 10
    };
    await makeRequest(
      'PUT',
      `${BASE_URL}/api/v1/emi/providers/${CREATED_RESOURCES.providers[0]}`,
      'Test 1.10: PUT update provider - Valid update',
      200,
      updatedProviderData,
      ['id', 'name']
    );
  }

  // Test 11: PUT update provider - Empty name
  if (CREATED_RESOURCES.providers.length > 0) {
    await makeRequest(
      'PUT',
      `${BASE_URL}/api/v1/emi/providers/${CREATED_RESOURCES.providers[0]}`,
      'Test 1.11: PUT update provider - Empty name',
      400,
      {
        name: '   '
      }
    );
  }

  // Test 12: PUT update provider - Invalid UUID
  await makeRequest(
    'PUT',
    `${BASE_URL}/api/v1/emi/providers/not-a-uuid`,
    'Test 1.12: PUT update provider - Invalid UUID',
    400,
    {
      name: 'Test'
    }
  );

  // Test 13: PUT update provider - Non-existent
  await makeRequest(
    'PUT',
    `${BASE_URL}/api/v1/emi/providers/00000000-0000-0000-0000-000000000000`,
    'Test 1.13: PUT update provider - Non-existent provider',
    404,
    {
      name: 'Non-existent'
    }
  );

  // Test 14: PUT update provider - Negative processing fee
  if (CREATED_RESOURCES.providers.length > 0) {
    await makeRequest(
      'PUT',
      `${BASE_URL}/api/v1/emi/providers/${CREATED_RESOURCES.providers[0]}`,
      'Test 1.14: PUT update provider - Negative processing fee',
      400,
      {
        processingFee: -50
      }
    );
  }

  // Test 15: PUT update provider - Min >= Max
  if (CREATED_RESOURCES.providers.length > 0) {
    await makeRequest(
      'PUT',
      `${BASE_URL}/api/v1/emi/providers/${CREATED_RESOURCES.providers[0]}`,
      'Test 1.15: PUT update provider - Min amount >= Max amount',
      400,
      {
        minAmount: 100000,
        maxAmount: 50000
      }
    );
  }

  // Test 16: DELETE provider (valid)
  if (CREATED_RESOURCES.providers.length > 0) {
    await makeRequest(
      'DELETE',
      `${BASE_URL}/api/v1/emi/providers/${CREATED_RESOURCES.providers[0]}`,
      'Test 1.16: DELETE provider - Valid ID',
      200,
      null,
      ['id', 'name']
    );
    // Remove from created resources since it's deleted
    CREATED_RESOURCES.providers.shift();
  }

  // Test 17: DELETE provider - Invalid UUID
  await makeRequest(
    'DELETE',
    `${BASE_URL}/api/v1/emi/providers/not-a-uuid`,
    'Test 1.17: DELETE provider - Invalid UUID',
    400
  );

  // Test 18: DELETE provider - Non-existent
  await makeRequest(
    'DELETE',
    `${BASE_URL}/api/v1/emi/providers/00000000-0000-0000-0000-000000000000`,
    'Test 1.18: DELETE provider - Non-existent provider',
    404
  );

  // ============================================================================
  // EMI PLANS CRUD TESTS
  // ============================================================================
  log('\n========================================', 'cyan');
  log('EMI PLANS CRUD TESTS', 'cyan');
  log('========================================\n', 'cyan');

  // First, create a provider for plan tests
  const planTestProvider = await makeRequest(
    'POST',
    `${BASE_URL}/api/v1/emi/providers`,
    'Setup: Create provider for plan tests',
    201,
    {
      name: 'Plan Test Bank',
      logoUrl: 'https://example.com/plantest.png',
      website: 'https://plantestbank.com',
      minAmount: 5000,
      maxAmount: 200000,
      processingFee: 100,
      interestRate: 12,
      isActive: true
    },
    ['id', 'name']
  );
  if (planTestProvider && planTestProvider.data && planTestProvider.data.id) {
    CREATED_RESOURCES.providers.push(planTestProvider.data.id);
  }

  // Test 19: GET all plans
  await makeRequest(
    'GET',
    `${BASE_URL}/api/v1/emi/plans`,
    'Test 2.1: GET all EMI plans',
    200,
    null,
    []
  );

  // Test 20: POST create new plan - Valid data
  if (CREATED_RESOURCES.providers.length > 0) {
    const newPlanData = {
      providerId: CREATED_RESOURCES.providers[0],
      name: '3 Months Plan',
      duration: 3,
      interestRate: 10,
      minAmount: 5000,
      maxAmount: 50000,
      processingFee: 100,
      downPayment: 0,
      isActive: true,
      displayOrder: 1
    };
    const createdPlan = await makeRequest(
      'POST',
      `${BASE_URL}/api/v1/emi/plans`,
      'Test 2.2: POST create new EMI plan - Valid data',
      201,
      newPlanData,
      ['id', 'providerId', 'name', 'duration', 'interestRate', 'minAmount', 'maxAmount', 'processingFee', 'downPayment', 'isActive', 'displayOrder']
    );
    if (createdPlan && createdPlan.data && createdPlan.data.id) {
      CREATED_RESOURCES.plans.push(createdPlan.data.id);
    }
  }

  // Test 21: POST create plan - Missing required field (providerId)
  await makeRequest(
    'POST',
    `${BASE_URL}/api/v1/emi/plans`,
    'Test 2.3: POST create plan - Missing required field (providerId)',
    400,
    {
      name: 'Test Plan',
      duration: 6,
      interestRate: 12,
      minAmount: 5000,
      maxAmount: 100000
    }
  );

  // Test 22: POST create plan - Invalid providerId (not UUID)
  await makeRequest(
    'POST',
    `${BASE_URL}/api/v1/emi/plans`,
    'Test 2.4: POST create plan - Invalid providerId (not UUID)',
    400,
    {
      providerId: 'not-a-uuid',
      name: 'Test Plan',
      duration: 6,
      interestRate: 12,
      minAmount: 5000,
      maxAmount: 100000
    }
  );

  // Test 23: POST create plan - Non-existent provider
  await makeRequest(
    'POST',
    `${BASE_URL}/api/v1/emi/plans`,
    'Test 2.5: POST create plan - Non-existent provider',
    404,
    {
      providerId: '00000000-0000-0000-0000-000000000000',
      name: 'Test Plan',
      duration: 6,
      interestRate: 12,
      minAmount: 5000,
      maxAmount: 100000
    }
  );

  // Test 24: POST create plan - Missing required field (name)
  if (CREATED_RESOURCES.providers.length > 0) {
    await makeRequest(
      'POST',
      `${BASE_URL}/api/v1/emi/plans`,
      'Test 2.6: POST create plan - Missing required field (name)',
      400,
      {
        providerId: CREATED_RESOURCES.providers[0],
        duration: 6,
        interestRate: 12,
        minAmount: 5000,
        maxAmount: 100000
      }
    );
  }

  // Test 25: POST create plan - Invalid duration (zero)
  if (CREATED_RESOURCES.providers.length > 0) {
    await makeRequest(
      'POST',
      `${BASE_URL}/api/v1/emi/plans`,
      'Test 2.7: POST create plan - Invalid duration (zero)',
      400,
      {
        providerId: CREATED_RESOURCES.providers[0],
        name: 'Invalid Duration Plan',
        duration: 0,
        interestRate: 12,
        minAmount: 5000,
        maxAmount: 100000
      }
    );
  }

  // Test 26: POST create plan - Negative interest rate
  if (CREATED_RESOURCES.providers.length > 0) {
    await makeRequest(
      'POST',
      `${BASE_URL}/api/v1/emi/plans`,
      'Test 2.8: POST create plan - Negative interest rate',
      400,
      {
        providerId: CREATED_RESOURCES.providers[0],
        name: 'Negative Interest Plan',
        duration: 6,
        interestRate: -5,
        minAmount: 5000,
        maxAmount: 100000
      }
    );
  }

  // Test 27: POST create plan - Negative minAmount
  if (CREATED_RESOURCES.providers.length > 0) {
    await makeRequest(
      'POST',
      `${BASE_URL}/api/v1/emi/plans`,
      'Test 2.9: POST create plan - Negative minAmount',
      400,
      {
        providerId: CREATED_RESOURCES.providers[0],
        name: 'Negative Min Plan',
        duration: 6,
        interestRate: 12,
        minAmount: -1000,
        maxAmount: 100000
      }
    );
  }

  // Test 28: POST create plan - Min >= Max
  if (CREATED_RESOURCES.providers.length > 0) {
    await makeRequest(
      'POST',
      `${BASE_URL}/api/v1/emi/plans`,
      'Test 2.10: POST create plan - Min amount >= Max amount',
      400,
      {
        providerId: CREATED_RESOURCES.providers[0],
        name: 'Invalid Range Plan',
        duration: 6,
        interestRate: 12,
        minAmount: 100000,
        maxAmount: 50000
      }
    );
  }

  // Test 29: POST create plan - Negative processing fee
  if (CREATED_RESOURCES.providers.length > 0) {
    await makeRequest(
      'POST',
      `${BASE_URL}/api/v1/emi/plans`,
      'Test 2.11: POST create plan - Negative processing fee',
      400,
      {
        providerId: CREATED_RESOURCES.providers[0],
        name: 'Negative Fee Plan',
        duration: 6,
        interestRate: 12,
        minAmount: 5000,
        maxAmount: 100000,
        processingFee: -50
      }
    );
  }

  // Test 30: POST create plan - Negative down payment
  if (CREATED_RESOURCES.providers.length > 0) {
    await makeRequest(
      'POST',
      `${BASE_URL}/api/v1/emi/plans`,
      'Test 2.12: POST create plan - Negative down payment',
      400,
      {
        providerId: CREATED_RESOURCES.providers[0],
        name: 'Negative Down Payment Plan',
        duration: 6,
        interestRate: 12,
        minAmount: 5000,
        maxAmount: 100000,
        downPayment: -100
      }
    );
  }

  // Test 31: GET plan by ID (valid)
  if (CREATED_RESOURCES.plans.length > 0) {
    await makeRequest(
      'GET',
      `${BASE_URL}/api/v1/emi/plans/${CREATED_RESOURCES.plans[0]}`,
      'Test 2.13: GET plan by ID - Valid ID',
      200,
      null,
      ['id', 'providerId', 'name', 'duration', 'interestRate', 'minAmount', 'maxAmount', 'processingFee', 'downPayment', 'isActive', 'displayOrder', 'provider']
    );
  }

  // Test 32: GET plan by ID (invalid UUID)
  await makeRequest(
    'GET',
    `${BASE_URL}/api/v1/emi/plans/not-a-uuid`,
    'Test 2.14: GET plan by ID - Invalid UUID',
    400
  );

  // Test 33: GET plan by ID (non-existent)
  await makeRequest(
    'GET',
    `${BASE_URL}/api/v1/emi/plans/00000000-0000-0000-0000-000000000000`,
    'Test 2.15: GET plan by ID - Non-existent plan',
    404
  );

  // Test 34: PUT update plan (valid)
  if (CREATED_RESOURCES.plans.length > 0) {
    const updatedPlanData = {
      name: '3 Months Plan Updated',
      interestRate: 8,
      processingFee: 150
    };
    await makeRequest(
      'PUT',
      `${BASE_URL}/api/v1/emi/plans/${CREATED_RESOURCES.plans[0]}`,
      'Test 2.16: PUT update plan - Valid update',
      200,
      updatedPlanData,
      ['id', 'name']
    );
  }

  // Test 35: PUT update plan - Empty name
  if (CREATED_RESOURCES.plans.length > 0) {
    await makeRequest(
      'PUT',
      `${BASE_URL}/api/v1/emi/plans/${CREATED_RESOURCES.plans[0]}`,
      'Test 2.17: PUT update plan - Empty name',
      400,
      {
        name: '   '
      }
    );
  }

  // Test 36: PUT update plan - Invalid UUID
  await makeRequest(
    'PUT',
    `${BASE_URL}/api/v1/emi/plans/not-a-uuid`,
    'Test 2.18: PUT update plan - Invalid UUID',
    400,
    {
      name: 'Test'
    }
  );

  // Test 37: PUT update plan - Non-existent
  await makeRequest(
    'PUT',
    `${BASE_URL}/api/v1/emi/plans/00000000-0000-0000-0000-000000000000`,
    'Test 2.19: PUT update plan - Non-existent plan',
    404,
    {
      name: 'Non-existent'
    }
  );

  // Test 38: PUT update plan - Invalid duration (zero)
  if (CREATED_RESOURCES.plans.length > 0) {
    await makeRequest(
      'PUT',
      `${BASE_URL}/api/v1/emi/plans/${CREATED_RESOURCES.plans[0]}`,
      'Test 2.20: PUT update plan - Invalid duration (zero)',
      400,
      {
        duration: 0
      }
    );
  }

  // Test 39: PUT update plan - Negative interest rate
  if (CREATED_RESOURCES.plans.length > 0) {
    await makeRequest(
      'PUT',
      `${BASE_URL}/api/v1/emi/plans/${CREATED_RESOURCES.plans[0]}`,
      'Test 2.21: PUT update plan - Negative interest rate',
      400,
      {
        interestRate: -5
      }
    );
  }

  // Test 40: PUT update plan - Min >= Max
  if (CREATED_RESOURCES.plans.length > 0) {
    await makeRequest(
      'PUT',
      `${BASE_URL}/api/v1/emi/plans/${CREATED_RESOURCES.plans[0]}`,
      'Test 2.22: PUT update plan - Min amount >= Max amount',
      400,
      {
        minAmount: 100000,
        maxAmount: 50000
      }
    );
  }

  // Test 41: DELETE plan (valid)
  if (CREATED_RESOURCES.plans.length > 0) {
    await makeRequest(
      'DELETE',
      `${BASE_URL}/api/v1/emi/plans/${CREATED_RESOURCES.plans[0]}`,
      'Test 2.23: DELETE plan - Valid ID',
      200,
      null,
      ['id', 'name']
    );
    // Remove from created resources since it's deleted
    CREATED_RESOURCES.plans.shift();
  }

  // Test 42: DELETE plan - Invalid UUID
  await makeRequest(
    'DELETE',
    `${BASE_URL}/api/v1/emi/plans/not-a-uuid`,
    'Test 2.24: DELETE plan - Invalid UUID',
    400
  );

  // Test 43: DELETE plan - Non-existent
  await makeRequest(
    'DELETE',
    `${BASE_URL}/api/v1/emi/plans/00000000-0000-0000-0000-000000000000`,
    'Test 2.25: DELETE plan - Non-existent plan',
    404
  );

  // ============================================================================
  // CASCADE DELETE TEST
  // ============================================================================
  log('\n========================================', 'cyan');
  log('CASCADE DELETE TEST', 'cyan');
  log('========================================\n', 'cyan');

  // Create a provider with multiple plans
  const cascadeProvider = await makeRequest(
    'POST',
    `${BASE_URL}/api/v1/emi/providers`,
    'Setup: Create provider for cascade delete test',
    201,
    {
      name: 'Cascade Test Bank',
      logoUrl: 'https://example.com/cascade.png',
      website: 'https://cascadetestbank.com',
      minAmount: 5000,
      maxAmount: 200000,
      processingFee: 100,
      interestRate: 12,
      isActive: true
    },
    ['id', 'name']
  );

  if (cascadeProvider && cascadeProvider.data && cascadeProvider.data.id) {
    const cascadeProviderId = cascadeProvider.data.id;
    CREATED_RESOURCES.providers.push(cascadeProviderId);

    // Create multiple plans for this provider
    const cascadePlan1 = await makeRequest(
      'POST',
      `${BASE_URL}/api/v1/emi/plans`,
      'Setup: Create plan 1 for cascade delete test',
      201,
      {
        providerId: cascadeProviderId,
        name: 'Cascade Plan 1',
        duration: 3,
        interestRate: 10,
        minAmount: 5000,
        maxAmount: 50000,
        processingFee: 100,
        downPayment: 0,
        isActive: true,
        displayOrder: 1
      },
      ['id']
    );

    const cascadePlan2 = await makeRequest(
      'POST',
      `${BASE_URL}/api/v1/emi/plans`,
      'Setup: Create plan 2 for cascade delete test',
      201,
      {
        providerId: cascadeProviderId,
        name: 'Cascade Plan 2',
        duration: 6,
        interestRate: 12,
        minAmount: 10000,
        maxAmount: 100000,
        processingFee: 150,
        downPayment: 0,
        isActive: true,
        displayOrder: 2
      },
      ['id']
    );

    if (cascadePlan1 && cascadePlan1.data && cascadePlan1.data.id) {
      CREATED_RESOURCES.plans.push(cascadePlan1.data.id);
    }
    if (cascadePlan2 && cascadePlan2.data && cascadePlan2.data.id) {
      CREATED_RESOURCES.plans.push(cascadePlan2.data.id);
    }

    // Verify plans exist
    if (cascadePlan1 && cascadePlan1.data && cascadePlan1.data.id) {
      await makeRequest(
        'GET',
        `${BASE_URL}/api/v1/emi/plans/${cascadePlan1.data.id}`,
        'Test 3.1: Verify plan 1 exists before cascade delete',
        200,
        null,
        ['id', 'name']
      );
    }

    if (cascadePlan2 && cascadePlan2.data && cascadePlan2.data.id) {
      await makeRequest(
        'GET',
        `${BASE_URL}/api/v1/emi/plans/${cascadePlan2.data.id}`,
        'Test 3.2: Verify plan 2 exists before cascade delete',
        200,
        null,
        ['id', 'name']
      );
    }

    // Delete the provider (should cascade delete plans)
    await makeRequest(
      'DELETE',
      `${BASE_URL}/api/v1/emi/providers/${cascadeProviderId}`,
      'Test 3.3: DELETE provider (cascade delete associated plans)',
      200,
      null,
      ['id', 'name']
    );

    // Verify plans are deleted
    if (cascadePlan1 && cascadePlan1.data && cascadePlan1.data.id) {
      await makeRequest(
        'GET',
        `${BASE_URL}/api/v1/emi/plans/${cascadePlan1.data.id}`,
        'Test 3.4: Verify plan 1 is deleted after cascade',
        404
      );
    }

    if (cascadePlan2 && cascadePlan2.data && cascadePlan2.data.id) {
      await makeRequest(
        'GET',
        `${BASE_URL}/api/v1/emi/plans/${cascadePlan2.data.id}`,
        'Test 3.5: Verify plan 2 is deleted after cascade',
        404
      );
    }
  }

  // ============================================================================
  // ADDITIONAL EMI ENDPOINTS TEST
  // ============================================================================
  log('\n========================================', 'cyan');
  log('ADDITIONAL EMI ENDPOINTS TEST', 'cyan');
  log('========================================\n', 'cyan');

  // Test 44: GET EMI configuration
  await makeRequest(
    'GET',
    `${BASE_URL}/api/v1/emi/configuration`,
    'Test 4.1: GET EMI configuration',
    200,
    null,
    ['minAmount', 'maxAmount', 'defaultDurations', 'providers']
  );

  // Test 45: GET EMI eligibility
  await makeRequest(
    'GET',
    `${BASE_URL}/api/v1/emi/eligibility/50000`,
    'Test 4.2: GET EMI eligibility for amount 50000',
    200,
    null,
    ['eligible', 'minAmount', 'maxAmount']
  );

  // Test 46: GET EMI eligibility - Below minimum
  await makeRequest(
    'GET',
    `${BASE_URL}/api/v1/emi/eligibility/1000`,
    'Test 4.3: GET EMI eligibility - Below minimum amount',
    200,
    null,
    ['eligible', 'reason']
  );

  // Test 47: GET EMI eligibility - Above maximum
  await makeRequest(
    'GET',
    `${BASE_URL}/api/v1/emi/eligibility/1000000`,
    'Test 4.4: GET EMI eligibility - Above maximum amount',
    200,
    null,
    ['eligible', 'reason']
  );

  // Test 48: GET available EMI plans
  await makeRequest(
    'GET',
    `${BASE_URL}/api/v1/emi/available/50000`,
    'Test 4.5: GET available EMI plans for amount 50000',
    200,
    null,
    ['amount', 'plans']
  );

  // Test 49: GET EMI calculate (all available plans)
  await makeRequest(
    'GET',
    `${BASE_URL}/api/v1/emi/calculate?amount=50000`,
    'Test 4.6: GET EMI calculate - All available plans',
    200,
    null,
    ['amount', 'availablePlans']
  );

  // Test 50: GET EMI calculate - Invalid amount
  await makeRequest(
    'GET',
    `${BASE_URL}/api/v1/emi/calculate?amount=-100`,
    'Test 4.7: GET EMI calculate - Invalid negative amount',
    400
  );

  // Generate summary report
  generateSummaryReport();
}

function generateSummaryReport() {
  log('\n========================================', 'cyan');
  log('TEST SUMMARY REPORT', 'cyan');
  log('========================================\n', 'cyan');

  const totalTests = TEST_RESULTS.length;
  const passedTests = TEST_RESULTS.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  log(`Total Tests: ${totalTests}`, 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`, 'cyan');

  // Count by category
  const providerTests = TEST_RESULTS.filter(r => r.testName.includes('Test 1.') || r.testName.includes('Test 3.'));
  const planTests = TEST_RESULTS.filter(r => r.testName.includes('Test 2.'));
  const additionalTests = TEST_RESULTS.filter(r => r.testName.includes('Test 4.'));

  log('\n========================================', 'cyan');
  log('TESTS BY CATEGORY', 'cyan');
  log('========================================\n', 'cyan');

  log(`EMI Providers Tests: ${providerTests.length}`, 'cyan');
  log(`  Passed: ${providerTests.filter(r => r.passed).length}`, 'green');
  log(`  Failed: ${providerTests.filter(r => !r.passed).length}`, providerTests.filter(r => !r.passed).length > 0 ? 'red' : 'green');

  log(`\nEMI Plans Tests: ${planTests.length}`, 'cyan');
  log(`  Passed: ${planTests.filter(r => r.passed).length}`, 'green');
  log(`  Failed: ${planTests.filter(r => !r.passed).length}`, planTests.filter(r => !r.passed).length > 0 ? 'red' : 'green');

  log(`\nAdditional EMI Endpoints Tests: ${additionalTests.length}`, 'cyan');
  log(`  Passed: ${additionalTests.filter(r => r.passed).length}`, 'green');
  log(`  Failed: ${additionalTests.filter(r => !r.passed).length}`, additionalTests.filter(r => !r.passed).length > 0 ? 'red' : 'green');

  log('\n========================================', 'cyan');
  log('DETAILED RESULTS', 'cyan');
  log('========================================\n', 'cyan');

  TEST_RESULTS.forEach((result, index) => {
    log(`\n${index + 1}. ${result.testName}`, 'cyan');
    log(`   Status: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`, result.passed ? 'green' : 'red');

    if (result.actualStatus) {
      const statusMatch = result.actualStatus === result.expectedStatus;
      log(`   HTTP Status: ${result.actualStatus} (expected: ${result.expectedStatus})`, statusMatch ? 'green' : 'yellow');
    }

    if (result.error) {
      log(`   Error: ${result.error}`, 'red');
    }

    if (result.response && !result.passed) {
      log(`   Response: ${JSON.stringify(result.response)}`, 'blue');
    }
  });

  // Save results to JSON file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `emi-crud-test-results-${timestamp}.json`;

  fs.writeFileSync(filename, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTests,
    passedTests,
    failedTests,
    successRate: ((passedTests / totalTests) * 100).toFixed(2),
    results: TEST_RESULTS
  }, null, 2));

  log(`\n\nDetailed results saved to: ${filename}`, 'green');

  // Overall assessment
  log('\n========================================', 'cyan');
  log('OVERALL ASSESSMENT', 'cyan');
  log('========================================\n', 'cyan');

  if (failedTests === 0) {
    log('✓ ALL TESTS PASSED', 'green');
    log('All EMI CRUD operations are working correctly.', 'green');
    log('EMI Providers: GET, POST, PUT, DELETE - All operations verified', 'green');
    log('EMI Plans: GET, POST, PUT, DELETE - All operations verified', 'green');
    log('Cascade Delete: Deleting provider deletes associated plans - Verified', 'green');
    log('Validation: Invalid data submissions properly rejected - Verified', 'green');
    log('Error Handling: Appropriate error responses for invalid operations - Verified', 'green');
  } else {
    log(`✗ ${failedTests} TEST(S) FAILED`, 'red');
    log('Please review the failed tests above for details.', 'yellow');
    
    // List failed test categories
    const failedCategories = [];
    if (providerTests.some(r => !r.passed)) failedCategories.push('EMI Providers');
    if (planTests.some(r => !r.passed)) failedCategories.push('EMI Plans');
    if (additionalTests.some(r => !r.passed)) failedCategories.push('Additional Endpoints');
    
    if (failedCategories.length > 0) {
      log(`\nFailed Categories: ${failedCategories.join(', ')}`, 'yellow');
    }
  }

  log('\n========================================\n', 'cyan');
}

// Run the tests
runTests().catch(error => {
  log(`\nTest suite failed with error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
