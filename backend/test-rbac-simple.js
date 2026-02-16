const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const http = require('http');

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

    // 3. Test RBAC roles endpoint using Node http module
    console.log('\n3. Testing RBAC roles endpoint using Node http...');
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/v1/rbac/roles',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log('   Response status:', res.statusCode);
          console.log('   Response headers:', JSON.stringify(res.headers, null, 2));
          console.log('   Response body:', data);
          resolve();
        });
        
        res.on('error', (err) => {
          console.error('   ❌ Request error:', err.message);
          reject(err);
        });
      });

      req.on('error', (err) => {
        console.error('   ❌ Connection error:', err.message);
        reject(err);
      });

      req.end();
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('\n=== Test Complete ===');
  }
}

testRbacRolesEndpoint();
