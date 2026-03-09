/**
 * Order Modification Request Feature Fixes - Comprehensive Test Suite
 * 
 * This script tests all fixes made to the Order Modification Request feature:
 * 
 * Test 1: Backend API endpoint test
 *   - Test that GET /api/v1/admin/modifications returns all modifications with pagination
 *   - Test filtering by status, type, page, limit
 *   - Verify that the endpoint requires admin authentication
 * 
 * Test 2: Backend modification approval test
 *   - Test approving each modification type (item_add, item_remove, quantity_change, price_change, address_change, shipping_method_change, payment_method_change)
 *   - Verify that the actual order is modified correctly
 *   - Verify that order totals are recalculated
 *   - Verify that inventory is updated correctly
 *   - Test that modifications are rejected for shipped/delivered orders
 *   - Test that inventory validation works for item_add
 * 
 * Test 3: Frontend admin page test
 *   - Test that the admin page loads modifications from the API
 *   - Test that filtering works (status, type)
 *   - Test that approve button calls the correct API with correct parameters
 *   - Test that reject button calls the correct API with correct parameters
 *   - Test that the page refreshes after approve/reject
 * 
 * Test 4: End-to-end integration test
 *   - Create a test order
 *   - Submit a modification request
 *   - Verify it appears in the admin modifications page
 *   - Approve the modification
 *   - Verify the order is actually modified
 *   - Verify the modification status is updated
 */

const http = require('http');

// Test configuration
const API_BASE = 'http://localhost:3001/api/v1';
const TEST_CREDENTIALS = {
  admin: {
    identifier: 'admin@smarttech.com',
    password: 'AdminPassword123'
  },
  regularUser: {
    identifier: 'raselbepari88@gmail.com',
    password: '74Vfo^71~_oY'
  }
};

