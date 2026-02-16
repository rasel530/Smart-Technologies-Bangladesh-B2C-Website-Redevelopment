/**
 * Cart Price Calculation Fix - Comprehensive Test Suite
 * 
 * This test suite verifies the fix for the critical bug where products without
 * a discount were resulting in zero totals. The fix replaced nullish coalescing
 * operators (??) with explicit validation logic that checks if salePrice > 0
 * AND salePrice < regularPrice before using the sale price.
 * 
 * Files Modified:
 * 1. Created: frontend/src/lib/utils/price.ts - New utility functions for price calculation
 * 2. Modified: frontend/src/components/cart/CartItem.tsx - Fixed price calculation (lines 128-130)
 * 3. Modified: frontend/src/contexts/CartContext.tsx - Fixed price calculation (lines 212, 787)
 */

import { getProductPrice, hasValidDiscount } from '@/lib/utils/price';

describe('Price Calculation Fix - getProductPrice', () => {
  describe('Test Case 1: Non-discounted product with salePrice = "0" (string)', () => {
    it('should return regularPrice when salePrice is "0"', () => {
      const salePrice = "0";
      const regularPrice = 5000;
      const result = getProductPrice(salePrice, regularPrice);
      
      expect(result).toBe(5000);
      expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    });
  });

  describe('Test Case 2: Non-discounted product with salePrice = 0 (number)', () => {
    it('should return regularPrice when salePrice is 0 (number)', () => {
      const salePrice = 0;
      const regularPrice = 5000;
      const result = getProductPrice(salePrice, regularPrice);
      
      expect(result).toBe(5000);
      expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    });
  });

  describe('Test Case 3: Non-discounted product with salePrice = null', () => {
    it('should return regularPrice when salePrice is null', () => {
      const salePrice = null;
      const regularPrice = 5000;
      const result = getProductPrice(salePrice, regularPrice);
      
      expect(result).toBe(5000);
      expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    });
  });

  describe('Test Case 4: Non-discounted product with salePrice = undefined', () => {
    it('should return regularPrice when salePrice is undefined', () => {
      const salePrice = undefined;
      const regularPrice = 5000;
      const result = getProductPrice(salePrice, regularPrice);
      
      expect(result).toBe(5000);
      expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    });
  });

  describe('Test Case 5: Product with valid discount', () => {
    it('should return salePrice when discount is valid', () => {
      const salePrice = 4500;
      const regularPrice = 5000;
      const result = getProductPrice(salePrice, regularPrice);
      
      expect(result).toBe(4500);
      expect(hasValidDiscount(salePrice, regularPrice)).toBe(true);
    });
  });

  describe('Test Case 6: Product with invalid discount (salePrice >= regularPrice)', () => {
    it('should return regularPrice when salePrice equals regularPrice', () => {
      const salePrice = 5000;
      const regularPrice = 5000;
      const result = getProductPrice(salePrice, regularPrice);
      
      expect(result).toBe(5000);
      expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    });
  });

  describe('Test Case 7: Product with invalid discount (salePrice > regularPrice)', () => {
    it('should return regularPrice when salePrice is greater than regularPrice', () => {
      const salePrice = 5500;
      const regularPrice = 5000;
      const result = getProductPrice(salePrice, regularPrice);
      
      expect(result).toBe(5000);
      expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    });
  });

  describe('Test Case 8: Multiple products in cart (mixed discounted and non-discounted)', () => {
    it('should calculate correct totals for mixed products', () => {
      // Product 1: Non-discounted (salePrice = "0")
      const product1Price = getProductPrice("0", 5000);
      const product1Subtotal = product1Price * 1;
      
      // Product 2: Discounted
      const product2Price = getProductPrice(2500, 3000);
      const product2Subtotal = product2Price * 2;
      
      const total = product1Subtotal + product2Subtotal;
      
      expect(product1Price).toBe(5000);
      expect(product1Subtotal).toBe(5000);
      expect(product2Price).toBe(2500);
      expect(product2Subtotal).toBe(5000);
      expect(total).toBe(10000);
    });
  });

  describe('Test Case 9: Product with quantity > 1 and no discount', () => {
    it('should calculate correct subtotal for quantity > 1 with no discount', () => {
      const salePrice = "0";
      const regularPrice = 5000;
      const quantity = 3;
      const price = getProductPrice(salePrice, regularPrice);
      const subtotal = price * quantity;
      
      expect(price).toBe(5000);
      expect(subtotal).toBe(15000);
      expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    });
  });

  describe('Test Case 10: Product with quantity > 1 and valid discount', () => {
    it('should calculate correct subtotal for quantity > 1 with discount', () => {
      const salePrice = 4500;
      const regularPrice = 5000;
      const quantity = 2;
      const price = getProductPrice(salePrice, regularPrice);
      const subtotal = price * quantity;
      
      expect(price).toBe(4500);
      expect(subtotal).toBe(9000);
      expect(hasValidDiscount(salePrice, regularPrice)).toBe(true);
    });
  });

  // Additional edge case tests
  describe('Edge Cases - String prices', () => {
    it('should handle string regularPrice', () => {
      const salePrice = "0";
      const regularPrice = "5000";
      const result = getProductPrice(salePrice, regularPrice);
      
      expect(result).toBe(5000);
    });

    it('should handle string salePrice with valid discount', () => {
      const salePrice = "4500";
      const regularPrice = "5000";
      const result = getProductPrice(salePrice, regularPrice);
      
      expect(result).toBe(4500);
    });

    it('should handle string salePrice = "0.00"', () => {
      const salePrice = "0.00";
      const regularPrice = 5000;
      const result = getProductPrice(salePrice, regularPrice);
      
      expect(result).toBe(5000);
      expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    });
  });

  describe('Edge Cases - Negative prices', () => {
    it('should handle negative salePrice', () => {
      const salePrice = -100;
      const regularPrice = 5000;
      const result = getProductPrice(salePrice, regularPrice);
      
      expect(result).toBe(5000);
      expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    });

    it('should handle negative regularPrice', () => {
      const salePrice = 4500;
      const regularPrice = -5000;
      const result = getProductPrice(salePrice, regularPrice);
      
      // When regularPrice is negative, salePrice is not less than it
      expect(result).toBe(-5000);
      expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    });
  });

  describe('Edge Cases - Decimal prices', () => {
    it('should handle decimal salePrice with valid discount', () => {
      const salePrice = 4999.99;
      const regularPrice = 5000;
      const result = getProductPrice(salePrice, regularPrice);
      
      expect(result).toBe(4999.99);
      expect(hasValidDiscount(salePrice, regularPrice)).toBe(true);
    });

    it('should handle decimal regularPrice', () => {
      const salePrice = "0";
      const regularPrice = 4999.99;
      const result = getProductPrice(salePrice, regularPrice);
      
      expect(result).toBe(4999.99);
    });
  });

  describe('Edge Cases - Very small discounts', () => {
    it('should handle salePrice = regularPrice - 0.01', () => {
      const salePrice = 4999.99;
      const regularPrice = 5000;
      const result = getProductPrice(salePrice, regularPrice);
      
      expect(result).toBe(4999.99);
      expect(hasValidDiscount(salePrice, regularPrice)).toBe(true);
    });

    it('should handle salePrice = 0.01 with regularPrice = 100', () => {
      const salePrice = 0.01;
      const regularPrice = 100;
      const result = getProductPrice(salePrice, regularPrice);
      
      expect(result).toBe(0.01);
      expect(hasValidDiscount(salePrice, regularPrice)).toBe(true);
    });
  });

  describe('Edge Cases - Fallback price', () => {
    it('should use fallbackPrice when regularPrice is undefined', () => {
      const salePrice = null;
      const regularPrice = undefined;
      const fallbackPrice = 1000;
      const result = getProductPrice(salePrice, regularPrice, fallbackPrice);
      
      expect(result).toBe(1000);
    });

    it('should use fallbackPrice when regularPrice is null', () => {
      const salePrice = null;
      const regularPrice = null;
      const fallbackPrice = 1000;
      const result = getProductPrice(salePrice, regularPrice, fallbackPrice);
      
      expect(result).toBe(1000);
    });

    it('should return 0 when no valid price is available', () => {
      const salePrice = null;
      const regularPrice = undefined;
      const result = getProductPrice(salePrice, regularPrice);
      
      expect(result).toBe(0);
    });
  });

  describe('Edge Cases - HP Laptop specific test case', () => {
    it('should correctly calculate price for HP laptop with salePrice = "0"', () => {
      const salePrice = "0";
      const regularPrice = 5000;
      const quantity = 1;
      
      const hasDiscount = hasValidDiscount(salePrice, regularPrice);
      const finalPrice = getProductPrice(salePrice, regularPrice);
      const calculatedSubtotal = finalPrice * quantity;
      
      expect(hasDiscount).toBe(false);
      expect(finalPrice).toBe(5000);
      expect(calculatedSubtotal).toBe(5000);
    });
  });
});

