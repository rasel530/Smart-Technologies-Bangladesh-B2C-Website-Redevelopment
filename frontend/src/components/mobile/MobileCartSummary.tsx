/**
 * MobileCartSummary Component
 * Mobile cart summary with sticky footer
 */

import React from 'react';
import type { MobileCartOptimized as MobileCartOptimizedType } from '../../types/mobileCart';

interface MobileCartSummaryProps {
  cart: MobileCartOptimizedType;
  onCheckout: () => void;
  onContinueShopping: () => void;
}

export const MobileCartSummary: React.FC<MobileCartSummaryProps> = ({
  cart,
  onCheckout,
  onContinueShopping
}) => {
  return (
    <div className="mobile-cart-summary sticky-footer">
      <div className="summary-content">
        <div className="summary-row">
          <span className="label">Items:</span>
          <span className="value">{cart.totalItems}</span>
        </div>
        <div className="summary-row">
          <span className="label">Total:</span>
          <span className="value total">৳{cart.totals.total.toFixed(2)}</span>
        </div>
        <div className="summary-actions">
          <button
            onClick={onContinueShopping}
            className="btn-secondary"
          >
            Continue Shopping
          </button>
          <button
            onClick={onCheckout}
            className="btn-primary"
            disabled={cart.items.length === 0}
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileCartSummary;
