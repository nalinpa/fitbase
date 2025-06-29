import {logAnalyticsEvent} from './analytics';

export const logAsyncError = (error: Error, context?: string) => {
  const errorData = {
    error: error.toString(),
    stack: error.stack,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userId: getCurrentUserId(), // Implement this based on your auth
  };

  console.log('Logging async error:', errorData);

  logAnalyticsEvent('error_occurred', {
    error_message: error.message,
    error_context: context
  });
};

const getCurrentUserId = (): string | null => {
  // Implement based on your auth system
  // Example: return auth.currentUser?.uid || null;
  return null;
};