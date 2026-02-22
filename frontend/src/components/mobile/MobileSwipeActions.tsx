/**
 * MobileSwipeActions Component
 * Swipe actions for cart items (left swipe to remove, right swipe to edit)
 */

import React, { useRef, useEffect } from 'react';
import type { TouchGesture } from '../../types/mobileCart';

interface MobileSwipeActionsProps {
  itemId: string;
  onSwipeLeft: (itemId: string) => void;
  onSwipeRight: (itemId: string) => void;
  children: React.ReactNode;
}

export const MobileSwipeActions: React.FC<MobileSwipeActionsProps> = ({
  itemId,
  onSwipeLeft,
  onSwipeRight,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) {
      const touchEndX = e.touches[0].clientX;
      const touchEndY = e.touches[0].clientY;
      
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;
      
      // Only trigger swipe if horizontal movement is greater than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        isSwiping.current = true;
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;

    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;

    if (deltaX > 50) {
      onSwipeRight(itemId);
    } else if (deltaX < -50) {
      onSwipeLeft(itemId);
    }

    isSwiping.current = false;
  };

  return (
    <div
      ref={containerRef}
      className="swipe-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

export default MobileSwipeActions;
