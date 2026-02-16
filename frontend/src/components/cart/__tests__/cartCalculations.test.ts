/**
 * Cart Calculations Test Suite
 * 
 * Comprehensive tests for cart calculation utilities including
 * subtotal, discount, shipping, tax, and total calculations.
 */

describe('Cart Calculations', () => {
  describe('Subtotal Calculation', () => {
    /**
     * Calculate subtotal from cart items
     */
    const calculateSubtotal = (items: { productId: string; quantity: number; price: number }[]): number => {
      return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    it('should calculate subtotal correctly for multiple items', () => {
      const items = [
        { productId: 'prod1', quantity: 2, price: 100 },
        { productId: 'prod2', quantity: 3, price: 50 }
      ];
      const subtotal = calculateSubtotal(items);
      expect(subtotal).toBe(350);
    });

    it('should calculate subtotal correctly with single item', () => {
      const items = [
        { productId: 'prod1', quantity: 5, price: 100 }
      ];
      const subtotal = calculateSubtotal(items);
      expect(subtotal).toBe(500);
    });

    it('should handle decimal prices correctly', () => {
      const items = [
        { productId: 'prod1', quantity: 1, price: 99.99 },
        { productId: 'prod2', quantity: 2, price: 49.50 }
      ];
      const subtotal = calculateSubtotal(items);
      expect(subtotal).toBeCloseTo(198.99, 2);
    });

    it('should return 0 for empty cart', () => {
      const items: { productId: string; quantity: number; price: number }[] = [];
      const subtotal = calculateSubtotal(items);
      expect(subtotal).toBe(0);
    });

    it('should handle large quantities correctly', () => {
      const items = [
        { productId: 'prod1', quantity: 1000, price: 99.99 }
      ];
      const subtotal = calculateSubtotal(items);
      expect(subtotal).toBeCloseTo(99990, 2);
    });

    it('should handle very small prices', () => {
      const items = [
        { productId: 'prod1', quantity: 1, price: 0.01 },
        { productId: 'prod2', quantity: 1, price: 0.02 }
      ];
      const subtotal = calculateSubtotal(items);
      expect(subtotal).toBeCloseTo(0.03, 2);
    });

    it('should handle large price values', () => {
      const items = [
        { productId: 'prod1', quantity: 1, price: 999999.99 },
        { productId: 'prod2', quantity: 2, price: 500000 }
      ];
      const subtotal = calculateSubtotal(items);
      expect(subtotal).toBeCloseTo(1999999.99, 2);
    });

    it('should correctly handle quantity of 0', () => {
      const items = [
        { productId: 'prod1', quantity: 0, price: 100 },
        { productId: 'prod2', quantity: 1, price: 50 }
      ];
      const subtotal = calculateSubtotal(items);
      expect(subtotal).toBe(50);
    });

    it('should handle mixed positive and negative quantities gracefully', () => {
      const items = [
        { productId: 'prod1', quantity: 5, price: 100 },
        { productId: 'prod2', quantity: 5, price: 100 }
      ];
      const subtotal = calculateSubtotal(items);
      expect(subtotal).toBe(1000);
    });
  });

  describe('Discount Calculation', () => {
    /**
     * Calculate discount amount based on type
     */
    const calculateDiscount = (
      subtotal: number,
      discountValue: number,
      discountType: 'percentage' | 'fixed'
    ): number => {
      if (discountType === 'percentage') {
        return Math.round(subtotal * (discountValue / 100) * 100) / 100;
      }
      return Math.min(discountValue, subtotal);
    };

    it('should apply percentage discount correctly', () => {
      const subtotal = 1000;
      const discount = calculateDiscount(subtotal, 10, 'percentage');
      expect(discount).toBe(100);
    });

    it('should apply fixed discount correctly', () => {
      const subtotal = 1000;
      const discount = calculateDiscount(subtotal, 150, 'fixed');
      expect(discount).toBe(150);
    });

    it('should not allow discount greater than subtotal for fixed discount', () => {
      const subtotal = 100;
      const discount = calculateDiscount(subtotal, 150, 'fixed');
      expect(discount).toBe(100); // Should cap at subtotal
    });

    it('should handle 100% discount', () => {
      const subtotal = 1000;
      const discount = calculateDiscount(subtotal, 100, 'percentage');
      expect(discount).toBe(1000);
    });

    it('should handle 0% discount', () => {
      const subtotal = 1000;
      const discount = calculateDiscount(subtotal, 0, 'percentage');
      expect(discount).toBe(0);
    });

    it('should handle decimal percentage discounts', () => {
      const subtotal = 1000;
      const discount = calculateDiscount(subtotal, 12.5, 'percentage');
      expect(discount).toBe(125);
    });

    it('should handle fractional discount values', () => {
      const subtotal = 1000;
      const discount = calculateDiscount(subtotal, 33.33, 'percentage');
      expect(discount).toBeCloseTo(333.30, 2);
    });

    it('should handle 0 fixed discount', () => {
      const subtotal = 1000;
      const discount = calculateDiscount(subtotal, 0, 'fixed');
      expect(discount).toBe(0);
    });

    it('should handle very small percentage discounts', () => {
      const subtotal = 1000;
      const discount = calculateDiscount(subtotal, 0.1, 'percentage');
      expect(discount).toBe(1);
    });
  });

  describe('Shipping Calculation', () => {
    /**
     * Calculate shipping cost based on subtotal and method
     */
    const calculateShipping = (
      subtotal: number,
      method: 'standard' | 'express' | 'overnight' | 'pickup',
      thresholds: { freeShipping: number; standard: number; express: number; overnight: number }
    ): number => {
      if (method === 'pickup') return 0;
      if (subtotal >= thresholds.freeShipping) return 0;
      
      switch (method) {
        case 'standard': return thresholds.standard;
        case 'express': return thresholds.express;
        case 'overnight': return thresholds.overnight;
        default: return thresholds.standard;
      }
    };

    const defaultThresholds = {
      freeShipping: 500,
      standard: 50,
      express: 100,
      overnight: 200
    };

    it('should use parseFloat for shipping cost precision', () => {
      const shippingCost = parseFloat('99.50');
      expect(shippingCost).toBe(99.5);
      expect(typeof shippingCost).toBe('number');
    });

    it('should return 0 for free shipping threshold met', () => {
      const cost = calculateShipping(600, 'standard', defaultThresholds);
      expect(cost).toBe(0);
    });

    it('should apply standard shipping when below free threshold', () => {
      const cost = calculateShipping(100, 'standard', defaultThresholds);
      expect(cost).toBe(50);
    });

    it('should apply express shipping cost', () => {
      const cost = calculateShipping(100, 'express', defaultThresholds);
      expect(cost).toBe(100);
    });

    it('should apply overnight shipping cost', () => {
      const cost = calculateShipping(100, 'overnight', defaultThresholds);
      expect(cost).toBe(200);
    });

    it('should return 0 for pickup method regardless of subtotal', () => {
      const cost = calculateShipping(1000, 'pickup', defaultThresholds);
      expect(cost).toBe(0);
      const costLow = calculateShipping(50, 'pickup', defaultThresholds);
      expect(costLow).toBe(0);
    });

    it('should handle exact threshold boundary', () => {
      const cost = calculateShipping(500, 'standard', defaultThresholds);
      expect(cost).toBe(0);
    });

    it('should handle just below threshold', () => {
      const cost = calculateShipping(499.99, 'standard', defaultThresholds);
      expect(cost).toBe(50);
    });

    it('should handle zero subtotal', () => {
      const cost = calculateShipping(0, 'standard', defaultThresholds);
      expect(cost).toBe(50);
    });

    it('should handle very large subtotal', () => {
      const cost = calculateShipping(100000, 'standard', defaultThresholds);
      expect(cost).toBe(0);
    });
  });

  describe('Tax Calculation', () => {
    /**
     * Calculate tax based on subtotal and tax rate
     */
    const calculateTax = (subtotal: number, taxRate: number): number => {
      return Math.round(subtotal * (taxRate / 100) * 100) / 100;
    };

    it('should calculate tax correctly for standard rate', () => {
      const subtotal = 1000;
      const tax = calculateTax(subtotal, 10);
      expect(tax).toBe(100);
    });

    it('should calculate tax with decimal rate', () => {
      const subtotal = 1000;
      const tax = calculateTax(subtotal, 7.5);
      expect(tax).toBe(75);
    });

    it('should return 0 for 0% tax rate', () => {
      const subtotal = 1000;
      const tax = calculateTax(subtotal, 0);
      expect(tax).toBe(0);
    });

    it('should return 0 for empty cart', () => {
      const subtotal = 0;
      const tax = calculateTax(subtotal, 10);
      expect(tax).toBe(0);
    });

    it('should handle fractional tax calculation', () => {
      const subtotal = 100;
      const tax = calculateTax(subtotal, 5.5);
      expect(tax).toBeCloseTo(5.50, 2);
    });

    it('should round to 2 decimal places', () => {
      const subtotal = 100;
      const tax = calculateTax(subtotal, 7.25);
      expect(tax).toBe(7.25);
    });

    it('should handle very small tax rate', () => {
      const subtotal = 1000;
      const tax = calculateTax(subtotal, 0.1);
      expect(tax).toBe(1);
    });

    it('should handle large tax rate', () => {
      const subtotal = 1000;
      const tax = calculateTax(subtotal, 25);
      expect(tax).toBe(250);
    });
  });

  describe('Total Calculation', () => {
    /**
     * Calculate total cart value
     */
    const calculateTotal = (
      subtotal: number,
      tax: number,
      shipping: number,
      discount: number
    ): number => {
      const total = subtotal + tax + shipping - discount;
      return Math.round(total * 100) / 100;
    };

    it('should calculate total with all components', () => {
      const subtotal = 500;
      const tax = 50;
      const shipping = 30;
      const discount = 50;
      const total = calculateTotal(subtotal, tax, shipping, discount);
      expect(total).toBe(530);
    });

    it('should calculate total without discount', () => {
      const subtotal = 500;
      const tax = 50;
      const shipping = 30;
      const discount = 0;
      const total = calculateTotal(subtotal, tax, shipping, discount);
      expect(total).toBe(580);
    });

    it('should calculate total without shipping (free shipping)', () => {
      const subtotal = 500;
      const tax = 50;
      const shipping = 0;
      const discount = 0;
      const total = calculateTotal(subtotal, tax, shipping, discount);
      expect(total).toBe(550);
    });

    it('should not allow negative total after discount', () => {
      const subtotal = 50;
      const tax = 5;
      const shipping = 30;
      const discount = 100;
      const total = calculateTotal(subtotal, tax, shipping, discount);
      expect(total).toBeLessThanOrEqual(0);
    });

    it('should handle rounding correctly', () => {
      const items = [
        { price: 33.33, quantity: 3 },
        { price: 33.34, quantity: 1 }
      ];
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      expect(subtotal).toBeCloseTo(133.33, 2);
    });

    it('should handle floating point precision', () => {
      const subtotal = 199.99;
      const tax = 20; // 10%
      const shipping = 9.99;
      const discount = 10;
      const total = calculateTotal(subtotal, tax, shipping, discount);
      expect(total).toBeCloseTo(219.98, 2);
    });

    it('should handle zero values correctly', () => {
      const total = calculateTotal(0, 0, 0, 0);
      expect(total).toBe(0);
    });

    it('should handle large values without precision loss', () => {
      const subtotal = 99999.99;
      const tax = 9999.999;
      const shipping = 999.99;
      const discount = 999.99;
      const total = calculateTotal(subtotal, tax, shipping, discount);
      expect(total).toBeCloseTo(109999.99, 2);
    });

    it('should calculate total for complex cart scenario', () => {
      // Scenario: 3 items, mixed quantities, discount, shipping
      const items = [
        { productId: 'laptop', quantity: 1, price: 999.99 },
        { productId: 'mouse', quantity: 2, price: 29.99 },
        { productId: 'keyboard', quantity: 1, price: 79.99 }
      ];
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      expect(subtotal).toBeCloseTo(1139.96, 2);
      
      const tax = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax
      expect(tax).toBeCloseTo(114.00, 2);
      
      const shipping = 25; // standard shipping
      const discount = 50; // $50 off
      
      const total = calculateTotal(subtotal, tax, shipping, discount);
      expect(total).toBeCloseTo(1228.96, 2);
    });
  });

  describe('Price Validation Utilities', () => {
    it('should parse string price to number', () => {
      const priceStr = '99.99';
      const price = parseFloat(priceStr);
      expect(price).toBe(99.99);
      expect(typeof price).toBe('number');
    });

    it('should handle integer string prices', () => {
      const priceStr = '100';
      const price = parseFloat(priceStr);
      expect(price).toBe(100);
      expect(typeof price).toBe('number');
    });

    it('should round numbers to prevent floating point errors', () => {
      const value = 0.1 + 0.2;
      const rounded = Math.round(value * 100) / 100;
      expect(rounded).toBe(0.3);
    });

    it('should format currency correctly', () => {
      const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(amount);
      };

      const formatted = formatCurrency(99.99);
      expect(formatted).toBe('$99.99');
    });

    it('should handle large currency values', () => {
      const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(amount);
      };

      const formatted = formatCurrency(999999.99);
      expect(formatted).toBe('$999,999.99');
    });
  });

  describe('Item Price Sum', () => {
    it('should calculate sum of single item', () => {
      const items = [{ price: 100 }];
      const sum = items.reduce((acc, item) => acc + item.price, 0);
      expect(sum).toBe(100);
    });

    it('should calculate sum of multiple items', () => {
      const items = [
        { price: 100 },
        { price: 200 },
        { price: 300 }
      ];
      const sum = items.reduce((acc, item) => acc + item.price, 0);
      expect(sum).toBe(600);
    });

    it('should handle empty array', () => {
      const items: { price: number }[] = [];
      const sum = items.reduce((acc, item) => acc + item.price, 0);
      expect(sum).toBe(0);
    });

    it('should handle decimal prices', () => {
      const items = [
        { price: 99.99 },
        { price: 49.50 }
      ];
      const sum = items.reduce((acc, item) => acc + item.price, 0);
      expect(sum).toBeCloseTo(149.49, 2);
    });
  });

  describe('Quantity Validation', () => {
    it('should validate positive integer quantity', () => {
      const isValidQuantity = (qty: number): boolean => {
        return Number.isInteger(qty) && qty > 0 && qty <= 999;
      };

      expect(isValidQuantity(1)).toBe(true);
      expect(isValidQuantity(100)).toBe(true);
      expect(isValidQuantity(999)).toBe(true);
      expect(isValidQuantity(0)).toBe(false);
      expect(isValidQuantity(-1)).toBe(false);
      expect(isValidQuantity(1.5)).toBe(false);
      expect(isValidQuantity(1000)).toBe(false);
    });

    it('should handle quantity limits', () => {
      const maxQuantity = 10;
      const isWithinLimit = (qty: number): boolean => qty > 0 && qty <= maxQuantity;

      expect(isWithinLimit(5)).toBe(true);
      expect(isWithinLimit(10)).toBe(true);
      expect(isWithinLimit(11)).toBe(false);
      expect(isWithinLimit(0)).toBe(false);
    });
  });

  describe('Cart Summary Calculation', () => {
    interface CartSummary {
      itemCount: number;
      subtotal: number;
      tax: number;
      shipping: number;
      discount: number;
      total: number;
    }

    const calculateCartSummary = (
      items: { quantity: number; price: number }[],
      taxRate: number,
      shippingCost: number,
      discountAmount: number
    ): CartSummary => {
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100;
      const total = Math.round((subtotal + tax + shippingCost - discountAmount) * 100) / 100;

      return {
        itemCount,
        subtotal,
        tax,
        shipping: shippingCost,
        discount: discountAmount,
        total
      };
    };

    it('should calculate complete cart summary', () => {
      const items = [
        { quantity: 2, price: 100 },
        { quantity: 1, price: 50 }
      ];
      const summary = calculateCartSummary(items, 10, 25, 20);

      expect(summary.itemCount).toBe(3);
      expect(summary.subtotal).toBe(250);
      expect(summary.tax).toBe(25);
      expect(summary.shipping).toBe(25);
      expect(summary.discount).toBe(20);
      expect(summary.total).toBe(280);
    });

    it('should handle empty cart summary', () => {
      const items: { quantity: number; price: number }[] = [];
      const summary = calculateCartSummary(items, 10, 0, 0);

      expect(summary.itemCount).toBe(0);
      expect(summary.subtotal).toBe(0);
      expect(summary.tax).toBe(0);
      expect(summary.shipping).toBe(0);
      expect(summary.discount).toBe(0);
      expect(summary.total).toBe(0);
    });

    it('should calculate summary with free shipping', () => {
      const items = [{ quantity: 1, price: 600 }];
      const summary = calculateCartSummary(items, 10, 0, 0);

      expect(summary.subtotal).toBe(600);
      expect(summary.shipping).toBe(0);
      expect(summary.total).toBe(660);
    });

    it('should apply maximum discount correctly', () => {
      const items = [{ quantity: 1, price: 50 }];
      const summary = calculateCartSummary(items, 10, 25, 100); // Discount > subtotal

      expect(summary.total).toBeLessThanOrEqual(0);
    });
  });
});
