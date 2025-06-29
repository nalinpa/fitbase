import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { logAsyncError } from '../lib/globalErrorHandling';

export const useErrorHandler = () => {
  const handleError = useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context || 'application'}:`, error);
    
    // Handle specific error types
    if (error.name === 'ChunkLoadError') {
      toast.error('App update available');
    } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
      toast.error('Connection error');
    } else if (error.message?.includes('unauthenticated') || error.message?.includes('unauthorized')) {
      toast.error('Session expired');
      // Optionally redirect to login
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else if (error.message?.includes('permission-denied')) {
      toast.error('Access denied');
    } else if (error.message?.includes('not-found')) {
      toast.error('Not found');
    } else {
      toast.error('Something went wrong');
    }

    // Log to error service
    logAsyncError(error, context);
  }, []);

  return { handleError };
};