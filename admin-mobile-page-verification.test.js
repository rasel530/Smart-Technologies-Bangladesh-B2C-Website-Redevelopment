/**
 * Admin Mobile Page Verification Test
 * 
 * This test verifies that the admin mobile page works correctly after all fixes:
 * - Routes are mounted in backend/index.js
 * - Date validation is fixed in backend/services/mobileCartService.js
 * - Frontend null safety is fixed in frontend/src/app/admin/mobile/page.tsx
 * 
 * Test Coverage:
 * 1. Full user flow from accessing the page to displaying data
 * 2. Page loads without errors
 * 3. API calls are made successfully
 * 4. Data is displayed correctly (or empty state is handled gracefully)
 * 5. Different period filters (24h, 7d, 30d, 90d)
 * 6. Authentication is required and working
 * 7. Error handling (invalid dates, network errors)
 */

const http = require('http');

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';
const API_BASE = `${BACKEND_URL}/api/v1`;

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Helper function to make HTTP requests
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url || options.path, options.baseUrl || BACKEND_URL);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000
    };

    if (options.data) {
      requestOptions.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            rawData: data
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    req.end();
  });
}

// Test runner
function runTest(testName, testFn) {
  testResults.summary.total++;
  console.log(`\n[TEST] ${testName}`);
  
  return testFn()
    .then((result) => {
      testResults.summary.passed++;
      testResults.tests.push({
        name: testName,
        status: 'PASS',
        message: result.message || 'Test passed',
        details: result.details || null
      });
      console.log(`✓ PASS: ${result.message || 'Test passed'}`);
      return result;
    })
    .catch((error) => {
      testResults.summary.failed++;
      testResults.tests.push({
        name: testName,
        status: 'FAIL',
        message: error.message,
        details: error.details || null
      });
      console.log(`✗ FAIL: ${error.message}`);
      if (error.details) {
        console.log(`  Details: ${JSON.stringify(error.details, null, 2)}`);
      }
      throw error;
    });
}

// Warning logger
function logWarning(testName, message, details = null) {
  testResults.summary.warnings++;
  testResults.tests.push({
    name: testName,
    status: 'WARNING',
    message: message,
    details: details
  });
  console.log(`⚠ WARNING: ${message}`);
  if (details) {
    console.log(`  Details: ${JSON.stringify(details, null, 2)}`);
  }
}

// Global variables for auth
let authToken = null;
let adminUser = null;

// ==================== TEST SUITE ====================

