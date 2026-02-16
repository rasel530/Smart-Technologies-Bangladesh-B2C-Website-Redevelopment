/**
 * Comprehensive Test Suite for RBAC User Role Management Fixes
 * 
 * This test suite verifies three critical fixes:
 * 
 * ISSUE 1: DELETE Request Sending Undefined roleId (Frontend Fix)
 * - Backend validation ensures invalid roleId returns 400 error
 * - Tests verify proper error handling for missing/invalid roleId
 * 
 * ISSUE 2: POST Request Causing 500 Internal Server Error (Backend Fix)
 * - userRole variable now accessible outside transaction scope
 * - Tests verify response includes created userRole data
 * - Tests verify transaction completes successfully
 * 
 * ISSUE 3: expires_at Validation Error (Backend Fix)
 * - Validation now accepts null, undefined, and empty strings
 * - Tests verify all valid formats are accepted
 * - Tests verify invalid formats are still rejected
 */

const http = require('http');

// Configuration
const BASE_URL = 'localhost';
const PORT = 3001;
const BASE_API = '/api/v1';

// Test credentials
const TEST_CREDENTIALS = {
  identifier: 'test.superadmin@smarttech.com',
  password: 'dpWcQf*YH2mwKSXd'
};

// Test user data
const TEST_USER = {
  email: `test.fixes.${Date.now()}@example.com`,
  phone: '+8801712345678',
  password: 'SecurePass@2026!Strong',
  firstName: 'TestFixes',
  lastName: 'User',
  roleIds: [] // Will be populated after fetching roles
};

