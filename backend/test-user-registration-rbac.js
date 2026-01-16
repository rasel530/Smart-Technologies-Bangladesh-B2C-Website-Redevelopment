const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUserRegistration() {
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
  const API_BASE = `${BACKEND_URL}/api/v1/auth`;

  console.log('=== USER REGISTRATION RBAC TEST ===\n');

  // Test data
  const uniqueId = Date.now();
  const testUser = {
    email: `rbac-test-${uniqueId}@smarttech.com`,
    password: 'SecureP@ssw0rd!',  // Strong password with uppercase, lowercase, number, special char
    confirmPassword: 'SecureP@ssw0rd!',
    firstName: 'RBAC',
    lastName: 'Test',
    phone: `017123456${uniqueId % 100}`  // Unique phone number
  };

  console.log('Test User:', testUser.email);
  console.log('Password: TestPassword123!\n');

  try {
    // Step 1: Register new user
    console.log('Step 1: Registering new user...');
    const registerResponse = await axios.post(`${API_BASE}/register`, testUser, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('Registration Status:', registerResponse.status);
    console.log('Registration Response:', JSON.stringify(registerResponse.data, null, 2));

    if (registerResponse.status !== 201) {
      console.error('✗ Registration failed');
      console.error('Error:', registerResponse.data);
      return;
    }

    const userId = registerResponse.data.user?.id;
    if (!userId) {
      console.error('✗ No user ID in response');
      return;
    }

    console.log('✓ User registered successfully');
    console.log('User ID:', userId);

    // Step 2: Check if user has CUSTOMER role in user_roles table
    console.log('\nStep 2: Checking RBAC role assignment...');
    const userRoles = await prisma.$queryRaw`
      SELECT
        ur.role_id,
        r.name as role_name,
        ur.is_active,
        ur.assigned_at
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ${userId}
    `;

    if (userRoles.length === 0) {
      console.error('✗ No RBAC role assigned to user!');
      return;
    }

    const userRole = userRoles[0];
    console.log('✓ RBAC Role assigned:', userRole.role_name);
    console.log('  Role ID:', userRole.role_id);
    console.log('  Is Active:', userRole.is_active);
    console.log('  Assigned At:', userRole.assigned_at);

    // Verify it's CUSTOMER role
    if (userRole.role_name !== 'CUSTOMER') {
      console.error('✗ Wrong role assigned! Expected CUSTOMER, got:', userRole.role_name);
      return;
    }

    console.log('✓ Correct CUSTOMER role assigned');

    // Step 3: Verify legacy role field
    console.log('\nStep 3: Verifying legacy role field...');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true
      }
    });

    if (!user) {
      console.error('✗ User not found in database');
      return;
    }

    console.log('Legacy Role:', user.role);
    console.log('Status:', user.status);

    if (user.role !== 'customer') {
      console.error('✗ Wrong legacy role! Expected customer, got:', user.role);
      return;
    }

    console.log('✓ Legacy role is correct');

    // Step 4: Verify role consistency
    console.log('\nStep 4: Verifying role consistency...');
    const legacyRole = user.role.toUpperCase(); // customer -> CUSTOMER
    const rbacRole = userRole.role_name; // CUSTOMER

    if (legacyRole === rbacRole) {
      console.log('✓ Legacy and RBAC roles match!');
    } else {
      console.error('✗ Role mismatch!');
      console.error('  Legacy:', legacyRole);
      console.error('  RBAC:', rbacRole);
    }

    // Step 5: Test login
    console.log('\nStep 5: Testing login with new user...');
    const loginResponse = await axios.post(`${API_BASE}/login`, {
      identifier: testUser.email,
      password: testUser.password
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('Login Status:', loginResponse.status);

    if (loginResponse.status !== 200) {
      console.error('✗ Login failed');
      console.error('Error:', loginResponse.data);
      return;
    }

    console.log('✓ Login successful');
    console.log('User Role in response:', loginResponse.data.user.role);

    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log('✓ All tests passed!');
    console.log('✓ New user registration assigns CUSTOMER role in RBAC system');
    console.log('✓ Legacy role field is set correctly');
    console.log('✓ RBAC and legacy roles are consistent');
    console.log('✓ User can login successfully');

  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
      console.error('Status:', error.response.status);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testUserRegistration();
