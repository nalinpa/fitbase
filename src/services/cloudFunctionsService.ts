import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { User } from 'firebase/auth';
export interface DashboardData {
  userData: any;
  activePlan: any;
  recentWorkouts: any[];
  nextWorkout: any;
}

export interface WorkoutLibraryData {
  commonWorkouts: any[];
  customWorkouts: any[];
  activePlanId: string | null;
}

export interface WorkoutHistoryData {
  sessions: any[];
  hasMore: boolean;
}

export interface CalendarData {
  events: any[];
}

export interface AnalyticsData {
  period: string;
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
  averageWorkoutsPerWeek: string;
  workoutsByDay: { [key: string]: number };
  volumeByMuscleGroup: { [key: string]: number };
}

export interface PersonalRecordsData {
  personalRecords: { [exercise: string]: number };
  exerciseFrequency: { [exercise: string]: number };
  volumeByExercise: { [exercise: string]: number };
  totalWorkouts: number;
}

export interface SessionData {
  sessionId: string;
  session: any;
}

// Workout session response type
export interface WorkoutSessionResponse {
  id: string;
  planName: string;
  dayName: string;
  exercises: any[];
  userId: string;
  status: string;
  dateStarted: any;
  planId: string;
  dayIndex: number;
  [key: string]: any;
}

export interface UserPreferences {
  weightUnit: 'kg' | 'lbs';
  timezone: string;
  displayName: string;
}

// Cloud Functions Service Class
class CloudFunctionsService {
  // ==================== AUTH FUNCTIONS ====================
  
  async createUser(email: string, password: string) {
    const createUserFn = httpsCallable(functions, 'createUser');
    const result = await createUserFn({ email, password });
    return result.data;
  }

  async verifyUser(email: string) {
    const verifyUserFn = httpsCallable(functions, 'verifyUser');
    const result = await verifyUserFn({ email });
    return result.data;
  }

  async initiatePasswordReset(email: string) {
    const initiatePasswordResetFn = httpsCallable(functions, 'initiatePasswordReset');
    const result = await initiatePasswordResetFn({ email });
    return result.data;
  }

  // ==================== USER DATA FUNCTIONS ====================
  
  async getUserDashboardData(): Promise<DashboardData> {
    const getDashboardDataFn = httpsCallable(functions, 'getUserDashboardData');
    const result = await getDashboardDataFn();
    return result.data as DashboardData;
  }

  async getUserProfile(): Promise<UserPreferences> {
    const getUserProfileFn = httpsCallable(functions, 'getUserProfile');
    const result = await getUserProfileFn();
    return result.data as UserPreferences;
  }

  async updateUserProfile(profileData: any) {
    const updateUserProfileFn = httpsCallable(functions, 'updateUserProfile');
    const result = await updateUserProfileFn({ profileData });
    return result.data;
  }

  // ==================== WORKOUT PLAN FUNCTIONS ====================
  
  async getWorkoutLibrary(): Promise<WorkoutLibraryData> {
    const getWorkoutLibraryFn = httpsCallable(functions, 'getWorkoutLibrary');
    const result = await getWorkoutLibraryFn();
    return result.data as WorkoutLibraryData;
  }

  async getWorkoutPlan(planId: string) {
    const getWorkoutPlanFn = httpsCallable(functions, 'getWorkoutPlan');
    const result = await getWorkoutPlanFn({ planId });
    return result.data;
  }

  async createWorkoutPlan(description: string, numberOfDays: number, days: any[]) {
    const createWorkoutPlanFn = httpsCallable(functions, 'createWorkoutPlan');
    const result = await createWorkoutPlanFn({ description, numberOfDays, days });
    return result.data;
  }

  async updateWorkoutPlan(planId: string, planData: any) {
    const updateWorkoutPlanFn = httpsCallable(functions, 'updateWorkoutPlan');
    const result = await updateWorkoutPlanFn({ planId, planData });
    return result.data;
  }

  async deleteWorkoutPlan(planId: string) {
    const deleteWorkoutPlanFn = httpsCallable(functions, 'deleteWorkoutPlan');
    const result = await deleteWorkoutPlanFn({ planId });
    return result.data;
  }

