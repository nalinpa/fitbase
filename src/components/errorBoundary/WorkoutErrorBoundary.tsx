import React, { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { ErrorBoundary } from './errorBoundary';

interface WorkoutErrorBoundaryProps {
  children: ReactNode;
}

export const WorkoutErrorBoundary: React.FC<WorkoutErrorBoundaryProps> = ({ children }) => {
  const handleWorkoutError = (error: Error) => {
    toast.error('Workout error');
    console.error('Workout component error:', error);
  };

  const WorkoutErrorFallback = () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
      <div className="flex items-start">
        <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Workout Error</h3>
          <p className="text-red-700 mb-4">
            There was an issue loading your workout. Your progress has been automatically saved.
          </p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors mr-2"
            >
              Retry Workout
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      context="workout session"
      onError={handleWorkoutError}
      fallback={<WorkoutErrorFallback />}
    >
      {children}
    </ErrorBoundary>
  );
};