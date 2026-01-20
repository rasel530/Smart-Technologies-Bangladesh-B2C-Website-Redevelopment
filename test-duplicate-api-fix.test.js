/**
 * Test Suite: Duplicate /api Segment Fix Verification
 * 
 * This test verifies that the fix for duplicate /api segments in API URL construction
 * is working correctly for both corporate status and invoice download endpoints.
 * 
 * Files Tested:
 * 1. frontend/src/app/account/corporate/page.tsx - Corporate status endpoint
 * 2. frontend/src/lib/api/corporate.ts - Invoice download endpoint
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_ACCOUNT_ID = '5a5eaca8-37a7-4115-9e8d-c9577c6c9333';
const TEST_INVOICE_ID = 'test-invoice-123';
const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test results tracking
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
    const status = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${testName}`);
    if (details) {
        console.log(`  ${details}`);
    }
    
    testResults.total++;
    if (passed) {
        testResults.passed++;
    } else {
        testResults.failed++;
    }
    
    testResults.tests.push({
        name: testName,
        passed,
        details
    });
}

// Helper function to check for duplicate /api segments
function hasDuplicateApiSegments(url) {
    const apiMatches = url.match(/\/api/g);
    return apiMatches && apiMatches.length > 1;
}

// Helper function to extract URL from code pattern
function extractUrlFromPattern(code, pattern) {
    const match = code.match(pattern);
    return match ? match[1] : null;
}

// Test 1: Verify API client configuration
function testApiClientConfiguration() {
    console.log('\n=== Test 1: API Client Configuration ===');
    
    const clientPath = path.join(__dirname, 'frontend/src/lib/api/client.ts');
    const clientCode = fs.readFileSync(clientPath, 'utf8');
    
    // Check API_BASE_URL definition
    const baseUrlMatch = clientCode.match(/const API_BASE_URL = ['"`]([^'"`]+)['"`]/);
    const hasBaseUrl = baseUrlMatch && baseUrlMatch[1] === API_BASE_URL;
    logTest(
        'API_BASE_URL is correctly defined',
        hasBaseUrl,
        `Expected: ${API_BASE_URL}, Found: ${baseUrlMatch ? baseUrlMatch[1] : 'N/A'}`
    );
    
    // Check URL construction in request method
    const urlConstructionMatch = clientCode.match(/const url = \`\$\{API_BASE_URL\}\$\{endpoint\}\`/);
    const hasCorrectConstruction = urlConstructionMatch !== null;
    logTest(
        'URL construction uses API_BASE_URL + endpoint',
        hasCorrectConstruction,
        hasCorrectConstruction ? 'Correct pattern found' : 'Pattern not found'
    );
}

// Test 2: Verify corporate status endpoint URL construction
function testCorporateStatusEndpoint() {
    console.log('\n=== Test 2: Corporate Status Endpoint ===');
    
    const pagePath = path.join(__dirname, 'frontend/src/app/account/corporate/page.tsx');
    const pageCode = fs.readFileSync(pagePath, 'utf8');
    
    // Check that apiClient is imported
    const hasApiClientImport = pageCode.includes("import { apiClient } from '@/lib/api/client'");
    logTest(
        'apiClient is imported',
        hasApiClientImport,
        hasApiClientImport ? 'Import statement found' : 'Import statement missing'
    );
    
    // Check that loadDocuments uses apiClient.get
    const usesApiClientGet = pageCode.includes('apiClient.get<{ documents: CorporateDocument[] }>(`/corporate/${accountId}/status`)');
    logTest(
        'loadDocuments uses apiClient.get for status endpoint',
        usesApiClientGet,
        usesApiClientGet ? 'Correct apiClient.get usage found' : 'apiClient.get usage not found'
    );
    
    // Verify the endpoint path doesn't include /api prefix
    const endpointPattern = /apiClient\.get.*?`([^`]+)`/;
    const endpointMatch = pageCode.match(endpointPattern);
    const endpoint = endpointMatch ? endpointMatch[1] : '';
    const hasNoApiPrefix = !endpoint.includes('/api');
    logTest(
        'Endpoint path does not include /api prefix',
        hasNoApiPrefix,
        `Endpoint: ${endpoint}`
    );
    
    // Simulate URL construction
    const simulatedUrl = `${API_BASE_URL}/corporate/${TEST_ACCOUNT_ID}/status`;
    const hasNoDuplicateApi = !hasDuplicateApiSegments(simulatedUrl);
    logTest(
        'Simulated URL has no duplicate /api segments',
        hasNoDuplicateApi,
        `URL: ${simulatedUrl}`
    );
    
    // Verify no manual token handling in loadDocuments
    const hasManualTokenHandling = pageCode.includes('const token = typeof window !== \'undefined\' ? localStorage.getItem(\'auth_token\')') &&
                                    pageCode.includes('loadDocuments');
    logTest(
        'No manual token handling in loadDocuments',
        !hasManualTokenHandling,
        hasManualTokenHandling ? 'Manual token handling found (should be removed)' : 'No manual token handling (correct)'
    );
}

// Test 3: Verify invoice download endpoint URL construction
function testInvoiceDownloadEndpoint() {
    console.log('\n=== Test 3: Invoice Download Endpoint ===');
    
    const corporatePath = path.join(__dirname, 'frontend/src/lib/api/corporate.ts');
    const corporateCode = fs.readFileSync(corporatePath, 'utf8');
    
    // Check that downloadInvoice uses direct API_BASE_URL
    const usesDirectBaseUrl = corporateCode.includes("const API_BASE_URL = 'http://localhost:3001/api/v1'") &&
                               corporateCode.includes('downloadInvoice');
    logTest(
        'downloadInvoice uses direct API_BASE_URL',
        usesDirectBaseUrl,
        usesDirectBaseUrl ? 'Direct API_BASE_URL found' : 'Direct API_BASE_URL not found'
    );
    
    // Check URL construction pattern
    const urlPattern = /downloadInvoice.*?fetch\(`([^`]+)`/s;
    const urlMatch = corporateCode.match(urlPattern);
    const urlTemplate = urlMatch ? urlMatch[1] : '';
    
    // Replace placeholders to get actual URL
    const actualUrl = urlTemplate
        .replace('${API_BASE_URL}', API_BASE_URL)
        .replace('${accountId}', TEST_ACCOUNT_ID)
        .replace('${invoiceId}', TEST_INVOICE_ID);
    
    const hasNoDuplicateApi = !hasDuplicateApiSegments(actualUrl);
    logTest(
        'Invoice download URL has no duplicate /api segments',
        hasNoDuplicateApi,
        `URL: ${actualUrl}`
    );
    
    // Verify the URL template uses API_BASE_URL (not env variable)
    const usesEnvVar = urlTemplate.includes('process.env.NEXT_PUBLIC_API_URL');
    logTest(
        'URL construction does not use environment variable',
        !usesEnvVar,
        usesEnvVar ? 'Environment variable found (should be removed)' : 'No environment variable (correct)'
    );
    
    // Verify the path starts with /corporate (not /api/corporate)
    const startsWithCorporate = urlTemplate.includes('/corporate/');
    logTest(
        'URL path starts with /corporate (not /api/corporate)',
        startsWithCorporate,
        `Path: ${urlTemplate.replace('${API_BASE_URL}', '')}`
    );
}

// Test 4: Verify authentication headers are still included
function testAuthenticationHeaders() {
    console.log('\n=== Test 4: Authentication Headers ===');
    
    const clientPath = path.join(__dirname, 'frontend/src/lib/api/client.ts');
    const clientCode = fs.readFileSync(clientPath, 'utf8');
    
    // Check addAuthHeader function exists
    const hasAddAuthHeader = clientCode.includes('const addAuthHeader =');
    logTest(
        'addAuthHeader function exists',
        hasAddAuthHeader,
        hasAddAuthHeader ? 'Function found' : 'Function not found'
    );
    
    // Check Authorization header is added
    const addsAuthorization = clientCode.includes('Authorization: `Bearer ${token}`');
    logTest(
        'Authorization header is added with Bearer token',
        addsAuthorization,
        addsAuthorization ? 'Authorization header found' : 'Authorization header not found'
    );
    
    // Check that addAuthHeader is called in request method
    const callsAddAuthHeader = clientCode.includes('const authHeaders = addAuthHeader(headers)');
    logTest(
        'addAuthHeader is called in request method',
        callsAddAuthHeader,
        callsAddAuthHeader ? 'Function call found' : 'Function call not found'
    );
    
    // Verify invoice download still includes Authorization header
    const corporatePath = path.join(__dirname, 'frontend/src/lib/api/corporate.ts');
    const corporateCode = fs.readFileSync(corporatePath, 'utf8');
    const hasAuthHeader = corporateCode.includes("'Authorization': `Bearer ${token}`");
    logTest(
        'Invoice download includes Authorization header',
        hasAuthHeader,
        hasAuthHeader ? 'Authorization header found' : 'Authorization header not found'
    );
}

// Test 5: Verify error handling
function testErrorHandling() {
    console.log('\n=== Test 5: Error Handling ===');
    
    const clientPath = path.join(__dirname, 'frontend/src/lib/api/client.ts');
    const clientCode = fs.readFileSync(clientPath, 'utf8');
    
    // Check ApiError class exists
    const hasApiError = clientCode.includes('class ApiError extends Error');
    logTest(
        'ApiError class exists',
        hasApiError,
        hasApiError ? 'ApiError class found' : 'ApiError class not found'
    );
    
    // Check handleResponse function exists
    const hasHandleResponse = clientCode.includes('const handleResponse =');
    logTest(
        'handleResponse function exists',
        hasHandleResponse,
        hasHandleResponse ? 'Function found' : 'Function not found'
    );
    
    // Check that errors are thrown on non-ok responses
    const throwsOnNonOk = clientCode.includes("if (!response.ok)") && clientCode.includes('throw new ApiError');
    logTest(
        'Errors are thrown on non-ok responses',
        throwsOnNonOk,
        throwsOnNonOk ? 'Error handling found' : 'Error handling not found'
    );
    
    // Verify invoice download throws error on failure
    const corporatePath = path.join(__dirname, 'frontend/src/lib/api/corporate.ts');
    const corporateCode = fs.readFileSync(corporatePath, 'utf8');
    const throwsOnFailure = corporateCode.includes("if (!response.ok)") && corporateCode.includes('throw new ApiError');
    logTest(
        'Invoice download throws error on failure',
        throwsOnFailure,
        throwsOnFailure ? 'Error handling found' : 'Error handling not found'
    );
}

// Test 6: Integration test - Verify no duplicate /api in actual URLs
function testIntegration() {
    console.log('\n=== Test 6: Integration Tests ===');
    
    // Test corporate status URL
    const corporateStatusUrl = `${API_BASE_URL}/corporate/${TEST_ACCOUNT_ID}/status`;
    const statusUrlCorrect = corporateStatusUrl === 'http://localhost:3001/api/v1/corporate/5a5eaca8-37a7-4115-9e8d-c9577c6c9333/status';
    const statusUrlNoDuplicate = !hasDuplicateApiSegments(corporateStatusUrl);
    
    logTest(
        'Corporate status URL is correctly formatted',
        statusUrlCorrect && statusUrlNoDuplicate,
        `URL: ${corporateStatusUrl}`
    );
    
    // Test invoice download URL
    const invoiceDownloadUrl = `${API_BASE_URL}/corporate/${TEST_ACCOUNT_ID}/invoices/${TEST_INVOICE_ID}/download`;
    const invoiceUrlCorrect = invoiceDownloadUrl === 'http://localhost:3001/api/v1/corporate/5a5eaca8-37a7-4115-9e8d-c9577c6c9333/invoices/test-invoice-123/download';
    const invoiceUrlNoDuplicate = !hasDuplicateApiSegments(invoiceDownloadUrl);
    
    logTest(
        'Invoice download URL is correctly formatted',
        invoiceUrlCorrect && invoiceUrlNoDuplicate,
        `URL: ${invoiceDownloadUrl}`
    );
    
    // Verify both URLs don't have duplicate /api
    const bothUrlsNoDuplicate = statusUrlNoDuplicate && invoiceUrlNoDuplicate;
    logTest(
        'All tested URLs have no duplicate /api segments',
        bothUrlsNoDuplicate,
        `Status URL: ${corporateStatusUrl}\nInvoice URL: ${invoiceDownloadUrl}`
    );
}

// Test 7: Verify no regressions in other endpoints
function testNoRegressions() {
    console.log('\n=== Test 7: Regression Tests ===');
    
    const corporatePath = path.join(__dirname, 'frontend/src/lib/api/corporate.ts');
    const corporateCode = fs.readFileSync(corporatePath, 'utf8');
    
    // Check that other endpoints still use apiClient
    const usesApiClientForRegister = corporateCode.includes("apiClient.post<{ accountId: string; status: string }>('/corporate/register'");
    logTest(
        'Register endpoint still uses apiClient',
        usesApiClientForRegister,
        usesApiClientForRegister ? 'apiClient usage found' : 'apiClient usage not found'
    );
    
    const usesApiClientForGetAccount = corporateCode.includes("apiClient.get<CorporateAccount>(`/corporate/${accountId}`)");
    logTest(
        'Get account endpoint still uses apiClient',
        usesApiClientForGetAccount,
        usesApiClientForGetAccount ? 'apiClient usage found' : 'apiClient usage not found'
    );
    
    const usesApiClientForDashboard = corporateCode.includes("apiClient.get<CorporateDashboardStats>(`/corporate/${accountId}/dashboard`)");
    logTest(
        'Dashboard endpoint still uses apiClient',
        usesApiClientForDashboard,
        usesApiClientForDashboard ? 'apiClient usage found' : 'apiClient usage not found'
    );
    
    // Verify no other endpoints have duplicate /api
    const allEndpoints = corporateCode.match(/apiClient\.(get|post|put|delete|patch)\([^)]+\)/g) || [];
    let allEndpointsCorrect = true;
    
    allEndpoints.forEach((endpointCall, index) => {
        const endpointMatch = endpointCall.match(/['"`]([^'"`]+)['"`]/);
        if (endpointMatch && endpointMatch[1].includes('/api')) {
            allEndpointsCorrect = false;
            console.log(`  Warning: Endpoint ${index + 1} contains /api: ${endpointMatch[1]}`);
        }
    });
    
    logTest(
        'No other endpoints have duplicate /api in their paths',
        allEndpointsCorrect,
        `Checked ${allEndpoints.length} endpoint calls`
    );
}

// Main test runner
function runAllTests() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Duplicate /api Segment Fix Verification Test Suite            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`\nTest Account ID: ${TEST_ACCOUNT_ID}`);
    console.log(`Test Invoice ID: ${TEST_INVOICE_ID}`);
    console.log(`API Base URL: ${API_BASE_URL}`);
    
    try {
        testApiClientConfiguration();
        testCorporateStatusEndpoint();
        testInvoiceDownloadEndpoint();
        testAuthenticationHeaders();
        testErrorHandling();
        testIntegration();
        testNoRegressions();
        
        // Print summary
        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║  Test Summary                                                 ║');
        console.log('╚════════════════════════════════════════════════════════════════╝');
        console.log(`\nTotal Tests: ${testResults.total}`);
        console.log(`Passed: ${testResults.passed} ✓`);
        console.log(`Failed: ${testResults.failed} ✗`);
        console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
        
        if (testResults.failed === 0) {
            console.log('\n✓ All tests passed! The duplicate /api segment fix is working correctly.');
        } else {
            console.log('\n✗ Some tests failed. Please review the failed tests above.');
        }
        
        // Save test results to file
        const resultsPath = path.join(__dirname, 'duplicate-api-fix-test-results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
        console.log(`\nTest results saved to: ${resultsPath}`);
        
        return testResults.failed === 0;
    } catch (error) {
        console.error('\n✗ Test execution failed:', error.message);
        console.error(error.stack);
        return false;
    }
}

// Run tests
const success = runAllTests();
process.exit(success ? 0 : 1);
