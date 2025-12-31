'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ hasError: true, error });

    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="mb-4">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              
              <p className="text-gray-600 mb-6">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              
              <div className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-md">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">
                    What happened?
                  </h2>
                  <p className="text-sm text-gray-700">
                    {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
                  </p>
                </div>
                
                <div className="bg-gray-100 p-4 rounded-md">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">
                    What can you do?
                  </h2>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>Try refreshing the page</li>
                    <li>Check your internet connection</li>
                    <li>Try again later</li>
                  </ul>
                </div>
              </div>
              
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center mx-auto px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Try again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;