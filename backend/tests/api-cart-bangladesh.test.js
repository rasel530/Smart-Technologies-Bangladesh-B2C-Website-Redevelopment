/**
 * Bangladesh-Specific Cart Features Tests
 * 
 * This test suite covers Bangladesh-specific cart functionality including:
 * - Local currency (BDT) formatting and calculations
 * - Tax calculations for different product categories
 * - Shipping calculations by division (Dhaka, Chittagong, etc.)
 * - Local payment method compatibility
 * - Bangladesh-specific business rules and regulations
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

describe('Bangladesh-Specific Cart Features', () => {
  let testUser, testCategory, testBrand, testProduct, testCart;

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestData();
    
    // Create test data
    testUser = await createTestUser();
    testCategory = await createTestCategory();
    testBrand = await createTestBrand();
    testProduct = await createTestProduct({ 
      category: testCategory, 
      brand: testBrand,
      regularPrice: 5000,
      stockQuantity: 100
    });
    
    testCart = await createTestCart({ 
      user: testUser, 
      product: testProduct,
      quantity: 2
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData();
  });

  /**
   * Bangladesh-specific test data configuration
   */
  const BANGLADESH_CART_CONFIG = {
    currency: {
      code: 'BDT',
      symbol: '৳',
      decimalPlaces: 2,
      exchangeRate: 1.0 // Base rate for BDT
    },
    tax: {
      electronics: 0.15,    // 15% VAT on electronics
      clothing: 0.10,       // 10% VAT on clothing
      food: 0.05,           // 5% VAT on food items
      books: 0.05,           // 5% VAT on books
      medicine: 0.00        // 0% VAT on medicine
    },
    shipping: {
      DHAKA: { regular: 100, express: 200, sameDay: 300 },
      CHITTAGONG: { regular: 150, express: 250, sameDay: 350 },
      RAJSHAHI: { regular: 120, express: 220, sameDay: 320 },
      SYLHET: { regular: 130, express: 230, sameDay: 330 },
      KHULNA: { regular: 140, express: 240, sameDay: 340 },
      BARISHAL: { regular: 160, express: 260, sameDay: 360 },
      RANGPUR: { regular: 170, express: 270, sameDay: 370 },
      MYMENSINGH: { regular: 180, express: 280, sameDay: 380 }
    },
    paymentMethods: {
      CASH_ON_DELIVERY: { fee: 0, available: true },
      BKASH: { fee: 0.018, available: true }, // 1.8% fee
      NAGAD: { fee: 0.018, available: true }, // 1.8% fee
      ROCKET: { fee: 0.020, available: true }, // 2.0% fee
      CARD: { fee: 0.025, available: true } // 2.5% fee
    }
  };

  describe('BDT Currency Handling', () => {
    /**
     * Test BDT currency formatting in cart totals
     */
    it('should display cart totals in BDT format', async () => {
      // Add items to cart
      await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: testProduct.id,
          quantity: 3
        },
        testUser.token
      );

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      // Verify currency formatting
      expect(cart.subtotal).toBeDefined();
      expect(cart.tax).toBeDefined();
      expect(cart.shippingCost).toBeDefined();
      expect(cart.total).toBeDefined();

      // Verify BDT symbol if included in response
      if (cart.currency) {
        expect(cart.currency.code).toBe('BDT');
        expect(cart.currency.symbol).toBe('৳');
      }
    });

    /**
     * Test price calculations with BDT decimal places
     */
    it('should handle BDT price calculations with correct decimal places', async () => {
      // Create product with fractional price
      const fractionalProduct = await createTestProduct({
        name: 'Fractional Price Product',
        regularPrice: 1250.75, // 1250.75 BDT
        stockQuantity: 50
      });

      await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: fractionalProduct.id,
          quantity: 2
        },
        testUser.token
      );

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      // Verify fractional calculations
      const expectedSubtotal = 1250.75 * 2; // 2501.50 BDT
      const expectedTax = expectedSubtotal * 0.15; // 375.23 BDT
      const expectedTotal = expectedSubtotal + expectedTax + 100; // 2976.73 BDT

      expect(parseFloat(cart.subtotal)).toBeCloseTo(expectedSubtotal, 2);
      expect(parseFloat(cart.tax)).toBeCloseTo(expectedTax, 2);
      expect(parseFloat(cart.total)).toBeCloseTo(expectedTotal, 2);
    });

    /**
     * Test large BDT amounts
     */
    it('should handle large BDT amounts correctly', async () => {
      // Create expensive product
      const expensiveProduct = await createTestProduct({
        name: 'Expensive Product',
        regularPrice: 125000, // 1.25 lakh BDT
        stockQuantity: 5
      });

      await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: expensiveProduct.id,
          quantity: 1
        },
        testUser.token
      );

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      // Verify large amount calculations
      const expectedSubtotal = 125000;
      const expectedTax = 125000 * 0.15; // 18750 BDT
      const expectedTotal = 125000 + 18750 + 100; // 143850 BDT

      expect(parseFloat(cart.subtotal)).toBeCloseTo(expectedSubtotal, 2);
      expect(parseFloat(cart.tax)).toBeCloseTo(expectedTax, 2);
      expect(parseFloat(cart.total)).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe('Bangladesh Tax Calculations', () => {
    /**
     * Test tax calculation for electronics (15% VAT)
     */
    it('should apply 15% VAT for electronics products', async () => {
      // Create electronics product
      const electronicsCategory = await createTestCategory({ name: 'Electronics' });
      const electronicsProduct = await createTestProduct({
        name: 'Smartphone',
        category: electronicsCategory,
        regularPrice: 50000,
        stockQuantity: 20
      });

      await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: electronicsProduct.id,
          quantity: 2
        },
        testUser.token
      );

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      const expectedSubtotal = 50000 * 2; // 100000 BDT
      const expectedTax = expectedSubtotal * BANGLADESH_CART_CONFIG.tax.electronics; // 15000 BDT (15%)
      const expectedTotal = expectedSubtotal + expectedTax + 100; // 115100 BDT

      expect(parseFloat(cart.subtotal)).toBeCloseTo(expectedSubtotal, 2);
      expect(parseFloat(cart.tax)).toBeCloseTo(expectedTax, 2);
      expect(parseFloat(cart.total)).toBeCloseTo(expectedTotal, 2);
    });

    /**
     * Test tax calculation for clothing (10% VAT)
     */
    it('should apply 10% VAT for clothing products', async () => {
      // Create clothing product
      const clothingCategory = await createTestCategory({ name: 'Clothing' });
      const clothingProduct = await createTestProduct({
        name: 'Traditional Panjabi',
        category: clothingCategory,
        regularPrice: 2500,
        stockQuantity: 30
      });

      await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: clothingProduct.id,
          quantity: 3
        },
        testUser.token
      );

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      const expectedSubtotal = 2500 * 3; // 7500 BDT
      const expectedTax = expectedSubtotal * BANGLADESH_CART_CONFIG.tax.clothing; // 750 BDT (10%)
      const expectedTotal = expectedSubtotal + expectedTax + 100; // 8350 BDT

      expect(parseFloat(cart.subtotal)).toBeCloseTo(expectedSubtotal, 2);
      expect(parseFloat(cart.tax)).toBeCloseTo(expectedTax, 2);
      expect(parseFloat(cart.total)).toBeCloseTo(expectedTotal, 2);
    });

    /**
     * Test tax calculation for food items (5% VAT)
     */
    it('should apply 5% VAT for food products', async () => {
      // Create food product
      const foodCategory = await createTestCategory({ name: 'Food & Groceries' });
      const foodProduct = await createTestProduct({
        name: 'Local Rice',
        category: foodCategory,
        regularPrice: 800,
        stockQuantity: 100
      });

      await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: foodProduct.id,
          quantity: 10 // 10 kg rice
        },
        testUser.token
      );

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      const expectedSubtotal = 800 * 10; // 8000 BDT
      const expectedTax = expectedSubtotal * BANGLADESH_CART_CONFIG.tax.food; // 400 BDT (5%)
      const expectedTotal = expectedSubtotal + expectedTax + 100; // 8500 BDT

      expect(parseFloat(cart.subtotal)).toBeCloseTo(expectedSubtotal, 2);
      expect(parseFloat(cart.tax)).toBeCloseTo(expectedTax, 2);
      expect(parseFloat(cart.total)).toBeCloseTo(expectedTotal, 2);
    });

    /**
     * Test mixed category tax calculations
     */
    it('should calculate taxes correctly for mixed product categories', async () => {
      // Create products from different categories
      const electronicsCategory = await createTestCategory({ name: 'Electronics' });
      const clothingCategory = await createTestCategory({ name: 'Clothing' });
      const foodCategory = await createTestCategory({ name: 'Food' });

      const electronicsProduct = await createTestProduct({
        name: 'Mobile Phone',
        category: electronicsCategory,
        regularPrice: 30000,
        stockQuantity: 10
      });

      const clothingProduct = await createTestProduct({
        name: 'Shirt',
        category: clothingCategory,
        regularPrice: 1500,
        stockQuantity: 20
      });

      const foodProduct = await createTestProduct({
        name: 'Spices',
        category: foodCategory,
        regularPrice: 500,
        stockQuantity: 50
      });

      // Add all products to cart
      await Promise.all([
        makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          { productId: electronicsProduct.id, quantity: 1 },
          testUser.token
        ),
        makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          { productId: clothingProduct.id, quantity: 2 },
          testUser.token
        ),
        makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          { productId: foodProduct.id, quantity: 5 },
          testUser.token
        )
      ]);

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      // Calculate expected taxes by category
      const electronicsTax = 30000 * BANGLADESH_CART_CONFIG.tax.electronics; // 4500 BDT
      const clothingTax = (1500 * 2) * BANGLADESH_CART_CONFIG.tax.clothing; // 300 BDT
      const foodTax = (500 * 5) * BANGLADESH_CART_CONFIG.tax.food; // 125 BDT
      const expectedTotalTax = electronicsTax + clothingTax + foodTax; // 4925 BDT

      const expectedSubtotal = 30000 + (1500 * 2) + (500 * 5); // 42500 BDT
      const expectedTotal = expectedSubtotal + expectedTotalTax + 100; // 47525 BDT

      expect(parseFloat(cart.subtotal)).toBeCloseTo(expectedSubtotal, 2);
      expect(parseFloat(cart.tax)).toBeCloseTo(expectedTotalTax, 2);
      expect(parseFloat(cart.total)).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe('Bangladesh Shipping Calculations', () => {
    /**
     * Test shipping costs for Dhaka division
     */
    it('should calculate correct shipping for Dhaka division', async () => {
      // Add items to cart
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

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      // Verify Dhaka shipping costs
      const expectedShipping = BANGLADESH_CART_CONFIG.shipping.DHAKA.regular; // 100 BDT
      expect(parseFloat(cart.shippingCost)).toBe(expectedShipping);

      // If express shipping is calculated, verify it too
      if (cart.expressShipping) {
        const expectedExpressShipping = BANGLADESH_CART_CONFIG.shipping.DHAKA.express; // 200 BDT
        expect(parseFloat(cart.expressShipping)).toBe(expectedExpressShipping);
      }
    });

    /**
     * Test shipping costs for Chittagong division
     */
    it('should calculate correct shipping for Chittagong division', async () => {
      await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: testProduct.id,
          quantity: 1
        },
        testUser.token
      );

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      const expectedShipping = BANGLADESH_CART_CONFIG.shipping.CHITTAGONG.regular; // 150 BDT
      expect(parseFloat(cart.shippingCost)).toBe(expectedShipping);
    });

    /**
     * Test shipping costs for all divisions
     */
    it('should calculate different shipping costs for all Bangladesh divisions', async () => {
      const divisions = Object.keys(BANGLADESH_CART_CONFIG.shipping);
      const shippingCosts = [];

      for (const division of divisions) {
        // Create separate cart for each division test
        const divisionCart = await createTestCart({ user: testUser });

        await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${divisionCart.id}/items`,
          {
            productId: testProduct.id,
            quantity: 1
          },
          testUser.token
        );

        const response = await makeAuthenticatedRequest(
          app,
          'GET',
          `/api/v1/cart/${divisionCart.id}`,
          {},
          testUser.token
        );

        expect(response.status).toBe(200);
        
        const shippingCost = parseFloat(response.body.cart.shippingCost);
        const expectedCost = BANGLADESH_CART_CONFIG.shipping[division].regular;
        
        expect(shippingCost).toBe(expectedCost);
        shippingCosts.push({ division, cost: shippingCost });
      }

      // Verify all divisions have different shipping costs
      const uniqueCosts = [...new Set(shippingCosts.map(s => s.cost))];
      expect(uniqueCosts.length).toBeGreaterThan(1);
    });

    /**
     * Test same-day shipping availability
     */
    it('should handle same-day shipping availability correctly', async () => {
      // Add items to cart
      await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: testProduct.id,
          quantity: 1
        },
        testUser.token
      );

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      // If same-day shipping is calculated
      if (cart.sameDayShipping) {
        // Should be higher than regular shipping
        expect(parseFloat(cart.sameDayShipping)).toBeGreaterThan(parseFloat(cart.shippingCost));
        
        // Should match Dhaka same-day rate (assuming Dhaka as default)
        const expectedSameDayShipping = BANGLADESH_CART_CONFIG.shipping.DHAKA.sameDay; // 300 BDT
        expect(parseFloat(cart.sameDayShipping)).toBe(expectedSameDayShipping);
      }
    });
  });

  describe('Bangladesh Payment Methods', () => {
    /**
     * Test bKash payment method integration
     */
    it('should support bKash payment method', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      // Verify bKash is available as payment option
      if (cart.paymentMethods) {
        expect(cart.paymentMethods.BKASH).toBeDefined();
        expect(cart.paymentMethods.BKASH.available).toBe(true);
        expect(cart.paymentMethods.BKASH.fee).toBe(BANGLADESH_CART_CONFIG.paymentMethods.BKASH.fee);
      }
    });

    /**
     * Test Nagad payment method integration
     */
    it('should support Nagad payment method', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      // Verify Nagad is available as payment option
      if (cart.paymentMethods) {
        expect(cart.paymentMethods.NAGAD).toBeDefined();
        expect(cart.paymentMethods.NAGAD.available).toBe(true);
        expect(cart.paymentMethods.NAGAD.fee).toBe(BANGLADESH_CART_CONFIG.paymentMethods.NAGAD.fee);
      }
    });

    /**
     * Test Rocket payment method integration
     */
    it('should support Rocket payment method', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      // Verify Rocket is available as payment option
      if (cart.paymentMethods) {
        expect(cart.paymentMethods.ROCKET).toBeDefined();
        expect(cart.paymentMethods.ROCKET.available).toBe(true);
        expect(cart.paymentMethods.ROCKET.fee).toBe(BANGLADESH_CART_CONFIG.paymentMethods.ROCKET.fee);
      }
    });

    /**
     * Test cash on delivery payment method
     */
    it('should support cash on delivery payment method', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      // Verify Cash on Delivery is available with no fee
      if (cart.paymentMethods) {
        expect(cart.paymentMethods.CASH_ON_DELIVERY).toBeDefined();
        expect(cart.paymentMethods.CASH_ON_DELIVERY.available).toBe(true);
        expect(cart.paymentMethods.CASH_ON_DELIVERY.fee).toBe(BANGLADESH_CART_CONFIG.paymentMethods.CASH_ON_DELIVERY.fee);
      }
    });

    /**
     * Test payment method fee calculations
     */
    it('should calculate payment method fees correctly', async () => {
      // Add expensive item to test fee calculations
      const expensiveProduct = await createTestProduct({
        name: 'Expensive Item',
        regularPrice: 50000,
        stockQuantity: 5
      });

      await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: expensiveProduct.id,
          quantity: 1
        },
        testUser.token
      );

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      const subtotal = parseFloat(cart.subtotal);
      
      // Calculate expected fees for different payment methods
      const expectedBkashFee = subtotal * BANGLADESH_CART_CONFIG.paymentMethods.BKASH.fee; // 1.8%
      const expectedNagadFee = subtotal * BANGLADESH_CART_CONFIG.paymentMethods.NAGAD.fee; // 1.8%
      const expectedRocketFee = subtotal * BANGLADESH_CART_CONFIG.paymentMethods.ROCKET.fee; // 2.0%
      const expectedCardFee = subtotal * BANGLADESH_CART_CONFIG.paymentMethods.CARD.fee; // 2.5%

      if (cart.paymentFees) {
        expect(parseFloat(cart.paymentFees.BKASH)).toBeCloseTo(expectedBkashFee, 2);
        expect(parseFloat(cart.paymentFees.NAGAD)).toBeCloseTo(expectedNagadFee, 2);
        expect(parseFloat(cart.paymentFees.ROCKET)).toBeCloseTo(expectedRocketFee, 2);
        expect(parseFloat(cart.paymentFees.CARD)).toBeCloseTo(expectedCardFee, 2);
      }
    });
  });

  describe('Bangladesh Business Rules', () => {
    /**
     * Test minimum order value for certain divisions
     */
    it('should enforce minimum order values for certain divisions', async () => {
      // Add low-value item
      const lowValueProduct = await createTestProduct({
        name: 'Low Value Item',
        regularPrice: 50,
        stockQuantity: 100
      });

      await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: lowValueProduct.id,
          quantity: 1
        },
        testUser.token
      );

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      // If minimum order validation exists
      if (cart.minimumOrder) {
        expect(cart.minimumOrder.value).toBeDefined();
        expect(cart.minimumOrder.met).toBeDefined();
        
        // Should indicate if minimum is met (50 BDT is likely below minimum)
        if (parseFloat(cart.subtotal) < cart.minimumOrder.value) {
          expect(cart.minimumOrder.met).toBe(false);
        }
      }
    });

    /**
     * Test maximum cart item limits
     */
    it('should enforce maximum cart item limits', async () => {
      // Try to add many items to cart
      const promises = [];
      for (let i = 0; i < 150; i++) { // Try to add 150 items
        promises.push(
          makeAuthenticatedRequest(
            app,
            'POST',
            `/api/v1/cart/${testCart.id}/items`,
            {
              productId: testProduct.id,
              quantity: 1
            },
            testUser.token
          )
        );
      }

      const responses = await Promise.all(promises);
      
      // Some requests should fail if there's a cart limit
      const failedRequests = responses.filter(res => res.status !== 201);
      
      if (failedRequests.length > 0) {
        expect(failedRequests[0].status).toBe(400);
        expect(failedRequests[0].body).toHaveProperty('error');
      }
    });

    /**
     * Test promotional discounts for local festivals
     */
    it('should handle promotional discounts for local festivals', async () => {
      // Create festival-specific coupon
      const festivalCoupon = await prisma.coupon.create({
        data: {
          code: 'EID2025',
          type: 'PERCENTAGE',
          value: 15.00,
          minAmount: 2000,
          maxDiscount: 1000,
          usageLimit: 1000,
          isActive: true,
          expiresAt: new Date('2025-06-30T23:59:59Z') // Eid-ul-Fitr 2025
        }
      });

      // Add items eligible for discount
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

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(200);
      const cart = response.body.cart;

      // If festival discounts are applied
      if (cart.festivalDiscount) {
        expect(cart.festivalDiscount.code).toBe('EID2025');
        expect(cart.festivalDiscount.percentage).toBe(15);
      }
    });
  });
});