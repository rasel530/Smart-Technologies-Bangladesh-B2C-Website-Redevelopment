/**
 * Browser Caching Fix Verification Test
 * 
 * This test verifies that the browser caching issue causing wrong admin page
 * to load after logout has been properly fixed.
 * 
 * The fix involves:
 * 1. Adding isRedirecting state to AuthContext to track redirect status
 * 2. Setting isRedirecting(false) before logout
 * 3. Setting isRedirecting(true) after redirect completes
 * 4. Ensuring loading overlays show immediately and cover entire screen
 * 5. Preventing old page content from showing during transitions
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('BROWSER CACHING FIX VERIFICATION TEST');
console.log('='.repeat(80));
console.log('');

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to track test results
function runTest(testName, testFn) {
  testResults.total++;
  console.log(`\n[Test ${testResults.total}] ${testName}`);
  console.log('-'.repeat(80));
  
  try {
    const result = testFn();
    if (result.passed) {
      testResults.passed++;
      testResults.details.push({
        test: testName,
        status: 'PASSED',
        message: result.message
      });
      console.log(`✅ PASSED: ${result.message}`);
    } else {
      testResults.failed++;
      testResults.details.push({
        test: testName,
        status: 'FAILED',
        message: result.message
      });
      console.log(`❌ FAILED: ${result.message}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.details.push({
      test: testName,
      status: 'ERROR',
      message: error.message
    });
    console.log(`❌ ERROR: ${error.message}`);
  }
}

// Helper function to read file content
function readFileContent(filePath) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

// Test 1: Verify isRedirecting state is added to AuthContext
runTest('AuthContext has isRedirecting state', () => {
  const content = readFileContent('frontend/src/contexts/AuthContext.tsx');
  
  // Check for isRedirecting state declaration
  const hasStateDeclaration = content.includes('const [isRedirecting, setIsRedirecting] = React.useState(false)');
  
  if (!hasStateDeclaration) {
    return {
      passed: false,
      message: 'isRedirecting state not found in AuthContext'
    };
  }
  
  return {
    passed: true,
    message: 'isRedirecting state properly declared in AuthContext'
  };
});

// Test 2: Verify logout function sets isRedirecting(false) before logout
runTest('Logout function sets isRedirecting(false) before logout', () => {
  const content = readFileContent('frontend/src/contexts/AuthContext.tsx');
  
  // Check for isRedirecting(false) before logout operations
  // Find the logout function and check order within it
  const logoutMatch = content.match(/const logout = async \(\) => \{[\s\S]*?window\.location\.replace/);
  if (!logoutMatch) {
    return {
      passed: false,
      message: 'Logout function not found'
    };
  }
  
  const logoutCode = logoutMatch[0];
  const hasSetFalseBeforeLogout = logoutCode.includes('setIsRedirecting(false)') && 
                                  logoutCode.indexOf('setIsRedirecting(false)') < logoutCode.indexOf('nextAuthSignOut');
  
  if (!hasSetFalseBeforeLogout) {
    return {
      passed: false,
      message: 'isRedirecting(false) not set before logout operations'
    };
  }
  
  return {
    passed: true,
    message: 'isRedirecting(false) properly set before logout'
  };
});

// Test 3: Verify logout function sets isRedirecting(true) after redirect
runTest('Logout function sets isRedirecting(true) after redirect', () => {
  const content = readFileContent('frontend/src/contexts/AuthContext.tsx');
  
  // Check for isRedirecting(true) after redirect preparation
  const hasSetTrueAfterRedirect = content.includes('setIsRedirecting(true)') &&
                                  content.indexOf('setIsRedirecting(true)') > content.indexOf('document.body.innerHTML');
  
  if (!hasSetTrueAfterRedirect) {
    return {
      passed: false,
      message: 'isRedirecting(true) not set after redirect preparation'
    };
  }
  
  return {
    passed: true,
    message: 'isRedirecting(true) properly set after redirect preparation'
  };
});

// Test 4: Verify isRedirecting is exposed in AuthContext value
runTest('isRedirecting is exposed in AuthContext value', () => {
  const content = readFileContent('frontend/src/contexts/AuthContext.tsx');
  
  // Check for isRedirecting in context value
  const contextValueMatch = content.match(/const value: AuthContextType = \{[\s\S]*?\n  \};/);
  
  if (!contextValueMatch) {
    return {
      passed: false,
      message: 'Context value object not found'
    };
  }
  
  const contextValue = contextValueMatch[0];
  const hasIsRedirecting = contextValue.includes('isRedirecting,');
  
  if (!hasIsRedirecting) {
    return {
      passed: false,
      message: 'isRedirecting not exposed in context value'
    };
  }
  
  return {
    passed: true,
    message: 'isRedirecting properly exposed in context value'
  };
});

// Test 5: Verify isRedirecting is added to AuthContextType interface
runTest('isRedirecting is added to AuthContextType interface', () => {
  const content = readFileContent('frontend/src/types/auth.ts');
  
  // Check for isRedirecting in AuthContextType interface
  const authContextTypeMatch = content.match(/export interface AuthContextType \{[\s\S]*?\n\}/);
  
  if (!authContextTypeMatch) {
    return {
      passed: false,
      message: 'AuthContextType interface not found'
    };
  }
  
  const authContextType = authContextTypeMatch[0];
  const hasIsRedirecting = authContextType.includes('isRedirecting: boolean;');
  
  if (!hasIsRedirecting) {
    return {
      passed: false,
      message: 'isRedirecting not found in AuthContextType interface'
    };
  }
  
  return {
    passed: true,
    message: 'isRedirecting properly added to AuthContextType interface'
  };
});

// Test 6: Verify login page has isRedirecting state
runTest('Login page has isRedirecting state', () => {
  const content = readFileContent('frontend/src/app/login/page.tsx');
  
  // Check for isRedirecting state declaration
  const hasStateDeclaration = content.includes('const [isRedirecting, setIsRedirecting] = useState(false)');
  
  if (!hasStateDeclaration) {
    return {
      passed: false,
      message: 'isRedirecting state not found in login page'
    };
  }
  
  return {
    passed: true,
    message: 'isRedirecting state properly declared in login page'
  };
});

// Test 7: Verify login page uses isRedirecting to prevent showing old content
runTest('Login page uses isRedirecting to prevent showing old content', () => {
  const content = readFileContent('frontend/src/app/login/page.tsx');
  
  // Check for isRedirecting in redirect condition
  const hasRedirectingCheck = content.includes('!isRedirecting') || 
                              content.includes('isRedirecting === false');
  
  if (!hasRedirectingCheck) {
    return {
      passed: false,
      message: 'isRedirecting not used in redirect condition'
    };
  }
  
  return {
    passed: true,
    message: 'isRedirecting properly used to prevent showing old content'
  };
});

// Test 8: Verify logout function shows loading overlay
runTest('Logout function shows loading overlay', () => {
  const content = readFileContent('frontend/src/contexts/AuthContext.tsx');
  
  // Check for loading overlay creation
  const hasOverlayCreation = (content.includes('loadingOverlay = document.createElement') ||
                            content.includes('const loadingOverlay = document.createElement')) &&
                            content.includes('id="logout-loading-overlay"') &&
                            content.includes('z-index: 99999');
  
  if (!hasOverlayCreation) {
    return {
      passed: false,
      message: 'Loading overlay not properly created in logout function'
    };
  }
  
  return {
    passed: true,
    message: 'Loading overlay properly created in logout function'
  };
});

// Test 9: Verify logout function clears page content before redirect
runTest('Logout function clears page content before redirect', () => {
  const content = readFileContent('frontend/src/contexts/AuthContext.tsx');
  
  // Check for page content clearing
  const clearsBody = content.includes('document.body.innerHTML');
  const clearsHead = content.includes('document.head.innerHTML');
  
  if (!clearsBody || !clearsHead) {
    return {
      passed: false,
      message: 'Page content not properly cleared before redirect'
    };
  }
  
  return {
    passed: true,
    message: 'Page content properly cleared before redirect'
  };
});

// Test 10: Verify logout function uses window.location.replace for clean redirect
runTest('Logout function uses window.location.replace for clean redirect', () => {
  const content = readFileContent('frontend/src/contexts/AuthContext.tsx');
  
  // Check for window.location.replace usage
  const usesReplace = content.includes('window.location.replace');
  
  if (!usesReplace) {
    return {
      passed: false,
      message: 'window.location.replace not used for redirect'
    };
  }
  
  return {
    passed: true,
    message: 'window.location.replace properly used for clean redirect'
  };
});

// Test 11: Verify login page shows loading overlay during redirect
runTest('Login page shows loading overlay during redirect', () => {
  const content = readFileContent('frontend/src/app/login/page.tsx');
  
  // Check for loading overlay creation
  const hasOverlayCreation = (content.includes('loadingOverlay = document.createElement') ||
                            content.includes('const loadingOverlay = document.createElement')) &&
                            content.includes('id="login-redirect-overlay"') &&
                            content.includes('z-index: 99999');
  
  if (!hasOverlayCreation) {
    return {
      passed: false,
      message: 'Loading overlay not properly created in login page'
    };
  }
  
  return {
    passed: true,
    message: 'Loading overlay properly created in login page'
  };
});

// Test 12: Verify login page clears page content before redirect
runTest('Login page clears page content before redirect', () => {
  const content = readFileContent('frontend/src/app/login/page.tsx');
  
  // Check for page content clearing
  const clearsBody = content.includes('document.body.innerHTML');
  const clearsHead = content.includes('document.head.innerHTML');
  
  if (!clearsBody || !clearsHead) {
    return {
      passed: false,
      message: 'Page content not properly cleared before redirect'
    };
  }
  
  return {
    passed: true,
    message: 'Page content properly cleared before redirect'
  };
});

// Test 13: Verify LoadingOverlay component has fullScreen support
runTest('LoadingOverlay component has fullScreen support', () => {
  const content = readFileContent('frontend/src/components/ui/LoadingOverlay.tsx');
  
  // Check for fullScreen prop and fixed positioning
  const hasFullScreenProp = content.includes('fullScreen?: boolean');
  const hasFixedPositioning = content.includes('fixed inset-0');
  const hasHighZIndex = content.includes('z-50');
  
  if (!hasFullScreenProp || !hasFixedPositioning || !hasHighZIndex) {
    return {
      passed: false,
      message: 'LoadingOverlay component missing fullScreen support'
    };
  }
  
  return {
    passed: true,
    message: 'LoadingOverlay component properly supports fullScreen mode'
  };
});

// Test 14: Verify just_logged_out flag is set during logout
runTest('just_logged_out flag is set during logout', () => {
  const content = readFileContent('frontend/src/contexts/AuthContext.tsx');
  
  // Check for just_logged_out sessionStorage flag
  const setsJustLoggedOut = content.includes("sessionStorage.setItem('just_logged_out', 'true')");
  
  if (!setsJustLoggedOut) {
    return {
      passed: false,
      message: 'just_logged_out flag not set during logout'
    };
  }
  
  return {
    passed: true,
    message: 'just_logged_out flag properly set during logout'
  };
});

// Test 15: Verify login page checks just_logged_out flag
runTest('Login page checks just_logged_out flag', () => {
  const content = readFileContent('frontend/src/app/login/page.tsx');
  
  // Check for just_logged_out sessionStorage check
  const checksJustLoggedOut = content.includes("sessionStorage.getItem('just_logged_out')") ||
                            content.includes("sessionStorage.getItem(\"just_logged_out\")");
  
  if (!checksJustLoggedOut) {
    return {
      passed: false,
      message: 'just_logged_out flag not checked in login page'
    };
  }
  
  return {
    passed: true,
    message: 'just_logged_out flag properly checked in login page'
  };
});

// Print summary
console.log('\n' + '='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log(`Total Tests: ${testResults.total}`);
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);

if (testResults.failed > 0) {
  console.log('\n' + '='.repeat(80));
  console.log('FAILED TESTS DETAILS');
  console.log('='.repeat(80));
  testResults.details.filter(d => d.status !== 'PASSED').forEach(detail => {
    console.log(`\n❌ ${detail.test}`);
    console.log(`   Status: ${detail.status}`);
    console.log(`   Message: ${detail.message}`);
  });
}

console.log('\n' + '='.repeat(80));

// Exit with appropriate code
process.exit(testResults.failed > 0 ? 1 : 0);
