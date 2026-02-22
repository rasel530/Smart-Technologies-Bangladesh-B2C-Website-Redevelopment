import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface MobilePullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  maxPullDistance?: number;
  pullText?: string;
  releaseText?: string;
  refreshingText?: string;
}

interface TouchPosition {
  clientY: number;
  clientX: number;
}

export const MobilePullToRefresh: React.FC<MobilePullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  maxPullDistance = 150,
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh',
  refreshingText = 'Refreshing...'
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);
  const [canRefresh, setCanRefresh] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isRefreshing) {
      handleRefresh();
    }
  }, [isRefreshing]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ clientY: touch.clientY, clientX: touch.clientX });
    setIsPulling(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isRefreshing) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStart.clientY;
    const deltaX = Math.abs(touch.clientX - touchStart.clientX);

    // Only allow vertical pull (prevent horizontal scrolling from triggering)
    if (deltaX > 10) return;

    // Only trigger if at the top of the page
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > 0) return;

    // Calculate pull distance with damping
    let distance = deltaY * 0.5;

    // Clamp the distance
    distance = Math.max(0, Math.min(distance, maxPullDistance));

    setPullDistance(distance);
    setCanRefresh(distance >= threshold);
  };

  const handleTouchEnd = () => {
    if (!isPulling) return;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
    } else {
      // Reset if not enough pull
      setPullDistance(0);
    }

    setIsPulling(false);
    setTouchStart(null);
    setCanRefresh(false);
  };

  const handleRefresh = async () => {
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  };

  const getProgress = (): number => {
    return Math.min(pullDistance / threshold, 1);
  };

  const getRotation = (): number => {
    return getProgress() * 180;
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        minHeight: '100%',
        touchAction: 'pan-y'
      }}
    >
      {/* Pull indicator */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${Math.max(0, pullDistance)}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          transition: isRefreshing ? 'height 0.3s ease-out' : 'none'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transform: `translateY(${Math.min(pullDistance, threshold)}px)`
          }}
        >
          {/* Refresh icon/spinner */}
          <div
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isRefreshing ? (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid rgba(59, 130, 246, 0.3)',
                  borderTopColor: '#3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
            ) : (
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: `rotate(${getRotation()}deg)`,
                  transition: 'transform 0.2s ease-out',
                  color: canRefresh ? '#3b82f6' : '#9ca3af'
                }}
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            )}
          </div>

          {/* Text indicator */}
          <div
            style={{
              fontSize: '14px',
              fontWeight: '500',
              color: canRefresh ? '#3b82f6' : '#9ca3af',
              textAlign: 'center',
              opacity: pullDistance > 0 ? 1 : 0
            }}
          >
            {isRefreshing
              ? refreshingText
              : canRefresh
              ? releaseText
              : pullText}
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        style={{
          transition: isRefreshing ? 'transform 0.3s ease-out' : 'none',
          transform: isRefreshing ? `translateY(${threshold}px)` : 'none'
        }}
      >
        {children}
      </div>

      {/* CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MobilePullToRefresh;
