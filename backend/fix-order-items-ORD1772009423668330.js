/**
 * Fix order ORD1772009423668330 which has 0 items
 * 
 * Issue: Guest session was linked to empty cart, but customer's actual items
 * were in a different cart (3f06cf28-35d4-4976-b6a8-8ce0f8bc9f7d)
 * Cart association was fixed, but order items were never added
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixOrderItems() {
  const orderNumber = 'ORD1772009423668330';
  const cartId = '3f06cf28-35d4-4976-b6a8-8ce0f8bc9f7d';
  
  console.log('=== Fixing Order Items for', orderNumber, '===\n');
  
  try {
    // Step 1: Get the order
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true
      }
    });
    
    if (!order) {
      console.log('❌ Order not found!');
      return;
    }
    
    console.log('Order found:', order.orderNumber);
    console.log('Current items count:', order.items.length);
    console.log('Current total:', order.total.toString());
    console.log('PaymentDetails:', JSON.stringify(order.paymentDetails, null, 2));
    
    // Step 2: Get the cart with items
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                sku: true,
                regularPrice: true,
                salePrice: true
              }
            },
            variant: true
          }
        }
      }
    });
    
    if (!cart) {
      console.log('❌ Cart not found:', cartId);
      return;
    }
    
    console.log('\nCart found:', cart.id);
    console.log('Cart items count:', cart.items.length);
    console.log('Cart total:', cart.total.toString());
    
    if (cart.items.length === 0) {
      console.log('❌ Cart has no items to add to order');
      return;
    }
    
    // Step 3: Show the cart items
    console.log('\n=== Cart Items ===');
    for (const item of cart.items) {
      console.log(`- ${item.product.name || item.product.nameEn} (SKU: ${item.product.sku})`);
      console.log(`  Quantity: ${item.quantity}, Unit Price: ${item.price}, Subtotal: ${item.subtotal}`);
    }
    
    // Step 4: If order already has items, we need to handle that
    if (order.items.length > 0) {
      console.log('\n⚠️  Order already has items. Checking if they need to be replaced...');
      // Let's see what's in the order
      console.log('Current order items:');
      for (const item of order.items) {
        console.log(`- Product ID: ${item.productId}, Quantity: ${item.quantity}, Total: ${item.totalPrice}`);
      }
    }
    
    // Step 5: Create order items from cart items
    console.log('\n=== Adding Order Items ===');
    
    // First, delete any existing order items (to be safe)
    if (order.items.length > 0) {
      await prisma.orderItem.deleteMany({
        where: { orderId: order.id }
      });
      console.log('Deleted existing order items');
    }
    
    // Calculate order totals from cart
    let orderSubtotal = 0;
    let orderTax = 0;
    let orderShippingCost = Number(order.shippingCost) || 0;
    let orderDiscount = Number(order.discount) || 0;
    
    // Create order items
    const orderItemsData = cart.items.map(item => {
      const unitPrice = Number(item.price);
      const quantity = item.quantity;
      const totalPrice = Number(item.subtotal);
      orderSubtotal += totalPrice;
      
      return {
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice
      };
    });
    
    // Create the order items
    for (const itemData of orderItemsData) {
      const orderItem = await prisma.orderItem.create({
        data: itemData
      });
      console.log(`✅ Created order item for product ${itemData.productId} (qty: ${itemData.quantity})`);
    }
    
    // Step 6: Calculate and update order totals
    // Use the paymentDetails total if available (should be 5998.65)
    let orderTotal = 0;
    if (order.paymentDetails && order.paymentDetails.totalAmount) {
      orderTotal = Number(order.paymentDetails.totalAmount);
    } else {
      orderTotal = orderSubtotal + orderTax + orderShippingCost - orderDiscount;
    }
    
    console.log('\n=== Updating Order Totals ===');
    console.log('Subtotal:', orderSubtotal);
    console.log('Tax:', orderTax);
    console.log('Shipping Cost:', orderShippingCost);
    console.log('Discount:', orderDiscount);
    console.log('Total:', orderTotal);
    
    // Update the order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        subtotal: orderSubtotal,
        tax: orderTax,
        shippingCost: orderShippingCost,
        discount: orderDiscount,
        total: orderTotal
      }
    });
    
    console.log('✅ Order totals updated');
    
    // Step 7: Verify the fix
    console.log('\n=== Verification ===');
    const updatedOrder = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                nameEn: true,
                sku: true
              }
            }
          }
        }
      }
    });
    
    console.log('Order:', updatedOrder.orderNumber);
    console.log('Items count:', updatedOrder.items.length);
    console.log('Subtotal:', updatedOrder.subtotal.toString());
    console.log('Tax:', updatedOrder.tax.toString());
    console.log('Shipping Cost:', updatedOrder.shippingCost.toString());
    console.log('Discount:', updatedOrder.discount.toString());
    console.log('Total:', updatedOrder.total.toString());
    
    console.log('\n=== Order Items ===');
    for (const item of updatedOrder.items) {
      console.log(`- ${item.product.name || item.product.nameEn}`);
      console.log(`  SKU: ${item.product.sku}, Quantity: ${item.quantity}`);
      console.log(`  Unit Price: ${item.unitPrice}, Total: ${item.totalPrice}`);
    }
    
    console.log('\n✅ Order items fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrderItems();
