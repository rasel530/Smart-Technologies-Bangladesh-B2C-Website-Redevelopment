// Quick verification script for order ORD1772009423668330
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verify() {
  const order = await prisma.order.findUnique({
    where: { orderNumber: 'ORD1772009423668330' },
    include: {
      items: {
        include: {
          product: { select: { name: true, nameEn: true, sku: true } }
        }
      }
    }
  });

  console.log('Order:', order.orderNumber);
  console.log('Items:', order.items.length);
  console.log('Total:', order.total.toString());
  console.log('PaymentDetails:', JSON.stringify(order.paymentDetails, null, 2));
  console.log('\nOrder Items:');
  order.items.forEach(i => {
    console.log('-', i.product.nameEn || i.product.name, 'Qty:', i.quantity, 'Price:', i.totalPrice.toString());
  });
  
  await prisma.$disconnect();
}

verify().catch(console.error);
