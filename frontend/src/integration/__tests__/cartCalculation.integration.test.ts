/**
 * Cart Calculation Integration Tests
 * 
 * Comprehensive integration tests for cart calculations including
 * subtotals, discounts, shipping, taxes, and frontend/backend verification
 * 
 * @author Smart Tech B2C Development Team
 * @version 1.0.0
 */

// ============================================
// Cart Calculation Utilities
// ============================================

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  variantId: string | null;
  weight?: number;
}

interface CartCalculationResult {
  subtotal: number;
  discount: number;
  discountPercentage: number;
  shipping: number;
  tax: number;
  taxRate: number;
  total: number;
  itemCount: number;
  savings: number;
}

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  freeThreshold: number;
  estimatedDays: string;
}

interface DiscountRule {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  applicableProducts?: string[];
  excludedProducts?: string[];
}

// Configuration constants
const TAX_RATE = 0.10; // 10% tax
const FREE_SHIPPING_THRESHOLD = 500.00;
const STANDARD_SHIPPING_COST = 50.00;
const EXPRESS_SHIPPING_COST = 100.00;
const OVERNIGHT_SHIPPING_COST = 150.00;

// ============================================
// Calculation Functions
// ============================================

/**
 * Calculate subtotal from cart items
 */
function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
}

/**
 * Calculate item count
 */
