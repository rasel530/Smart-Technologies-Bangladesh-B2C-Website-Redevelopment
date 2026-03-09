/**
 * Order History API Verification Test
 * 
 * This test verifies that the /api/v1/orders/history endpoint
 * returns orders in the correct format for the frontend.
 */

const express = require('express');
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const ordersRouter = require('./routes/orders');

const app = express();
app.use(express.json());
app.use('/api/v1/orders', ordersRouter);

const prisma = new PrismaClient();

async function verifyOrderHistoryAPI() {
  console.log('=== Order History API Verification ===\n');
  
  try {
    // 1. Check if there are orders in the database
    console.log('1. Checking database for orders...');
    const totalOrders = await prisma.order.count();
    console.log(`   Total orders in database: ${totalOrders}\n`);
    
    if (totalOrders === 0) {
      console.log('   ⚠️  No orders found in database. Skipping API test.\n');
      return;
    }
    
    // 2. Get a sample user ID from the orders
    console.log('2. Getting sample user ID from orders...');
    const sampleOrder = await prisma.order.findFirst({
      select: { userId: true }
    });
    
    if (!sampleOrder?.userId) {
      console.log('   ⚠️  No user ID found in orders. Skipping authenticated API test.\n');
      return;
    }
    
    console.log(`   Sample user ID: ${sampleOrder.userId}\n`);
    
    // 3. Mock authentication middleware
    console.log('3. Testing API response structure...');
    const mockAuthMiddleware = (req, res, next) => {
      req.user = {
        id: sampleOrder.userId,
        role: 'USER'
      };
      next();
    };
    
    // Replace the auth middleware in the orders router
    const originalAuth = require('./middleware/auth');
    originalAuth.authenticate = () => mockAuthMiddleware;
    
    // 4. Make API request to /history endpoint
    const response = await request(app)
      .get('/api/v1/orders/history')
      .expect(200);
    
    console.log('   API Response Status:', response.status);
    console.log('   Response Body:', JSON.stringify(response.body, null, 2));
    
    // 5. Verify response structure
    console.log('\n4. Verifying response structure...');
    const { success, data, pagination } = response.body;
    
    const checks = [
      {
        name: 'Response has success field',
        pass: 'success' in response.body,
        expected: true
      },
      {
        name: 'Response has data field',
        pass: 'data' in response.body,
        expected: true
      },
      {
        name: 'Response has pagination field',
        pass: 'pagination' in response.body,
        expected: true
      },
      {
        name: 'success is true',
        pass: success === true,
        expected: true
      },
      {
        name: 'data is an array',
        pass: Array.isArray(data),
        expected: true
      },
      {
        name: 'data has orders',
        pass: Array.isArray(data) && data.length > 0,
        expected: true
      },
      {
        name: 'pagination is an object',
        pass: pagination && typeof pagination === 'object',
        expected: true
      },
      {
        name: 'pagination has page',
        pass: pagination && 'page' in pagination,
        expected: true
      },
      {
        name: 'pagination has limit',
        pass: pagination && 'limit' in pagination,
        expected: true
      },
      {
        name: 'pagination has total',
        pass: pagination && 'total' in pagination,
        expected: true
      },
      {
        name: 'pagination has pages',
        pass: pagination && 'pages' in pagination,
        expected: true
      }
    ];
    
    let allPassed = true;
    checks.forEach(check => {
      const status = check.pass ? '✓' : '✗';
      console.log(`   ${status} ${check.name}: ${check.pass ? 'PASS' : 'FAIL'}`);
      if (!check.pass) allPassed = false;
    });
    
    console.log('\n5. Summary:');
    if (allPassed) {
      console.log('   ✅ All checks passed! API response structure is correct.');
      console.log(`   ✅ Orders returned: ${data.length} of ${totalOrders} total`);
    } else {
      console.log('   ❌ Some checks failed. API response structure needs fixing.');
    }
    
    // 6. Verify order structure
    if (data && data.length > 0) {
      console.log('\n6. Verifying first order structure...');
      const firstOrder = data[0];
      const orderChecks = [
        {
          name: 'Order has id',
          pass: 'id' in firstOrder,
          expected: true
        },
        {
          name: 'Order has orderNumber',
          pass: 'orderNumber' in firstOrder,
          expected: true
        },
        {
          name: 'Order has status',
          pass: 'status' in firstOrder,
          expected: true
        },
        {
          name: 'Order has total',
          pass: 'total' in firstOrder,
          expected: true
        },
        {
          name: 'Order has createdAt',
          pass: 'createdAt' in firstOrder,
          expected: true
        },
        {
          name: 'Order has items array',
          pass: 'items' in firstOrder && Array.isArray(firstOrder.items),
          expected: true
        }
      ];
      
      orderChecks.forEach(check => {
        const status = check.pass ? '✓' : '✗';
        console.log(`   ${status} ${check.name}: ${check.pass ? 'PASS' : 'FAIL'}`);
      });
    }
    
    console.log('\n=== Verification Complete ===\n');
    
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyOrderHistoryAPI();
