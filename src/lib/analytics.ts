import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase';

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

export const trackEvent = {
  userSignedUp: () => logAnalyticsEvent('sign_up'),
  userLoggedIn: () => logAnalyticsEvent('login'),
  
  // Workout events
  workoutStarted: (workoutType: string) => 
    logAnalyticsEvent('workout_started', { workout_type: workoutType }),
  
  workoutCompleted: (workoutType: string, durationMinutes: number) =>
    logAnalyticsEvent('workout_completed', { 
      workout_type: workoutType, 
      duration_minutes: durationMinutes 
    }),
  
  workoutCancelled: (workoutType: string, reason: string) =>
    logAnalyticsEvent('workout_cancelled', {
      workout_type: workoutType,
      reason: reason
    }),
  
  // AI Routine events
  routineGenerated: (fitnessLevel: string, goal: string, equipment: string) =>
    logAnalyticsEvent('routine_generated', { 
      fitness_level: fitnessLevel, 
      goal: goal,
      equipment: equipment
    }),
  
  routineSaved: (routineType: string) =>
    logAnalyticsEvent('routine_saved', { routine_type: routineType }),
  
  // Profile events
  profileUpdated: () => logAnalyticsEvent('profile_updated'),
  
  // Error events
  errorOccurred: (errorType: string, context: string) =>
    logAnalyticsEvent('error_occurred', {
      error_type: errorType,
      context: context
    }),
  
  // Feature usage
  featureUsed: (featureName: string) =>
    logAnalyticsEvent('feature_used', { feature_name: featureName }),
};