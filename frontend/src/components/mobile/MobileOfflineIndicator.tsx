import React, { useState, useEffect } from 'react';

interface MobileOfflineIndicatorProps {
  showLabel?: boolean;
  position?: 'top' | 'bottom';
  className?: string;
}

export const MobileOfflineIndicator: React.FC<MobileOfflineIndicatorProps> = ({
  showLabel = true,
  position = 'top',
  className = ''
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const positionStyles = {
    top: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
    },
    bottom: {
      position: 'fixed' as const,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
    },
  };

  const styles = {
    ...positionStyles[position],
    backgroundColor: isOnline ? '#22c55e' : '#ef4444',
    color: 'white',
    padding: '8px 16px',
    textAlign: 'center' as const,
    fontWeight: 'bold',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
  };

  if (isOnline) {
    return null;
  }

  return (
    <div style={styles} className={className}>
      <span style={{ marginRight: showLabel ? '8px' : '0' }}>🔴</span>
      {showLabel && (
        <>
          <span style={{ display: 'inline' }}>You are offline</span>
          <span style={{ marginLeft: '8px', opacity: 0.8 }}>আপনি অফলাইনে আছেন</span>
        </>
      )}
    </div>
  );
};

export default MobileOfflineIndicator;
