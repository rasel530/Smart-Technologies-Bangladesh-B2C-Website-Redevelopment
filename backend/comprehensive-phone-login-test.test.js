/**
 * Comprehensive Phone Number Login Format Test
 * 
 * This script tests all common Bangladesh phone number formats for login
 * to ensure 100% compatibility with the authentication system.
 * 
 * Test User:
 * - Phone: +8801700000000 (stored in international format)
 * - Password: TestPassword123!
 */

const http = require('http');

// Test configuration
const config = {
  host: 'localhost',
  port: 3001,
  password: 'TestPassword123!',
  testUserPhone: '+8801700000000' // The phone as stored in database
};

// All phone formats to test
const phoneFormats = [
  {
    name: 'International Format (with +)',
    format: '+8801700000000',
    description: 'Standard international format with country code prefix',
    expectedNormalized: '+8801700000000'
  },
  {
    name: 'Local Format (without country code)',
    format: '01700000000',
    description: 'Standard local Bangladesh format',
    expectedNormalized: '+8801700000000'
  },
  {
    name: 'Local Format with Dashes',
    format: '017-000-00000',
    description: 'Local format with dash separators',
    expectedNormalized: '+8801700000000'
  },
  {
    name: 'Local Format with Spaces',
    format: '017 000 00000',
    description: 'Local format with space separators',
    expectedNormalized: '+8801700000000'
  },
  {
    name: 'Local Format with Mixed Separators',
    format: '017-000 00000',
    description: 'Local format with mixed dash and space separators',
    expectedNormalized: '+8801700000000'
  },
  {
    name: 'Country Code without +',
    format: '8801700000000',
    description: 'Country code without + prefix',
    expectedNormalized: '+8801700000000'
  },
  {
    name: 'International Format with Dashes',
    format: '+880-170-000-0000',
    description: 'International format with dash separators',
    expectedNormalized: '+8801700000000'
  },
  {
    name: 'International Format with Spaces',
    format: '+880 170 000 0000',
    description: 'International format with space separators',
    expectedNormalized: '+8801700000000'
  },
  {
    name: 'Local Format with Parentheses',
    format: '(017) 000-00000',
    description: 'Local format with parentheses around area code',
    expectedNormalized: '+8801700000000'
  },
  {
    name: 'International Format with Parentheses',
    format: '+880 (170) 000-0000',
    description: 'International format with parentheses',
    expectedNormalized: '+8801700000000'
  }
];

// Test results storage
const testResults = {
  total: phoneFormats.length,
  passed: 0,
  failed: 0,
  results: [],
  startTime: new Date().toISOString(),
  endTime: null,
  duration: null
};

/**
 * Make HTTP POST request to login endpoint
 */
function makeLoginRequest(phone) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      identifier: phone,
      password: config.password,
      rememberMe: false
    });

    const options = {
      hostname: config.host,
      port: config.port,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test a single phone format
 */
async function testPhoneFormat(formatInfo) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${formatInfo.name}`);
  console.log(`Format: ${formatInfo.format}`);
  console.log(`Description: ${formatInfo.description}`);
  console.log(`Expected Normalized: ${formatInfo.expectedNormalized}`);
  console.log(`${'='.repeat(80)}`);

  const testResult = {
    ...formatInfo,
    status: 'pending',
    statusCode: null,
    response: null,
    error: null,
    normalizedPhone: null,
    userFound: false,
    tokenValid: false,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await makeLoginRequest(formatInfo.format);

    testResult.statusCode = response.statusCode;
    testResult.response = response.body;

    console.log(`\nHTTP Status: ${response.statusCode}`);
    console.log(`Response Headers:`, JSON.stringify(response.headers, null, 2));

    if (response.body) {
      console.log(`\nResponse Body:`, JSON.stringify(response.body, null, 2));

      // Check if login was successful
      if (response.statusCode === 200 && response.body && response.body.user) {
        testResult.status = 'passed';
        testResult.userFound = true;
        testResult.tokenValid = !!response.body.token;
        testResult.normalizedPhone = response.body.user.phone;

        console.log(`\n✅ LOGIN SUCCESSFUL`);
        console.log(`User ID: ${response.body.user.id}`);
        console.log(`User Phone: ${response.body.user.phone}`);
        console.log(`User Name: ${response.body.user.firstName} ${response.body.user.lastName}`);
        console.log(`Token Generated: ${testResult.tokenValid ? 'Yes' : 'No'}`);
        console.log(`Login Type: ${response.body.loginType}`);

        // Verify normalized phone matches expected
        if (response.body.user.phone === formatInfo.expectedNormalized) {
          console.log(`✅ Normalization Correct: ${response.body.user.phone} === ${formatInfo.expectedNormalized}`);
        } else {
          console.log(`⚠️  Normalization Warning: ${response.body.user.phone} !== ${formatInfo.expectedNormalized}`);
        }
      } else if (response.statusCode === 401) {
        testResult.status = 'failed';
        testResult.error = 'Invalid credentials';
        console.log(`\n❌ LOGIN FAILED: Invalid credentials`);
        console.log(`Error: ${response.body.message || response.body.error}`);
      } else if (response.statusCode === 400) {
        testResult.status = 'failed';
        testResult.error = 'Validation error';
        console.log(`\n❌ LOGIN FAILED: Validation error`);
        console.log(`Error: ${response.body.message || response.body.error}`);
        console.log(`Code: ${response.body.code}`);
      } else {
        testResult.status = 'failed';
        testResult.error = `Unexpected status code: ${response.statusCode}`;
        console.log(`\n❌ LOGIN FAILED: Unexpected status code ${response.statusCode}`);
        console.log(`Error: ${response.body.message || response.body.error}`);
      }
    } else {
      testResult.status = 'failed';
      testResult.error = 'No response body';
      console.log(`\n❌ LOGIN FAILED: No response body received`);
    }
  } catch (error) {
    testResult.status = 'failed';
    testResult.error = error.message;
    console.log(`\n❌ LOGIN FAILED: Request error`);
    console.log(`Error: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }

  return testResult;
}

