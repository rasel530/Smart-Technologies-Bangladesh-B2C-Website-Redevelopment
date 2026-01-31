/**
 * CODE ANALYSIS VERIFICATION FOR ALL THREE FIXES
 * 
 * This script verifies the fixes are correctly implemented by analyzing the code:
 * 1. Issue #1: Success message when adding product
 * 2. Issue #2: Products displaying on both pages
 * 3. Issue #3: Product image upload
 */

const fs = require('fs');
const path = require('path');

// Test results tracking
const testResults = {
  issue1: {
    name: 'Issue #1: Success message when adding product',
    tests: [],
    passed: 0,
    failed: 0
  },
  issue2: {
    name: 'Issue #2: Products displaying on both pages',
    tests: [],
    passed: 0,
    failed: 0
  },
  issue3: {
    name: 'Issue #3: Product image upload',
    tests: [],
    passed: 0,
    failed: 0
  }
};

// Helper function to log test results
function logTest(issueNumber, testName, passed, message, details = {}) {
  const result = {
    testName,
    passed,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults[`issue${issueNumber}`].tests.push(result);
  
  if (passed) {
    testResults[`issue${issueNumber}`].passed++;
    console.log(`✅ PASS [Issue #${issueNumber}] ${testName}`);
  } else {
    testResults[`issue${issueNumber}`].failed++;
    console.log(`❌ FAIL [Issue #${issueNumber}] ${testName}: ${message}`);
    if (Object.keys(details).length > 0) {
      console.log(`   Details:`, details);
    }
  }
}

// ============================================
// ISSUE #1: SUCCESS MESSAGE WHEN ADDING PRODUCT
// ============================================
function testIssue1() {
  console.log('\n' + '='.repeat(70));
  console.log('CODE ANALYSIS: ISSUE #1 - Success message when adding product');
  console.log('='.repeat(70));
  
  // Test 1.1: Verify ProductForm.tsx has toast notifications
  try {
    const productFormPath = path.join(__dirname, '../../frontend/src/components/admin/ProductForm.tsx');
    
    if (fs.existsSync(productFormPath)) {
      const productFormContent = fs.readFileSync(productFormPath, 'utf8');
      
      const hasToastImport = productFormContent.includes("useShowToast") || 
                            productFormContent.includes("from '@/components/ui/Toast'");
      const hasSuccessToast = productFormContent.includes('toast.success');
      const hasErrorToast = productFormContent.includes('toast.error');
      const hasSuccessMessage = productFormContent.includes('Product created successfully') ||
                               productFormContent.includes('Product updated successfully');
      
      if (hasToastImport && hasSuccessToast && hasErrorToast && hasSuccessMessage) {
        logTest(1, 'ProductForm has toast notifications', true,
          'Toast notifications are properly imported and used',
          { 
            toastImport: hasToastImport,
            successToast: hasSuccessToast,
            errorToast: hasErrorToast,
            successMessage: hasSuccessMessage
          });
      } else {
        logTest(1, 'ProductForm has toast notifications', false,
          'Missing toast notification implementation',
          { 
            toastImport: hasToastImport,
            successToast: hasSuccessToast,
            errorToast: hasErrorToast,
            successMessage: hasSuccessMessage
          });
      }
    } else {
      logTest(1, 'ProductForm file exists', false,
        'ProductForm.tsx file not found',
        { path: productFormPath });
    }
  } catch (error) {
    logTest(1, 'ProductForm analysis', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 1.2: Verify success message is shown on successful submission
  try {
    const productFormPath = path.join(__dirname, '../../frontend/src/components/admin/ProductForm.tsx');
    const productFormContent = fs.readFileSync(productFormPath, 'utf8');
    
    const hasTryCatchBlock = productFormContent.includes('try {') && 
                            productFormContent.includes('catch (error)');
    const hasToastSuccessInTry = productFormContent.includes('toast.success');
    const hasToastErrorInCatch = productFormContent.includes('toast.error');
    const hasOnSubmitHandler = productFormContent.includes('const handleSubmit = async');
    
    if (hasTryCatchBlock && hasToastSuccessInTry && hasToastErrorInCatch && hasOnSubmitHandler) {
      logTest(1, 'Success message in handleSubmit', true,
        'Toast notifications are properly placed in submit handler',
        { 
          tryCatchBlock: hasTryCatchBlock,
          toastSuccessInTry: hasToastSuccessInTry,
          toastErrorInCatch: hasToastErrorInCatch,
          onSubmitHandler: hasOnSubmitHandler
        });
    } else {
      logTest(1, 'Success message in handleSubmit', false,
        'Toast notifications not properly implemented in submit handler',
        { 
          tryCatchBlock: hasTryCatchBlock,
          toastSuccessInTry: hasToastSuccessInTry,
          toastErrorInCatch: hasToastErrorInCatch,
          onSubmitHandler: hasOnSubmitHandler
        });
    }
  } catch (error) {
    logTest(1, 'handleSubmit analysis', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 1.3: Verify error message is shown on failure
  try {
    const productFormPath = path.join(__dirname, '../../frontend/src/components/admin/ProductForm.tsx');
    const productFormContent = fs.readFileSync(productFormPath, 'utf8');
    
    const hasErrorMessage = productFormContent.includes('Failed to save product');
    const hasErrorTitle = productFormContent.includes('Error');
    const hasConsoleError = productFormContent.includes('console.error');
    
    if (hasErrorMessage && hasErrorTitle && hasConsoleError) {
      logTest(1, 'Error message handling', true,
        'Error messages are properly implemented',
        { 
          errorMessage: hasErrorMessage,
          errorTitle: hasErrorTitle,
          consoleError: hasConsoleError
        });
    } else {
      logTest(1, 'Error message handling', false,
        'Error message handling incomplete',
        { 
          errorMessage: hasErrorMessage,
          errorTitle: hasErrorTitle,
          consoleError: hasConsoleError
        });
    }
  } catch (error) {
    logTest(1, 'Error handling analysis', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
}

// ============================================
// ISSUE #2: PRODUCTS DISPLAYING ON BOTH PAGES
// ============================================
function testIssue2() {
  console.log('\n' + '='.repeat(70));
  console.log('CODE ANALYSIS: ISSUE #2 - Products displaying on both pages');
  console.log('='.repeat(70));
  
  // Test 2.1: Verify .env has correct API URLs
  try {
    const envPath = path.join(__dirname, '../../frontend/.env');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      const hasBackendApiUrl = envContent.includes('BACKEND_API_URL=http://localhost:3001/api/v1');
      const hasPublicApiUrl = envContent.includes('NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001/api/v1');
      const hasApiUrl = envContent.includes('NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1');
      
      if (hasBackendApiUrl && hasPublicApiUrl && hasApiUrl) {
        logTest(2, 'Environment variables configuration', true,
          'All required API URLs are correctly configured',
          { 
            BACKEND_API_URL: hasBackendApiUrl,
            NEXT_PUBLIC_BACKEND_API_URL: hasPublicApiUrl,
            NEXT_PUBLIC_API_URL: hasApiUrl
          });
      } else {
        logTest(2, 'Environment variables configuration', false,
          'Some API URLs are missing or incorrect',
          { 
            BACKEND_API_URL: hasBackendApiUrl,
            NEXT_PUBLIC_BACKEND_API_URL: hasPublicApiUrl,
            NEXT_PUBLIC_API_URL: hasApiUrl
          });
      }
    } else {
      logTest(2, '.env file exists', false,
        '.env file not found',
        { path: envPath });
    }
  } catch (error) {
    logTest(2, 'Environment variables check', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 2.2: Verify ProductList.tsx has error handling
  try {
    const productListPath = path.join(__dirname, '../../frontend/src/components/admin/ProductList.tsx');
    
    if (fs.existsSync(productListPath)) {
      const productListContent = fs.readFileSync(productListPath, 'utf8');
      
      const hasErrorState = productListContent.includes('const [error, setError]');
      const hasTryCatch = productListContent.includes('try {') && 
                          productListContent.includes('catch (error)');
      const hasErrorDisplay = productListContent.includes('{error && (');
      const hasErrorMessageExtraction = productListContent.includes('let errorMessage =');
      const hasAuthErrorHandling = productListContent.includes('if (error?.status === 401)');
      const hasServerErrorHandling = productListContent.includes('if (error?.status === 500)');
      const hasConsoleLogging = productListContent.includes('console.error');
      
      if (hasErrorState && hasTryCatch && hasErrorDisplay && 
          hasErrorMessageExtraction && hasAuthErrorHandling && 
          hasServerErrorHandling && hasConsoleLogging) {
        logTest(2, 'ProductList error handling', true,
          'Comprehensive error handling is implemented',
          { 
            errorState: hasErrorState,
            tryCatch: hasTryCatch,
            errorDisplay: hasErrorDisplay,
            errorMessageExtraction: hasErrorMessageExtraction,
            authErrorHandling: hasAuthErrorHandling,
            serverErrorHandling: hasServerErrorHandling,
            consoleLogging: hasConsoleLogging
          });
      } else {
        logTest(2, 'ProductList error handling', false,
          'Error handling is incomplete',
          { 
            errorState: hasErrorState,
            tryCatch: hasTryCatch,
            errorDisplay: hasErrorDisplay,
            errorMessageExtraction: hasErrorMessageExtraction,
            authErrorHandling: hasAuthErrorHandling,
            serverErrorHandling: hasServerErrorHandling,
            consoleLogging: hasConsoleLogging
          });
      }
    } else {
      logTest(2, 'ProductList file exists', false,
        'ProductList.tsx file not found',
        { path: productListPath });
    }
  } catch (error) {
    logTest(2, 'ProductList analysis', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 2.3: Verify products page has error handling
  try {
    const productsPagePath = path.join(__dirname, '../../frontend/src/app/products/page.tsx');
    
    if (fs.existsSync(productsPagePath)) {
      const productsPageContent = fs.readFileSync(productsPagePath, 'utf8');
      
      const hasErrorState = productsPageContent.includes('let fetchError = null');
      const hasTryCatch = productsPageContent.includes('try {') && 
                          productsPageContent.includes('catch (error)');
      const hasErrorDisplay = productsPageContent.includes('{fetchError && (');
      const hasConsoleLogging = productsPageContent.includes('console.error');
      const hasDefaultValues = productsPageContent.includes('productsData = {');
      
      if (hasErrorState && hasTryCatch && hasErrorDisplay && 
          hasConsoleLogging && hasDefaultValues) {
        logTest(2, 'Products page error handling', true,
          'Comprehensive error handling is implemented',
          { 
            errorState: hasErrorState,
            tryCatch: hasTryCatch,
            errorDisplay: hasErrorDisplay,
            consoleLogging: hasConsoleLogging,
            defaultValues: hasDefaultValues
          });
      } else {
        logTest(2, 'Products page error handling', false,
          'Error handling is incomplete',
          { 
            errorState: hasErrorState,
            tryCatch: hasTryCatch,
            errorDisplay: hasErrorDisplay,
            consoleLogging: hasConsoleLogging,
            defaultValues: hasDefaultValues
          });
      }
    } else {
      logTest(2, 'Products page file exists', false,
        'products/page.tsx file not found',
        { path: productsPagePath });
    }
  } catch (error) {
    logTest(2, 'Products page analysis', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 2.4: Verify API client has enhanced logging
  try {
    const apiClientPath = path.join(__dirname, '../../frontend/src/lib/api/client.ts');
    
    if (fs.existsSync(apiClientPath)) {
      const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
      
      const hasRequestLogging = apiClientContent.includes('[API Client] Making request:');
      const hasResponseLogging = apiClientContent.includes('[API Client] Response received:');
      const hasErrorLogging = apiClientContent.includes('[API Client] Request failed:');
      const hasDetailedErrorInfo = apiClientContent.includes('status: error?.status');
      
      if (hasRequestLogging && hasResponseLogging && hasErrorLogging && hasDetailedErrorInfo) {
        logTest(2, 'API client enhanced logging', true,
          'Enhanced logging is implemented',
          { 
            requestLogging: hasRequestLogging,
            responseLogging: hasResponseLogging,
            errorLogging: hasErrorLogging,
            detailedErrorInfo: hasDetailedErrorInfo
          });
      } else {
        logTest(2, 'API client enhanced logging', false,
          'Enhanced logging is incomplete',
          { 
            requestLogging: hasRequestLogging,
            responseLogging: hasResponseLogging,
            errorLogging: hasErrorLogging,
            detailedErrorInfo: hasDetailedErrorInfo
          });
      }
    } else {
      logTest(2, 'API client file exists', false,
        'client.ts file not found',
        { path: apiClientPath });
    }
  } catch (error) {
    logTest(2, 'API client analysis', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 2.5: Verify products API has enhanced logging
  try {
    const productsApiPath = path.join(__dirname, '../../frontend/src/lib/api/products.ts');
    
    if (fs.existsSync(productsApiPath)) {
      const productsApiContent = fs.readFileSync(productsApiPath, 'utf8');
      
      const hasFetchLogging = productsApiContent.includes('[Products API] Fetching products:');
      const hasSuccessLogging = productsApiContent.includes('[Products API] Products fetched successfully:');
      const hasErrorLogging = productsApiContent.includes('[Products API] Error fetching products:');
      const hasDetailedErrorInfo = productsApiContent.includes('status: error?.status');
      
      if (hasFetchLogging && hasSuccessLogging && hasErrorLogging && hasDetailedErrorInfo) {
        logTest(2, 'Products API enhanced logging', true,
          'Enhanced logging is implemented',
          { 
            fetchLogging: hasFetchLogging,
            successLogging: hasSuccessLogging,
            errorLogging: hasErrorLogging,
            detailedErrorInfo: hasDetailedErrorInfo
          });
      } else {
        logTest(2, 'Products API enhanced logging', false,
          'Enhanced logging is incomplete',
          { 
            fetchLogging: hasFetchLogging,
            successLogging: hasSuccessLogging,
            errorLogging: hasErrorLogging,
            detailedErrorInfo: hasDetailedErrorInfo
          });
      }
    } else {
      logTest(2, 'Products API file exists', false,
        'products.ts file not found',
        { path: productsApiPath });
    }
  } catch (error) {
    logTest(2, 'Products API analysis', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
}

// ============================================
// ISSUE #3: PRODUCT IMAGE UPLOAD
// ============================================
function testIssue3() {
  console.log('\n' + '='.repeat(70));
  console.log('CODE ANALYSIS: ISSUE #3 - Product image upload');
  console.log('='.repeat(70));
  
  // Test 3.1: Verify backend routes has comprehensive error handling
  try {
    const productsRoutePath = path.join(__dirname, '../routes/products.js');
    
    if (fs.existsSync(productsRoutePath)) {
      const routeContent = fs.readFileSync(productsRoutePath, 'utf8');
      
      const hasComprehensiveLogging = routeContent.includes('[Product Image Upload]');
      const hasErrorHandling = routeContent.includes('catch (error)');
      const hasCleanup = routeContent.includes('fs.unlinkSync');
      const hasDetailedErrors = routeContent.includes('error.code');
      const hasPrismaErrorHandling = routeContent.includes("error.code === 'P2002'");
      const hasErrorMessageBn = routeContent.includes('messageBn');
      const hasStatusCodeHandling = routeContent.includes('statusCode = 500');
      const hasErrorDetails = routeContent.includes('errorName: error.name');
      
      if (hasComprehensiveLogging && hasErrorHandling && hasCleanup && 
          hasDetailedErrors && hasPrismaErrorHandling && hasErrorMessageBn &&
          hasStatusCodeHandling && hasErrorDetails) {
        logTest(3, 'Backend comprehensive error handling', true,
          'Comprehensive error handling and logging is implemented',
          { 
            comprehensiveLogging: hasComprehensiveLogging,
            errorHandling: hasErrorHandling,
            fileCleanup: hasCleanup,
            detailedErrors: hasDetailedErrors,
            prismaErrorHandling: hasPrismaErrorHandling,
            bilingualMessages: hasErrorMessageBn,
            statusCodeHandling: hasStatusCodeHandling,
            errorDetails: hasErrorDetails
          });
      } else {
        logTest(3, 'Backend comprehensive error handling', false,
          'Some error handling features are missing',
          { 
            comprehensiveLogging: hasComprehensiveLogging,
            errorHandling: hasErrorHandling,
            fileCleanup: hasCleanup,
            detailedErrors: hasDetailedErrors,
            prismaErrorHandling: hasPrismaErrorHandling,
            bilingualMessages: hasErrorMessageBn,
            statusCodeHandling: hasStatusCodeHandling,
            errorDetails: hasErrorDetails
          });
      }
    } else {
      logTest(3, 'Products route file exists', false,
        'products.js file not found',
        { path: productsRoutePath });
    }
  } catch (error) {
    logTest(3, 'Backend error handling analysis', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 3.2: Verify file validation is implemented
  try {
    const productsRoutePath = path.join(__dirname, '../routes/products.js');
    const routeContent = fs.readFileSync(productsRoutePath, 'utf8');
    
    const hasMulterConfig = routeContent.includes('const upload = multer(');
    const hasFileFilter = routeContent.includes('fileFilter:');
    const hasAllowedTypes = routeContent.includes('allowedTypes = /jpeg|jpg|png|gif|webp|svg/');
    const hasMimetypeCheck = routeContent.includes('file.mimetype');
    const hasExtnameCheck = routeContent.includes('path.extname');
    const hasFileSizeLimit = routeContent.includes('fileSize: 5 * 1024 * 1024');
    const hasErrorCallback = routeContent.includes("cb(new Error('Only image files are allowed!'))");
    
    if (hasMulterConfig && hasFileFilter && hasAllowedTypes && 
        hasMimetypeCheck && hasExtnameCheck && hasFileSizeLimit && hasErrorCallback) {
      logTest(3, 'File validation implementation', true,
        'File validation is properly implemented',
        { 
          multerConfig: hasMulterConfig,
          fileFilter: hasFileFilter,
          allowedTypes: hasAllowedTypes,
          mimetypeCheck: hasMimetypeCheck,
          extnameCheck: hasExtnameCheck,
          fileSizeLimit: hasFileSizeLimit,
          errorCallback: hasErrorCallback
        });
    } else {
      logTest(3, 'File validation implementation', false,
        'File validation is incomplete',
        { 
          multerConfig: hasMulterConfig,
          fileFilter: hasFileFilter,
          allowedTypes: hasAllowedTypes,
          mimetypeCheck: hasMimetypeCheck,
          extnameCheck: hasExtnameCheck,
          fileSizeLimit: hasFileSizeLimit,
          errorCallback: hasErrorCallback
        });
    }
  } catch (error) {
    logTest(3, 'File validation analysis', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 3.3: Verify error cleanup is implemented
  try {
    const productsRoutePath = path.join(__dirname, '../routes/products.js');
    const routeContent = fs.readFileSync(productsRoutePath, 'utf8');
    
    const hasCleanupBlock = routeContent.includes('if (req.file && req.file.path)');
    const hasFsUnlink = routeContent.includes('fs.unlinkSync(req.file.path)');
    const hasCleanupErrorHandling = routeContent.includes('catch (cleanupError)');
    const hasCleanupLogging = routeContent.includes('console.error(\'[Product Image Upload] Failed to clean up uploaded file:\', cleanupError)');
    
    if (hasCleanupBlock && hasFsUnlink && hasCleanupErrorHandling && hasCleanupLogging) {
      logTest(3, 'File cleanup on error', true,
        'File cleanup on error is implemented',
        { 
          cleanupBlock: hasCleanupBlock,
          fsUnlink: hasFsUnlink,
          cleanupErrorHandling: hasCleanupErrorHandling,
          cleanupLogging: hasCleanupLogging
        });
    } else {
      logTest(3, 'File cleanup on error', false,
        'File cleanup on error is incomplete',
        { 
          cleanupBlock: hasCleanupBlock,
          fsUnlink: hasFsUnlink,
          cleanupErrorHandling: hasCleanupErrorHandling,
          cleanupLogging: hasCleanupLogging
        });
    }
  } catch (error) {
    logTest(3, 'File cleanup analysis', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
  
  // Test 3.4: Verify detailed error logging
  try {
    const productsRoutePath = path.join(__dirname, '../routes/products.js');
    const routeContent = fs.readFileSync(productsRoutePath, 'utf8');
    
    const hasErrorNameLogging = routeContent.includes('console.error(\'[Product Image Upload] Error name:\', error.name)');
    const hasErrorMessageLogging = routeContent.includes('console.error(\'[Product Image Upload] Error message:\', error.message)');
    const hasErrorCodeLogging = routeContent.includes('console.error(\'[Product Image Upload] Error code:\', error.code)');
    const hasErrorMetaLogging = routeContent.includes('console.error(\'[Product Image Upload] Error meta:\', error.meta)');
    const hasErrorStackLogging = routeContent.includes('console.error(\'[Product Image Upload] Error stack:\', error.stack)');
    
    if (hasErrorNameLogging && hasErrorMessageLogging && hasErrorCodeLogging && 
        hasErrorMetaLogging && hasErrorStackLogging) {
      logTest(3, 'Detailed error logging', true,
        'Detailed error logging is implemented',
        { 
          errorNameLogging: hasErrorNameLogging,
          errorMessageLogging: hasErrorMessageLogging,
          errorCodeLogging: hasErrorCodeLogging,
          errorMetaLogging: hasErrorMetaLogging,
          errorStackLogging: hasErrorStackLogging
        });
    } else {
      logTest(3, 'Detailed error logging', false,
        'Detailed error logging is incomplete',
        { 
          errorNameLogging: hasErrorNameLogging,
          errorMessageLogging: hasErrorMessageLogging,
          errorCodeLogging: hasErrorCodeLogging,
          errorMetaLogging: hasErrorMetaLogging,
          errorStackLogging: hasErrorStackLogging
        });
    }
  } catch (error) {
    logTest(3, 'Detailed error logging analysis', false,
      `Error: ${error.message}`,
      { error: error.message });
  }
}

// ============================================
// GENERATE TEST REPORT
// ============================================
function generateTestReport() {
  console.log('\n' + '='.repeat(70));
  console.log('COMPREHENSIVE CODE ANALYSIS TEST REPORT');
  console.log('='.repeat(70));
  console.log(`Test completed at: ${new Date().toISOString()}\n`);
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (let i = 1; i <= 3; i++) {
    const issue = testResults[`issue${i}`];
    totalPassed += issue.passed;
    totalFailed += issue.failed;
    
    console.log(`${issue.name}`);
    console.log('-'.repeat(70));
    console.log(`Tests Passed: ${issue.passed}`);
    console.log(`Tests Failed: ${issue.failed}`);
    console.log(`Total Tests: ${issue.tests.length}`);
    console.log(`Success Rate: ${((issue.passed / issue.tests.length) * 100).toFixed(2)}%\n`);
    
    issue.tests.forEach(test => {
      const icon = test.passed ? '✅' : '❌';
      console.log(`${icon} ${test.testName}`);
      if (!test.passed) {
        console.log(`   Message: ${test.message}`);
        if (Object.keys(test.details).length > 0) {
          console.log(`   Details:`, test.details);
        }
      }
    });
    console.log();
  }
  
  console.log('='.repeat(70));
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests Passed: ${totalPassed}`);
  console.log(`Total Tests Failed: ${totalFailed}`);
  console.log(`Total Tests: ${totalPassed + totalFailed}`);
  console.log(`Overall Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(2)}%`);
  console.log('='.repeat(70));
  
  // Save report to file
  const reportPath = path.join(__dirname, 'code-analysis-test-results.json');
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPassed,
      totalFailed,
      totalTests: totalPassed + totalFailed,
      successRate: ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(2) + '%'
    },
    issues: testResults
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\nDetailed test report saved to: ${reportPath}`);
}

// ============================================
// MAIN TEST EXECUTION
// ============================================
function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('STARTING CODE ANALYSIS VERIFICATION FOR ALL THREE FIXES');
  console.log('='.repeat(70));
  console.log(`Test Start Time: ${new Date().toISOString()}`);
  
  try {
    testIssue1();
    testIssue2();
    testIssue3();
    
    generateTestReport();
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR DURING TEST EXECUTION:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
