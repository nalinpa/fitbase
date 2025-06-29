import React, { Component, ErrorInfo, ReactNode } from 'react';

interface DefaultErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onRetry: () => void;
  context?: string;
}

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Default error fallback component to display when an error occurs within an
 * {@link https://reactjs.org/docs/error-boundaries.html | error boundary}. This
 * component renders a user-friendly error message with a retry button and
 * additional buttons to refresh the page or navigate to the dashboard.
 * 
 * @remarks
 * This component is designed to be used as a fallback for the
 * {@link ErrorBoundary} component. It displays a user-friendly error message
 * with a retry button and additional buttons to refresh the page or navigate
 * to the dashboard. In development mode, it also displays the error details.
 * 
 * @param {Object} props - The component props.
 * @param {Error} [props.error] - The error that occurred.
 * @param {ErrorInfo} [props.errorInfo] - The error info that occurred.
 * @param {() => void} [props.onRetry] - The retry button click handler.
 * @param {string} [props.context] - The context in which the error occurred.
 * @returns {ReactElement} The default error fallback component.
 */
/*******  83927e78-2f57-48cc-806d-e139c4dbe389  *******/
export const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  onRetry, 
  context 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Oops! Something went wrong
          </h2>
          
          <p className="text-gray-600 mb-2">
            We encountered an unexpected error in {context || 'the application'}.
          </p>
          
          <p className="text-gray-600 mb-6">
            Don't worry, your data is safe.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Refresh Page
            </button>
            
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                {error.toString()}
                {errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};