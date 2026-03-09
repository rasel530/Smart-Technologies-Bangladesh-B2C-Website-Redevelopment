// Fix the incorrect item prices in order ORD1772009423668330
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixOrderPrices() {
  const orderId = '6332751d-063c-4ae4-87cd-1e3c8c7205c0';
  const orderNumber = 'ORD1772009423668330';
  
  // Get current order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true
    }
  });
  
  console.log('Current Order:');
  console.log('  Total:', order.total);
  console.log('  PaymentDetails totalAmount:', order.paymentDetails?.totalAmount);
  console.log('\nCurrent Items:');
  order.items.forEach(item => {
    console.log(`  - Unit Price: ${item.unitPrice}, Total Price: ${item.totalPrice}`);
  });
  
  // The paymentDetails shows totalAmount: 5998.65
  // This should be the correct total. Let's adjust item prices to match.
  // Current prices are: 70000, 5000, 850 (way too high)
  // Dividing by 1000 gives: 70, 5, 0.85 - that's too low
  // Let's see what makes sense:
  // 
  // Looking at prices: 70000/1000=70, 5000/1000=5, 850/1000=0.85
  // But that seems wrong. Let me check actual product prices.
  
  // Actually, looking at it again - maybe the issue is:
  // Prices should be in Taka but the calculation was wrong somewhere.
  // paymentDetails.totalAmount = 5998.65 seems correct
  // Let's calculate what the prices SHOULD be based on the total.
  
  // Current prices add up to: 70000 + 5000 + 850 = 75850
  // But order.total = 5998.65
  // Ratio: 5998.65 / 75850 = 0.0791
  
  // Let's recalculate based on the correct total:
  // If total = 5998.65, and assuming similar proportions:
  // Lenovo (70000/75850) * 5998.65 = 5541.72
  // HP 1 (5000/75850) * 5998.65 = 395.84  
  // HP 2 (850/75850) * 5998.65 = 67.29
  // Total = 6004.85 (close but not exact due to rounding)
  
  // Actually, let's use simpler approach - divide all by 100 to get reasonable prices
  const correctItems = [
    { id: order.items[0].id, unitPrice: 700, totalPrice: 700 },   // Lenovo: was 70000 -> 700
    { id: order.items[1].id, unitPrice: 50, totalPrice: 50 },    // HP Core i5: was 5000 -> 50
    { id: order.items[2].id, unitPrice: 8.50, totalPrice: 8.50 } // HP850 -> 8 Ryzen: was .50
  ];
  
  const newSubtotal = correctItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = newSubtotal * 0.05;  // 5% tax
  const shippingCost = newSubtotal >= 5000 ? 0 : 100;
  const newTotal = newSubtotal + tax + shippingCost;
  
  console.log('\n=== PROPOSED CHANGES ===');
  console.log('New item prices:');
  correctItems.forEach(item => {
    console.log(`  - Unit Price: ${item.unitPrice}, Total Price: ${item.totalPrice}`);
  });
  console.log(`\nNew Subtotal: ${newSubtotal}`);
  console.log(`New Tax: ${tax}`);
  console.log(`New Shipping: ${shippingCost}`);
  console.log(`New Total: ${newTotal}`);
  console.log(`\nPaymentDetails Total: ${order.paymentDetails?.totalAmount}`);
  
  // Check if this matches
  if (Math.abs(newTotal - order.paymentDetails?.totalAmount) < 1) {
    console.log('\n✅ Prices match paymentDetails! Applying fix...');
    
    // Update items
    for (const item of correctItems) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }
      });
    }
    
    // Update order totals
    await prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal: newSubtotal,
        tax: tax,
        shippingCost: shippingCost,
        total: newTotal
      }
    });
    
    console.log('✅ Fix applied successfully!');
  } else {
    console.log('\n⚠ Prices do NOT match paymentDetails. Manual intervention needed.');
    console.log(`   Difference: ${Math.abs(newTotal - order.paymentDetails?.totalAmount)}`);
  }
  
  // Verify final state
  console.log('\n=== FINAL VERIFICATION ===');
  const fixedOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true
    }
  });
  
  console.log('Order Total:', fixedOrder.total);
  console.log('PaymentDetails Total:', fixedOrder.paymentDetails?.totalAmount);
  console.log('\nItems:');
  fixedOrder.items.forEach(item => {
    console.log(`  - Unit Price: ${item.unitPrice}, Total Price: ${item.totalPrice}`);
  });
  
  await prisma.$disconnect();
}

fixOrderPrices().catch(console.error);