  async selectWorkoutPlan(planId: string) {
    const selectWorkoutPlanFn = httpsCallable(functions, 'selectWorkoutPlan');
    const result = await selectWorkoutPlanFn({ planId });
    return result.data;
  }

  // ==================== WORKOUT SESSION FUNCTIONS ====================
  
  async startWorkoutSession(planId: string, dayIndex: number): Promise<SessionData> {
    console.log('Service called with:', { planId, dayIndex, dayIndexType: typeof dayIndex });

    const startWorkoutSessionFn = httpsCallable(functions, 'startWorkoutSession');
    const result = await startWorkoutSessionFn({ planId, dayIndex });
    return result.data as SessionData;
  }

  async getWorkoutSession(sessionId: string): Promise<WorkoutSessionResponse> {
    const getWorkoutSessionFn = httpsCallable(functions, 'getWorkoutSession');
    const result = await getWorkoutSessionFn({ sessionId });
    return result.data as WorkoutSessionResponse;
  }

  async updateWorkoutSession(sessionId: string, exercises: any[]) {
    const updateWorkoutSessionFn = httpsCallable(functions, 'updateWorkoutSession');
    const result = await updateWorkoutSessionFn({ sessionId, exercises });
    return result.data;
  }

  async finishWorkout(sessionId: string, exercises: any[]) {
    const finishWorkoutFn = httpsCallable(functions, 'finishWorkout');
    const result = await finishWorkoutFn({ sessionId, exercises });
    return result.data;
  }

  async cancelWorkoutSession(sessionId: string) {
    const cancelWorkoutSessionFn = httpsCallable(functions, 'cancelWorkoutSession');
    const result = await cancelWorkoutSessionFn({ sessionId });
    return result.data;
  }

  // ==================== HISTORY & CALENDAR FUNCTIONS ====================
  
  async getWorkoutHistory(limit: number = 20, startAfter?: string): Promise<WorkoutHistoryData> {
    const getWorkoutHistoryFn = httpsCallable(functions, 'getWorkoutHistory');
    const result = await getWorkoutHistoryFn({ limit, startAfter });
    return result.data as WorkoutHistoryData;
  }

  async getCalendarData(startDate: string, endDate: string): Promise<CalendarData> {
    const getCalendarDataFn = httpsCallable(functions, 'getCalendarData');
    const result = await getCalendarDataFn({ startDate, endDate });
    return result.data as CalendarData;
  }

  // ==================== ANALYTICS FUNCTIONS ====================
  
  async getWorkoutAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<AnalyticsData> {
    const getWorkoutAnalyticsFn = httpsCallable(functions, 'getWorkoutAnalytics');
    const result = await getWorkoutAnalyticsFn({ period });
    return result.data as AnalyticsData;
  }

  async getPersonalRecords(): Promise<PersonalRecordsData> {
    const getPersonalRecordsFn = httpsCallable(functions, 'getPersonalRecords');
    const result = await getPersonalRecordsFn();
    return result.data as PersonalRecordsData;
  }

    async testFunctionCall() {
    try {
      console.log('Testing function call...');
      console.log('Functions:', functions);
      
      // Test the actual function call
      const testFn = httpsCallable(functions, 'getUserDashboardData');
      console.log('Function created:', testFn);
      
      const result = await testFn();
      console.log('Function result:', result);
    } catch (error) {
      console.error('Function call error:', error);
      console.error('Error type:', typeof error);
    }
  };
}

// Export a singleton instance
export const cloudFunctionsService = new CloudFunctionsService();

// Export individual function calls for components that prefer this pattern
export const {
  createUser,
  verifyUser,
  initiatePasswordReset,
  getUserDashboardData,
  getUserProfile,
  updateUserProfile,
  getWorkoutLibrary,
  getWorkoutPlan,
  createWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  selectWorkoutPlan,
  startWorkoutSession,
  getWorkoutSession,
  updateWorkoutSession,
  finishWorkout,
  cancelWorkoutSession,
  getWorkoutHistory,
  getCalendarData,
  getWorkoutAnalytics,
  getPersonalRecords,
  testFunctionCall
} = cloudFunctionsService;