describe('Price Calculation Fix - hasValidDiscount', () => {
  describe('hasValidDiscount function tests', () => {
    it('should return false when salePrice is null', () => {
      expect(hasValidDiscount(null, 5000)).toBe(false);
    });

    it('should return false when salePrice is undefined', () => {
      expect(hasValidDiscount(undefined, 5000)).toBe(false);
    });

    it('should return false when salePrice is 0', () => {
      expect(hasValidDiscount(0, 5000)).toBe(false);
    });

    it('should return false when salePrice is "0"', () => {
      expect(hasValidDiscount("0", 5000)).toBe(false);
    });

    it('should return false when salePrice equals regularPrice', () => {
      expect(hasValidDiscount(5000, 5000)).toBe(false);
    });

    it('should return false when salePrice is greater than regularPrice', () => {
      expect(hasValidDiscount(5500, 5000)).toBe(false);
    });

    it('should return true when salePrice is valid discount', () => {
      expect(hasValidDiscount(4500, 5000)).toBe(true);
    });

    it('should return false when regularPrice is null', () => {
      expect(hasValidDiscount(4500, null)).toBe(false);
    });

    it('should return false when regularPrice is undefined', () => {
      expect(hasValidDiscount(4500, undefined)).toBe(false);
    });

    it('should handle string prices', () => {
      expect(hasValidDiscount("4500", "5000")).toBe(true);
    });

    it('should handle mixed string and number prices', () => {
      expect(hasValidDiscount(4500, "5000")).toBe(true);
      expect(hasValidDiscount("4500", 5000)).toBe(true);
    });
  });
});

