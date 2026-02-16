const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { execSync } = require('child_process');

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

    // 3. Test RBAC roles endpoint using curl
    console.log('\n3. Testing RBAC roles endpoint using curl...');
    console.log('   URL: http://localhost:3001/api/v1/rbac/roles');
    
    try {
      const curlResult = execSync(
        `curl -s -w "\\nHTTP_CODE:%{http_code}" -H "Authorization: Bearer ${token}" http://localhost:3001/api/v1/rbac/roles`,
        { encoding: 'utf-8' }
      );
      console.log('   Response:', curlResult);
    } catch (error) {
      console.error('   ❌ Curl error:', error.message);
    }

    // 4. Test token refresh endpoint
    console.log('\n4. Testing token refresh endpoint using curl...');
    try {
      const refreshResult = execSync(
        `curl -s -w "\\nHTTP_CODE:%{http_code}" -H "Content-Type: application/json" -d '{"token":"${token}"}' http://localhost:3001/api/v1/auth/refresh`,
        { encoding: 'utf-8' }
      );
      console.log('   Response:', refreshResult);
    } catch (error) {
      console.error('   ❌ Curl error:', error.message);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== Test Complete ===');
  }
}

testRbacRolesEndpoint();