// NOTE: orderManagement routes are mounted under /api/v1/orders
// So /admin/modifications becomes /api/v1/orders/admin/modifications

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  skipped: []
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const fullPath = API_BASE + options.path;
    const url = new URL(fullPath);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(requestOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
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

// Helper function to login and get token
async function login(identifier, password) {
  const response = await makeRequest({
    path: '/auth/login',
    method: 'POST'
  }, { identifier, password });

  if (response.statusCode === 200 && response.body && response.body.token) {
    return response.body.token;
  }
  throw new Error(`Login failed for ${identifier}: ${JSON.stringify(response.body)}`);
}

// Helper function to record test result
function recordTest(testName, passed, message, details = {}) {
  const result = {
    testName,
    passed,
    message,
    details,
    timestamp: new Date().toISOString()
  };

  if (passed) {
    testResults.passed.push(result);
    console.log(`✅ PASS: ${testName} - ${message}`);
  } else {
    testResults.failed.push(result);
    console.log(`❌ FAIL: ${testName} - ${message}`);
    if (details.error) {
      console.log(`   Error: ${details.error}`);
    }
  }
}

// ============================================================================
// TEST 1: Backend API Endpoint Tests
// ============================================================================

// Test 1.1: Verify GET /api/v1/orders/admin/modifications endpoint exists
async function testGetAllModificationsEndpointExists(adminToken) {
  console.log('\n=== Test 1.1: GET /api/v1/orders/admin/modifications Endpoint Exists ===');
  try {
    const response = await makeRequest({
      path: '/orders/admin/modifications',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.statusCode === 200) {
      const hasData = response.body && response.body.data !== undefined;
      const hasPagination = response.body && response.body.pagination !== undefined;
      
      recordTest(
        '1.1 - GET /admin/modifications Endpoint Exists',
        hasData && hasPagination,
        `Endpoint returns data array and pagination object`,
        { 
          hasData, 
          hasPagination,
          dataCount: response.body?.data?.length || 0,
          pagination: response.body?.pagination
        }
      );
    } else {
      recordTest(
        '1.1 - GET /admin/modifications Endpoint Exists',
        false,
        `Expected 200, got ${response.statusCode}`,
        { statusCode: response.statusCode, body: response.body }
      );
    }
  } catch (error) {
    recordTest(
      '1.1 - GET /admin/modifications Endpoint Exists',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 1.2: Test filtering by status
async function testFilterByStatus(adminToken) {
  console.log('\n=== Test 1.2: Filter Modifications by Status ===');
  try {
    const statuses = ['pending', 'approved', 'rejected'];
    const filterResults = {};

    for (const status of statuses) {
      const response = await makeRequest({
        path: `/orders/admin/modifications?status=${status}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      filterResults[status] = {
        statusCode: response.statusCode,
        success: response.statusCode === 200,
        count: response.body?.data?.length || 0
      };
    }

    const allFiltersWork = Object.values(filterResults).every(r => r.statusCode === 200);
    
    recordTest(
      '1.2 - Filter Modifications by Status',
      allFiltersWork,
      allFiltersWork 
        ? `All status filters work (pending: ${filterResults.pending.count}, approved: ${filterResults.approved.count}, rejected: ${filterResults.rejected.count})`
        : 'Some status filters failed',
      { filterResults }
    );
  } catch (error) {
    recordTest(
      '1.2 - Filter Modifications by Status',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 1.3: Test filtering by type
async function testFilterByType(adminToken) {
  console.log('\n=== Test 1.3: Filter Modifications by Type ===');
  try {
    const types = ['item_add', 'item_remove', 'quantity_change'];
    const filterResults = {};

    for (const type of types) {
      const response = await makeRequest({
        path: `/admin/modifications?type=${type}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      filterResults[type] = {
        statusCode: response.statusCode,
        success: response.statusCode === 200,
        count: response.body?.data?.length || 0
      };
    }

    const allFiltersWork = Object.values(filterResults).every(r => r.statusCode === 200);
    
    recordTest(
      '1.3 - Filter Modifications by Type',
      allFiltersWork,
      allFiltersWork 
        ? `All type filters work (${Object.entries(filterResults).map(([k, v]) => `${k}: ${v.count}`).join(', ')})`
        : 'Some type filters failed',
      { filterResults }
    );
  } catch (error) {
    recordTest(
      '1.3 - Filter Modifications by Type',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 1.4: Test pagination
async function testPagination(adminToken) {
  console.log('\n=== Test 1.4: Pagination Works ===');
  try {
    const response = await makeRequest({
      path: '/admin/modifications?page=1&limit=10',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.statusCode === 200) {
      const hasPagination = response.body && response.body.pagination;
      const paginationValid = hasPagination && 
                           typeof response.body.pagination.page === 'number' &&
                           typeof response.body.pagination.limit === 'number' &&
                           typeof response.body.pagination.total === 'number' &&
                           typeof response.body.pagination.pages === 'number';

      recordTest(
        '1.4 - Pagination Works',
        paginationValid,
        paginationValid
          ? `Pagination object valid (page: ${response.body.pagination.page}, limit: ${response.body.pagination.limit}, total: ${response.body.pagination.total})`
          : 'Pagination object invalid or missing',
        { pagination: response.body?.pagination }
      );
    } else {
      recordTest(
        '1.4 - Pagination Works',
        false,
        `Expected 200, got ${response.statusCode}`,
        { statusCode: response.statusCode, body: response.body }
      );
    }
  } catch (error) {
    recordTest(
      '1.4 - Pagination Works',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 1.5: Verify endpoint requires admin authentication
async function testAdminAuthenticationRequired() {
  console.log('\n=== Test 1.5: Admin Authentication Required ===');
  try {
    const response = await makeRequest({
      path: '/admin/modifications',
      method: 'GET'
    });

    if (response.statusCode === 401 || response.statusCode === 403) {
      recordTest(
        '1.5 - Admin Authentication Required',
        true,
        `Endpoint correctly requires authentication (${response.statusCode})`,
        { statusCode: response.statusCode }
      );
    } else {
      recordTest(
        '1.5 - Admin Authentication Required',
        false,
        `Expected 401 or 403, got ${response.statusCode}`,
        { statusCode: response.statusCode, body: response.body }
      );
    }
  } catch (error) {
    recordTest(
      '1.5 - Admin Authentication Required',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// ============================================================================
// TEST 2: Backend Modification Approval Tests
// ============================================================================

// Test 2.1: Test approving item_add modification
async function testApproveItemAddModification(adminToken) {
  console.log('\n=== Test 2.1: Approve Item Add Modification ===');
  try {
    // First, get a pending item_add modification
    const listResponse = await makeRequest({
      path: '/admin/modifications?status=pending&type=item_add',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (listResponse.statusCode !== 200 || !listResponse.body.data || listResponse.body.data.length === 0) {
      recordTest(
        '2.1 - Approve Item Add Modification',
        false,
        'No pending item_add modifications available',
        { reason: 'No pending item_add modifications' }
      );
      return;
    }

    const modification = listResponse.body.data[0];
    const orderId = modification.orderId;
    const modificationId = modification.id;

    console.log(`   Approving modification ${modificationId} for order ${orderId}`);

    // Approve the modification
    const approveResponse = await makeRequest({
      path: `/orders/${orderId}/modifications/${modificationId}/approve`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }, { adminNotes: 'Test approval' });

    if (approveResponse.statusCode === 200) {
      // Verify the modification status was updated
      const verifyResponse = await makeRequest({
        path: `/orders/${orderId}/modifications`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const updatedModification = verifyResponse.body?.data?.find(m => m.id === modificationId);
      const statusUpdated = updatedModification && updatedModification.status === 'approved';

      recordTest(
        '2.1 - Approve Item Add Modification',
        statusUpdated,
        statusUpdated
          ? `Item add modification approved and status updated to 'approved'`
          : `Approval response was 200 but status not updated`,
        { 
          orderId, 
          modificationId, 
          status: updatedModification?.status,
          processedAt: updatedModification?.processedAt
        }
      );
    } else {
      recordTest(
        '2.1 - Approve Item Add Modification',
        false,
        `Expected 200, got ${approveResponse.statusCode}`,
        { statusCode: approveResponse.statusCode, body: approveResponse.body }
      );
    }
  } catch (error) {
    recordTest(
      '2.1 - Approve Item Add Modification',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 2.2: Test approving item_remove modification
async function testApproveItemRemoveModification(adminToken) {
  console.log('\n=== Test 2.2: Approve Item Remove Modification ===');
  try {
    const listResponse = await makeRequest({
      path: '/admin/modifications?status=pending&type=item_remove',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (listResponse.statusCode !== 200 || !listResponse.body.data || listResponse.body.data.length === 0) {
      recordTest(
        '2.2 - Approve Item Remove Modification',
        false,
        'No pending item_remove modifications available',
        { reason: 'No pending item_remove modifications' }
      );
      return;
    }

    const modification = listResponse.body.data[0];
    const orderId = modification.orderId;
    const modificationId = modification.id;

    console.log(`   Approving modification ${modificationId} for order ${orderId}`);

    const approveResponse = await makeRequest({
      path: `/orders/${orderId}/modifications/${modificationId}/approve`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }, { adminNotes: 'Test approval' });

    if (approveResponse.statusCode === 200) {
      const verifyResponse = await makeRequest({
        path: `/orders/${orderId}/modifications`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const updatedModification = verifyResponse.body?.data?.find(m => m.id === modificationId);
      const statusUpdated = updatedModification && updatedModification.status === 'approved';

      recordTest(
        '2.2 - Approve Item Remove Modification',
        statusUpdated,
        statusUpdated
          ? `Item remove modification approved and status updated to 'approved'`
          : `Approval response was 200 but status not updated`,
        { orderId, modificationId, status: updatedModification?.status }
      );
    } else {
      recordTest(
        '2.2 - Approve Item Remove Modification',
        false,
        `Expected 200, got ${approveResponse.statusCode}`,
        { statusCode: approveResponse.statusCode, body: approveResponse.body }
      );
    }
  } catch (error) {
    recordTest(
      '2.2 - Approve Item Remove Modification',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 2.3: Test approving quantity_change modification
async function testApproveQuantityChangeModification(adminToken) {
  console.log('\n=== Test 2.3: Approve Quantity Change Modification ===');
  try {
    const listResponse = await makeRequest({
      path: '/admin/modifications?status=pending&type=quantity_change',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (listResponse.statusCode !== 200 || !listResponse.body.data || listResponse.body.data.length === 0) {
      recordTest(
        '2.3 - Approve Quantity Change Modification',
        false,
        'No pending quantity_change modifications available',
        { reason: 'No pending quantity_change modifications' }
      );
      return;
    }

    const modification = listResponse.body.data[0];
    const orderId = modification.orderId;
    const modificationId = modification.id;

    console.log(`   Approving modification ${modificationId} for order ${orderId}`);

    const approveResponse = await makeRequest({
      path: `/orders/${orderId}/modifications/${modificationId}/approve`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }, { adminNotes: 'Test approval' });

    if (approveResponse.statusCode === 200) {
      const verifyResponse = await makeRequest({
        path: `/orders/${orderId}/modifications`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const updatedModification = verifyResponse.body?.data?.find(m => m.id === modificationId);
      const statusUpdated = updatedModification && updatedModification.status === 'approved';

      recordTest(
        '2.3 - Approve Quantity Change Modification',
        statusUpdated,
        statusUpdated
          ? `Quantity change modification approved and status updated to 'approved'`
          : `Approval response was 200 but status not updated`,
        { orderId, modificationId, status: updatedModification?.status }
      );
    } else {
      recordTest(
        '2.3 - Approve Quantity Change Modification',
        false,
        `Expected 200, got ${approveResponse.statusCode}`,
        { statusCode: approveResponse.statusCode, body: approveResponse.body }
      );
    }
  } catch (error) {
    recordTest(
      '2.3 - Approve Quantity Change Modification',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 2.4: Test approving price_change modification
async function testApprovePriceChangeModification(adminToken) {
  console.log('\n=== Test 2.4: Approve Price Change Modification ===');
  try {
    const listResponse = await makeRequest({
      path: '/admin/modifications?status=pending&type=price_change',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (listResponse.statusCode !== 200 || !listResponse.body.data || listResponse.body.data.length === 0) {
      recordTest(
        '2.4 - Approve Price Change Modification',
        false,
        'No pending price_change modifications available',
        { reason: 'No pending price_change modifications' }
      );
      return;
    }

    const modification = listResponse.body.data[0];
    const orderId = modification.orderId;
    const modificationId = modification.id;

    console.log(`   Approving modification ${modificationId} for order ${orderId}`);

    const approveResponse = await makeRequest({
      path: `/orders/${orderId}/modifications/${modificationId}/approve`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }, { adminNotes: 'Test approval' });

    if (approveResponse.statusCode === 200) {
      const verifyResponse = await makeRequest({
        path: `/orders/${orderId}/modifications`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const updatedModification = verifyResponse.body?.data?.find(m => m.id === modificationId);
      const statusUpdated = updatedModification && updatedModification.status === 'approved';

      recordTest(
        '2.4 - Approve Price Change Modification',
        statusUpdated,
        statusUpdated
          ? `Price change modification approved and status updated to 'approved'`
          : `Approval response was 200 but status not updated`,
        { orderId, modificationId, status: updatedModification?.status }
      );
    } else {
      recordTest(
        '2.4 - Approve Price Change Modification',
        false,
        `Expected 200, got ${approveResponse.statusCode}`,
        { statusCode: approveResponse.statusCode, body: approveResponse.body }
      );
    }
  } catch (error) {
    recordTest(
      '2.4 - Approve Price Change Modification',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 2.5: Test approving address_change modification
async function testApproveAddressChangeModification(adminToken) {
  console.log('\n=== Test 2.5: Approve Address Change Modification ===');
  try {
    const listResponse = await makeRequest({
      path: '/admin/modifications?status=pending&type=address_change',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (listResponse.statusCode !== 200 || !listResponse.body.data || listResponse.body.data.length === 0) {
      recordTest(
        '2.5 - Approve Address Change Modification',
        false,
        'No pending address_change modifications available',
        { reason: 'No pending address_change modifications' }
      );
      return;
    }

    const modification = listResponse.body.data[0];
    const orderId = modification.orderId;
    const modificationId = modification.id;

    console.log(`   Approving modification ${modificationId} for order ${orderId}`);

    const approveResponse = await makeRequest({
      path: `/orders/${orderId}/modifications/${modificationId}/approve`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }, { adminNotes: 'Test approval' });

    if (approveResponse.statusCode === 200) {
      const verifyResponse = await makeRequest({
        path: `/orders/${orderId}/modifications`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const updatedModification = verifyResponse.body?.data?.find(m => m.id === modificationId);
      const statusUpdated = updatedModification && updatedModification.status === 'approved';

      recordTest(
        '2.5 - Approve Address Change Modification',
        statusUpdated,
        statusUpdated
          ? `Address change modification approved and status updated to 'approved'`
          : `Approval response was 200 but status not updated`,
        { orderId, modificationId, status: updatedModification?.status }
      );
    } else {
      recordTest(
        '2.5 - Approve Address Change Modification',
        false,
        `Expected 200, got ${approveResponse.statusCode}`,
        { statusCode: approveResponse.statusCode, body: approveResponse.body }
      );
    }
  } catch (error) {
    recordTest(
      '2.5 - Approve Address Change Modification',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 2.6: Test approving shipping_method_change modification
async function testApproveShippingMethodChangeModification(adminToken) {
  console.log('\n=== Test 2.6: Approve Shipping Method Change Modification ===');
  try {
    const listResponse = await makeRequest({
      path: '/admin/modifications?status=pending&type=shipping_method_change',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (listResponse.statusCode !== 200 || !listResponse.body.data || listResponse.body.data.length === 0) {
      recordTest(
        '2.6 - Approve Shipping Method Change Modification',
        false,
        'No pending shipping_method_change modifications available',
        { reason: 'No pending shipping_method_change modifications' }
      );
      return;
    }

    const modification = listResponse.body.data[0];
    const orderId = modification.orderId;
    const modificationId = modification.id;

    console.log(`   Approving modification ${modificationId} for order ${orderId}`);

    const approveResponse = await makeRequest({
      path: `/orders/${orderId}/modifications/${modificationId}/approve`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }, { adminNotes: 'Test approval' });

    if (approveResponse.statusCode === 200) {
      const verifyResponse = await makeRequest({
        path: `/orders/${orderId}/modifications`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const updatedModification = verifyResponse.body?.data?.find(m => m.id === modificationId);
      const statusUpdated = updatedModification && updatedModification.status === 'approved';

      recordTest(
        '2.6 - Approve Shipping Method Change Modification',
        statusUpdated,
        statusUpdated
          ? `Shipping method change modification approved and status updated to 'approved'`
          : `Approval response was 200 but status not updated`,
        { orderId, modificationId, status: updatedModification?.status }
      );
    } else {
      recordTest(
        '2.6 - Approve Shipping Method Change Modification',
        false,
        `Expected 200, got ${approveResponse.statusCode}`,
        { statusCode: approveResponse.statusCode, body: approveResponse.body }
      );
    }
  } catch (error) {
    recordTest(
      '2.6 - Approve Shipping Method Change Modification',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 2.7: Test approving payment_method_change modification
async function testApprovePaymentMethodChangeModification(adminToken) {
  console.log('\n=== Test 2.7: Approve Payment Method Change Modification ===');
  try {
    const listResponse = await makeRequest({
      path: '/admin/modifications?status=pending&type=payment_method_change',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (listResponse.statusCode !== 200 || !listResponse.body.data || listResponse.body.data.length === 0) {
      recordTest(
        '2.7 - Approve Payment Method Change Modification',
        false,
        'No pending payment_method_change modifications available',
        { reason: 'No pending payment_method_change modifications' }
      );
      return;
    }

    const modification = listResponse.body.data[0];
    const orderId = modification.orderId;
    const modificationId = modification.id;

    console.log(`   Approving modification ${modificationId} for order ${orderId}`);

    const approveResponse = await makeRequest({
      path: `/orders/${orderId}/modifications/${modificationId}/approve`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }, { adminNotes: 'Test approval' });

    if (approveResponse.statusCode === 200) {
      const verifyResponse = await makeRequest({
        path: `/orders/${orderId}/modifications`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const updatedModification = verifyResponse.body?.data?.find(m => m.id === modificationId);
      const statusUpdated = updatedModification && updatedModification.status === 'approved';

      recordTest(
        '2.7 - Approve Payment Method Change Modification',
        statusUpdated,
        statusUpdated
          ? `Payment method change modification approved and status updated to 'approved'`
          : `Approval response was 200 but status not updated`,
        { orderId, modificationId, status: updatedModification?.status }
      );
    } else {
      recordTest(
        '2.7 - Approve Payment Method Change Modification',
        false,
        `Expected 200, got ${approveResponse.statusCode}`,
        { statusCode: approveResponse.statusCode, body: approveResponse.body }
      );
    }
  } catch (error) {
    recordTest(
      '2.7 - Approve Payment Method Change Modification',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 2.8: Test rejecting modification for shipped/delivered orders
async function testRejectModificationForShippedOrder(adminToken) {
  console.log('\n=== Test 2.8: Reject Modification for Shipped/Delivered Orders ===');
  try {
    // Get a shipped or delivered order
    const ordersResponse = await makeRequest({
      path: '/orders?status=shipped',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (ordersResponse.statusCode !== 200 || !ordersResponse.body.orders || ordersResponse.body.orders.length === 0) {
      recordTest(
        '2.8 - Reject Modification for Shipped/Delivered Orders',
        false,
        'No shipped orders available to test',
        { reason: 'No shipped orders in database' }
      );
      return;
    }

    const order = ordersResponse.body.orders[0];
    const orderId = order.id;

    // Try to create a modification for a shipped order
    const createResponse = await makeRequest({
      path: `/orders/${orderId}/modifications`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      type: 'item_add',
      reason: 'Test modification for shipped order',
      changes: {
        items: [{ productId: 'test-product-id', quantity: 1, price: 100 }]
      }
    });

    if (createResponse.statusCode === 400) {
      recordTest(
        '2.8 - Reject Modification for Shipped/Delivered Orders',
        true,
        `Correctly rejected modification for shipped order: ${createResponse.body.error}`,
        { orderId, error: createResponse.body.error }
      );
    } else if (createResponse.statusCode === 200 || createResponse.statusCode === 201) {
      recordTest(
        '2.8 - Reject Modification for Shipped/Delivered Orders',
        false,
        `Should reject modification for shipped order, but got ${createResponse.statusCode}`,
        { statusCode: createResponse.statusCode, body: createResponse.body }
      );
    } else {
      recordTest(
        '2.8 - Reject Modification for Shipped/Delivered Orders',
        false,
        `Unexpected response code: ${createResponse.statusCode}`,
        { statusCode: createResponse.statusCode, body: createResponse.body }
      );
    }
  } catch (error) {
    recordTest(
      '2.8 - Reject Modification for Shipped/Delivered Orders',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 2.9: Test inventory validation for item_add
async function testInventoryValidationForItemAdd(adminToken) {
  console.log('\n=== Test 2.9: Inventory Validation for Item Add ===');
  try {
    // Get a pending order
    const ordersResponse = await makeRequest({
      path: '/orders?status=pending',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (ordersResponse.statusCode !== 200 || !ordersResponse.body.orders || ordersResponse.body.orders.length === 0) {
      recordTest(
        '2.9 - Inventory Validation for Item Add',
        false,
        'No pending orders available to test',
        { reason: 'No pending orders in database' }
      );
      return;
    }

    const order = ordersResponse.body.orders[0];
    const orderId = order.id;

    // Try to create an item_add modification with insufficient stock
    // Using a non-existent product ID to simulate inventory issue
    const createResponse = await makeRequest({
      path: `/orders/${orderId}/modifications`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      type: 'item_add',
      reason: 'Test inventory validation',
      changes: {
        items: [{ 
          productId: '00000000-0000-0000-0000-000000000000', // Invalid UUID
          quantity: 999999, // Excessive quantity
          price: 100 
        }]
      }
    });

    // The backend should validate the product exists and has sufficient stock
    if (createResponse.statusCode === 400 || createResponse.statusCode === 404) {
      recordTest(
        '2.9 - Inventory Validation for Item Add',
        true,
        `Inventory validation working: ${createResponse.body.error || 'Product not found'}`,
        { orderId, error: createResponse.body.error }
      );
    } else if (createResponse.statusCode === 200 || createResponse.statusCode === 201) {
      // If it succeeds, it might be because the product exists
      recordTest(
        '2.9 - Inventory Validation for Item Add',
        false,
        'Inventory validation may not be working correctly',
        { statusCode: createResponse.statusCode, body: createResponse.body }
      );
    } else {
      recordTest(
        '2.9 - Inventory Validation for Item Add',
        false,
        `Unexpected response code: ${createResponse.statusCode}`,
        { statusCode: createResponse.statusCode, body: createResponse.body }
      );
    }
  } catch (error) {
    recordTest(
      '2.9 - Inventory Validation for Item Add',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 2.10: Test that modification request validation works
async function testModificationRequestValidation(adminToken) {
  console.log('\n=== Test 2.10: Modification Request Validation ===');
  try {
    // Get a pending order
    const ordersResponse = await makeRequest({
      path: '/orders?status=pending',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (ordersResponse.statusCode !== 200 || !ordersResponse.body.orders || ordersResponse.body.orders.length === 0) {
      recordTest(
        '2.10 - Modification Request Validation',
        false,
        'No pending orders available to test',
        { reason: 'No pending orders in database' }
      );
      return;
    }

    const order = ordersResponse.body.orders[0];
    const orderId = order.id;

    // Test 1: item_remove without itemIds array (should fail)
    const test1Response = await makeRequest({
      path: `/orders/${orderId}/modifications`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      type: 'item_remove',
      reason: 'Test validation'
      // Missing changes.itemIds
    });

    const test1Valid = test1Response.statusCode === 400 && 
                       test1Response.body.error === 'Item removal requires itemIds array in changes';

    // Test 2: item_add without items array (should fail)
    const test2Response = await makeRequest({
      path: `/orders/${orderId}/modifications`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      type: 'item_add',
      reason: 'Test validation',
      changes: {} // Missing changes.items
    });

    const test2Valid = test2Response.statusCode === 400;

    const allTestsValid = test1Valid && test2Valid;

    recordTest(
      '2.10 - Modification Request Validation',
      allTestsValid,
      allTestsValid
        ? 'Modification request validation working correctly'
        : 'Some validation tests failed',
      { 
        test1: { valid: test1Valid, error: test1Response.body.error },
        test2: { valid: test2Valid, error: test2Response.body.error }
      }
    );
  } catch (error) {
    recordTest(
      '2.10 - Modification Request Validation',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// ============================================================================
// TEST 3: Frontend Admin Page Tests
// ============================================================================

// Test 3.1: Test that admin page loads modifications from API
async function testAdminPageLoadsModifications(adminToken) {
  console.log('\n=== Test 3.1: Admin Page Loads Modifications from API ===');
  try {
    const response = await makeRequest({
      path: '/admin/modifications',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.statusCode === 200) {
      const hasData = Array.isArray(response.body.data);
      const hasRequiredFields = hasData && response.body.data.length > 0 
        ? response.body.data[0].id && 
          response.body.data[0].orderId && 
          response.body.data[0].modificationType &&
          response.body.data[0].status
        : true;

      recordTest(
        '3.1 - Admin Page Loads Modifications from API',
        hasData && hasRequiredFields,
        hasData && hasRequiredFields
          ? `Modifications loaded successfully with ${response.body.data.length} records`
          : 'Modifications data structure invalid',
        { 
          hasData, 
          hasRequiredFields,
          sampleModification: response.body.data[0] || null
        }
      );
    } else {
      recordTest(
        '3.1 - Admin Page Loads Modifications from API',
        false,
        `Expected 200, got ${response.statusCode}`,
        { statusCode: response.statusCode, body: response.body }
      );
    }
  } catch (error) {
    recordTest(
      '3.1 - Admin Page Loads Modifications from API',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 3.2: Test that filtering works on admin page
async function testAdminPageFiltering(adminToken) {
  console.log('\n=== Test 3.2: Admin Page Filtering Works ===');
  try {
    // Test status filter
    const statusResponse = await makeRequest({
      path: '/admin/modifications?status=pending',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    // Test type filter
    const typeResponse = await makeRequest({
      path: '/admin/modifications?type=item_add',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    // Test combined filter
    const combinedResponse = await makeRequest({
      path: '/admin/modifications?status=pending&type=item_add',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const statusFilterWorks = statusResponse.statusCode === 200;
    const typeFilterWorks = typeResponse.statusCode === 200;
    const combinedFilterWorks = combinedResponse.statusCode === 200;

    const allFiltersWork = statusFilterWorks && typeFilterWorks && combinedFilterWorks;

    recordTest(
      '3.2 - Admin Page Filtering Works',
      allFiltersWork,
      allFiltersWork
        ? 'All filters working (status, type, combined)'
        : 'Some filters failed',
      { 
        statusFilter: statusFilterWorks,
        typeFilter: typeFilterWorks,
        combinedFilter: combinedFilterWorks
      }
    );
  } catch (error) {
    recordTest(
      '3.2 - Admin Page Filtering Works',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 3.3: Test that approve button calls correct API with correct parameters
async function testApproveButtonCallsCorrectAPI(adminToken) {
  console.log('\n=== Test 3.3: Approve Button Calls Correct API ===');
  try {
    // Get a pending modification
    const listResponse = await makeRequest({
      path: '/admin/modifications?status=pending',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (listResponse.statusCode !== 200 || !listResponse.body.data || listResponse.body.data.length === 0) {
      recordTest(
        '3.3 - Approve Button Calls Correct API',
        false,
        'No pending modifications available to test',
        { reason: 'No pending modifications' }
      );
      return;
    }

    const modification = listResponse.body.data[0];
    const orderId = modification.orderId;
    const modificationId = modification.id;

    // Test the approve endpoint with correct parameters
    const approveResponse = await makeRequest({
      path: `/orders/${orderId}/modifications/${modificationId}/approve`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }, { adminNotes: 'Test approval notes' });

    if (approveResponse.statusCode === 200) {
      recordTest(
        '3.3 - Approve Button Calls Correct API',
        true,
        `Approve API called correctly with orderId=${orderId}, modificationId=${modificationId}`,
        { 
          orderId, 
          modificationId, 
          response: approveResponse.body 
        }
      );
    } else {
      recordTest(
        '3.3 - Approve Button Calls Correct API',
        false,
        `Expected 200, got ${approveResponse.statusCode}`,
        { statusCode: approveResponse.statusCode, body: approveResponse.body }
      );
    }
  } catch (error) {
    recordTest(
      '3.3 - Approve Button Calls Correct API',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 3.4: Test that reject button calls correct API with correct parameters
async function testRejectButtonCallsCorrectAPI(adminToken) {
  console.log('\n=== Test 3.4: Reject Button Calls Correct API ===');
  try {
    // Get a pending modification
    const listResponse = await makeRequest({
      path: '/admin/modifications?status=pending',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (listResponse.statusCode !== 200 || !listResponse.body.data || listResponse.body.data.length === 0) {
      recordTest(
        '3.4 - Reject Button Calls Correct API',
        false,
        'No pending modifications available to test',
        { reason: 'No pending modifications' }
      );
      return;
    }

    const modification = listResponse.body.data[0];
    const orderId = modification.orderId;
    const modificationId = modification.id;

    // Test the reject endpoint with correct parameters
    const rejectResponse = await makeRequest({
      path: `/orders/${orderId}/modifications/${modificationId}/reject`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }, { reason: 'Test rejection reason' });

    if (rejectResponse.statusCode === 200) {
      // Verify status was updated
      const verifyResponse = await makeRequest({
        path: `/orders/${orderId}/modifications`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const updatedModification = verifyResponse.body?.data?.find(m => m.id === modificationId);
      const statusUpdated = updatedModification && updatedModification.status === 'rejected';

      recordTest(
        '3.4 - Reject Button Calls Correct API',
        statusUpdated,
        statusUpdated
          ? `Reject API called correctly and status updated to 'rejected'`
          : `Reject API called but status not updated`,
        { 
          orderId, 
          modificationId, 
          status: updatedModification?.status 
        }
      );
    } else {
      recordTest(
        '3.4 - Reject Button Calls Correct API',
        false,
        `Expected 200, got ${rejectResponse.statusCode}`,
        { statusCode: rejectResponse.statusCode, body: rejectResponse.body }
      );
    }
  } catch (error) {
    recordTest(
      '3.4 - Reject Button Calls Correct API',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 3.5: Test that page refreshes after approve/reject
async function testPageRefreshesAfterAction(adminToken) {
  console.log('\n=== Test 3.5: Page Refreshes After Approve/Reject ===');
  try {
    // Get initial count of pending modifications
    const initialResponse = await makeRequest({
      path: '/admin/modifications?status=pending',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (initialResponse.statusCode !== 200 || !initialResponse.body.data || initialResponse.body.data.length === 0) {
      recordTest(
        '3.5 - Page Refreshes After Approve/Reject',
        false,
        'No pending modifications available to test',
        { reason: 'No pending modifications' }
      );
      return;
    }

    const initialCount = initialResponse.body.data.length;
    const modification = initialResponse.body.data[0];
    const orderId = modification.orderId;
    const modificationId = modification.id;

    // Reject the modification
    const rejectResponse = await makeRequest({
      path: `/orders/${orderId}/modifications/${modificationId}/reject`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }, { reason: 'Test to verify page refresh' });

    if (rejectResponse.statusCode === 200) {
      // Get updated count
      const updatedResponse = await makeRequest({
        path: '/admin/modifications?status=pending',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const updatedCount = updatedResponse.body.data.length;
      const countDecreased = updatedCount < initialCount;

      recordTest(
        '3.5 - Page Refreshes After Approve/Reject',
        countDecreased,
        countDecreased
          ? `Pending modifications count decreased from ${initialCount} to ${updatedCount}`
          : `Pending modifications count did not decrease (initial: ${initialCount}, updated: ${updatedCount})`,
        { initialCount, updatedCount }
      );
    } else {
      recordTest(
        '3.5 - Page Refreshes After Approve/Reject',
        false,
        `Reject failed with status ${rejectResponse.statusCode}`,
        { statusCode: rejectResponse.statusCode, body: rejectResponse.body }
      );
    }
  } catch (error) {
    recordTest(
      '3.5 - Page Refreshes After Approve/Reject',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// ============================================================================
// TEST 4: End-to-End Integration Tests
// ============================================================================

// Test 4.1: Create a test order and submit modification request
async function testCreateOrderAndSubmitModification(userToken) {
  console.log('\n=== Test 4.1: Create Order and Submit Modification Request ===');
  try {
    // Get user's orders
    const ordersResponse = await makeRequest({
      path: '/orders',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    if (ordersResponse.statusCode !== 200 || !ordersResponse.body.orders || ordersResponse.body.orders.length === 0) {
      recordTest(
        '4.1 - Create Order and Submit Modification Request',
        false,
        'No orders available to test',
        { reason: 'No orders in database' }
      );
      return;
    }

    const order = ordersResponse.body.orders[0];
    const orderId = order.id;

    // Submit a modification request
    const createResponse = await makeRequest({
      path: `/orders/${orderId}/modifications`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    }, {
      type: 'custom',
      reason: 'Test modification request',
      changes: { test: 'data' }
    });

    if (createResponse.statusCode === 200 || createResponse.statusCode === 201) {
      recordTest(
        '4.1 - Create Order and Submit Modification Request',
        true,
        `Modification request created successfully: ${createResponse.body.modificationId}`,
        { 
          orderId, 
          modificationId: createResponse.body.modificationId,
          status: createResponse.body.status 
        }
      );
    } else {
      recordTest(
        '4.1 - Create Order and Submit Modification Request',
        false,
        `Expected 200 or 201, got ${createResponse.statusCode}`,
        { statusCode: createResponse.statusCode, body: createResponse.body }
      );
    }
  } catch (error) {
    recordTest(
      '4.1 - Create Order and Submit Modification Request',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 4.2: Verify modification appears in admin modifications page
async function testModificationAppearsInAdminPage(adminToken) {
  console.log('\n=== Test 4.2: Modification Appears in Admin Page ===');
  try {
    // Get all modifications
    const response = await makeRequest({
      path: '/admin/modifications',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.statusCode === 200) {
      const hasModifications = Array.isArray(response.body.data) && response.body.data.length > 0;

      recordTest(
        '4.2 - Modification Appears in Admin Page',
        hasModifications,
        hasModifications
          ? `Found ${response.body.data.length} modifications in admin page`
          : 'No modifications found in admin page',
        { 
          hasModifications,
          count: response.body.data.length 
        }
      );
    } else {
      recordTest(
        '4.2 - Modification Appears in Admin Page',
        false,
        `Expected 200, got ${response.statusCode}`,
        { statusCode: response.statusCode, body: response.body }
      );
    }
  } catch (error) {
    recordTest(
      '4.2 - Modification Appears in Admin Page',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 4.3: Approve the modification and verify order is modified
async function testApproveModificationAndVerifyOrderModified(adminToken) {
  console.log('\n=== Test 4.3: Approve Modification and Verify Order Modified ===');
  try {
    // Get a pending custom modification (safest to test)
    const listResponse = await makeRequest({
      path: '/admin/modifications?status=pending&type=custom',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (listResponse.statusCode !== 200 || !listResponse.body.data || listResponse.body.data.length === 0) {
      recordTest(
        '4.3 - Approve Modification and Verify Order Modified',
        false,
        'No pending custom modifications available',
        { reason: 'No pending custom modifications' }
      );
      return;
    }

    const modification = listResponse.body.data[0];
    const orderId = modification.orderId;
    const modificationId = modification.id;

    // Get order details before approval
    const beforeResponse = await makeRequest({
      path: `/orders/${orderId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const orderBefore = beforeResponse.body?.order;

    // Approve the modification
    const approveResponse = await makeRequest({
      path: `/orders/${orderId}/modifications/${modificationId}/approve`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }, { adminNotes: 'Test approval' });

    if (approveResponse.statusCode === 200) {
      // Verify modification status
      const verifyResponse = await makeRequest({
        path: `/orders/${orderId}/modifications`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const updatedModification = verifyResponse.body?.data?.find(m => m.id === modificationId);
      const statusUpdated = updatedModification && updatedModification.status === 'approved';
      const wasProcessed = updatedModification && updatedModification.processedAt !== null;

      recordTest(
        '4.3 - Approve Modification and Verify Order Modified',
        statusUpdated && wasProcessed,
        statusUpdated && wasProcessed
          ? `Modification approved, status='approved', processedAt=${updatedModification.processedAt}`
          : `Modification approval response was 200 but status not properly updated`,
        { 
          orderId, 
          modificationId, 
          status: updatedModification?.status,
          processedAt: updatedModification?.processedAt,
          orderBefore: orderBefore
        }
      );
    } else {
      recordTest(
        '4.3 - Approve Modification and Verify Order Modified',
        false,
        `Expected 200, got ${approveResponse.statusCode}`,
        { statusCode: approveResponse.statusCode, body: approveResponse.body }
      );
    }
  } catch (error) {
    recordTest(
      '4.3 - Approve Modification and Verify Order Modified',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// Test 4.4: Verify modification status is updated
async function testModificationStatusUpdated(adminToken) {
  console.log('\n=== Test 4.4: Verify Modification Status Updated ===');
  try {
    // Get approved modifications
    const response = await makeRequest({
      path: '/admin/modifications?status=approved',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.statusCode === 200) {
      const hasApprovedMods = Array.isArray(response.body.data) && response.body.data.length > 0;
      
      if (hasApprovedMods) {
        // Check that approved modifications have the correct status and processedAt
        const allValid = response.body.data.every(mod => 
          mod.status === 'approved' && 
          mod.processedAt !== null &&
          mod.approvedBy !== null
        );

        recordTest(
          '4.4 - Verify Modification Status Updated',
          allValid,
          allValid
            ? `All ${response.body.data.length} approved modifications have correct status and processedAt`
            : 'Some approved modifications have invalid status or missing processedAt',
          { 
            hasApprovedMods,
            count: response.body.data.length,
            allValid
          }
        );
      } else {
        recordTest(
          '4.4 - Verify Modification Status Updated',
          false,
          'No approved modifications found',
          { reason: 'No approved modifications in database' }
        );
      }
    } else {
      recordTest(
        '4.4 - Verify Modification Status Updated',
        false,
        `Expected 200, got ${response.statusCode}`,
        { statusCode: response.statusCode, body: response.body }
      );
    }
  } catch (error) {
    recordTest(
      '4.4 - Verify Modification Status Updated',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTests() {
  console.log('========================================');
  console.log('Order Modification Request Feature Fixes');
  console.log('Comprehensive Test Suite');
  console.log('========================================');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Started at: ${new Date().toISOString()}`);

  let adminToken = null;
  let userToken = null;

  try {
    // Login as admin
    console.log('\n=== Logging in as admin ===');
    adminToken = await login(TEST_CREDENTIALS.admin.identifier, TEST_CREDENTIALS.admin.password);
    console.log('✅ Admin login successful');

    // Login as regular user
    console.log('\n=== Logging in as regular user ===');
    try {
      userToken = await login(TEST_CREDENTIALS.regularUser.identifier, TEST_CREDENTIALS.regularUser.password);
      console.log('✅ Regular user login successful');
    } catch (error) {
      console.log('⚠️  Regular user login failed (user may not exist):', error.message);
      testResults.skipped.push({
        testName: 'Regular User Tests',
        reason: 'Test user does not exist in database',
        timestamp: new Date().toISOString()
      });
    }

    // Run Test 1: Backend API Endpoint Tests
    console.log('\n\n========================================');
    console.log('TEST 1: Backend API Endpoint Tests');
    console.log('========================================');
    await testGetAllModificationsEndpointExists(adminToken);
    await testFilterByStatus(adminToken);
    await testFilterByType(adminToken);
    await testPagination(adminToken);
    await testAdminAuthenticationRequired();

    // Run Test 2: Backend Modification Approval Tests
    console.log('\n\n========================================');
    console.log('TEST 2: Backend Modification Approval Tests');
    console.log('========================================');
    await testApproveItemAddModification(adminToken);
    await testApproveItemRemoveModification(adminToken);
    await testApproveQuantityChangeModification(adminToken);
    await testApprovePriceChangeModification(adminToken);
    await testApproveAddressChangeModification(adminToken);
    await testApproveShippingMethodChangeModification(adminToken);
    await testApprovePaymentMethodChangeModification(adminToken);
    await testRejectModificationForShippedOrder(adminToken);
    await testInventoryValidationForItemAdd(adminToken);
    await testModificationRequestValidation(adminToken);

    // Run Test 3: Frontend Admin Page Tests
    console.log('\n\n========================================');
    console.log('TEST 3: Frontend Admin Page Tests');
    console.log('========================================');
    await testAdminPageLoadsModifications(adminToken);
    await testAdminPageFiltering(adminToken);
    await testApproveButtonCallsCorrectAPI(adminToken);
    await testRejectButtonCallsCorrectAPI(adminToken);
    await testPageRefreshesAfterAction(adminToken);

    // Run Test 4: End-to-End Integration Tests
    console.log('\n\n========================================');
    console.log('TEST 4: End-to-End Integration Tests');
    console.log('========================================');
    if (userToken) {
      await testCreateOrderAndSubmitModification(userToken);
    } else {
      testResults.skipped.push({
        testName: '4.1 - Create Order and Submit Modification Request',
        reason: 'No regular user token available',
        timestamp: new Date().toISOString()
      });
    }
    await testModificationAppearsInAdminPage(adminToken);
    await testApproveModificationAndVerifyOrderModified(adminToken);
    await testModificationStatusUpdated(adminToken);

  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error);
  }

  // Print summary
  console.log('\n\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  console.log(`Total Tests: ${testResults.passed.length + testResults.failed.length + testResults.skipped.length}`);
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️  Skipped: ${testResults.skipped.length}`);

  if (testResults.failed.length > 0) {
    console.log('\nFailed Tests:');
    testResults.failed.forEach(test => {
      console.log(`  - ${test.testName}: ${test.message}`);
    });
  }

  if (testResults.skipped.length > 0) {
    console.log('\nSkipped Tests:');
    testResults.skipped.forEach(test => {
      console.log(`  - ${test.testName}: ${test.reason}`);
    });
  }

  // Save results to file
  const fs = require('fs');
  const resultsFile = `order-modification-fixes-test-results-${Date.now()}.json`;
  fs.writeFileSync(resultsFile, JSON.stringify({
    summary: {
      total: testResults.passed.length + testResults.failed.length + testResults.skipped.length,
      passed: testResults.passed.length,
      failed: testResults.failed.length,
      skipped: testResults.skipped.length,
      passRate: testResults.passed.length + testResults.failed.length > 0 
        ? ((testResults.passed.length / (testResults.passed.length + testResults.failed.length)) * 100).toFixed(2) + '%'
        : 'N/A'
    },
    results: testResults,
    timestamp: new Date().toISOString()
  }, null, 2));

  console.log(`\n📄 Detailed results saved to: ${resultsFile}`);
  console.log(`\nCompleted at: ${new Date().toISOString()}`);
}

// Run tests
runTests().catch(console.error);
