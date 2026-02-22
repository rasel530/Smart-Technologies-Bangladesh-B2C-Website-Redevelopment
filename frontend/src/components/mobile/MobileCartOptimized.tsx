/**
 * MobileCartOptimized Component
 * Mobile-optimized cart view with lazy loading and touch-friendly UI
 */

import React, { useState, useEffect } from 'react';
import type { MobileCartOptimized as MobileCartOptimizedType, MobileCartItem } from '../../types/mobileCart';

interface MobileCartOptimizedProps {
  cart: MobileCartOptimizedType;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateCart: () => void;
}

export const MobileCartOptimized: React.FC<MobileCartOptimizedProps> = ({
  cart,
  onQuantityChange,
  onRemoveItem,
  onUpdateCart
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [visibleItems, setVisibleItems] = useState(5);

  useEffect(() => {
    setIsLoading(false);
  }, [cart]);

  const loadMoreItems = () => {
    setVisibleItems(prev => Math.min(prev + 5, cart.items.length));
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    onQuantityChange(itemId, newQuantity);
  };

  return (
    <div className="mobile-cart-optimized">
      <div className="mobile-cart-header">
        <h2>Shopping Cart</h2>
        <button
          onClick={onUpdateCart}
          className="refresh-button"
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {cart.items.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <button className="continue-shopping">Continue Shopping</button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.items.slice(0, visibleItems).map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-image">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.productName}
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="item-details">
                  <h3 className="item-name">{item.productName}</h3>
                  {item.variantName && (
                    <p className="item-variant">{item.variantName}</p>
                  )}
                  <p className="item-price">৳{item.price.toFixed(2)}</p>
                  <div className="item-quantity">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="quantity-btn"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={!item.inStock}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                  {!item.inStock && (
                    <p className="out-of-stock">Out of Stock</p>
                  )}
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="remove-item"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {visibleItems < cart.items.length && (
            <button
              onClick={loadMoreItems}
              className="load-more-button"
            >
              Load More Items
            </button>
          )}

          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>৳{cart.totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Tax:</span>
              <span>৳{cart.totals.tax.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span>৳{cart.totals.shippingCost.toFixed(2)}</span>
            </div>
            {cart.totals.discount > 0 && (
              <div className="summary-row discount">
                <span>Discount:</span>
                <span>-৳{cart.totals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Total:</span>
              <span>৳{cart.totals.total.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileCartOptimized;
