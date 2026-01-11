'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  id?: string;
}

interface ToastContextType {
  showToast: (toast: ToastProps) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = (toast: ToastProps) => {
    const id = toast.id || Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
    
    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none"
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map(toast => {
          const Icon = icons[toast.type];
          const bgColor = colors[toast.type];
          const toastId = toast.id || Date.now().toString();
          
          return (
            <div
              key={toastId}
              className={cn(
                'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 transform transition-all duration-300 ease-out',
                'animate-in slide-in-from-right-5 fade-in-20'
              )}
              role="alert"
              aria-labelledby={`toast-title-${toastId}`}
              aria-describedby={`toast-message-${toastId}`}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className={`flex-shrink-0 p-2 rounded-full ${bgColor}`} aria-hidden="true">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3 flex-1">
                    {toast.title && (
                      <h4
                        id={`toast-title-${toastId}`}
                        className="text-sm font-medium text-gray-900"
                      >
                        {toast.title}
                      </h4>
                    )}
                    <p
                      id={`toast-message-${toastId}`}
                      className="text-sm text-gray-600"
                    >
                      {toast.message}
                    </p>
                  </div>
                  <button
                    onClick={() => removeToast(toastId)}
                    className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                    aria-label="Close notification"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast hook for easy usage
export const useShowToast = () => {
  const { showToast } = useToast();  
  return {
    success: (message: string, title?: string) => {
      showToast({ type: 'success', title, message });
    },
    error: (message: string, title?: string) => {
      showToast({ type: 'error', title, message });
    },
    warning: (message: string, title?: string) => {
      showToast({ type: 'warning', title, message });
    },
    info: (message: string, title?: string) => {
      showToast({ type: 'info', title, message });
    },
  };
};

export default ToastProvider;