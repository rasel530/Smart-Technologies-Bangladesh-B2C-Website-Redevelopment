/**
 * Guest Cart Persistence Test
 * 
 * This test verifies that guest carts are properly persisted and retrieved.
 * Tests the complete flow: Add Item → Save to Backend → Retrieve Cart → Display Items
 */

const GUEST_CART_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function testGuestCartPersistence() {
  console.log('='.repeat(60));
  console.log('GUEST CART PERSISTENCE TEST');
  console.log('='.repeat(60));
  
  let sessionId;
  let cartId;
  const testProductId = '4010caae-464e-4787-ad8f-ee04096100d0'; // Known test product
  
  // Step 1: Generate guest session
  console.log('\n[Step 1] Generating guest session ID...');
  sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  console.log(`✓ Session ID: ${sessionId}`);
  
  // Step 2: Create guest cart
  console.log('\n[Step 2] Creating guest cart via POST /api/v1/cart/guest...');
  try {
    const createResponse = await fetch(`${GUEST_CART_API_URL}/cart/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      },
      body: JSON.stringify({
        items: [],
        sessionId
      })
    });
    
    const createData = await createResponse.json();
    console.log('Response:', JSON.stringify(createData, null, 2));
    
    if (createData.success) {
      cartId = createData.data?.cartId;
      console.log(`✓ Guest cart created: ${cartId}`);
    } else {
      console.log('✗ Failed to create guest cart');
      return false;
    }
  } catch (error) {
    console.log(`✗ Error creating guest cart: ${error.message}`);
    return false;
  }
  
  // Step 3: Add item to guest cart
  console.log('\n[Step 3] Adding item to guest cart...');
  try {
    const addItemResponse = await fetch(`${GUEST_CART_API_URL}/cart/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      },
      body: JSON.stringify({
        items: [{
          productId: testProductId,
          quantity: 1,
          variantId: null,
          price: 999.00
        }],
        sessionId
      })
    });
    
    const addItemData = await addItemResponse.json();
    console.log('Response:', JSON.stringify(addItemData, null, 2));
    
    if (addItemData.success) {
      console.log('✓ Item added to guest cart');
    } else {
      console.log(`✗ Failed to add item: ${addItemData.error}`);
    }
  } catch (error) {
    console.log(`✗ Error adding item: ${error.message}`);
  }
  
  // Step 4: Retrieve cart and verify items
  console.log('\n[Step 4] Retrieving guest cart to verify persistence...');
  try {
    const getCartResponse = await fetch(`${GUEST_CART_API_URL}/cart`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      }
    });
    
    const getCartData = await getCartResponse.json();
    console.log('Response:', JSON.stringify(getCartData, null, 2));
    
    if (getCartData.success && getCartData.data) {
      const cart = getCartData.data;
      const itemCount = cart.items?.length || 0;
      console.log(`✓ Cart retrieved:`);
      console.log(`  - Cart ID: ${cart.id}`);
      console.log(`  - Session ID: ${cart.sessionId}`);
      console.log(`  - Item Count: ${itemCount}`);
      console.log(`  - Subtotal: $${cart.subtotal || 0}`);
      
      if (itemCount > 0) {
        console.log(`\n✓✓✓ GUEST CART PERSISTENCE WORKING ✓✓✓`);
        console.log('Items in cart:');
        cart.items.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.product?.name || 'Product'} - Qty: ${item.quantity} - $${item.price}`);
        });
        return true;
      } else {
        console.log('\n✗ Cart is empty - items not persisted');
        return false;
      }
    } else {
      console.log('✗ Failed to retrieve cart');
      return false;
    }
  } catch (error) {
    console.log(`✗ Error retrieving cart: ${error.message}`);
    return false;
  }
}

// Run test
testGuestCartPersistence()
  .then(success => {
    console.log('\n' + '='.repeat(60));
    console.log(success ? 'TEST PASSED' : 'TEST FAILED');
    console.log('='.repeat(60));
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n✗ Test error:', error);
    process.exit(1);
  });