/**
 * Run all phone format tests
 */
async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE PHONE NUMBER LOGIN FORMAT TEST');
  console.log('='.repeat(80));
  console.log(`Test User Phone: ${config.testUserPhone}`);
  console.log(`Test Password: ${config.password}`);
  console.log(`Test Endpoint: http://${config.host}:${config.port}/api/v1/auth/login`);
  console.log(`Total Formats to Test: ${phoneFormats.length}`);
  console.log(`Started At: ${testResults.startTime}`);
  console.log('='.repeat(80));

  for (const formatInfo of phoneFormats) {
    const result = await testPhoneFormat(formatInfo);
    testResults.results.push(result);

    if (result.status === 'passed') {
      testResults.passed++;
    } else {
      testResults.failed++;
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  testResults.endTime = new Date().toISOString();
  testResults.duration = new Date(testResults.endTime) - new Date(testResults.startTime);

  printSummary();
  saveResultsToFile();
}

/**
 * Print test summary
 */
function printSummary() {
  console.log('\n\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} (${((testResults.passed / testResults.total) * 100).toFixed(2)}%)`);
  console.log(`Failed: ${testResults.failed} (${((testResults.failed / testResults.total) * 100).toFixed(2)}%)`);
  console.log(`Duration: ${testResults.duration}ms`);
  console.log(`Started At: ${testResults.startTime}`);
  console.log(`Ended At: ${testResults.endTime}`);
  console.log('='.repeat(80));

  console.log('\n\nPASSED TESTS:');
  testResults.results.filter(r => r.status === 'passed').forEach(result => {
    console.log(`✅ ${result.name}`);
    console.log(`   Format: ${result.format}`);
    console.log(`   Normalized: ${result.normalizedPhone}`);
  });

  console.log('\n\nFAILED TESTS:');
  testResults.results.filter(r => r.status === 'failed').forEach(result => {
    console.log(`❌ ${result.name}`);
    console.log(`   Format: ${result.format}`);
    console.log(`   Error: ${result.error}`);
    console.log(`   Status Code: ${result.statusCode}`);
  });

  console.log('\n\n' + '='.repeat(80));
  if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! 100% SUCCESS RATE!');
  } else {
    console.log(`⚠️  ${testResults.failed} TEST(S) FAILED - NEEDS ATTENTION`);
  }
  console.log('='.repeat(80));
}

/**
 * Save test results to JSON file
 */
function saveResultsToFile() {
  const fs = require('fs');
  const filename = `phone-login-test-results-${Date.now()}.json`;

  try {
    fs.writeFileSync(filename, JSON.stringify(testResults, null, 2));
    console.log(`\n\n📄 Test results saved to: ${filename}`);
  } catch (error) {
    console.error(`\n\n❌ Failed to save results to file: ${error.message}`);
  }
}

/**
 * Generate detailed test report
 */
function generateDetailedReport() {
  const report = {
    title: 'COMPREHENSIVE PHONE NUMBER LOGIN FORMAT TEST REPORT',
    generatedAt: new Date().toISOString(),
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%',
      duration: testResults.duration + 'ms'
    },
    testConfiguration: config,
    phoneNormalizationLogic: {
      service: 'phoneValidationService',
      location: 'backend/services/phoneValidationService.js',
      method: 'validateForUseCase()',
      normalizationRules: [
        'Removes all non-digit characters except +',
        'Converts local format (01XXXXXXXXX) to international (+8801XXXXXXXXX)',
        'Converts country code (8801XXXXXXXXX) to international (+8801XXXXXXXXX)',
        'Keeps international format (+8801XXXXXXXXX) unchanged'
      ]
    },
    detailedResults: testResults.results,
    conclusions: [],
    recommendations: []
  };

  // Add conclusions based on results
  if (testResults.failed === 0) {
    report.conclusions.push('✅ All phone number formats work correctly');
    report.conclusions.push('✅ Phone normalization logic is functioning as expected');
    report.conclusions.push('✅ Authentication system accepts all common Bangladesh phone formats');
    report.recommendations.push('No changes needed - system is fully compatible');
  } else {
    report.conclusions.push(`❌ ${testResults.failed} phone format(s) failed`);
    report.failedFormats = testResults.results.filter(r => r.status === 'failed').map(r => r.format);
    report.recommendations.push('Review phone normalization logic for failed formats');
    report.recommendations.push('Consider adding more robust format handling');
  }

  return report;
}

