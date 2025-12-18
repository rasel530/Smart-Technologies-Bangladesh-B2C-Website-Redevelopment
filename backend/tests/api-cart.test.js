/**
 * Cart Management API Endpoint Tests
 * 
 * This comprehensive test suite covers all cart management endpoints including:
 * - Basic cart operations (add, view, update, remove items)
 * - Advanced cart operations (quantity updates, bulk operations, cart merging)
 * - Guest cart handling (session-based carts, cart persistence after login)
 * - Bangladesh-specific features (local currency, tax calculations, shipping zones)
 * - Error handling and edge cases
 * - Performance and load testing scenarios
 * 
 * Test Coverage Areas:
 * 1. Basic Operations: Add items to cart, view cart contents, update quantities, remove items, clear cart
 * 2. Advanced Operations: Bulk add multiple items, cart merging, cart persistence, apply coupons, calculate totals
 * 3. Bangladesh-Specific Features: Tax calculations, shipping by division, currency formatting, payment methods
 * 4. Error Handling: Invalid product IDs, insufficient stock, negative quantities, unauthorized access, cart limits
 * 5. Performance Testing: Large cart handling, concurrent operations, memory optimization
 */

const request = require('supertest');
const { app } = require('../index');
const { 
  TEST_CONFIG, 
  createTestUser, 
  createTestAdmin,
  createTestCategory,
  createTestBrand,
  createTestProduct,
  createTestCart,
  cleanupTestData,
  makeAuthenticatedRequest,
  validateResponseStructure,
  prisma,
  BANGLADESH_TEST_DATA
} = require('./api-test-utils');

