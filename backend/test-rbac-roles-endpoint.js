const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testRbacRolesEndpoint() {
  try {
    console.log('=== Testing RBAC Roles Endpoint ===\n');

    // 1. Find admin user
    console.log('1. Finding admin user...');
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@smarttech.com' },
      select: { id: true, email: true, status: true }
    });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    console.log('✅ Admin user found:', { id: adminUser.id, email: adminUser.email, status: adminUser.status });

    // 2. Generate token
    console.log('\n2. Generating JWT token...');
    const payload = { userId: adminUser.id, email: adminUser.email };
    const secret = 'smarttech-super-secret-jwt-key-change-in-production-2024-at-least-32-chars';
    const token = jwt.sign(payload, secret, { 
      expiresIn: '1h',
      issuer: 'smart-ecommerce-api',
      audience: 'smart-ecommerce-clients'
    });
    console.log('✅ Token generated (first 50 chars):', token.substring(0, 50) + '...');

    // 3. Test RBAC roles endpoint
    console.log('\n3. Testing RBAC roles endpoint...');
    console.log('   URL: http://localhost:3001/api/v1/rbac/roles');
    
    const response = await fetch('http://localhost:3001/api/v1/rbac/roles', {
      method: 'GET',
      headers: { 
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Response status:', response.status);
    console.log('   Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log('   Response body:', data);

    // 4. Test token refresh endpoint
    console.log('\n4. Testing token refresh endpoint...');
    const refreshResponse = await fetch('http://localhost:3001/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token })
    });
    
    console.log('   Refresh response status:', refreshResponse.status);
    const refreshData = await refreshResponse.text();
    console.log('   Refresh response body:', refreshData);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== Test Complete ===');
  }
}

testRbacRolesEndpoint();
