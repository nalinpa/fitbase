
import React, { ReactNode } from "react";
import toast from "react-hot-toast";
import { ErrorBoundary } from "./errorBoundary";

export const AuthErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  const handleAuthError = (error: Error) => {
    toast.error('Authentication error');
    console.error('Auth component error:', error);
  };

  const AuthErrorFallback = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
        <p className="text-gray-600 mb-6">
          There was an issue with the authentication system. Please try logging in again.
        </p>
        
        <button 
          onClick={() => window.location.href = '/login'}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Login
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      context="authentication"
      onError={handleAuthError}
      fallback={<AuthErrorFallback />}
    >
      {children}
    </ErrorBoundary>
  );
};