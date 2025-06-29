import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import app from './firebase'; 

let analytics: Analytics | null = null;

// Initialize analytics only in browser environment
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

// Safe analytics logging function
export const logAnalyticsEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (analytics) {
    try {
      logEvent(analytics, eventName, parameters);
    } catch (error) {
      console.warn('Analytics event failed:', error);
    }
  } else {
    console.log('Analytics not available, would log:', eventName, parameters);
  }
};

// Pre-defined events for your fitness app
export const analyticsEvents = {
  workoutStarted: (workoutType: string) => 
    logAnalyticsEvent('workout_started', { workout_type: workoutType }),
  
  workoutCompleted: (workoutType: string, durationMinutes: number) =>
    logAnalyticsEvent('workout_completed', { 
      workout_type: workoutType, 
      duration_minutes: durationMinutes 
    }),
  
  routineGenerated: (fitnessLevel: string, goal: string) =>
    logAnalyticsEvent('routine_generated', { 
      fitness_level: fitnessLevel, 
      goal: goal 
    }),
  
  userSignedUp: () => 
    logAnalyticsEvent('sign_up'),
  
  userLoggedIn: () => 
    logAnalyticsEvent('login'),
};

export { analytics };