// Run tests
runAllTests().then(() => {
  const report = generateDetailedReport();
  const fs = require('fs');
  
  // Save detailed report
  const reportFilename = 'PHONE_NUMBER_LOGIN_TEST_REPORT.md';
  let reportContent = `# ${report.title}\n\n`;
  reportContent += `**Generated At:** ${report.generatedAt}\n\n`;
  reportContent += `## Summary\n\n`;
  reportContent += `- **Total Tests:** ${report.summary.total}\n`;
  reportContent += `- **Passed:** ${report.summary.passed}\n`;
  reportContent += `- **Failed:** ${report.summary.failed}\n`;
  reportContent += `- **Success Rate:** ${report.summary.successRate}\n`;
  reportContent += `- **Duration:** ${report.summary.duration}\n\n`;
  
  reportContent += `## Test Configuration\n\n`;
  reportContent += `- **Host:** ${config.host}\n`;
  reportContent += `- **Port:** ${config.port}\n`;
  reportContent += `- **Test User Phone:** ${config.testUserPhone}\n\n`;
  
  reportContent += `## Phone Normalization Logic\n\n`;
  reportContent += `**Service:** ${report.phoneNormalizationLogic.service}\n`;
  reportContent += `**Location:** ${report.phoneNormalizationLogic.location}\n`;
  reportContent += `**Method:** ${report.phoneNormalizationLogic.method}\n\n`;
  reportContent += `**Normalization Rules:**\n`;
  report.phoneNormalizationLogic.normalizationRules.forEach(rule => {
    reportContent += `- ${rule}\n`;
  });
  
  reportContent += `\n## Detailed Results\n\n`;
  report.detailedResults.forEach(result => {
    const emoji = result.status === 'passed' ? '✅' : '❌';
    reportContent += `### ${emoji} ${result.name}\n\n`;
    reportContent += `- **Format:** ${result.format}\n`;
    reportContent += `- **Description:** ${result.description}\n`;
    reportContent += `- **Expected Normalized:** ${result.expectedNormalized}\n`;
    reportContent += `- **Status:** ${result.status.toUpperCase()}\n`;
    reportContent += `- **HTTP Status:** ${result.statusCode}\n`;
    if (result.normalizedPhone) {
      reportContent += `- **Actual Normalized:** ${result.normalizedPhone}\n`;
    }
    if (result.error) {
      reportContent += `- **Error:** ${result.error}\n`;
    }
    if (result.userFound) {
      reportContent += `- **User Found:** Yes\n`;
      reportContent += `- **Token Generated:** ${result.tokenValid ? 'Yes' : 'No'}\n`;
    }
    reportContent += `- **Timestamp:** ${result.timestamp}\n\n`;
  });
  
  reportContent += `## Conclusions\n\n`;
  report.conclusions.forEach(conclusion => {
    reportContent += `- ${conclusion}\n`;
  });
  
  reportContent += `\n## Recommendations\n\n`;
  report.recommendations.forEach(recommendation => {
    reportContent += `- ${recommendation}\n`;
  });
  
  try {
    fs.writeFileSync(reportFilename, reportContent);
    console.log(`\n\n📄 Detailed report saved to: ${reportFilename}`);
  } catch (error) {
    console.error(`\n\n❌ Failed to save report: ${error.message}`);
  }
  
  process.exit(testResults.failed === 0 ? 0 : 1);
}).catch(error => {
  console.error('\n\n❌ Test execution failed:', error);
  process.exit(1);
});
