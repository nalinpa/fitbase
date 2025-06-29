
import React, { ReactNode } from "react";
import toast from "react-hot-toast";
import { ErrorBoundary } from "./errorBoundary";

export const DashboardErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  const handleDashboardError = (error: Error) => {
    toast.error('Dashboard error');
    console.error('Dashboard component error:', error);
  };

  const DashboardErrorFallback = () => (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Dashboard Unavailable</h2>
        <p className="text-gray-600 mb-8">
          We're having trouble loading your dashboard right now. This might be a temporary issue.
        </p>
        
        <div className="space-y-3">
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mr-4"
          >
            Reload Dashboard
          </button>
          <button 
            onClick={() => window.location.href = '/workouts'}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Workouts
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      context="dashboard"
      onError={handleDashboardError}
      fallback={<DashboardErrorFallback />}
    >
      {children}
    </ErrorBoundary>
  );
};