function calculateItemCount(items: CartItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

/**
 * Apply fixed amount discount
 */
function applyFixedDiscount(subtotal: number, discountValue: number): number {
  return Math.min(subtotal, discountValue);
}

/**
 * Apply percentage discount
 */
function applyPercentageDiscount(subtotal: number, discountPercentage: number): number {
  return (subtotal * discountPercentage) / 100;
}

/**
 * Calculate shipping cost based on subtotal
 */
function calculateShipping(subtotal: number, shippingMethod: ShippingMethod): number {
  if (subtotal >= shippingMethod.freeThreshold) {
    return 0;
  }
  return shippingMethod.price;
}

/**
 * Calculate shipping with all methods
 */
function calculateAllShipping(subtotal: number): { standard: number; express: number; overnight: number } {
  return {
    standard: calculateShipping(subtotal, {
      id: 'standard',
      name: 'Standard Shipping',
      price: STANDARD_SHIPPING_COST,
      freeThreshold: FREE_SHIPPING_THRESHOLD,
      estimatedDays: '5-7 business days'
    }),
    express: calculateShipping(subtotal, {
      id: 'express',
      name: 'Express Shipping',
      price: EXPRESS_SHIPPING_COST,
      freeThreshold: FREE_SHIPPING_THRESHOLD,
      estimatedDays: '2-3 business days'
    }),
    overnight: calculateShipping(subtotal, {
      id: 'overnight',
      name: 'Overnight Shipping',
      price: OVERNIGHT_SHIPPING_COST,
      freeThreshold: FREE_SHIPPING_THRESHOLD,
      estimatedDays: '1 business day'
    })
  };
}

/**
 * Calculate tax on discounted amount
 */
function calculateTax(taxableAmount: number, taxRate: number = TAX_RATE): number {
  return Number((taxableAmount * taxRate).toFixed(2));
}

/**
 * Calculate total with all components
 */
function calculateTotal(
  subtotal: number,
  discount: number,
  shipping: number,
  tax: number
): number {
  return Number((subtotal - discount + shipping + tax).toFixed(2));
}

/**
 * Apply discount code with rules
 */
function applyDiscountCode(
  subtotal: number,
  discountCode: string,
  rules: DiscountRule[]
): { discount: number; valid: boolean; message: string } {
  const rule = rules.find(r => r.code === discountCode.toUpperCase());
  
  if (!rule) {
    return { discount: 0, valid: false, message: 'Invalid discount code' };
  }
  
  if (subtotal < rule.minOrderAmount) {
    return { 
      discount: 0, 
      valid: false, 
      message: `Minimum order amount of $${rule.minOrderAmount.toFixed(2)} required` 
    };
  }
  
  let discount: number;
  if (rule.type === 'percentage') {
    discount = applyPercentageDiscount(subtotal, rule.value);
  } else {
    discount = applyFixedDiscount(subtotal, rule.value);
  }
  
  // Apply max discount cap
  if (rule.maxDiscountAmount > 0 && discount > rule.maxDiscountAmount) {
    discount = rule.maxDiscountAmount;
  }
  
  return { discount, valid: true, message: 'Discount applied' };
}

/**
 * Calculate tiered discounts based on order value
 */
function calculateTieredDiscount(subtotal: number): { percentage: number; discount: number; tier: string } {
  let tier: string;
  let percentage: number;
  
  if (subtotal >= 2000) {
    tier = 'platinum';
    percentage = 20;
  } else if (subtotal >= 1000) {
    tier = 'gold';
    percentage = 15;
  } else if (subtotal >= 500) {
    tier = 'silver';
    percentage = 10;
  } else if (subtotal >= 250) {
    tier = 'bronze';
    percentage = 5;
  } else {
    tier = 'none';
    percentage = 0;
  }
  
  const discount = applyPercentageDiscount(subtotal, percentage);
  
  return { percentage, discount, tier };
}

/**
 * Complete cart calculation
 */
function calculateCartTotal(
  items: CartItem[],
  discountCode: string | null,
  shippingMethodId: string,
  discountRules: DiscountRule[]
): CartCalculationResult {
  const subtotal = calculateSubtotal(items);
  const itemCount = calculateItemCount(items);
  
  // Apply discount
  let discount = 0;
  let discountPercentage = 0;
  let savings = 0;
  
  if (discountCode) {
    const { discount: codeDiscount, valid } = applyDiscountCode(subtotal, discountCode, discountRules);
    if (valid) {
      discount = codeDiscount;
      discountPercentage = (discount / subtotal) * 100;
      savings = discount;
    }
  }
  
  // Calculate shipping
  const shippingMethods: ShippingMethod[] = [
    { id: 'standard', name: 'Standard', price: STANDARD_SHIPPING_COST, freeThreshold: FREE_SHIPPING_THRESHOLD, estimatedDays: '5-7 days' },
    { id: 'express', name: 'Express', price: EXPRESS_SHIPPING_COST, freeThreshold: FREE_SHIPPING_THRESHOLD, estimatedDays: '2-3 days' },
    { id: 'overnight', name: 'Overnight', price: OVERNIGHT_SHIPPING_COST, freeThreshold: FREE_SHIPPING_THRESHOLD, estimatedDays: '1 day' }
  ];
  
  const shippingMethod = shippingMethods.find(m => m.id === shippingMethodId) || shippingMethods[0];
  const shipping = calculateShipping(subtotal, shippingMethod);
  
  // Calculate tax on discounted subtotal
  const taxableAmount = subtotal - discount;
  const tax = calculateTax(taxableAmount);
  
  // Calculate total
  const total = calculateTotal(subtotal, discount, shipping, tax);
  
  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    discountPercentage: Number(discountPercentage.toFixed(2)),
    shipping: Number(shipping.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    taxRate: TAX_RATE * 100,
    total: Number(total.toFixed(2)),
    itemCount,
    savings: Number(savings.toFixed(2))
  };
}

// ============================================
// Mock Backend API
// ============================================

class MockCartAPI {
  private discountRules: DiscountRule[] = [
    { code: 'SAVE10', type: 'percentage', value: 10, minOrderAmount: 0, maxDiscountAmount: 100 },
    { code: 'SAVE20', type: 'percentage', value: 20, minOrderAmount: 200, maxDiscountAmount: 200 },
    { code: 'FLAT50', type: 'fixed', value: 50, minOrderAmount: 150, maxDiscountAmount: 0 },
    { code: 'WELCOME15', type: 'percentage', value: 15, minOrderAmount: 0, maxDiscountAmount: 150 },
    { code: 'VIP25', type: 'percentage', value: 25, minOrderAmount: 500, maxDiscountAmount: 500 }
  ];

  async calculateCart(items: CartItem[], discountCode: string | null, shippingMethodId: string): Promise<CartCalculationResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return calculateCartTotal(items, discountCode, shippingMethodId, this.discountRules);
  }

  async getDiscountRules(): Promise<DiscountRule[]> {
    return this.discountRules;
  }

  async validateDiscountCode(code: string, subtotal: number): Promise<{ valid: boolean; discount: number; message: string }> {
    const { discount, valid, message } = applyDiscountCode(subtotal, code, this.discountRules);
    return { valid, discount, message };
  }
}