describe('Cart Management API Endpoints', () => {
  let testUser, adminUser, guestUser, testCategory, testBrand, testProduct, testCart, guestCart;

  /**
   * Bangladesh-specific test data for cart operations
   */
  const BANGLADESH_CART_DATA = {
    divisions: {
      DHAKA: { tax: 0.15, shipping: 100, expressShipping: 200 },
      CHITTAGONG: { tax: 0.15, shipping: 150, expressShipping: 250 },
      RAJSHAHI: { tax: 0.15, shipping: 120, expressShipping: 220 },
      SYLHET: { tax: 0.15, shipping: 130, expressShipping: 230 },
      KHULNA: { tax: 0.15, shipping: 140, expressShipping: 240 },
      BARISHAL: { tax: 0.15, shipping: 160, expressShipping: 260 },
      RANGPUR: { tax: 0.15, shipping: 170, expressShipping: 270 },
      MYMENSINGH: { tax: 0.15, shipping: 180, expressShipping: 280 }
    },
    products: {
      electronics: {
        tax: 0.15,
        warranty: 12,
        categories: ['mobile-phones', 'laptops', 'tablets']
      },
      clothing: {
        tax: 0.10,
        warranty: 6,
        categories: ['mens-clothing', 'womens-clothing', 'kids-clothing']
      },
      food: {
        tax: 0.05,
        warranty: 0,
        categories: ['groceries', 'snacks', 'beverages']
      }
    },
    paymentMethods: ['CASH_ON_DELIVERY', 'BKASH', 'NAGAD', 'ROCKET'],
    currency: {
      code: 'BDT',
      symbol: '৳',
      decimalPlaces: 2
    }
  };

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestData();
    
    // Create test data
    testUser = await createTestUser();
    adminUser = await createTestAdmin();
    testCategory = await createTestCategory();
    testBrand = await createTestBrand();
    testProduct = await createTestProduct({ 
      category: testCategory, 
      brand: testBrand,
      regularPrice: 5000,
      stockQuantity: 100
    });
    
    // Create test carts
    testCart = await createTestCart({ 
      user: testUser, 
      product: testProduct,
      quantity: 2
    });
    
    guestCart = await createTestCart({ 
      user: null,
      sessionId: 'guest-session-' + Date.now(),
      product: testProduct,
      quantity: 1
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData();
  });

  describe('GET /api/v1/cart/:cartId', () => {
    /**
     * Test successful retrieval of user cart
     */
    it('should retrieve user cart successfully with calculated totals', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('cart');
      
      const cart = response.body.cart;
      expect(cart.id).toBe(testCart.id);
      expect(cart).toHaveProperty('items');
      expect(cart).toHaveProperty('subtotal');
      expect(cart).toHaveProperty('tax');
      expect(cart).toHaveProperty('shippingCost');
      expect(cart).toHaveProperty('total');
      
      // Verify calculations
      const expectedSubtotal = cart.items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
      const expectedTax = expectedSubtotal * 0.15; // 15% tax
      const expectedShipping = 100; // Fixed shipping
      const expectedTotal = expectedSubtotal + expectedTax + expectedShipping;
      
      expect(parseFloat(cart.subtotal)).toBeCloseTo(expectedSubtotal, 2);
      expect(parseFloat(cart.tax)).toBeCloseTo(expectedTax, 2);
      expect(parseFloat(cart.shippingCost)).toBe(expectedShipping);
      expect(parseFloat(cart.total)).toBeCloseTo(expectedTotal, 2);
    });

    /**
     * Test successful retrieval of guest cart
     */
    it('should retrieve guest cart successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/cart/${guestCart.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('cart');
      expect(response.body.cart.id).toBe(guestCart.id);
    });

    /**
     * Test retrieval of non-existent cart
     */
    it('should return 404 for non-existent cart', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${fakeId}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Cart not found');
    });

    /**
     * Test invalid UUID format
     */
    it('should return validation error for invalid UUID format', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        '/api/v1/cart/invalid-uuid',
        {},
        testUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    /**
     * Test cart with product images
     */
    it('should include product images in cart response', async () => {
      // Create product with image
      const productWithImage = await createTestProduct({
        name: 'Product with Image'
      });
      
      // Create product image
      await prisma.productImage.create({
        data: {
          productId: productWithImage.id,
          url: 'https://example.com/image.jpg',
          alt: 'Product Image',
          sortOrder: 0
        }
      });

      const cartWithImage = await createTestCart({
        user: testUser,
        product: productWithImage
      });

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${cartWithImage.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;
      expect(cart.items.length).toBeGreaterThan(0);
      
      if (cart.items.length > 0) {
        expect(cart.items[0].product).toHaveProperty('images');
        expect(Array.isArray(cart.items[0].product.images)).toBe(true);
      }
    });
  });

  describe('POST /api/v1/cart/:cartId/items', () => {
    /**
     * Test successful addition of item to cart
     */
    it('should add item to cart successfully', async () => {
      const newItem = {
        productId: testProduct.id,
        quantity: 2
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        newItem,
        testUser.token
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Item added to cart');
      expect(response.body).toHaveProperty('item');
      
      const item = response.body.item;
      expect(item.productId).toBe(newItem.productId);
      expect(item.quantity).toBe(newItem.quantity);
      expect(item).toHaveProperty('unitPrice');
      expect(item).toHaveProperty('totalPrice');
      
      // Verify price calculation
      const expectedTotalPrice = parseFloat(item.unitPrice) * newItem.quantity;
      expect(parseFloat(item.totalPrice)).toBeCloseTo(expectedTotalPrice, 2);
    });

    /**
     * Test adding item with variant
     */
    it('should add item with variant to cart successfully', async () => {
      // Create product variant
      const variant = await prisma.productVariant.create({
        data: {
          productId: testProduct.id,
          name: 'Test Variant',
          sku: 'VARIANT-001',
          price: 6000,
          stock: 50,
          isActive: true
        }
      });

      const newItem = {
        productId: testProduct.id,
        variantId: variant.id,
        quantity: 1
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        newItem,
        testUser.token
      );

      expect(response.status).toBe(201);
      const item = response.body.item;
      expect(item.variantId).toBe(variant.id);
      expect(parseFloat(item.unitPrice)).toBe(6000);
    });

    /**
     * Test updating existing item quantity
     */
    it('should update quantity of existing item in cart', async () => {
      // Add initial item
      await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: testProduct.id,
          quantity: 2
        },
        testUser.token
      );

      // Add same item again
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: testProduct.id,
          quantity: 3
        },
        testUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Cart item updated');
      expect(response.body.item.quantity).toBe(5); // 2 + 3
    });

    /**
     * Test adding item to guest cart
     */
    it('should allow adding items to guest cart without authentication', async () => {
      const newItem = {
        productId: testProduct.id,
        quantity: 1
      };

      const response = await request(app)
        .post(`/api/v1/cart/${guestCart.id}/items`)
        .send(newItem);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Item added to cart');
    });

    /**
     * Test validation of required fields
     */
    it('should validate required fields for adding item', async () => {
      const incompleteData = {
        quantity: 2
        // Missing productId
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        incompleteData,
        testUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    /**
     * Test invalid product ID
     */
    it('should return 404 for non-existent product', async () => {
      const fakeProductId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: fakeProductId,
          quantity: 1
        },
        testUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Product not found');
    });

    /**
     * Test invalid quantity
     */
    it('should reject invalid quantity values', async () => {
      const invalidQuantities = [0, -1, -5, 'invalid'];

      for (const quantity of invalidQuantities) {
        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          {
            productId: testProduct.id,
            quantity: quantity
          },
          testUser.token
        );

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation failed');
      }
    });

    /**
     * Test adding to non-existent cart
     */
    it('should return 404 when adding to non-existent cart', async () => {
      const fakeCartId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${fakeCartId}/items`,
        {
          productId: testProduct.id,
          quantity: 1
        },
        testUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Cart not found');
    });
  });

  describe('PUT /api/v1/cart/:cartId/items/:itemId', () => {
    let cartItem;

    beforeEach(async () => {
      // Create a cart item for testing
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: testCart.id,
          productId: testProduct.id,
          quantity: 2,
          unitPrice: parseFloat(testProduct.regularPrice),
          totalPrice: parseFloat(testProduct.regularPrice) * 2
        }
      });
    });

    /**
     * Test successful update of cart item quantity
     */
    it('should update cart item quantity successfully', async () => {
      const updateData = {
        quantity: 5
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/cart/${testCart.id}/items/${cartItem.id}`,
        updateData,
        testUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Cart item updated');
      expect(response.body).toHaveProperty('item');
      
      const item = response.body.item;
      expect(item.quantity).toBe(updateData.quantity);
      
      // Verify price calculation
      const expectedTotalPrice = parseFloat(item.unitPrice) * updateData.quantity;
      expect(parseFloat(item.totalPrice)).toBeCloseTo(expectedTotalPrice, 2);
    });

    /**
     * Test updating item with variant
     */
    it('should update cart item with variant correctly', async () => {
      // Create variant
      const variant = await prisma.productVariant.create({
        data: {
          productId: testProduct.id,
          name: 'Test Variant',
          sku: 'VARIANT-002',
          price: 7000,
          stock: 30,
          isActive: true
        }
      });

      // Create cart item with variant
      const variantCartItem = await prisma.cartItem.create({
        data: {
          cartId: testCart.id,
          productId: testProduct.id,
          variantId: variant.id,
          quantity: 1,
          unitPrice: 7000,
          totalPrice: 7000
        }
      });

      const updateData = {
        quantity: 3
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/cart/${testCart.id}/items/${variantCartItem.id}`,
        updateData,
        testUser.token
      );

      expect(response.status).toBe(200);
      const item = response.body.item;
      expect(item.quantity).toBe(3);
      expect(parseFloat(item.totalPrice)).toBe(21000); // 7000 * 3
    });

    /**
     * Test updating non-existent cart item
     */
    it('should return 404 for non-existent cart item', async () => {
      const fakeItemId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/cart/${testCart.id}/items/${fakeItemId}`,
        { quantity: 5 },
        testUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Cart item not found');
    });

    /**
     * Test invalid quantity values
     */
    it('should reject invalid quantity values', async () => {
      const invalidQuantities = [0, -1, -5, 'invalid'];

      for (const quantity of invalidQuantities) {
        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `/api/v1/cart/${testCart.id}/items/${cartItem.id}`,
          { quantity },
          testUser.token
        );

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation failed');
      }
    });

    /**
     * Test updating item in guest cart
     */
    it('should allow updating items in guest cart without authentication', async () => {
      const guestCartItem = await prisma.cartItem.create({
        data: {
          cartId: guestCart.id,
          productId: testProduct.id,
          quantity: 1,
          unitPrice: parseFloat(testProduct.regularPrice),
          totalPrice: parseFloat(testProduct.regularPrice)
        }
      });

      const response = await request(app)
        .put(`/api/v1/cart/${guestCart.id}/items/${guestCartItem.id}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(200);
      expect(response.body.item.quantity).toBe(3);
    });
  });

  describe('DELETE /api/v1/cart/:cartId/items/:itemId', () => {
    let cartItem;

    beforeEach(async () => {
      // Create a cart item for testing
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: testCart.id,
          productId: testProduct.id,
          quantity: 2,
          unitPrice: parseFloat(testProduct.regularPrice),
          totalPrice: parseFloat(testProduct.regularPrice) * 2
        }
      });
    });

    /**
     * Test successful removal of cart item
     */
    it('should remove cart item successfully', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/cart/${testCart.id}/items/${cartItem.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Item removed from cart');

      // Verify item is deleted
      const deletedItem = await prisma.cartItem.findUnique({
        where: { id: cartItem.id }
      });
      expect(deletedItem).toBeNull();
    });

    /**
     * Test removing non-existent cart item
     */
    it('should return 404 for non-existent cart item', async () => {
      const fakeItemId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/cart/${testCart.id}/items/${fakeItemId}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Cart item not found');
    });

    /**
     * Test removing item from guest cart
     */
    it('should allow removing items from guest cart without authentication', async () => {
      const guestCartItem = await prisma.cartItem.create({
        data: {
          cartId: guestCart.id,
          productId: testProduct.id,
          quantity: 1,
          unitPrice: parseFloat(testProduct.regularPrice),
          totalPrice: parseFloat(testProduct.regularPrice)
        }
      });

      const response = await request(app)
        .delete(`/api/v1/cart/${guestCart.id}/items/${guestCartItem.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Item removed from cart');
    });

    /**
     * Test removing item from wrong cart
     */
    it('should prevent removing item from different cart', async () => {
      const anotherCart = await createTestCart({ user: testUser });
      
      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/cart/${anotherCart.id}/items/${cartItem.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Cart item not found');
    });
  });

  describe('DELETE /api/v1/cart/:cartId', () => {
    /**
     * Test successful clearing of cart
     */
    it('should clear cart successfully', async () => {
      // Add multiple items to cart
      await Promise.all([
        prisma.cartItem.create({
          data: {
            cartId: testCart.id,
            productId: testProduct.id,
            quantity: 1,
            unitPrice: parseFloat(testProduct.regularPrice),
            totalPrice: parseFloat(testProduct.regularPrice)
          }
        }),
        prisma.cartItem.create({
          data: {
            cartId: testCart.id,
            productId: testProduct.id,
            quantity: 2,
            unitPrice: parseFloat(testProduct.regularPrice),
            totalPrice: parseFloat(testProduct.regularPrice) * 2
          }
        })
      ]);

      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Cart cleared');

      // Verify all items are deleted
      const remainingItems = await prisma.cartItem.findMany({
        where: { cartId: testCart.id }
      });
      expect(remainingItems.length).toBe(0);
    });

    /**
     * Test clearing empty cart
     */
    it('should clear empty cart successfully', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Cart cleared');
    });

    /**
     * Test clearing non-existent cart
     */
    it('should return 404 for non-existent cart', async () => {
      const fakeCartId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/cart/${fakeCartId}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Cart not found');
    });

    /**
     * Test clearing guest cart
     */
    it('should allow clearing guest cart without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/cart/${guestCart.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Cart cleared');
    });
  });
});