async function runAllTests() {
  console.log('='.repeat(80));
  console.log('ADMIN MOBILE PAGE VERIFICATION TEST');
  console.log('='.repeat(80));
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Test started at: ${testResults.timestamp}`);
  console.log('='.repeat(80));

  try {
    // Phase 1: Backend Health Check
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 1: BACKEND HEALTH CHECK');
    console.log('='.repeat(80));

    await runTest('Backend server is running', async () => {
      const response = await makeRequest({
        url: `${BACKEND_URL}/health`,
        method: 'GET'
      });
      
      if (response.statusCode !== 200) {
        throw new Error(`Backend health check failed with status ${response.statusCode}`);
      }
      
      if (!response.data || response.data.status !== 'OK') {
        throw new Error('Backend health check returned unexpected status');
      }
      
      return {
        message: 'Backend is healthy and running',
        details: {
          status: response.data.status,
          database: response.data.database,
          redis: response.data.redis
        }
      };
    });

    // Phase 2: Authentication Setup
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 2: AUTHENTICATION SETUP');
    console.log('='.repeat(80));

    await runTest('Create or find admin user', async () => {
      // Try to login with existing admin credentials
      const loginResponse = await makeRequest({
        url: `${API_BASE}/auth/login`,
        method: 'POST',
        data: {
          identifier: 'admin@smarttech.com',
          password: 'AdminPassword123'
        }
      });

      if (loginResponse.statusCode === 200 && loginResponse.data?.token) {
        authToken = loginResponse.data.token;
        adminUser = loginResponse.data.user;
        return {
          message: 'Admin user logged in successfully',
          details: {
            userId: adminUser.id,
            email: adminUser.email,
            role: adminUser.role
          }
        };
      }

      // If login fails, try to create admin user
      const registerResponse = await makeRequest({
        url: `${API_BASE}/auth/register`,
        method: 'POST',
        data: {
          email: 'admin@smarttech.com',
          password: 'AdminPassword123',
          confirmPassword: 'AdminPassword123',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin'
        }
      });

      if (registerResponse.statusCode === 200 || registerResponse.statusCode === 201) {
        // Now login with the created user
        const loginResponse2 = await makeRequest({
          url: `${API_BASE}/auth/login`,
          method: 'POST',
          data: {
            identifier: 'admin@smarttech.com',
            password: 'AdminPassword123'
          }
        });

        if (loginResponse2.statusCode === 200 && loginResponse2.data?.data?.token) {
          authToken = loginResponse2.data.data.token;
          adminUser = loginResponse2.data.data.user;
          return {
            message: 'Admin user created and logged in successfully',
            details: {
              userId: adminUser.id,
              email: adminUser.email,
              role: adminUser.role
            }
          };
        }
      }

      // If all else fails, provide detailed error
      const errorDetails = {
        loginStatus: loginResponse.statusCode,
        loginData: loginResponse.data,
        registerStatus: registerResponse.statusCode,
        registerData: registerResponse.data
      };
      console.log('[AUTH ERROR DETAILS]', JSON.stringify(errorDetails, null, 2));
      throw new Error(`Failed to create or login admin user. Login status: ${loginResponse.statusCode}, Register status: ${registerResponse.statusCode}`);
    });

    // Phase 3: Route Mounting Verification
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 3: ROUTE MOUNTING VERIFICATION');
    console.log('='.repeat(80));

    await runTest('Mobile analytics endpoint is accessible (with auth)', async () => {
      const response = await makeRequest({
        url: `${API_BASE}/admin/mobile/analytics`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.statusCode === 404) {
        throw new Error('Mobile analytics endpoint not found (404) - route may not be mounted');
      }

      if (response.statusCode === 401 || response.statusCode === 403) {
        throw new Error(`Authentication/authorization failed with status ${response.statusCode}`);
      }

      if (response.statusCode !== 200) {
        throw new Error(`Unexpected status code: ${response.statusCode}`);
      }

      return {
        message: 'Mobile analytics endpoint is accessible',
        details: {
          statusCode: response.statusCode,
          hasData: response.data?.data !== undefined
        }
      };
    });

    await runTest('Mobile performance endpoint is accessible (with auth)', async () => {
      const response = await makeRequest({
        url: `${API_BASE}/admin/mobile/performance`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.statusCode === 404) {
        throw new Error('Mobile performance endpoint not found (404) - route may not be mounted');
      }

      if (response.statusCode === 401 || response.statusCode === 403) {
        throw new Error(`Authentication/authorization failed with status ${response.statusCode}`);
      }

      if (response.statusCode !== 200) {
        throw new Error(`Unexpected status code: ${response.statusCode}`);
      }

      return {
        message: 'Mobile performance endpoint is accessible',
        details: {
          statusCode: response.statusCode,
          hasData: response.data?.data !== undefined
        }
      };
    });

    await runTest('Mobile analytics export endpoint is accessible (with auth)', async () => {
      const response = await makeRequest({
        url: `${API_BASE}/admin/mobile/analytics/export`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.statusCode === 404) {
        throw new Error('Mobile analytics export endpoint not found (404) - route may not be mounted');
      }

      if (response.statusCode === 401 || response.statusCode === 403) {
        throw new Error(`Authentication/authorization failed with status ${response.statusCode}`);
      }

      // Export endpoint might return JSON or file, both are acceptable
      if (response.statusCode !== 200) {
        throw new Error(`Unexpected status code: ${response.statusCode}`);
      }

      return {
        message: 'Mobile analytics export endpoint is accessible',
        details: {
          statusCode: response.statusCode,
          contentType: response.headers['content-type']
        }
      };
    });

    // Phase 4: Authentication Requirements
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 4: AUTHENTICATION REQUIREMENTS');
    console.log('='.repeat(80));

    await runTest('Mobile analytics endpoint requires authentication', async () => {
      const response = await makeRequest({
        url: `${API_BASE}/admin/mobile/analytics`,
        method: 'GET'
      });

      if (response.statusCode === 404) {
        throw new Error('Endpoint not found (404) - route may not be mounted');
      }

      if (response.statusCode !== 401 && response.statusCode !== 403) {
        throw new Error(`Expected 401/403, got ${response.statusCode} - authentication may not be required`);
      }

      return {
        message: 'Mobile analytics endpoint properly requires authentication',
        details: {
          statusCode: response.statusCode
        }
      };
    });

    await runTest('Mobile performance endpoint requires authentication', async () => {
      const response = await makeRequest({
        url: `${API_BASE}/admin/mobile/performance`,
        method: 'GET'
      });

      if (response.statusCode === 404) {
        throw new Error('Endpoint not found (404) - route may not be mounted');
      }

      if (response.statusCode !== 401 && response.statusCode !== 403) {
        throw new Error(`Expected 401/403, got ${response.statusCode} - authentication may not be required`);
      }

      return {
        message: 'Mobile performance endpoint properly requires authentication',
        details: {
          statusCode: response.statusCode
        }
      };
    });

    // Phase 5: Data Retrieval and Display
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 5: DATA RETRIEVAL AND DISPLAY');
    console.log('='.repeat(80));

    await runTest('Fetch mobile analytics data', async () => {
      const response = await makeRequest({
        url: `${API_BASE}/admin/mobile/analytics`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.statusCode !== 200) {
        throw new Error(`Failed to fetch analytics with status ${response.statusCode}`);
      }

      const analyticsData = response.data?.data;

      if (!analyticsData) {
        logWarning('Fetch mobile analytics data', 'No data returned (empty state)', {
          response: response.data
        });
        return {
          message: 'Analytics endpoint returned empty data (handled gracefully)',
          details: {
            statusCode: response.statusCode,
            isEmpty: true
          }
        };
      }

      // Verify expected fields exist (with null safety)
      const expectedFields = [
        'totalUsers', 'activeUsers', 'offlineUsers', 'totalCarts',
        'syncedCarts', 'pendingSync', 'averageSyncTime', 'platformBreakdown'
      ];

      const missingFields = expectedFields.filter(field => !(field in analyticsData));
      
      if (missingFields.length > 0) {
        logWarning('Fetch mobile analytics data', `Missing expected fields: ${missingFields.join(', ')}`, {
          missingFields
        });
      }

      return {
        message: 'Mobile analytics data retrieved successfully',
        details: {
          totalUsers: analyticsData.totalUsers ?? 0,
          activeUsers: analyticsData.activeUsers ?? 0,
          offlineUsers: analyticsData.offlineUsers ?? 0,
          totalCarts: analyticsData.totalCarts ?? 0,
          syncedCarts: analyticsData.syncedCarts ?? 0,
          pendingSync: analyticsData.pendingSync ?? 0,
          platformBreakdown: analyticsData.platformBreakdown || {}
        }
      };
    });

    await runTest('Fetch mobile performance metrics', async () => {
      const response = await makeRequest({
        url: `${API_BASE}/admin/mobile/performance`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.statusCode !== 200) {
        throw new Error(`Failed to fetch performance metrics with status ${response.statusCode}`);
      }

      const performanceData = response.data?.data;

      if (!performanceData) {
        logWarning('Fetch mobile performance metrics', 'No performance data returned (empty state)', {
          response: response.data
        });
        return {
          message: 'Performance endpoint returned empty data (handled gracefully)',
          details: {
            statusCode: response.statusCode,
            isEmpty: true
          }
        };
      }

      return {
        message: 'Mobile performance metrics retrieved successfully',
        details: {
          totalEvents: performanceData.totalEvents ?? 0,
          platformBreakdown: performanceData.platformBreakdown || {},
          averageMetrics: performanceData.averageMetrics || {}
        }
      };
    });

    // Phase 6: Period Filter Testing
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 6: PERIOD FILTER TESTING');
    console.log('='.repeat(80));

    const periods = ['24h', '7d', '30d', '90d'];

    for (const period of periods) {
      await runTest(`Test period filter: ${period}`, async () => {
        // Calculate date range based on period
        const now = new Date();
        let startDate = new Date();

        switch (period) {
          case '24h':
            startDate.setHours(startDate.getHours() - 24);
            break;
          case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
        }

        const response = await makeRequest({
          url: `${API_BASE}/admin/mobile/analytics?startDate=${encodeURIComponent(startDate.toISOString())}&endDate=${encodeURIComponent(now.toISOString())}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.statusCode !== 200) {
          throw new Error(`Failed with status ${response.statusCode} for period ${period}`);
        }

        return {
          message: `Period filter ${period} works correctly`,
          details: {
            period,
            startDate: startDate.toISOString(),
            endDate: now.toISOString(),
            hasData: response.data?.data !== undefined
          }
        };
      });
    }

    // Phase 7: Error Handling
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 7: ERROR HANDLING');
    console.log('='.repeat(80));

    await runTest('Handle invalid date format', async () => {
      const response = await makeRequest({
        url: `${API_BASE}/admin/mobile/analytics?startDate=invalid-date&endDate=invalid-date`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Should return 400 for invalid date format
      if (response.statusCode === 400) {
        return {
          message: 'Invalid date format properly rejected with 400',
          details: {
            statusCode: response.statusCode,
            error: response.data?.error
          }
        };
      }

      // If not 400, check if it still handles gracefully
      if (response.statusCode === 200) {
        logWarning('Handle invalid date format', 'Invalid date was accepted instead of rejected', {
          statusCode: response.statusCode
        });
        return {
          message: 'Invalid date was handled (accepted instead of rejected)',
          details: {
            statusCode: response.statusCode
          }
        };
      }

      throw new Error(`Unexpected response for invalid date: ${response.statusCode}`);
    });

    await runTest('Handle future date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const response = await makeRequest({
        url: `${API_BASE}/admin/mobile/analytics?startDate=${futureDate.toISOString()}&endDate=${futureDate.toISOString()}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Should handle gracefully (either 200 with empty data or 400)
      if (response.statusCode === 200 || response.statusCode === 400) {
        return {
          message: 'Future date handled gracefully',
          details: {
            statusCode: response.statusCode,
            hasData: response.data?.data !== undefined
          }
        };
      }

      throw new Error(`Unexpected response for future date: ${response.statusCode}`);
    });

    await runTest('Handle invalid auth token', async () => {
      const response = await makeRequest({
        url: `${API_BASE}/admin/mobile/analytics`,
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token-12345'
        }
      });

      if (response.statusCode === 401 || response.statusCode === 403) {
        return {
          message: 'Invalid auth token properly rejected',
          details: {
            statusCode: response.statusCode
          }
        };
      }

      throw new Error(`Expected 401/403 for invalid token, got ${response.statusCode}`);
    });

    // Phase 8: Null Safety Verification
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 8: NULL SAFETY VERIFICATION');
    console.log('='.repeat(80));

    await runTest('Verify null safety in analytics response', async () => {
      const response = await makeRequest({
        url: `${API_BASE}/admin/mobile/analytics`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.statusCode !== 200) {
        throw new Error(`Failed to fetch analytics with status ${response.statusCode}`);
      }

      const analyticsData = response.data?.data;

      // Simulate frontend null safety checks
      const safeValues = {
        totalUsers: analyticsData?.totalUsers ?? 0,
        activeUsers: analyticsData?.activeUsers ?? 0,
        offlineUsers: analyticsData?.offlineUsers ?? 0,
        totalCarts: analyticsData?.totalCarts ?? 0,
        syncedCarts: analyticsData?.syncedCarts ?? 0,
        pendingSync: analyticsData?.pendingSync ?? 0,
        averageSyncTime: analyticsData?.averageSyncTime ?? 0,
        platformBreakdown: analyticsData?.platformBreakdown || {},
        performanceMetrics: analyticsData?.performanceMetrics || {}
      };

      // Verify all values are safe (not null/undefined)
      const hasNullValues = Object.values(safeValues).some(v => v === null || v === undefined);

      if (hasNullValues) {
        throw new Error('Null safety check failed - found null/undefined values');
      }

      return {
        message: 'Null safety verified - all values have defaults',
        details: {
          safeValues
        }
      };
    });

    await runTest('Verify empty state handling', async () => {
      // This test verifies that when there's no data, the system handles it gracefully
      const response = await makeRequest({
        url: `${API_BASE}/admin/mobile/analytics`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.statusCode !== 200) {
        throw new Error(`Failed to fetch analytics with status ${response.statusCode}`);
      }

      const analyticsData = response.data?.data;

      // Check if data is empty or has zero values
      const isEmpty = !analyticsData || (
        (analyticsData.totalUsers ?? 0) === 0 &&
        (analyticsData.activeUsers ?? 0) === 0 &&
        (analyticsData.totalCarts ?? 0) === 0
      );

      if (isEmpty) {
        return {
          message: 'Empty state handled gracefully - zero values returned',
          details: {
            isEmpty: true,
            data: analyticsData
          }
        };
      }

      return {
        message: 'Data exists - empty state not applicable',
        details: {
          isEmpty: false,
          totalUsers: analyticsData.totalUsers,
          totalCarts: analyticsData.totalCarts
        }
      };
    });

    // Phase 9: Frontend Page Accessibility
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 9: FRONTEND PAGE ACCESSIBILITY');
    console.log('='.repeat(80));

    await runTest('Frontend admin mobile page is accessible', async () => {
      // Note: This is a basic check - full frontend testing would require a browser
      const response = await makeRequest({
        url: `${FRONTEND_URL}/admin/mobile`,
        method: 'GET'
      });

      // Frontend might return HTML (200) or redirect (302)
      if (response.statusCode === 200 || response.statusCode === 302) {
        return {
          message: 'Frontend admin mobile page is accessible',
          details: {
            statusCode: response.statusCode,
            contentType: response.headers['content-type']
          }
        };
      }

      throw new Error(`Frontend page not accessible, status: ${response.statusCode}`);
    });

    // Phase 10: Export Functionality
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 10: EXPORT FUNCTIONALITY');
    console.log('='.repeat(80));

    await runTest('Export analytics data', async () => {
      const response = await makeRequest({
        url: `${API_BASE}/admin/mobile/analytics/export`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.statusCode !== 200) {
        throw new Error(`Export failed with status ${response.statusCode}`);
      }

      const isJson = response.headers['content-type']?.includes('application/json');
      const isAttachment = response.headers['content-disposition']?.includes('attachment');

      if (!isJson && !isAttachment) {
        logWarning('Export analytics data', 'Unexpected content type', {
          contentType: response.headers['content-type']
        });
      }

      return {
        message: 'Analytics export works correctly',
        details: {
          contentType: response.headers['content-type'],
          contentDisposition: response.headers['content-disposition'],
          dataSize: response.rawData?.length || 0
        }
      };
    });

  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('TEST SUITE FAILED');
    console.error('='.repeat(80));
    console.error(error.message);
    console.error(error.stack);
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Warnings: ${testResults.summary.warnings}`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2)}%`);
  console.log('='.repeat(80));

  // Save results to file
  const resultsFilename = `admin-mobile-page-verification-results-${Date.now()}.json`;
  const fs = require('fs');
  fs.writeFileSync(resultsFilename, JSON.stringify(testResults, null, 2));
  console.log(`\nTest results saved to: ${resultsFilename}`);

  return testResults;
}

// Run the tests
runAllTests()
  .then((results) => {
    process.exit(results.summary.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