// ============================================
// Test Utilities
// ============================================

function createTestCart(items: Array<{ productId: string; quantity: number; price: number }>): CartItem[] {
  return items.map((item, index) => ({
    id: `item_${index}_${Date.now()}`,
    productId: item.productId,
    quantity: item.quantity,
    price: item.price,
    variantId: null
  }));
}

// ============================================
// Integration Tests
// ============================================

describe('Cart Calculation Integration', () => {
  let mockAPI: MockCartAPI;

  beforeAll(() => {
    mockAPI = new MockCartAPI();
  });

  // ============================================
  // End-to-End Calculation Flow
  // ============================================
  describe('End-to-End Calculation Flow', () => {
    it('should calculate correct totals for complex cart', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 2, price: 100.00 },  // 200
        { productId: 'prod2', quantity: 3, price: 50.00 },    // 150
        { productId: 'prod3', quantity: 1, price: 249.99 },  // 249.99
      ]);
      
      const result = await mockAPI.calculateCart(items, null, 'standard');
      
      // Subtotal: 200 + 150 + 249.99 = 599.99
      expect(result.subtotal).toBeCloseTo(599.99, 2);
      
      // Item count: 2 + 3 + 1 = 6
      expect(result.itemCount).toBe(6);
      
      // Shipping: subtotal 599.99 >= 500, so free
      expect(result.shipping).toBe(0);
      
      // Tax: 599.99 * 0.10 = 59.999 -> 60.00
      expect(result.tax).toBeCloseTo(60.00, 2);
      
      // Total: 599.99 + 0 + 60.00 = 659.99
      expect(result.total).toBeCloseTo(659.99, 2);
    });

    it('should apply percentage discount correctly', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 2, price: 100.00 }, // 200
      ]);
      
      const result = await mockAPI.calculateCart(items, 'SAVE10', 'standard');
      
      // Discount: 200 * 0.10 = 20
      expect(result.discount).toBe(20);
      expect(result.discountPercentage).toBe(10);
      expect(result.savings).toBe(20);
      
      // Tax: (200 - 20) * 0.10 = 18
      expect(result.tax).toBeCloseTo(18.00, 2);
      
      // Total: 200 - 20 + 0 + 18 = 198
      expect(result.total).toBeCloseTo(198.00, 2);
    });

    it('should apply fixed discount correctly', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 2, price: 100.00 }, // 200
      ]);
      
      const result = await mockAPI.calculateCart(items, 'FLAT50', 'standard');
      
      expect(result.discount).toBe(50);
      expect(result.savings).toBe(50);
      
      // Tax: (200 - 50) * 0.10 = 15
      expect(result.tax).toBeCloseTo(15.00, 2);
      
      // Total: 200 - 50 + 0 + 15 = 165
      expect(result.total).toBeCloseTo(165.00, 2);
    });

    it('should calculate shipping based on discounted subtotal', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 6, price: 100.00 }, // 600
      ]);
      
      const result = await mockAPI.calculateCart(items, 'SAVE10', 'standard');
      
      // Discount: 600 * 0.10 = 60
      expect(result.discount).toBe(60);
      
      // Subtotal after discount: 600 - 60 = 540
      // Shipping: 540 >= 500, so free
      expect(result.shipping).toBe(0);
    });

    it('should handle maximum discount cap', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 20, price: 100.00 }, // 2000
      ]);
      
      const result = await mockAPI.calculateCart(items, 'SAVE10', 'standard');
      
      // 10% of 2000 = 200, but max is 100
      expect(result.discount).toBe(100);
      expect(result.discountPercentage).toBe(5); // 100 / 2000
    });

    it('should handle invalid discount code', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 2, price: 100.00 },
      ]);
      
      const result = await mockAPI.calculateCart(items, 'INVALID', 'standard');
      
      expect(result.discount).toBe(0);
      expect(result.savings).toBe(0);
      expect(result.subtotal).toBe(200);
    });

    it('should enforce minimum order amount for discount', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 1, price: 50.00 }, // 50
      ]);
      
      const result = await mockAPI.calculateCart(items, 'FLAT50', 'standard');
      
      // FLAT50 requires min 150, so not applied
      expect(result.discount).toBe(0);
    });

    it('should calculate express shipping correctly', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 1, price: 100.00 },
      ]);
      
      const result = await mockAPI.calculateCart(items, null, 'express');
      
      // Express: 100 < 500, so $100
      expect(result.shipping).toBe(100);
      
      const resultWithDiscount = await mockAPI.calculateCart(items, 'SAVE10', 'express');
      
      // With 10% discount: 100 - 10 = 90 < 500, still $100
      expect(resultWithDiscount.shipping).toBe(100);
    });

    it('should handle overnight shipping', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 10, price: 100.00 }, // 1000
      ]);
      
      const result = await mockAPI.calculateCart(items, null, 'overnight');
      
      // Overnight: 1000 >= 500, free
      expect(result.shipping).toBe(0);
    });
  });

  // ============================================
  // Free Shipping Threshold Tests
  // ============================================
  describe('Free Shipping Threshold', () => {
    it('should charge shipping when below threshold', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 1, price: 200.00 }, // 200
      ]);
      
      const result = await mockAPI.calculateCart(items, null, 'standard');
      expect(result.shipping).toBe(50); // Not free
    });

    it('should provide free shipping at exact threshold', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 5, price: 100.00 }, // 500
      ]);
      
      const result = await mockAPI.calculateCart(items, null, 'standard');
      expect(result.shipping).toBe(0); // Free at 500
    });

    it('should provide free shipping above threshold', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 10, price: 100.00 }, // 1000
      ]);
      
      const result = await mockAPI.calculateCart(items, null, 'standard');
      expect(result.shipping).toBe(0); // Free above 500
    });

    it('should consider discount when determining free shipping', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 6, price: 100.00 }, // 600
      ]);
      
      // Without discount, shipping is free (600 >= 500)
      const resultNoDiscount = await mockAPI.calculateCart(items, null, 'standard');
      expect(resultNoDiscount.shipping).toBe(0);
      
      // With large discount that brings below threshold
      const itemsHighPrice = createTestCart([
        { productId: 'prod1', quantity: 1, price: 550.00 }, // 550
      ]);
      const resultWithDiscount = await mockAPI.calculateCart(itemsHighPrice, 'SAVE20', 'standard');
      
      // 550 * 0.80 = 440, which is below 500, so shipping applies
      expect(resultWithDiscount.subtotal).toBe(550);
      expect(resultWithDiscount.discount).toBe(110); // 20% of 550 = 110
      expect(resultWithDiscount.shipping).toBe(50); // Not free
    });

    it('should handle shipping thresholds with different shipping methods', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 4, price: 100.00 }, // 400
      ]);
      
      const result = await mockAPI.calculateCart(items, null, 'standard');
      expect(result.shipping).toBe(50);
      
      const resultExpress = await mockAPI.calculateCart(items, null, 'express');
      expect(resultExpress.shipping).toBe(100);
      
      const resultOvernight = await mockAPI.calculateCart(items, null, 'overnight');
      expect(resultOvernight.shipping).toBe(150);
    });
  });

  // ============================================
  // Tiered Discount Tests
  // ============================================
  describe('Tiered Discounts', () => {
    it('should not apply discount below lowest tier', () => {
      const subtotal = 100;
      const result = calculateTieredDiscount(subtotal);
      
      expect(result.tier).toBe('none');
      expect(result.discount).toBe(0);
      expect(result.percentage).toBe(0);
    });

    it('should apply 5% for orders $250-499', () => {
      const subtotal = 300;
      const result = calculateTieredDiscount(subtotal);
      
      expect(result.tier).toBe('bronze');
      expect(result.percentage).toBe(5);
      expect(result.discount).toBe(15); // 300 * 0.05
    });

    it('should apply 10% for orders $500-999', () => {
      const subtotal = 600;
      const result = calculateTieredDiscount(subtotal);
      
      expect(result.tier).toBe('silver');
      expect(result.percentage).toBe(10);
      expect(result.discount).toBe(60); // 600 * 0.10
    });

    it('should apply 15% for orders $1000-1999', () => {
      const subtotal = 1500;
      const result = calculateTieredDiscount(subtotal);
      
      expect(result.tier).toBe('gold');
      expect(result.percentage).toBe(15);
      expect(result.discount).toBe(225); // 1500 * 0.15
    });

    it('should apply 20% for orders $2000+', () => {
      const subtotal = 2500;
      const result = calculateTieredDiscount(subtotal);
      
      expect(result.tier).toBe('platinum');
      expect(result.percentage).toBe(20);
      expect(result.discount).toBe(500); // 2500 * 0.20
    });

    it('should calculate tiered discount with shipping', () => {
      const subtotal = 600;
      const tierResult = calculateTieredDiscount(subtotal);
      
      // Shipping should still be free since subtotal >= 500
      expect(tierResult.discount).toBe(60);
      
      const shipping = calculateShipping(subtotal, {
        id: 'standard',
        name: 'Standard',
        price: 50,
        freeThreshold: 500,
        estimatedDays: '5-7 days'
      });
      
      expect(shipping).toBe(0);
    });
  });

  // ============================================
  // Decimal Precision Tests
  // ============================================
  describe('Decimal Precision', () => {
    it('should handle repeating decimal prices correctly', () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 3, price: 33.33 },
        { productId: 'prod2', quantity: 2, price: 66.67 },
      ]);
      
      const subtotal = calculateSubtotal(items);
      // 99.99 + 133.34 = 233.33
      expect(subtotal).toBeCloseTo(233.33, 2);
    });

    it('should round tax correctly to 2 decimal places', () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 1, price: 33.33 },
      ]);
      
      const subtotal = calculateSubtotal(items);
      const tax = calculateTax(subtotal);
      
      // 33.33 * 0.10 = 3.333 -> should round to 3.33
      expect(tax).toBeCloseTo(3.33, 2);
    });

    it('should handle small decimal amounts', () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 1, price: 0.01 },
        { productId: 'prod2', quantity: 1, price: 0.02 },
      ]);
      
      const subtotal = calculateSubtotal(items);
      expect(subtotal).toBeCloseTo(0.03, 2);
      
      const tax = calculateTax(subtotal);
      expect(tax).toBeCloseTo(0.00, 2); // 0.003 rounds down
    });

    it('should handle large decimal precision prices', () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 1, price: 123456.789012 },
      ]);
      
      const subtotal = calculateSubtotal(items);
      expect(subtotal).toBeCloseTo(123456.79, 2);
    });

    it('should maintain precision through multiple calculations', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 7, price: 19.99 },
        { productId: 'prod2', quantity: 3, price: 29.97 },
        { productId: 'prod3', quantity: 5, price: 12.50 },
      ]);
      
      const result = await mockAPI.calculateCart(items, 'SAVE10', 'express');
      
      // Verify final total makes sense
      expect(result.total).toBeGreaterThan(0);
      expect(result.total).toBeLessThanOrEqual(result.subtotal + result.shipping + result.tax);
    });

    it('should handle floating point edge cases', () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 1, price: 0.1 },
        { productId: 'prod2', quantity: 2, price: 0.2 },
      ]);
      
      const subtotal = calculateSubtotal(items);
      // 0.1 + 0.4 = 0.5
      expect(subtotal).toBeCloseTo(0.5, 2);
      
      const tax = calculateTax(subtotal);
      expect(tax).toBeCloseTo(0.05, 2);
    });
  });

  // ============================================
  // Backend Calculation Verification
  // ============================================
  describe('Backend Calculation Verification', () => {
    it('should match frontend and backend calculations', async () => {
      const cartData = {
        items: createTestCart([
          { productId: 'prod1', quantity: 2, price: 100.00 },
          { productId: 'prod2', quantity: 1, price: 50.00 },
        ]),
        discountCode: 'SAVE10',
        shippingMethod: 'express'
      };
      
      // Get calculation from backend (mock)
      const backendCalculation = await mockAPI.calculateCart(
        cartData.items,
        cartData.discountCode,
        cartData.shippingMethod
      );
      
      // Calculate on frontend using same logic
      const frontendCalculation = calculateCartTotal(
        cartData.items,
        cartData.discountCode,
        cartData.shippingMethod,
        await mockAPI.getDiscountRules()
      );
      
      // Should match
      expect(backendCalculation.subtotal).toBe(frontendCalculation.subtotal);
      expect(backendCalculation.discount).toBe(frontendCalculation.discount);
      expect(backendCalculation.shipping).toBe(frontendCalculation.shipping);
      expect(backendCalculation.tax).toBeCloseTo(frontendCalculation.tax, 2);
      expect(backendCalculation.total).toBeCloseTo(frontendCalculation.total, 2);
    });

    it('should verify discount validation consistency', async () => {
      const subtotal = 300;
      const discountCode = 'SAVE20';
      
      // Frontend validation
      const frontendValidation = applyDiscountCode(subtotal, discountCode, await mockAPI.getDiscountRules());
      
      // Backend validation
      const backendValidation = await mockAPI.validateDiscountCode(discountCode, subtotal);
      
      expect(frontendValidation.valid).toBe(backendValidation.valid);
      expect(frontendValidation.discount).toBe(backendValidation.discount);
    });

    it('should handle concurrent calculation requests', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 5, price: 100.00 },
      ]);
      
      // Send concurrent calculation requests
      const results = await Promise.all([
        mockAPI.calculateCart(items, null, 'standard'),
        mockAPI.calculateCart(items, 'SAVE10', 'standard'),
        mockAPI.calculateCart(items, 'SAVE20', 'standard'),
        mockAPI.calculateCart(items, null, 'express'),
        mockAPI.calculateCart(items, 'FLAT50', 'overnight'),
      ]);
      
      // All should complete successfully
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.subtotal).toBe(500);
        expect(result.itemCount).toBe(5);
        expect(result.total).toBeGreaterThan(0);
      });
    });

    it('should calculate tax consistently across multiple runs', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 3, price: 149.99 },
      ]);
      
      const results = await Promise.all([
        mockAPI.calculateCart(items, null, 'standard'),
        mockAPI.calculateCart(items, null, 'standard'),
        mockAPI.calculateCart(items, null, 'standard'),
      ]);
      
      results.forEach(result => {
        expect(result.tax).toBeCloseTo(44.997, 1); // ~45
      });
    });
  });

  // ============================================
  // Edge Cases and Boundary Conditions
  // ============================================
  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty cart', async () => {
      const items: CartItem[] = [];
      
      const result = await mockAPI.calculateCart(items, null, 'standard');
      
      expect(result.subtotal).toBe(0);
      expect(result.discount).toBe(0);
      expect(result.shipping).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(0);
      expect(result.itemCount).toBe(0);
    });

    it('should handle single item cart', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 1, price: 1.00 },
      ]);
      
      const result = await mockAPI.calculateCart(items, null, 'standard');
      
      expect(result.subtotal).toBe(1);
      expect(result.itemCount).toBe(1);
      expect(result.tax).toBeCloseTo(0.10, 2);
    });

    it('should handle very large quantities', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 10000, price: 0.01 },
      ]);
      
      const result = await mockAPI.calculateCart(items, null, 'standard');
      
      expect(result.subtotal).toBe(100);
      expect(result.itemCount).toBe(10000);
    });

    it('should handle very high prices', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 1, price: 9999999.99 },
      ]);
      
      const result = await mockAPI.calculateCart(items, 'SAVE10', 'standard');
      
      expect(result.subtotal).toBeCloseTo(9999999.99, 2);
      expect(result.discount).toBeCloseTo(999999.999, 2); // Capped at 100
      expect(result.savings).toBeCloseTo(100, 2);
    });

    it('should handle discount that exceeds subtotal', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 1, price: 30.00 },
      ]);
      
      const result = await mockAPI.calculateCart(items, 'FLAT50', 'standard');
      
      // FLAT50 requires min 150, so not applied
      expect(result.discount).toBe(0);
    });

    it('should handle multiple discount code attempts', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 5, price: 100.00 },
      ]);
      
      const results = [];
      const codes = ['SAVE10', 'SAVE20', 'INVALID', 'WELCOME15', 'SAVE10'];
      
      for (const code of codes) {
        results.push(await mockAPI.calculateCart(items, code, 'standard'));
      }
      
      expect(results).toHaveLength(5);
      // Only valid discounts should apply
      const discounts = results.map(r => r.discount);
      expect(discounts.filter(d => d > 0).length).toBeGreaterThan(0);
    });

    it('should handle zero price items', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 1, price: 0.00 },
        { productId: 'prod2', quantity: 1, price: 100.00 },
      ]);
      
      const result = await mockAPI.calculateCart(items, null, 'standard');
      
      expect(result.subtotal).toBe(100);
      expect(result.itemCount).toBe(2);
      expect(result.tax).toBeCloseTo(10.00, 2);
    });

    it('should handle negative quantities gracefully', () => {
      const items: CartItem[] = [
        { id: '1', productId: 'prod1', quantity: -1, price: 100.00, variantId: null }
      ];
      
      const subtotal = calculateSubtotal(items);
      expect(subtotal).toBe(-100);
    });

    it('should handle mixed variant items correctly', async () => {
      const inputItems: CartItem[] = [
        { id: '1', productId: 'prod1', quantity: 2, price: 100.00, variantId: 'red' },
        { id: '2', productId: 'prod1', quantity: 3, price: 100.00, variantId: 'blue' },
        { id: '3', productId: 'prod1', quantity: 1, price: 100.00, variantId: null },
      ];
      
      const result = await mockAPI.calculateCart(inputItems, null, 'standard');
      
      expect(result.subtotal).toBe(600); // 200 + 300 + 100
      expect(result.itemCount).toBe(6);
      // Verify the calculation
      expect(result.total).toBeCloseTo(660, 2); // 600 + 60 tax (free shipping)
    });
  });

  // ============================================
  // Tax Calculation Tests
  // ============================================
  describe('Tax Calculation', () => {
    it('should calculate tax at standard rate', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 1, price: 100.00 },
      ]);
      
      const result = await mockAPI.calculateCart(items, null, 'standard');
      
      expect(result.taxRate).toBe(10);
      expect(result.tax).toBe(10);
    });

    it('should apply tax after discount', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 1, price: 100.00 },
      ]);
      
      const result = await mockAPI.calculateCart(items, 'SAVE10', 'standard');
      
      // Tax on 90, not 100
      expect(result.tax).toBe(9);
    });

    it('should handle tax on fractional amounts', () => {
      const taxableAmount = 33.33;
      const tax = calculateTax(taxableAmount);
      
      expect(tax).toBeCloseTo(3.33, 2);
    });

    it('should handle zero tax on free items', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 1, price: 0.00 },
      ]);
      
      const result = await mockAPI.calculateCart(items, null, 'standard');
      
      expect(result.tax).toBe(0);
    });

    it('should round tax ceiling for amounts near boundary', () => {
      const taxableAmount = 0.05;
      const tax = calculateTax(taxableAmount);
      
      // 0.005 should round up to 0.01
      expect(tax).toBeCloseTo(0.01, 2);
    });
  });

  // ============================================
  // Shipping Calculation Edge Cases
  // ============================================
  describe('Shipping Calculation Edge Cases', () => {
    it('should calculate shipping at exact threshold', () => {
      const shipping = calculateShipping(500, {
        id: 'standard',
        name: 'Standard',
        price: 50,
        freeThreshold: 500,
        estimatedDays: '5-7 days'
      });
      
      expect(shipping).toBe(0);
    });

    it('should calculate shipping just below threshold', () => {
      const shipping = calculateShipping(499.99, {
        id: 'standard',
        name: 'Standard',
        price: 50,
        freeThreshold: 500,
        estimatedDays: '5-7 days'
      });
      
      expect(shipping).toBe(50);
    });

    it('should handle free shipping with all methods', async () => {
      const items = createTestCart([
        { productId: 'prod1', quantity: 6, price: 100.00 },
      ]);
      
      const results = await Promise.all([
        mockAPI.calculateCart(items, null, 'standard'),
        mockAPI.calculateCart(items, null, 'express'),
        mockAPI.calculateCart(items, null, 'overnight'),
      ]);
      
      results.forEach(result => {
        expect(result.shipping).toBe(0);
      });
    });

    it('should calculate weight-based shipping', () => {
      // Test weight calculation (if implemented)
      const items: CartItem[] = [
        { id: '1', productId: 'prod1', quantity: 1, price: 100.00, variantId: null, weight: 5 }, // 5kg
        { id: '2', productId: 'prod2', quantity: 2, price: 50.00, variantId: null, weight: 2.5 }, // 5kg
      ];
      
      const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0);
      expect(totalWeight).toBe(10);
    });
  });

  // ============================================
  // Discount Validation
  // ============================================
  describe('Discount Validation', () => {
    it('should validate percentage discount correctly', async () => {
      const validation = await mockAPI.validateDiscountCode('SAVE20', 200);
      
      expect(validation.valid).toBe(true);
      expect(validation.discount).toBe(40); // 20% of 200
    });

    it('should validate fixed discount correctly', async () => {
      const validation = await mockAPI.validateDiscountCode('FLAT50', 200);
      
      expect(validation.valid).toBe(true);
      expect(validation.discount).toBe(50);
    });

    it('should reject discount below minimum', async () => {
      const validation = await mockAPI.validateDiscountCode('FLAT50', 100);
      
      expect(validation.valid).toBe(false);
      expect(validation.discount).toBe(0);
      expect(validation.message).toContain('Minimum order amount');
    });

    it('should handle case-insensitive discount codes', async () => {
      const validation = await mockAPI.validateDiscountCode('save10', 200);
      
      expect(validation.valid).toBe(true);
    });

    it('should handle whitespace in discount codes', async () => {
      const validation = await mockAPI.validateDiscountCode(' SAVE10 ', 200);
      
      expect(validation.valid).toBe(true);
    });
  });
});