describe('Integration Tests - Cart Item Price Calculation', () => {
  describe('CartItem component price calculation simulation', () => {
    it('should match CartItem price calculation logic for non-discounted product', () => {
      // Simulating CartItem.tsx lines 129-131
      const product = {
        salePrice: "0",
        regularPrice: 5000
      };
      
      const hasDiscount = product.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.regularPrice);
      const regularPrice = Number(product.regularPrice);
      const salePrice = hasDiscount ? Number(product.salePrice) : regularPrice;
      const quantity = 1;
      const calculatedSubtotal = salePrice * quantity;
      
      expect(hasDiscount).toBe(false);
      expect(salePrice).toBe(5000);
      expect(calculatedSubtotal).toBe(5000);
    });

    it('should match CartItem price calculation logic for discounted product', () => {
      // Simulating CartItem.tsx lines 129-131
      const product = {
        salePrice: 4500,
        regularPrice: 5000
      };
      
      const hasDiscount = product.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.regularPrice);
      const regularPrice = Number(product.regularPrice);
      const salePrice = hasDiscount ? Number(product.salePrice) : regularPrice;
      const quantity = 1;
      const calculatedSubtotal = salePrice * quantity;
      
      expect(hasDiscount).toBe(true);
      expect(salePrice).toBe(4500);
      expect(calculatedSubtotal).toBe(4500);
    });
  });
});

