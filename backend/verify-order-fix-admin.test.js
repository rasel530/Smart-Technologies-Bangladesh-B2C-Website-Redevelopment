// Verification test for order ORD1772009423668330 - simulating admin panel API call
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyOrderViaAPI() {
  // Find order by order number (simulating GET /api/v1/orders?search=ORD1772009423668330)
  const order = await prisma.order.findFirst({
    where: { orderNumber: 'ORD1772009423668330' },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true }
      },
      address: true,
      items: {
        include: {
          product: {
            select: { id: true, name: true, sku: true }
          }
        }
      }
    }
  });

  if (!order) {
    console.log('❌ Order not found');
    return { success: false };
  }

  // Simulate the API response transformation done in routes/orders.js (lines 64-69)
  const transformedOrder = {
    ...order,
    paymentDetails: order.paymentDetails
  };

  // Test what the admin panel would display:
  console.log('\n=== ADMIN PANEL VERIFICATION ===\n');
  
  // 1. Customer Information
  const customerName = order.paymentDetails?.firstName || order.paymentDetails?.lastName 
    ? `${order.paymentDetails.firstName || ''} ${order.paymentDetails.lastName || ''}`.trim()
    : order.address?.firstName || order.address?.lastName
      ? `${order.address.firstName || ''} ${order.address.lastName || ''}`.trim()
      : 'Guest';
  
  const customerEmail = order.paymentDetails?.email || order.user?.email || 'N/A';
  const customerPhone = order.paymentDetails?.phone || order.address?.phone;

  console.log('1. Customer Information:');
  console.log(`   Name: ${customerName}`);
  console.log(`   Email: ${customerEmail}`);
  console.log(`   Phone: ${customerPhone}`);
  
  // 2. Order Items
  console.log('\n2. Order Items:');
  console.log(`   Total Items: ${order.items.length}`);
  order.items.forEach(item => {
    console.log(`   - ${item.product.name} (Qty: ${item.quantity}, Price: ৳${item.unitPrice}, Total: ৳${item.totalPrice})`);
  });
  
  // 3. Order Summary
  console.log('\n3. Order Summary:');
  console.log(`   Subtotal: ৳${order.subtotal}`);
  console.log(`   Tax: ৳${order.tax}`);
  console.log(`   Shipping: ৳${order.shippingCost}`);
  console.log(`   Discount: ৳${order.discount}`);
  console.log(`   Total: ৳${order.total}`);
  
  // Compare with paymentDetails
  console.log('\n4. Payment Details (from paymentDetails):');
  if (order.paymentDetails) {
    console.log(`   Email: ${order.paymentDetails.email}`);
    console.log(`   Phone: ${order.paymentDetails.phone}`);
    console.log(`   Payment Method: ${order.paymentDetails.paymentMethodCode || order.paymentDetails.method}`);
    console.log(`   Total Amount: ৳${order.paymentDetails.totalAmount}`);
    console.log(`   Payment Fee: ৳${order.paymentDetails.paymentFee}`);
  } else {
    console.log('   No paymentDetails found');
  }

  // Validation
  console.log('\n=== VALIDATION RESULTS ===\n');
  
  let allPassed = true;
  
  // Check customer info
  if (customerName && customerName !== 'Guest' && order.paymentDetails?.firstName) {
    console.log('✅ Customer name from paymentDetails: PASS');
  } else {
    console.log('❌ Customer name from paymentDetails: FAIL');
    allPassed = false;
  }
  
  if (customerEmail === 'raselbepari88@gmail.com') {
    console.log('✅ Customer email from paymentDetails: PASS');
  } else {
    console.log('❌ Customer email from paymentDetails: FAIL');
    allPassed = false;
  }
  
  // Check items
  if (order.items.length === 3) {
    console.log('✅ Order items count (3): PASS');
  } else {
    console.log(`❌ Order items count: FAIL (expected 3, got ${order.items.length})`);
    allPassed = false;
  }
  
  // Check totals match paymentDetails (compare as floats, handle both number and string types)
  const orderTotal = parseFloat(order.total);
  const paymentTotal = parseFloat(order.paymentDetails?.totalAmount);
  if (Math.abs(orderTotal - paymentTotal) < 0.01) {
    console.log('✅ Order total matches paymentDetails.totalAmount: PASS');
  } else {
    console.log(`❌ Order total matches paymentDetails.totalAmount: FAIL (order.total=${orderTotal}, paymentDetails.totalAmount=${paymentTotal})`);
    allPassed = false;
  }
  
  console.log('\n=== OVERALL RESULT ===');
  if (allPassed) {
    console.log('✅ All checks PASSED - Order is correctly fixed!');
  } else {
    console.log('❌ Some checks FAILED');
  }
  
  await prisma.$disconnect();
  return { success: allPassed, order };
}

verifyOrderViaAPI().then(result => {
  process.exit(result.success ? 0 : 1);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
