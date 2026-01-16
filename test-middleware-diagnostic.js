#!/usr/bin/env node

/**
 * Middleware Diagnostic Test
 * 
 * This script tests the middleware behavior in detail to diagnose
 * why unauthenticated users are not being redirected to login.
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

/**
 * Make an HTTP request and return detailed response info
 */
function makeDetailedRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    console.log(`\n--- Making Request ---`);
    console.log(`URL: ${url}`);
    console.log(`Method: ${requestOptions.method}`);
    console.log(`Path: ${requestOptions.path}`);

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: data.substring(0, 500), // First 500 chars
          location: res.headers.location,
          contentType: res.headers['content-type'],
          setCookie: res.headers['set-cookie']
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Test multiple endpoints to understand middleware behavior
 */
async function runDiagnosticTests() {
  console.log('========================================');
  console.log('MIDDLEWARE DIAGNOSTIC TEST');
  console.log('========================================');
  console.log(`Target: ${BASE_URL}\n`);

  const tests = [
    {
      name: 'Test 1: Public Route (/)',
      url: `${BASE_URL}/`,
      expectedBehavior: 'Should return 200 (public route)'
    },
    {
      name: 'Test 2: Login Page (/login)',
      url: `${BASE_URL}/login`,
      expectedBehavior: 'Should return 200 (public route)'
    },
    {
      name: 'Test 3: Admin Page (/admin)',
      url: `${BASE_URL}/admin`,
      expectedBehavior: 'Should redirect to /login (protected route)'
    },
    {
      name: 'Test 4: Account Page (/account)',
      url: `${BASE_URL}/account`,
      expectedBehavior: 'Should redirect to /login (protected route)'
    },
    {
      name: 'Test 5: Dashboard (/dashboard)',
      url: `${BASE_URL}/dashboard`,
      expectedBehavior: 'Should redirect to /login (protected route)'
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(test.name);
    console.log('='.repeat(60));
    console.log(`Expected: ${test.expectedBehavior}`);

    try {
      const response = await makeDetailedRequest(test.url, {
        redirect: 'manual' // Don't follow redirects automatically
      });

      console.log(`\n--- Response ---`);
      console.log(`Status Code: ${response.statusCode}`);
      console.log(`Status Message: ${response.statusMessage}`);
      console.log(`Location: ${response.location || 'No redirect'}`);
      console.log(`Content-Type: ${response.contentType || 'Not specified'}`);
      console.log(`Set-Cookie: ${response.setCookie ? 'Present' : 'None'}`);
      
      if (response.body) {
        console.log(`\nBody Preview (first 500 chars):`);
        console.log(response.body);
      }

      // Analyze the response
      const isRedirect = response.statusCode === 307 || response.statusCode === 302;
      const isSuccess = response.statusCode === 200;

      let analysis = '';
      if (test.url.includes('/admin') || test.url.includes('/account') || test.url.includes('/dashboard')) {
        // Protected route
        if (isRedirect && response.location && response.location.includes('/login')) {
          analysis = '✓ CORRECT: Redirected to login as expected';
        } else if (isSuccess) {
          analysis = '✗ ISSUE: Protected route returned 200 instead of redirecting to login';
        } else {
          analysis = `? UNEXPECTED: Status ${response.statusCode}`;
        }
      } else {
        // Public route
        if (isSuccess) {
          analysis = '✓ CORRECT: Public route accessible';
        } else {
          analysis = `? UNEXPECTED: Status ${response.statusCode}`;
        }
      }

      console.log(`\n--- Analysis ---`);
      console.log(analysis);

      results.push({
        name: test.name,
        url: test.url,
        statusCode: response.statusCode,
        location: response.location,
        analysis: analysis
      });

    } catch (error) {
      console.log(`\n--- Error ---`);
      console.log(`✗ Request failed: ${error.message}`);
      results.push({
        name: test.name,
        url: test.url,
        error: error.message,
        analysis: '✗ ERROR: Request failed'
      });
    }

    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Print summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log('='.repeat(60));

  let issuesFound = 0;
  results.forEach(result => {
    console.log(`\n${result.name}`);
    console.log(`  URL: ${result.url}`);
    console.log(`  Status: ${result.statusCode || 'ERROR'}`);
    console.log(`  Location: ${result.location || 'None'}`);
    console.log(`  ${result.analysis}`);
    
    if (result.analysis.includes('✗') || result.analysis.includes('ISSUE')) {
      issuesFound++;
    }
  });

  console.log(`\n${'='.repeat(60)}`);
  if (issuesFound === 0) {
    console.log('✓ All tests passed! Middleware is working correctly.');
  } else {
    console.log(`✗ ${issuesFound} issue(s) found. Middleware may not be working as expected.`);
    console.log('\nPossible issues:');
    console.log('1. Middleware file not being loaded');
    console.log('2. Middleware configuration incorrect');
    console.log('3. NEXTAUTH_SECRET not set properly');
    console.log('4. Standalone build not including middleware correctly');
  }
  console.log('='.repeat(60));
}

// Run the diagnostic tests
runDiagnosticTests().catch(error => {
  console.error('Error running diagnostic tests:', error);
  process.exit(1);
});