let authToken = null;
let testUserId = null;
let testRoleId = null;
let userRoleRecordId = null;

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Helper function to create request options
function createOptions(method, path, token = null) {
  return {
    hostname: BASE_URL,
    port: PORT,
    path: `${BASE_API}${path}`,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
}

// Helper function to wait
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// SETUP TESTS
// ============================================================================

async function testLogin() {
  console.log('\n=== SETUP: LOGIN ===');
  try {
    const response = await makeRequest(
      createOptions('POST', '/auth/login'),
      TEST_CREDENTIALS
    );

    console.log('Status:', response.statusCode);

    if (response.statusCode === 200 && response.body && response.body.token) {
      authToken = response.body.token;
      console.log('✅ Login successful!');
      return true;
    } else {
      console.log('❌ Login failed!');
      console.log('Response:', JSON.stringify(response.body, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function testFetchRoles() {
  console.log('\n=== SETUP: FETCH ROLES ===');
  try {
    const response = await makeRequest(
      createOptions('GET', '/rbac/roles', authToken)
    );

    console.log('Status:', response.statusCode);

    if (response.statusCode === 200 && response.body && response.body.data) {
      const roles = response.body.data;
      console.log(`✅ Fetched ${roles.length} roles.`);
      
      // Use ADMIN role for testing
      const adminRole = roles.find(r => r.name === 'ADMIN');
      if (adminRole) {
        testRoleId = adminRole.id;
        console.log(`Using role: ${adminRole.name} (ID: ${adminRole.id})`);
      } else if (roles.length > 0) {
        testRoleId = roles[0].id;
        console.log(`Using role: ${roles[0].name} (ID: ${roles[0].id})`);
      }
      return true;
    } else {
      console.log('❌ Failed to fetch roles!');
      return false;
    }
  } catch (error) {
    console.error('❌ Fetch roles error:', error.message);
    return false;
  }
}

async function testCreateUser() {
  console.log('\n=== SETUP: CREATE TEST USER ===');
  try {
    const userData = {
      email: TEST_USER.email,
      phone: undefined, // Make phone optional to avoid validation issues
      password: TEST_USER.password,
      first_name: TEST_USER.firstName,
      last_name: TEST_USER.lastName,
      role_ids: [testRoleId] // Include test role for user creation
    };

    console.log('Request payload:', JSON.stringify(userData, null, 2));

    const response = await makeRequest(
      createOptions('POST', '/rbac/users', authToken),
      userData
    );

    console.log('Status:', response.statusCode);

    if (response.statusCode === 201 && response.body && response.body.data) {
      testUserId = response.body.data.user.id;
      console.log(`✅ Test user created successfully! ID: ${testUserId}`);
      return true;
    } else {
      console.log('❌ Failed to create test user!');
      console.log('Response:', JSON.stringify(response.body, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Create user error:', error.message);
    return false;
  }
}

// ============================================================================
// ISSUE 1: DELETE Request Sending Undefined roleId (Frontend Fix)
// Backend validation ensures invalid roleId returns proper error
// ============================================================================

async function testIssue1_DeleteWithInvalidRoleId() {
  console.log('\n=== ISSUE 1 TEST: DELETE WITH INVALID roleId ===');
  console.log('Description: Verify backend rejects DELETE with invalid roleId format');
  
  try {
    // Test with invalid UUID format
    const response = await makeRequest(
      createOptions('DELETE', `/rbac/users/${testUserId}/roles/invalid-uuid-format`, authToken)
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 400) {
      console.log('✅ PASS: Backend correctly rejects invalid roleId format with 400');
      return true;
    } else {
      console.log('❌ FAIL: Expected 400, got', response.statusCode);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

async function testIssue1_DeleteWithNonExistentRoleId() {
  console.log('\n=== ISSUE 1 TEST: DELETE WITH NON-EXISTENT roleId ===');
  console.log('Description: Verify backend handles non-existent roleId properly');
  
  try {
    // Test with valid UUID format but non-existent role
    const nonExistentRoleId = '00000000-0000-0000-0000-000000000000';
    const response = await makeRequest(
      createOptions('DELETE', `/rbac/users/${testUserId}/roles/${nonExistentRoleId}`, authToken)
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 404 || response.statusCode === 500) {
      console.log('✅ PASS: Backend handles non-existent roleId appropriately');
      return true;
    } else {
      console.log('❌ FAIL: Expected 404 or 500, got', response.statusCode);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

async function testIssue1_DeleteWithValidRoleId() {
  console.log('\n=== ISSUE 1 TEST: DELETE WITH VALID roleId (AFTER ASSIGNMENT) ===');
  console.log('Description: Verify backend accepts DELETE with valid roleId');
  
  try {
    // User already has role from creation, so we can directly test deletion
    const deleteResponse = await makeRequest(
      createOptions('DELETE', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken)
    );

    console.log('Delete Status:', deleteResponse.statusCode);
    console.log('Delete Response:', JSON.stringify(deleteResponse.body, null, 2));

    if (deleteResponse.statusCode === 200) {
      console.log('✅ PASS: Backend correctly accepts DELETE with valid roleId');
      return true;
    } else {
      console.log('❌ FAIL: Expected 200, got', deleteResponse.statusCode);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

// ============================================================================
// ISSUE 2: POST Request Causing 500 Internal Server Error (Backend Fix)
// userRole variable now accessible outside transaction scope
// ============================================================================

async function testIssue2_PostRoleAssignmentWithNullExpiresAt() {
  console.log('\n=== ISSUE 2 TEST: POST ROLE ASSIGNMENT WITH NULL expires_at ===');
  console.log('Description: Verify POST request includes userRole data in response');
  
  try {
    // First remove the existing role to allow re-assignment
    await makeRequest(
      createOptions('DELETE', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken)
    );
    await wait(100);

    const response = await makeRequest(
      createOptions('POST', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken),
      { expires_at: null }
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 201) {
      if (response.body && response.body.data) {
        const userRole = response.body.data;
        
        // Verify response contains all expected fields
        const hasId = !!userRole.id;
        const hasUserId = !!userRole.user_id;
        const hasRoleId = !!userRole.role_id;
        const hasAssignedBy = !!userRole.assigned_by;
        const hasExpiresAt = userRole.expires_at === null;
        const hasIsActive = userRole.is_active === true;

        console.log('Response validation:');
        console.log('  - Has id:', hasId);
        console.log('  - Has user_id:', hasUserId);
        console.log('  - Has role_id:', hasRoleId);
        console.log('  - Has assigned_by:', hasAssignedBy);
        console.log('  - expires_at is null:', hasExpiresAt);
        console.log('  - is_active is true:', hasIsActive);

        if (hasId && hasUserId && hasRoleId && hasAssignedBy && hasExpiresAt && hasIsActive) {
          console.log('✅ PASS: Response includes complete userRole data');
          userRoleRecordId = userRole.id;
          return true;
        } else {
          console.log('❌ FAIL: Response missing required fields');
          return false;
        }
      } else {
        console.log('❌ FAIL: Response missing data field');
        return false;
      }
    } else if (response.statusCode === 500) {
      console.log('❌ FAIL: 500 Internal Server Error - userRole variable issue not fixed');
      return false;
    } else {
      console.log('❌ FAIL: Expected 201, got', response.statusCode);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

async function testIssue2_PostRoleAssignmentWithValidExpiresAt() {
  console.log('\n=== ISSUE 2 TEST: POST ROLE ASSIGNMENT WITH VALID expires_at ===');
  console.log('Description: Verify POST request with valid date includes userRole data');
  
  try {
    // First remove the existing role to allow re-assignment
    await makeRequest(
      createOptions('DELETE', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken)
    );
    await wait(100);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const response = await makeRequest(
      createOptions('POST', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken),
      { expires_at: expiresAt }
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 201) {
      if (response.body && response.body.data) {
        const userRole = response.body.data;
        
        // Verify response contains all expected fields
        const hasId = !!userRole.id;
        const hasUserId = !!userRole.user_id;
        const hasRoleId = !!userRole.role_id;
        const hasAssignedBy = !!userRole.assigned_by;
        const hasExpiresAt = userRole.expires_at === expiresAt;
        const hasIsActive = userRole.is_active === true;

        console.log('Response validation:');
        console.log('  - Has id:', hasId);
        console.log('  - Has user_id:', hasUserId);
        console.log('  - Has role_id:', hasRoleId);
        console.log('  - Has assigned_by:', hasAssignedBy);
        console.log('  - expires_at matches:', hasExpiresAt);
        console.log('  - is_active is true:', hasIsActive);

        if (hasId && hasUserId && hasRoleId && hasAssignedBy && hasExpiresAt && hasIsActive) {
          console.log('✅ PASS: Response includes complete userRole data with expires_at');
          return true;
        } else {
          console.log('❌ FAIL: Response missing required fields or expires_at mismatch');
          return false;
        }
      } else {
        console.log('❌ FAIL: Response missing data field');
        return false;
      }
    } else if (response.statusCode === 500) {
      console.log('❌ FAIL: 500 Internal Server Error - userRole variable issue not fixed');
      return false;
    } else {
      console.log('❌ FAIL: Expected 201, got', response.statusCode);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

async function testIssue2_PostRoleAssignmentTransactionSuccess() {
  console.log('\n=== ISSUE 2 TEST: VERIFY TRANSACTION COMPLETES SUCCESSFULLY ===');
  console.log('Description: Verify role is actually created in database after POST');
  
  try {
    // First remove the existing role to allow re-assignment
    await makeRequest(
      createOptions('DELETE', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken)
    );
    await wait(100);

    // Assign a role
    const assignResponse = await makeRequest(
      createOptions('POST', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken),
      {}
    );

    console.log('Assignment Status:', assignResponse.statusCode);

    if (assignResponse.statusCode === 201) {
      // Wait a moment for transaction to complete
      await wait(100);

      // Verify the role exists by fetching user roles
      const fetchResponse = await makeRequest(
        createOptions('GET', `/rbac/users/${testUserId}/roles`, authToken)
      );

      console.log('Fetch Status:', fetchResponse.statusCode);

      if (fetchResponse.statusCode === 200 && fetchResponse.body && fetchResponse.body.data) {
        const roles = fetchResponse.body.data;
        const hasRole = roles.some(r => r.role_id === testRoleId && r.is_active);

        console.log('User has assigned role:', hasRole);
        console.log('Roles:', JSON.stringify(roles, null, 2));

        if (hasRole) {
          console.log('✅ PASS: Transaction completed successfully, role exists in database');
          return true;
        } else {
          console.log('❌ FAIL: Transaction did not complete, role not found in database');
          return false;
        }
      } else {
        console.log('❌ FAIL: Could not verify role existence');
        return false;
      }
    } else {
      console.log('❌ FAIL: Could not assign role');
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

// ============================================================================
// ISSUE 3: expires_at Validation Error (Backend Fix)
// Validation now accepts null, undefined, and empty strings
// ============================================================================

async function testIssue3_PostWithNullExpiresAt() {
  console.log('\n=== ISSUE 3 TEST: POST WITH NULL expires_at ===');
  console.log('Description: Verify validation accepts null for expires_at');
  
  try {
    // First remove the existing role to allow re-assignment
    await makeRequest(
      createOptions('DELETE', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken)
    );
    await wait(100);

    const response = await makeRequest(
      createOptions('POST', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken),
      { expires_at: null }
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 201) {
      if (response.body && response.body.data) {
        const expiresAt = response.body.data.expires_at;
        console.log('expires_at in response:', expiresAt);
        
        if (expiresAt === null) {
          console.log('✅ PASS: Validation accepts null, stored as null in database');
          return true;
        } else {
          console.log('❌ FAIL: expires_at should be null, got:', expiresAt);
          return false;
        }
      } else {
        console.log('❌ FAIL: Response missing data field');
        return false;
      }
    } else if (response.statusCode === 400) {
      console.log('❌ FAIL: Validation rejected null - fix not working');
      console.log('Validation error:', JSON.stringify(response.body, null, 2));
      return false;
    } else {
      console.log('❌ FAIL: Expected 201, got', response.statusCode);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

async function testIssue3_PostWithUndefinedExpiresAt() {
  console.log('\n=== ISSUE 3 TEST: POST WITH UNDEFINED expires_at ===');
  console.log('Description: Verify validation accepts undefined for expires_at');
  
  try {
    // First remove the existing role to allow re-assignment
    await makeRequest(
      createOptions('DELETE', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken)
    );
    await wait(100);

    const response = await makeRequest(
      createOptions('POST', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken),
      {} // expires_at not provided (undefined)
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 201) {
      if (response.body && response.body.data) {
        const expiresAt = response.body.data.expires_at;
        console.log('expires_at in response:', expiresAt);
        
        if (expiresAt === null) {
          console.log('✅ PASS: Validation accepts undefined, stored as null in database');
          return true;
        } else {
          console.log('❌ FAIL: expires_at should be null, got:', expiresAt);
          return false;
        }
      } else {
        console.log('❌ FAIL: Response missing data field');
        return false;
      }
    } else if (response.statusCode === 400) {
      console.log('❌ FAIL: Validation rejected undefined - fix not working');
      console.log('Validation error:', JSON.stringify(response.body, null, 2));
      return false;
    } else {
      console.log('❌ FAIL: Expected 201, got', response.statusCode);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

async function testIssue3_PostWithEmptyStringExpiresAt() {
  console.log('\n=== ISSUE 3 TEST: POST WITH EMPTY STRING expires_at ===');
  console.log('Description: Verify validation accepts empty string for expires_at');
  
  try {
    // First remove the existing role to allow re-assignment
    await makeRequest(
      createOptions('DELETE', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken)
    );
    await wait(100);

    const response = await makeRequest(
      createOptions('POST', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken),
      { expires_at: '' }
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 201) {
      if (response.body && response.body.data) {
        const expiresAt = response.body.data.expires_at;
        console.log('expires_at in response:', expiresAt);
        
        if (expiresAt === null) {
          console.log('✅ PASS: Validation accepts empty string, stored as null in database');
          return true;
        } else {
          console.log('❌ FAIL: expires_at should be null, got:', expiresAt);
          return false;
        }
      } else {
        console.log('❌ FAIL: Response missing data field');
        return false;
      }
    } else if (response.statusCode === 400) {
      console.log('❌ FAIL: Validation rejected empty string - fix not working');
      console.log('Validation error:', JSON.stringify(response.body, null, 2));
      return false;
    } else {
      console.log('❌ FAIL: Expected 201, got', response.statusCode);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

async function testIssue3_PostWithValidISO8601ExpiresAt() {
  console.log('\n=== ISSUE 3 TEST: POST WITH VALID ISO8601 expires_at ===');
  console.log('Description: Verify validation accepts valid ISO8601 date format');
  
  try {
    // First remove the existing role to allow re-assignment
    await makeRequest(
      createOptions('DELETE', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken)
    );
    await wait(100);

    const validDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const response = await makeRequest(
      createOptions('POST', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken),
      { expires_at: validDate }
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 201) {
      if (response.body && response.body.data) {
        const expiresAt = response.body.data.expires_at;
        console.log('expires_at in response:', expiresAt);
        console.log('Expected expires_at:', validDate);
        
        if (expiresAt === validDate) {
          console.log('✅ PASS: Validation accepts valid ISO8601 date format');
          return true;
        } else {
          console.log('❌ FAIL: expires_at does not match expected value');
          return false;
        }
      } else {
        console.log('❌ FAIL: Response missing data field');
        return false;
      }
    } else if (response.statusCode === 400) {
      console.log('❌ FAIL: Validation rejected valid ISO8601 date');
      console.log('Validation error:', JSON.stringify(response.body, null, 2));
      return false;
    } else {
      console.log('❌ FAIL: Expected 201, got', response.statusCode);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

async function testIssue3_PostWithInvalidDateFormat() {
  console.log('\n=== ISSUE 3 TEST: POST WITH INVALID DATE FORMAT ===');
  console.log('Description: Verify validation rejects invalid date formats');
  
  try {
    // First remove the existing role to allow re-assignment
    await makeRequest(
      createOptions('DELETE', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken)
    );
    await wait(100);

    const response = await makeRequest(
      createOptions('POST', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken),
      { expires_at: 'invalid-date-format' }
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 400) {
      console.log('✅ PASS: Validation correctly rejects invalid date format');
      return true;
    } else {
      console.log('❌ FAIL: Expected 400, got', response.statusCode);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

async function testIssue3_PutWithNullExpiresAt() {
  console.log('\n=== ISSUE 3 TEST: PUT WITH NULL expires_at ===');
  console.log('Description: Verify PUT request also accepts null for expires_at');
  
  try {
    // User already has role from creation, so we can directly test PUT
    const response = await makeRequest(
      createOptions('PUT', `/rbac/users/${testUserId}/roles/${testRoleId}`, authToken),
      { expires_at: null }
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200) {
      if (response.body && response.body.data) {
        const expiresAt = response.body.data.expires_at;
        console.log('expires_at in response:', expiresAt);
        
        if (expiresAt === null) {
          console.log('✅ PASS: PUT validation accepts null');
          return true;
        } else {
          console.log('❌ FAIL: expires_at should be null, got:', expiresAt);
          return false;
        }
      } else {
        console.log('❌ FAIL: Response missing data field');
        return false;
      }
    } else if (response.statusCode === 400) {
      console.log('❌ FAIL: PUT validation rejected null - fix not working');
      console.log('Validation error:', JSON.stringify(response.body, null, 2));
      return false;
    } else {
      console.log('❌ FAIL: Expected 200, got', response.statusCode);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

// ============================================================================
// CLEANUP TESTS
// ============================================================================

async function testCleanup() {
  console.log('\n=== CLEANUP: DELETE TEST USER ===');
  try {
    if (testUserId) {
      const response = await makeRequest(
        createOptions('DELETE', `/users/${testUserId}`, authToken)
      );

      console.log('Status:', response.statusCode);

      if (response.statusCode === 200) {
        console.log('✅ Test user deleted successfully');
        return true;
      } else {
        console.log('⚠️ Could not delete test user (may not exist)');
        return true;
      }
    }
    return true;
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
    return true; // Don't fail the suite if cleanup fails
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   RBAC USER ROLE MANAGEMENT FIXES COMPREHENSIVE TEST SUITE   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTest Configuration:`);
  console.log(`- Backend URL: http://${BASE_URL}:${PORT}`);
  console.log(`- Test User Email: ${TEST_USER.email}`);

  const results = {
    // Setup
    login: false,
    fetchRoles: false,
    createUser: false,
    
    // Issue 1: DELETE Request Sending Undefined roleId
    issue1_deleteInvalidRoleId: false,
    issue1_deleteNonExistentRoleId: false,
    issue1_deleteValidRoleId: false,
    
    // Issue 2: POST Request 500 Error
    issue2_postNullExpiresAt: false,
    issue2_postValidExpiresAt: false,
    issue2_transactionSuccess: false,
    
    // Issue 3: expires_at Validation
    issue3_postNullExpiresAt: false,
    issue3_postUndefinedExpiresAt: false,
    issue3_postEmptyStringExpiresAt: false,
    issue3_postValidISO8601ExpiresAt: false,
    issue3_postInvalidDateFormat: false,
    issue3_putNullExpiresAt: false,
    
    // Cleanup
    cleanup: false
  };

  // Run setup tests
  results.login = await testLogin();
  
  if (results.login) {
    results.fetchRoles = await testFetchRoles();
    
    if (results.fetchRoles) {
      results.createUser = await testCreateUser();
      
      if (results.createUser) {
        // Run Issue 1 tests
        results.issue1_deleteInvalidRoleId = await testIssue1_DeleteWithInvalidRoleId();
        results.issue1_deleteNonExistentRoleId = await testIssue1_DeleteWithNonExistentRoleId();
        results.issue1_deleteValidRoleId = await testIssue1_DeleteWithValidRoleId();
        
        // Run Issue 2 tests
        results.issue2_postNullExpiresAt = await testIssue2_PostRoleAssignmentWithNullExpiresAt();
        results.issue2_postValidExpiresAt = await testIssue2_PostRoleAssignmentWithValidExpiresAt();
        results.issue2_transactionSuccess = await testIssue2_PostRoleAssignmentTransactionSuccess();
        
        // Run Issue 3 tests
        results.issue3_postNullExpiresAt = await testIssue3_PostWithNullExpiresAt();
        results.issue3_postUndefinedExpiresAt = await testIssue3_PostWithUndefinedExpiresAt();
        results.issue3_postEmptyStringExpiresAt = await testIssue3_PostWithEmptyStringExpiresAt();
        results.issue3_postValidISO8601ExpiresAt = await testIssue3_PostWithValidISO8601ExpiresAt();
        results.issue3_postInvalidDateFormat = await testIssue3_PostWithInvalidDateFormat();
        results.issue3_putNullExpiresAt = await testIssue3_PutWithNullExpiresAt();
      }
    }
  }

  // Cleanup
  results.cleanup = await testCleanup();

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   TEST RESULTS SUMMARY                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Setup tests
  console.log('=== SETUP TESTS ===');
  const setupTests = [
    { name: 'Login', key: 'login' },
    { name: 'Fetch Roles', key: 'fetchRoles' },
    { name: 'Create Test User', key: 'createUser' }
  ];

  setupTests.forEach(test => {
    const status = results[test.key] ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${test.name}`);
  });

  // Issue 1 tests
  console.log('\n=== ISSUE 1: DELETE REQUEST SENDING UNDEFINED roleId ===');
  console.log('Frontend Fix: Added validation to check if roleId is undefined');
  console.log('Backend Test: Verify proper error handling for invalid roleId\n');
  
  const issue1Tests = [
    { name: 'DELETE with invalid UUID format', key: 'issue1_deleteInvalidRoleId' },
    { name: 'DELETE with non-existent roleId', key: 'issue1_deleteNonExistentRoleId' },
    { name: 'DELETE with valid roleId', key: 'issue1_deleteValidRoleId' }
  ];

  issue1Tests.forEach(test => {
    const status = results[test.key] ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${test.name}`);
  });

  // Issue 2 tests
  console.log('\n=== ISSUE 2: POST REQUEST CAUSING 500 INTERNAL SERVER ERROR ===');
  console.log('Backend Fix: Moved userRole variable outside transaction scope');
  console.log('Backend Test: Verify response includes userRole data\n');
  
  const issue2Tests = [
    { name: 'POST with null expires_at returns userRole data', key: 'issue2_postNullExpiresAt' },
    { name: 'POST with valid expires_at returns userRole data', key: 'issue2_postValidExpiresAt' },
    { name: 'Transaction completes successfully', key: 'issue2_transactionSuccess' }
  ];

  issue2Tests.forEach(test => {
    const status = results[test.key] ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${test.name}`);
  });

  // Issue 3 tests
  console.log('\n=== ISSUE 3: expires_at VALIDATION ERROR ===');
  console.log('Backend Fix: Updated validation to accept null, undefined, empty string');
  console.log('Backend Test: Verify all valid formats are accepted\n');
  
  const issue3Tests = [
    { name: 'POST with null expires_at', key: 'issue3_postNullExpiresAt' },
    { name: 'POST with undefined expires_at', key: 'issue3_postUndefinedExpiresAt' },
    { name: 'POST with empty string expires_at', key: 'issue3_postEmptyStringExpiresAt' },
    { name: 'POST with valid ISO8601 date', key: 'issue3_postValidISO8601ExpiresAt' },
    { name: 'POST with invalid date format (should reject)', key: 'issue3_postInvalidDateFormat' },
    { name: 'PUT with null expires_at', key: 'issue3_putNullExpiresAt' }
  ];

  issue3Tests.forEach(test => {
    const status = results[test.key] ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${test.name}`);
  });

  // Cleanup
  console.log('\n=== CLEANUP ===');
  const status = results.cleanup ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - Delete Test User`);

  // Overall summary
  const allTests = [
    ...setupTests,
    ...issue1Tests,
    ...issue2Tests,
    ...issue3Tests
  ];

  let passedCount = 0;
  let failedCount = 0;

  allTests.forEach(test => {
    if (results[test.key]) passedCount++;
    else failedCount++;
  });

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   OVERALL SUMMARY                                                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Total Tests: ${allTests.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Success Rate: ${((passedCount / allTests.length) * 100).toFixed(2)}%`);

  if (failedCount === 0) {
    console.log('\n🎉 All tests passed! All three RBAC user role management fixes are working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the errors above.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
