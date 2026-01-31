/**
 * ProductImageErrorBoundary Component
 * 
 * Error boundary for product image components to catch and handle errors gracefully.
 * Provides fallback UI and error reporting.
 */

'use client';

import React, { Component, ReactNode } from 'react';

interface ProductImageErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ProductImageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ProductImageErrorBoundary Component
 * 
 * @param children - Child components to wrap
 * @param fallback - Fallback UI to show on error
 * @param onError - Callback when error occurs
 */
export class ProductImageErrorBoundary extends Component<
  ProductImageErrorBoundaryProps,
  ProductImageErrorBoundaryState
> {
  constructor(props: ProductImageErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ProductImageErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console
    console.error('ProductImageErrorBoundary caught an error:', error, errorInfo);

    // Call error callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
              Something went wrong with the image gallery
            </h2>
            
            <div className="space-y-2">
              <p className="text-sm text-red-600 dark:text-red-400">
                An error occurred while loading the product images. Please try refreshing the page.
              </p>
              
              {this.state.error && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                    View error details
                  </summary>
                  <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/40 rounded">
                    <p className="font-mono text-xs text-red-800 dark:text-red-300">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="mt-2 text-xs text-red-700 dark:text-red-400 overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </div>
            
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProductImageErrorBoundary;
