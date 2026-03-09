/**
 * Fix for backend orders route response transformation
 * 
 * Problem: 
 * 1. Backend returns order_items but frontend expects orderItems
 * 2. Prices are Decimal objects showing as [object Object] in UI
 * 3. Product details not being properly included in response
 * 
 * Solution:
 * 1. Transform order_items to orderItems
 * 2. Convert Decimal fields to numbers
 * 3. Include product details properly
 */

const fs = require('fs');
const path = require('path');

// Read the current orders.js file
const ordersFilePath = path.join(__dirname, 'routes/orders.js').replace(/\\/g, '/');
let ordersContent = fs.readFileSync(ordersFilePath, 'utf8');

// Find and replace the transformation section
// Old code (lines 105-117):
const oldTransformation = `    // Transform orders to include paymentDetails for guest orders
    const transformedOrders = orders.map(order => ({
      ...order,
      // Include paymentDetails in response for admin panel
      paymentDetails: order.paymentDetails
    }));

    const response = transformPaginatedResponse(
      orders,
      { page, limit, total },
      transformOrder
    );
    res.json(response);`;

// New transformation code:
const newTransformation = `    // Transform orders properly to convert Decimal to numbers and fix field names
    const transformedOrders = orders.map(order => ({
      ...order,
      // Convert Decimal fields to numbers
      subtotal: parseFloat(order.subtotal?.toString() || '0'),
      tax: parseFloat(order.tax?.toString() || '0'),
      shippingCost: parseFloat(order.shippingCost?.toString() || '0'),
      discount: parseFloat(order.discount?.toString() || '0'),
      total: parseFloat(order.total?.toString() || '0'),
      // Transform order_items to orderItems
      orderItems: order.order_items?.map(item => ({
        ...item,
        // Convert Decimal fields to numbers
        unitPrice: parseFloat(item.unitPrice?.toString() || '0'),
        totalPrice: parseFloat(item.totalPrice?.toString() || '0'),
        // Include product details
        product: item.products
      })) || [],
      // Include paymentDetails in response for admin panel
      paymentDetails: order.paymentDetails,
      // Transform users to user
      user: order.users,
      // Transform addresses to address
      address: order.addresses
    }));

    const response = {
      success: true,
      data: transformedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
    res.json(response);`;

// Check if old transformation exists in the file
if (ordersContent.includes('transformPaginatedResponse(\n      orders,')) {
  console.log('✓ Found old transformation code in orders.js');
  
  // Replace the old transformation with the new one
  ordersContent = ordersContent.replace(oldTransformation, newTransformation);
  
  // Write the updated content back to the file
  fs.writeFileSync(ordersFilePath, ordersContent, 'utf8');
  
  console.log('✓ Successfully updated backend/routes/orders.js');
  console.log('✓ Changes:');
  console.log('  - order_items → orderItems');
  console.log('  - Decimal fields converted to numbers');
  console.log('  - Product details properly included');
  console.log('  - Response structure matches frontend expectations');
} else {
  console.log('✗ Old transformation code not found or already fixed');
  console.log('✗ File may have been modified since last read');
  console.log('✗ Please check the file manually');
}

console.log('\n=== Orders Route Fix Complete ===');
console.log('Please restart the backend server for changes to take effect');
