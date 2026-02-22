import React, { useRef, TouchEvent, MouseEvent, ReactNode } from 'react';

export type GestureType = 'tap' | 'longPress' | 'swipeLeft' | 'swipeRight' | 'swipeUp' | 'swipeDown';

interface MobileTouchGesturesProps {
  children: ReactNode;
  onTap?: (event: TouchEvent | MouseEvent) => void;
  onLongPress?: (event: TouchEvent | MouseEvent) => void;
  onSwipeLeft?: (event: TouchEvent) => void;
  onSwipeRight?: (event: TouchEvent) => void;
  onSwipeUp?: (event: TouchEvent) => void;
  onSwipeDown?: (event: TouchEvent) => void;
  longPressDelay?: number;
  swipeThreshold?: number;
  className?: string;
  style?: React.CSSProperties;
}

interface TouchPosition {
  x: number;
  y: number;
  timestamp: number;
}

export const MobileTouchGestures: React.FC<MobileTouchGesturesProps> = ({
  children,
  onTap,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  longPressDelay = 500,
  swipeThreshold = 50,
  className = '',
  style = {}
}) => {
  const touchStartRef = useRef<TouchPosition | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress(event);
        touchStartRef.current = null;
      }, longPressDelay);
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    // Cancel long press if user moves finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = (event: TouchEvent) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const touchStart = touchStartRef.current;
    if (!touchStart) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.timestamp;

    // Check for swipe gestures
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) >= swipeThreshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight(event);
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft(event);
        }
        touchStartRef.current = null;
        return;
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) >= swipeThreshold) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown(event);
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp(event);
        }
        touchStartRef.current = null;
        return;
      }
    }

    // Check for tap (quick touch without significant movement)
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
      if (onTap) {
        onTap(event);
      }
    }

    touchStartRef.current = null;
  };

  const handleMouseDown = (event: MouseEvent) => {
    touchStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now()
    };

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress(event);
        touchStartRef.current = null;
      }, longPressDelay);
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    // Cancel long press if user moves mouse
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleMouseUp = (event: MouseEvent) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const touchStart = touchStartRef.current;
    if (!touchStart) return;

    const deltaX = event.clientX - touchStart.x;
    const deltaY = event.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.timestamp;

    // Check for swipe gestures
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) >= swipeThreshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight(event as unknown as TouchEvent);
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft(event as unknown as TouchEvent);
        }
        touchStartRef.current = null;
        return;
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) >= swipeThreshold) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown(event as unknown as TouchEvent);
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp(event as unknown as TouchEvent);
        }
        touchStartRef.current = null;
        return;
      }
    }

    // Check for tap (quick click without significant movement)
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
      if (onTap) {
        onTap(event);
      }
    }

    touchStartRef.current = null;
  };

  return (
    <div
      className={className}
      style={style}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {children}
    </div>
  );
};

export default MobileTouchGestures;