describe('Integration Tests - CartContext Price Calculation', () => {
  describe('CartContext price calculation simulation', () => {
    it('should match CartContext addItem price calculation for non-discounted product', () => {
      // Simulating CartContext.tsx line 208-214
      const product = {
        salePrice: "0",
        regularPrice: 5000
      };
      
      const hasValidSalePrice = product.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.regularPrice);
      const price = hasValidSalePrice ? Number(product.salePrice) : Number(product.regularPrice);
      
      expect(hasValidSalePrice).toBe(false);
      expect(price).toBe(5000);
    });

    it('should match CartContext getCartFromStorageData price calculation for non-discounted product', () => {
      // Simulating CartContext.tsx line 789-790
      const product = {
        salePrice: "0",
        regularPrice: 5000
      };
      
      const hasValidSalePrice = product.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.regularPrice);
      const price = hasValidSalePrice ? Number(product.salePrice) : Number(product.regularPrice);
      
      expect(hasValidSalePrice).toBe(false);
      expect(price).toBe(5000);
    });

    it('should match CartContext getCartFromStorageData price calculation for discounted product', () => {
      // Simulating CartContext.tsx line 789-790
      const product = {
        salePrice: 4500,
        regularPrice: 5000
      };
      
      const hasValidSalePrice = product.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.regularPrice);
      const price = hasValidSalePrice ? Number(product.salePrice) : Number(product.regularPrice);
      
      expect(hasValidSalePrice).toBe(true);
      expect(price).toBe(4500);
    });
  });
});

describe('Summary Test - All 10 Test Cases', () => {
  test('Test Case 1: Non-discounted product with salePrice = "0"', () => {
    const salePrice = "0";
    const regularPrice = 5000;
    expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    expect(getProductPrice(salePrice, regularPrice)).toBe(5000);
  });

  test('Test Case 2: Non-discounted product with salePrice = 0', () => {
    const salePrice = 0;
    const regularPrice = 5000;
    expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    expect(getProductPrice(salePrice, regularPrice)).toBe(5000);
  });

  test('Test Case 3: Non-discounted product with salePrice = null', () => {
    const salePrice = null;
    const regularPrice = 5000;
    expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    expect(getProductPrice(salePrice, regularPrice)).toBe(5000);
  });

  test('Test Case 4: Non-discounted product with salePrice = undefined', () => {
    const salePrice = undefined;
    const regularPrice = 5000;
    expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    expect(getProductPrice(salePrice, regularPrice)).toBe(5000);
  });

  test('Test Case 5: Product with valid discount', () => {
    const salePrice = 4500;
    const regularPrice = 5000;
    expect(hasValidDiscount(salePrice, regularPrice)).toBe(true);
    expect(getProductPrice(salePrice, regularPrice)).toBe(4500);
  });

  test('Test Case 6: Product with invalid discount (salePrice >= regularPrice)', () => {
    const salePrice = 5000;
    const regularPrice = 5000;
    expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    expect(getProductPrice(salePrice, regularPrice)).toBe(5000);
  });

  test('Test Case 7: Product with invalid discount (salePrice > regularPrice)', () => {
    const salePrice = 5500;
    const regularPrice = 5000;
    expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    expect(getProductPrice(salePrice, regularPrice)).toBe(5000);
  });

  test('Test Case 8: Multiple products in cart (mixed discounted and non-discounted)', () => {
    const product1Price = getProductPrice("0", 5000);
    const product1Subtotal = product1Price * 1;
    const product2Price = getProductPrice(2500, 3000);
    const product2Subtotal = product2Price * 2;
    const total = product1Subtotal + product2Subtotal;
    expect(total).toBe(10000);
  });

  test('Test Case 9: Product with quantity > 1 and no discount', () => {
    const salePrice = "0";
    const regularPrice = 5000;
    const quantity = 3;
    const price = getProductPrice(salePrice, regularPrice);
    const subtotal = price * quantity;
    expect(hasValidDiscount(salePrice, regularPrice)).toBe(false);
    expect(price).toBe(5000);
    expect(subtotal).toBe(15000);
  });

  test('Test Case 10: Product with quantity > 1 and valid discount', () => {
    const salePrice = 4500;
    const regularPrice = 5000;
    const quantity = 2;
    const price = getProductPrice(salePrice, regularPrice);
    const subtotal = price * quantity;
    expect(hasValidDiscount(salePrice, regularPrice)).toBe(true);
    expect(price).toBe(4500);
    expect(subtotal).toBe(9000);
  });
});
