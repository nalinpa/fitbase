import toast from "react-hot-toast";

export const logAsyncError = (error: Error, context?: string) => {
  const errorData = {
    error: error.toString(),
    stack: error.stack,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  };
}

export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent the default browser error handling
    event.preventDefault();
    
    // Show user-friendly toast based on error type
    if (event.reason?.message?.includes('ChunkLoadError')) {
      toast.error('App update available');
    } else if (event.reason?.message?.includes('Loading chunk')) {
      toast.error('Loading error');
    } else if (event.reason?.code === 'unauthenticated') {
      toast.error('Session expired');
    } else {
      // Don't show toast for every unhandled rejection (can be noisy)
      console.warn('Background error occurred');
    }
    
    // Log the error
    logAsyncError(event.reason, 'unhandledrejection');
  });

  // Handle general JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Only show toast for critical errors
    if (event.error?.name === 'ChunkLoadError') {
      toast.error('App update available');
    }
    
    // Log all errors for debugging
    logAsyncError(event.error, 'global error');
  });

  // Handle resource loading errors (images, scripts, etc.)
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      console.warn('Resource loading error:', event.target);
      // Don't show toast for resource errors, just log them
      logAsyncError(new Error(`Resource loading failed: ${(event.target as any)?.src || 'unknown'}`), 'resource loading');
    }
  }, true);
};