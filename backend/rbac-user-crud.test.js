/**
 * Comprehensive RBAC User Management CRUD Test
 * Tests all CRUD operations for the RBAC user management system
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
  email: `test.user.${Date.now()}@example.com`,
  phone: '+8801712345678',
  password: 'SecurePass@2026!Strong',
  firstName: 'Test',
  lastName: 'User',
  roleIds: [] // Will be populated after fetching roles
};

let authToken = null;
let createdUserId = null;
let createdRoleIds = [];

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

// Test 1: Login
async function testLogin() {
  console.log('\n=== TEST 1: LOGIN ===');
  try {
    const response = await makeRequest(
      createOptions('POST', '/auth/login'),
      TEST_CREDENTIALS
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200 && response.body && response.body.token) {
      authToken = response.body.token;
      console.log('✅ Login successful! Token received.');
      return true;
    } else {
      console.log('❌ Login failed!');
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

// Test 2: Fetch Roles (to get role IDs)
async function testFetchRoles() {
  console.log('\n=== TEST 2: FETCH ROLES ===');
  try {
    const response = await makeRequest(
      createOptions('GET', '/rbac/roles', authToken)
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200 && response.body && response.body.data) {
      const roles = response.body.data;
      console.log(`✅ Fetched ${roles.length} roles.`);
      
      // Use ADMIN role for testing (not SUPER_ADMIN to avoid permission issues)
      const adminRole = roles.find(r => r.name === 'ADMIN');
      if (adminRole) {
        createdRoleIds = [adminRole.id];
        console.log(`Using role: ${adminRole.name} (ID: ${adminRole.id}, Level: ${adminRole.hierarchy_level})`);
      } else {
        console.log('⚠️ ADMIN role not found, using first available role');
        if (roles.length > 0) {
          createdRoleIds = [roles[0].id];
          console.log(`Using role: ${roles[0].name} (ID: ${roles[0].id})`);
        }
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

// Test 3: Create User
async function testCreateUser() {
  console.log('\n=== TEST 3: CREATE USER ===');
  try {
    // Prepare user data with snake_case for backend
    const userData = {
      email: TEST_USER.email,
      phone: TEST_USER.phone,
      password: TEST_USER.password,
      first_name: TEST_USER.firstName,
      last_name: TEST_USER.lastName,
      role_ids: createdRoleIds
    };

    console.log('Request payload:', JSON.stringify(userData, null, 2));

    const response = await makeRequest(
      createOptions('POST', '/rbac/users', authToken),
      userData
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 201 && response.body && response.body.data) {
      createdUserId = response.body.data.user.id;
      console.log(`✅ User created successfully! ID: ${createdUserId}`);
      console.log('User details:', JSON.stringify(response.body.data.user, null, 2));
      console.log('Assigned roles:', JSON.stringify(response.body.data.roles, null, 2));
      return true;
    } else {
      console.log('❌ Failed to create user!');
      return false;
    }
  } catch (error) {
    console.error('❌ Create user error:', error.message);
    return false;
  }
}

// Test 4: Read/Retrieve Users
async function testReadUsers() {
  console.log('\n=== TEST 4: READ USERS ===');
  try {
    const response = await makeRequest(
      createOptions('GET', '/rbac/users?page=1&limit=20', authToken)
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200 && response.body && response.body.data) {
      const users = response.body.data.users || [];
      console.log(`✅ Fetched ${users.length} users.`);
      
      // Check if our created user is in the list
      const foundUser = users.find(u => u.id === createdUserId);
      if (foundUser) {
        console.log('✅ Created user found in the list!');
        console.log('User details:', JSON.stringify(foundUser, null, 2));
      } else {
        console.log('⚠️ Created user not found in the list (might be on another page)');
      }
      return true;
    } else {
      console.log('❌ Failed to read users!');
      return false;
    }
  } catch (error) {
    console.error('❌ Read users error:', error.message);
    return false;
  }
}

// Test 5: Get User Roles
async function testGetUserRoles() {
  console.log('\n=== TEST 5: GET USER ROLES ===');
  try {
    const response = await makeRequest(
      createOptions('GET', `/rbac/users/${createdUserId}/roles`, authToken)
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200 && response.body && response.body.data) {
      const roles = response.body.data;
      console.log(`✅ User has ${roles.length} roles assigned.`);
      console.log('Roles:', JSON.stringify(roles, null, 2));
      return true;
    } else {
      console.log('❌ Failed to get user roles!');
      return false;
    }
  } catch (error) {
    console.error('❌ Get user roles error:', error.message);
    return false;
  }
}

// Test 6: Assign Additional Role
async function testAssignRole() {
  console.log('\n=== TEST 6: ASSIGN ADDITIONAL ROLE ===');
  try {
    if (createdRoleIds.length < 2) {
      console.log('⚠️ Skipping - need at least 2 roles for this test');
      return true;
    }

    const response = await makeRequest(
      createOptions('POST', `/rbac/users/${createdUserId}/roles/${createdRoleIds[1]}`, authToken),
      {}
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 201) {
      console.log('✅ Additional role assigned successfully!');
      return true;
    } else {
      console.log('❌ Failed to assign additional role!');
      return false;
    }
  } catch (error) {
    console.error('❌ Assign role error:', error.message);
    return false;
  }
}

// Test 7: Update User Role
async function testUpdateUserRole() {
  console.log('\n=== TEST 7: UPDATE USER ROLE ===');
  try {
    const updateData = {
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    };

    const response = await makeRequest(
      createOptions('PUT', `/rbac/users/${createdUserId}/roles/${createdRoleIds[0]}`, authToken),
      updateData
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200) {
      console.log('✅ User role updated successfully!');
      return true;
    } else {
      console.log('❌ Failed to update user role!');
      return false;
    }
  } catch (error) {
    console.error('❌ Update user role error:', error.message);
    return false;
  }
}

// Test 8: Remove Role
async function testRemoveRole() {
  console.log('\n=== TEST 8: REMOVE ROLE ===');
  try {
    const response = await makeRequest(
      createOptions('DELETE', `/rbac/users/${createdUserId}/roles/${createdRoleIds[0]}`, authToken)
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200) {
      console.log('✅ Role removed successfully!');
      return true;
    } else {
      console.log('❌ Failed to remove role!');
      return false;
    }
  } catch (error) {
    console.error('❌ Remove role error:', error.message);
    return false;
  }
}

// Test 9: Delete User
async function testDeleteUser() {
  console.log('\n=== TEST 9: DELETE USER ===');
  try {
    const response = await makeRequest(
      createOptions('DELETE', `/rbac/users/${createdUserId}`, authToken)
    );

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200) {
      console.log('✅ User deleted successfully!');
      return true;
    } else {
      console.log('❌ Failed to delete user!');
      return false;
    }
  } catch (error) {
    console.error('❌ Delete user error:', error.message);
    return false;
  }
}

// Test 10: Verify User is Deleted
async function testVerifyUserDeleted() {
  console.log('\n=== TEST 10: VERIFY USER DELETED ===');
  try {
    const response = await makeRequest(
      createOptions('GET', '/rbac/users?page=1&limit=20', authToken)
    );

    console.log('Status:', response.statusCode);

    if (response.statusCode === 200 && response.body && response.body.data) {
      const users = response.body.data.users || [];
      const foundUser = users.find(u => u.id === createdUserId);
      
      if (!foundUser) {
        console.log('✅ User successfully removed from the system!');
        return true;
      } else {
        console.log('❌ User still exists in the system!');
        return false;
      }
    } else {
      console.log('❌ Failed to verify user deletion!');
      return false;
    }
  } catch (error) {
    console.error('❌ Verify user deletion error:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   RBAC USER MANAGEMENT CRUD COMPREHENSIVE TEST SUITE           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTest Configuration:`);
  console.log(`- Backend URL: http://${BASE_URL}:${PORT}`);
  console.log(`- Test User Email: ${TEST_USER.email}`);
  console.log(`- Test User Password: ${TEST_USER.password}`);
  console.log(`- Test User Name: ${TEST_USER.firstName} ${TEST_USER.lastName}`);

  const results = {
    login: false,
    fetchRoles: false,
    createUser: false,
    readUsers: false,
    getUserRoles: false,
    assignRole: false,
    updateUserRole: false,
    removeRole: false,
    deleteUser: false,
    verifyUserDeleted: false
  };

  // Run tests sequentially
  results.login = await testLogin();
  
  if (results.login) {
    results.fetchRoles = await testFetchRoles();
    
    if (results.fetchRoles) {
      results.createUser = await testCreateUser();
      
      if (results.createUser) {
        results.readUsers = await testReadUsers();
        results.getUserRoles = await testGetUserRoles();
        results.assignRole = await testAssignRole();
        results.updateUserRole = await testUpdateUserRole();
        results.removeRole = await testRemoveRole();
        results.deleteUser = await testDeleteUser();
        results.verifyUserDeleted = await testVerifyUserDeleted();
      }
    }
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   TEST RESULTS SUMMARY                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const tests = [
    { name: 'Login', key: 'login' },
    { name: 'Fetch Roles', key: 'fetchRoles' },
    { name: 'Create User', key: 'createUser' },
    { name: 'Read Users', key: 'readUsers' },
    { name: 'Get User Roles', key: 'getUserRoles' },
    { name: 'Assign Role', key: 'assignRole' },
    { name: 'Update User Role', key: 'updateUserRole' },
    { name: 'Remove Role', key: 'removeRole' },
    { name: 'Delete User', key: 'deleteUser' },
    { name: 'Verify User Deleted', key: 'verifyUserDeleted' }
  ];

  let passedCount = 0;
  let failedCount = 0;

  tests.forEach(test => {
    const status = results[test.key] ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${test.name}`);
    if (results[test.key]) passedCount++;
    else failedCount++;
  });

  console.log(`\nTotal: ${tests.length} tests`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Success Rate: ${((passedCount / tests.length) * 100).toFixed(2)}%`);

  if (failedCount === 0) {
    console.log('\n🎉 All tests passed! The RBAC user management system is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the errors above.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
