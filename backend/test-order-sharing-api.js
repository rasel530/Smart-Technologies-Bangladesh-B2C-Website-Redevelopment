/**
 * Comprehensive test for Order Sharing Management API
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api/v1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@smarttech.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Store auth token
let authToken = null;

async function login() {
  console.log('=== Login ===\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success && data.data.token) {
      authToken = data.data.token;
      console.log('✅ Login successful');
      console.log(`Token: ${authToken.substring(0, 50)}...`);
      return true;
    } else {
      console.log('❌ Login failed:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function testGetSharedOrders() {
  console.log('\n=== Test: Get Shared Orders ===\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders/sharing?page=1&limit=20`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log(`\n✅ Found ${data.shares.length} shared orders`);
      console.log(`Total: ${data.total}`);
      console.log(`Page: ${data.page} of ${data.totalPages}`);
      
      if (data.shares.length > 0) {
        console.log('\nSample shares:');
        data.shares.slice(0, 3).forEach(share => {
          console.log(`  - ${share.shareToken} (${share.shareType})`);
          console.log(`    Order: ${share.orderNumber || 'N/A'}`);
          console.log(`    Views: ${share.viewCount}`);
          console.log(`    Active: ${share.isActive}`);
        });
      }
      return true;
    } else {
      console.log('❌ Failed to get shared orders');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testGetSharingStats() {
  console.log('\n=== Test: Get Sharing Statistics ===\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders/sharing/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('\n✅ Statistics retrieved successfully');
      console.log(`Total Shared: ${data.data.totalShared}`);
      console.log(`Active Shares: ${data.data.activeShares}`);
      console.log(`Total Views: ${data.data.totalViews}`);
      console.log(`By Type:`, data.data.byType);
      return true;
    } else {
      console.log('❌ Failed to get statistics');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testSearchAndFilter() {
  console.log('\n=== Test: Search and Filter ===\n');
  
  const tests = [
    { name: 'Filter by share type', params: '?shareType=public_link' },
    { name: 'Filter by active status', params: '?isActive=true' },
    { name: 'Filter by inactive status', params: '?isActive=false' },
    { name: 'Search by order ID', params: '?orderId=ORD1772342422736839' }
  ];

  for (const test of tests) {
    console.log(`\nTest: ${test.name}`);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/sharing${test.params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`  ✅ Success - Found ${data.shares.length} results`);
      } else {
        console.log(`  ❌ Failed - Status: ${response.status}`);
      }
    } catch (error) {
      console.error(`  ❌ Error:`, error.message);
    }
  }
}

async function testDisableShare(shareId) {
  console.log(`\n=== Test: Disable Share (${shareId}) ===\n`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders/sharing/${shareId}/disable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Share disabled successfully');
      return true;
    } else {
      console.log('❌ Failed to disable share');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testDeleteShare(shareId) {
  console.log(`\n=== Test: Delete Share (${shareId}) ===\n`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders/sharing/${shareId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Share deleted successfully');
      return true;
    } else {
      console.log('❌ Failed to delete share');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testBulkDisable(shareIds) {
  console.log('\n=== Test: Bulk Disable Shares ===\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders/sharing/bulk-disable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ shareIds })
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log(`✅ ${data.disabledCount} shares disabled successfully`);
      return true;
    } else {
      console.log('❌ Failed to bulk disable shares');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     Order Sharing Management - Comprehensive API Test          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Login
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  // Get all shared orders
  const getSuccess = await testGetSharedOrders();
  
  if (getSuccess) {
    // Get sharing statistics
    await testGetSharingStats();
    
    // Test search and filter
    await testSearchAndFilter();
    
    // Get a share ID for CRUD tests
    const getResponse = await fetch(`${API_BASE_URL}/admin/orders/sharing?page=1&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    const getData = await getResponse.json();
    
    if (getData.success && getData.shares.length > 0) {
      const shareId = getData.shares[0].id;
      
      // Test disable
      await testDisableShare(shareId);
      
      // Test delete (create a new share first)
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const orders = await prisma.order.findMany({ take: 1 });
      if (orders.length > 0) {
        const newShare = await prisma.orderSharing.create({
          data: {
            orderId: orders[0].id,
            token: `test_delete_${Date.now()}`,
            shareType: 'public_link',
            isActive: true,
            viewCount: 0,
            createdBy: 'test'
          }
        });
        
        await testDeleteShare(newShare.id);
      }
      
      await prisma.$disconnect();
      
      // Test bulk operations
      const allSharesResponse = await fetch(`${API_BASE_URL}/admin/orders/sharing?page=1&limit=5`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      const allSharesData = await allSharesResponse.json();
      
      if (allSharesData.success && allSharesData.shares.length >= 2) {
        const shareIds = allSharesData.shares.slice(0, 2).map(s => s.id);
        await testBulkDisable(shareIds);
      }
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    Test Complete                               ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
}

runAllTests();
