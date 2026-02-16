const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProductPrice() {
  try {
    const cart = await prisma.cart.findFirst({
      where: {
        items: {
          some: {}
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (cart && cart.items[0]) {
      const item = cart.items[0];
      const product = item.product;

      console.log('=== DATABASE VERIFICATION ===');
      console.log('Product ID:', product.id);
      console.log('Product Name:', product.name);
      console.log('Product Regular Price:', product.regularPrice, '(type:', typeof product.regularPrice + ')');
      console.log('Product Sale Price:', product.salePrice, '(type:', typeof product.salePrice + ')');
      console.log('Product Status:', product.status);
      console.log('Cart Item Price:', item.price, '(type:', typeof item.price + ')');
      console.log('Cart Item Subtotal:', item.subtotal, '(type:', typeof item.subtotal + ')');
      console.log('Cart Item Quantity:', item.quantity);
      console.log('Cart Subtotal:', cart.subtotal);

      // Check sale price validity
      const hasValidSalePrice = product.salePrice &&
                                    product.salePrice > 0 &&
                                    product.salePrice < product.regularPrice;
      console.log('\nHas Valid Sale Price:', hasValidSalePrice);
      console.log('Expected Price:', hasValidSalePrice ? product.salePrice : product.regularPrice);
    } else {
      console.log('No cart with items found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductPrice();
