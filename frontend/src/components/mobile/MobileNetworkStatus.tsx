import React, { useState, useEffect } from 'react';

type NetworkType = 'wifi' | '4g' | '3g' | '2g' | 'unknown';
type NetworkSpeed = 'fast' | 'medium' | 'slow' | 'unknown';

interface MobileNetworkStatusProps {
  showLabel?: boolean;
  showSpeed?: boolean;
  className?: string;
}

export const MobileNetworkStatus: React.FC<MobileNetworkStatusProps> = ({
  showLabel = true,
  showSpeed = true,
  className = ''
}) => {
  const [networkType, setNetworkType] = useState<NetworkType>('unknown');
  const [networkSpeed, setNetworkSpeed] = useState<NetworkSpeed>('unknown');
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

  useEffect(() => {
    const detectNetworkType = async () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      if (connection) {
        const effectiveType = connection.effectiveType;
        const rtt = connection.rtt || 0;
        const downlink = connection.downlink || 0;
        
        // Determine network type
        if (effectiveType === 'wifi') {
          setNetworkType('wifi');
        } else if (effectiveType === 'cellular') {
          if (rtt < 100 && downlink >= 10) {
            setNetworkType('4g');
          } else if (rtt < 300 && downlink >= 1.5) {
            setNetworkType('3g');
          } else {
            setNetworkType('2g');
          }
        } else {
          setNetworkType('unknown');
        }

        // Determine network speed
        if (downlink >= 10) {
          setNetworkSpeed('fast');
        } else if (downlink >= 1.5) {
          setNetworkSpeed('medium');
        } else if (downlink > 0) {
          setNetworkSpeed('slow');
        } else {
          setNetworkSpeed('unknown');
        }
      } else {
        setNetworkType('unknown');
        setNetworkSpeed('unknown');
      }
    };

    detectNetworkType();

    // Listen for connection changes
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', detectNetworkType);
      return () => {
        connection.removeEventListener('change', detectNetworkType);
      };
    }
  }, []);

  const getNetworkIcon = () => {
    switch (networkType) {
      case 'wifi':
        return '📶';
      case '4g':
        return '📡';
      case '3g':
        return '📶';
      case '2g':
        return '📶';
      default:
        return '❓';
    }
  };

  const getNetworkLabel = () => {
    switch (networkType) {
      case 'wifi':
        return 'WiFi';
      case '4g':
        return '4G';
      case '3g':
        return '3G';
      case '2g':
        return '2G';
      default:
        return 'Unknown';
    }
  };

  const getSpeedLabel = () => {
    switch (networkSpeed) {
      case 'fast':
        return 'Fast';
      case 'medium':
        return 'Medium';
      case 'slow':
        return 'Slow';
      default:
        return 'Unknown';
    }
  };

  const getSpeedColor = () => {
    switch (networkSpeed) {
      case 'fast':
        return '#22c55e';
      case 'medium':
        return '#eab308';
      case 'slow':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      backgroundColor: isOnline ? '#f3f4f6' : '#fee2e2',
      borderRadius: '8px',
      border: `1px solid ${isOnline ? '#e5e7eb' : '#fecaca'}`,
      transition: 'all 0.3s ease',
    } as React.CSSProperties,
    icon: {
      fontSize: '20px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: isOnline ? '#374151' : '#991b1b',
    },
    speed: {
      fontSize: '12px',
      fontWeight: '400',
      color: getSpeedColor(),
      padding: '2px 8px',
      borderRadius: '4px',
      backgroundColor: `${getSpeedColor()}15`,
    },
  };

  return (
    <div style={styles.container} className={className}>
      <span style={styles.icon}>{getNetworkIcon()}</span>
      {showLabel && (
        <span style={styles.label}>
          {getNetworkLabel()}
        </span>
      )}
      {showSpeed && (
        <span style={styles.speed}>
          {getSpeedLabel()}
        </span>
      )}
      {!isOnline && (
        <span style={{ color: '#ef4444', fontSize: '12px', marginLeft: '8px' }}>
          (Offline)
        </span>
      )}
    </div>
  );
};

export default MobileNetworkStatus;
