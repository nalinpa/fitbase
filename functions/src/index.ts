import {onCall, HttpsError} from "firebase-functions/v2/https";
import {FieldValue, Timestamp, UpdateData} from "firebase-admin/firestore";
import {setGlobalOptions} from "firebase-functions/v2";
import {logger} from "firebase-functions";
import * as admin from "firebase-admin";
import * as bcrypt from "bcrypt";

import {secureCall, security} from "./helper/SecureFunctionCall";

setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});

// Initialize Admin SDK
admin.initializeApp();

// Initialize
let db: admin.firestore.Firestore;
const saltRounds = 10;

const initializeDb = () => {
  if (!db) {
    logger.info("Initializing Firestore instance...");
    db = admin.firestore();
  }
};

// // Define callable options with CORS enabled
// const callableOptions: CallableOptions = {
//   cors: [
//     "http://localhost:3000",
//     "http://localhost:3001",
//     "https://fitbase-60cab.firebaseapp.com",
//     "https://fitbase-60cab.web.app",
//   ],
//   maxInstances: 10,
// };


// Types
interface Exercise {
  exerciseName: string;
  sets: number;
  reps: string;
  weight: string;
  restTime: number;
}

// interface WorkoutDay {
//   dayName: string;
//   notes: string;
//   exercises: Exercise[];
// }

interface PerformanceSet {
  weight: string;
  reps: string;
  completed: boolean;
}

interface LoggedExercise extends Exercise {
  performance: PerformanceSet[];
}
interface ActivePlan {
  id: string;
  planName?: string;
  description?: string;
  days?: LoggedExercise[];
}

interface UserProfileUpdate {
  displayName?: string;
  weightUnit?: string;
  timezone?: string;
  updatedAt?: FirebaseFirestore.FieldValue;
}

interface FirebaseFunctionError {
  code: string;
  message: string;
  details?: Record<string, unknown> | string | null;
}

// ==================== AUTH FUNCTIONS ====================
export const createUser = onCall({
  cors: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://fitbase-60cab.firebaseapp.com",
    "https://fitbase-60cab.web.app",
  ],
}, async (request) => {
  try {
    initializeDb();
    const {email, password} = request.data;

    if (!email || !password) {
      throw new HttpsError("invalid-argument", "Email and password are required.");
    }

    security.validateEmail(email);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpsError("invalid-argument", "Invalid email address format.");
    }

    // Basic password validation
    if (password.length < 6) {
      throw new HttpsError("invalid-argument", "Password must be at least 6 characters long.");
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: email.split("@")[0],
    });

    const userId = userRecord.uid;

    // Hash password for additional security (though Firebase Auth already handles this)
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user document
    const userDocData = {
      email: email,
      hashedPassword: hashedPassword,
      displayName: email.split("@")[0],
      createdAt: FieldValue.serverTimestamp(),
      activeWorkoutPlanId: null,
      lastCompletedDayIndex: null,
      totalWorkoutsCompleted: 0,
      memberSince: FieldValue.serverTimestamp(),
      weightUnit: "kg",
      timezone: "UTC",
      stats: {
        totalWorkouts: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastWorkoutDate: null,
        personalRecords: {},
        volumeByMuscleGroup: {},
      },
    };

    await db.collection("users").doc(userId).set(userDocData);

    // Return success response
    return {
      success: true,
      message: "User created successfully. Please sign in.",
      uid: userId,
    };
  } catch (error) {
    logger.error("Error creating user:", error);

    // Type guard for Firebase Auth errors
    if (error && typeof error === "object" && "code" in error) {
      const authError = error as admin.FirebaseError;

      switch (authError.code) {
      case "auth/email-already-exists":
        throw new HttpsError("already-exists", "Email already in use.");
      case "auth/invalid-email":
        throw new HttpsError("invalid-argument", "Invalid email address.");
      case "auth/weak-password":
        throw new HttpsError("invalid-argument", "Password is too weak.");
      default:
        logger.error("Unexpected Firebase Auth error:", authError);
        throw new HttpsError("internal", "Something went wrong creating user.");
      }
    } else if (error instanceof HttpsError) {
      // Re-throw HttpsError instances (like our validation errors)
      throw error;
    } else {
      logger.error("Unexpected error:", error);
      throw new HttpsError("internal", "Something went wrong creating user.");
    }
  }
});

// Update your existing verifyUser function to use onCall instead of onRequest
export const verifyUser = onCall({
  cors: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://fitbase-60cab.firebaseapp.com",
    "https://fitbase-60cab.web.app",
  ],
}, async (request) => {
  try {
    initializeDb();
    const {email} = request.data;

    security.validateEmail(email);

    if (!email) {
      throw new HttpsError("invalid-argument", "Email is required.");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpsError("invalid-argument", "Invalid email address format.");
    }

    // Check if user exists in our database
    const userQuery = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (userQuery.empty) {
      throw new HttpsError("not-found", "User not found.");
    }

    const userDoc = userQuery.docs[0];

    return {
      exists: true,
      uid: userDoc.id,
    };
  } catch (error) {
    logger.error("Error verifying user:", error);

    if (error instanceof HttpsError) {
      throw error;
    } else {
      throw new HttpsError("internal", "Something went wrong verifying user.");
    }
  }
});

// Optional: Add a password reset function
export const initiatePasswordReset = onCall({
  cors: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://fitbase-60cab.firebaseapp.com",
    "https://fitbase-60cab.web.app",
  ],
}, async (request) => {
  try {
    const {email} = request.data;

    security.validateEmail(email);

    if (!email) {
      throw new HttpsError("invalid-argument", "Email is required.");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new HttpsError("invalid-argument", "Invalid email address format.");
    }

    // Send password reset email
    await admin.auth().generatePasswordResetLink(email);

    return {
      success: true,
      message: "Password reset email sent successfully.",
    };
  } catch (error) {
    logger.error("Error initiating password reset:", error);

    if (error && typeof error === "object" && "code" in error) {
      const authError = error as admin.FirebaseError;

      switch (authError.code) {
      case "auth/user-not-found":
        throw new HttpsError("not-found", "No account found with this email address.");
      case "auth/invalid-email":
        throw new HttpsError("invalid-argument", "Invalid email address.");
      default:
        throw new HttpsError("internal", "Failed to send password reset email.");
      }
    } else {
      throw new HttpsError("internal", "Failed to send password reset email.");
    }
  }
});

// ==================== USER DATA FUNCTIONS ====================

export const getUserDashboardData = secureCall(
  async (request, uid) => {
    initializeDb();

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User not found.");
    }

    const userData = userDoc.data();

    let activePlan: ActivePlan | null = null;
    if (userData && userData.activeWorkoutPlanId) {
      const planDoc = await db
        .collection("workouts")
        .doc(userData.activeWorkoutPlanId)
        .get();
      if (planDoc.exists) {
        activePlan = {id: planDoc.id, ...planDoc.data()};
      }
    }

    // Get recent workouts
    const recentWorkoutsQuery = await db
      .collection("userWorkouts")
      .where("userId", "==", uid)
      .where("status", "==", "completed")
      .orderBy("dateCompleted", "desc")
      .limit(5)
      .get();

    const recentWorkouts = recentWorkoutsQuery.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate next workout
    let nextWorkout = null;
    if (activePlan && activePlan.days && userData) {
      const lastCompletedIndex = userData.lastCompletedDayIndex;
      const totalDays = activePlan.days.length;
      const nextDayIndex =
        (
          lastCompletedIndex === undefined ||
          lastCompletedIndex === null ||
          lastCompletedIndex >= totalDays - 1
        ) ?
          0 :
          lastCompletedIndex + 1;

      nextWorkout = {
        dayIndex: nextDayIndex,
        day: activePlan.days[nextDayIndex],
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {hashedPassword, ...safeUserData} = userData || {};

    return {
      userData: safeUserData,
      activePlan,
      recentWorkouts,
      nextWorkout,
    };
  }
);

// ==================== WORKOUT PLAN FUNCTIONS ====================

export const getWorkoutLibrary = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    try {
    // Get user's active plan ID
      const userDoc = await db.collection("users").doc(uid).get();
      const activePlanId = userDoc.data()?.activeWorkoutPlanId || null;

      // Get common workouts
      const commonQuery = await db
        .collection("workouts")
        .where("type", "==", "common")
        .orderBy("planName", "asc")
        .get();

      const commonWorkouts = commonQuery.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get user's custom workouts
      const customQuery = await db
        .collection("workouts")
        .where("createdBy", "==", uid)
        .orderBy("planName", "asc")
        .get();

      const customWorkouts = customQuery.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        commonWorkouts,
        customWorkouts,
        activePlanId,
      };
    } catch (error) {
      logger.error("Error fetching workout library:", error);
      throw new HttpsError("internal", "Failed to fetch workout library.");
    }
  });

export const selectWorkoutPlan = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const {planId} = request.data;
    if (!planId) {
      throw new HttpsError("invalid-argument", "Plan ID is required.");
    }

    try {
    // Verify plan exists
      const planDoc = await db.collection("workouts").doc(planId).get();
      if (!planDoc.exists) {
        throw new HttpsError("not-found", "Workout plan not found.");
      }

      // Update user's active plan
      await db.collection("users").doc(uid).update({
        activeWorkoutPlanId: planId,
        lastCompletedDayIndex: null, // Reset progress when selecting new plan
      });

      return {success: true, message: "Workout plan selected successfully."};
    } catch (error) {
      logger.error("Error selecting workout plan:", error);
      throw new HttpsError("internal", "Failed to select workout plan.");
    }
  });

export const createWorkoutPlan = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const {description, numberOfDays, days} = request.data;
    if (!numberOfDays || !Array.isArray(days) || days.length === 0) {
      throw new HttpsError("invalid-argument", "Invalid data payload.");
    }

    try {
    // Check workout limit
      const existingQuery = await db
        .collection("workouts")
        .where("createdBy", "==", uid)
        .where("type", "==", "custom")
        .get();

      if (existingQuery.size >= 5) {
        throw new HttpsError(
          "failed-precondition",
          "You have reached the limit of 5 custom workout plans."
        );
      }

      const newPlanName = `Custom Workout ${existingQuery.size + 1}`;
      const workoutPlanData = {
        planName: newPlanName,
        description: description || "",
        numberOfDays,
        days,
        createdBy: uid,
        createdAt: FieldValue.serverTimestamp(),
        type: "custom",
      };

      const docRef = await db.collection("workouts").add(workoutPlanData);
      return {success: true, planId: docRef.id, planName: newPlanName};
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Error creating workout plan:", error);
      throw new HttpsError("internal", "Failed to create workout plan.");
    }
  });

// ==================== WORKOUT SESSION FUNCTIONS ====================

export const startWorkoutSession = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const {planId, dayIndex} = request.data;
    if (!planId || dayIndex === undefined) {
      throw new HttpsError(
        "invalid-argument",
        "Plan ID and day index are required."
      );
    }

    try {
      // Get the workout plan
      const planDoc = await db.collection("workouts").doc(planId).get();
      if (!planDoc.exists) {
        throw new HttpsError("not-found", "Workout plan not found.");
      }

      const planData = planDoc.data();
      if (!planData) {
        throw new HttpsError("not-found", "Workout plan not found.");
      }

      const selectedDay = planData.days[dayIndex];
      if (!selectedDay) {
        throw new HttpsError("invalid-argument", "Invalid day index.");
      }

      // Get previous session for this day to pre-populate weights
      const previousSessionQuery = await db
        .collection("userWorkouts")
        .where("userId", "==", uid)
        .where("planId", "==", planId)
        .where("dayIndex", "==", dayIndex)
        .where("status", "==", "completed")
        .orderBy("dateCompleted", "desc")
        .limit(1)
        .get();

      const lastSessionData =
        previousSessionQuery.empty ? null :
          previousSessionQuery.docs[0].data();

      // Build exercises with performance tracking
      const exercises = selectedDay.exercises.map((planExercise: Exercise) => {
        const lastExercisePerformance = lastSessionData?.exercises.find(
          (lastEx: Exercise) => lastEx.exerciseName === planExercise.exerciseName
        );

        const performance =
          Array(planExercise.sets).fill(null).map((_, setIndex) => {
            const lastWeight =
              lastExercisePerformance?.performance[setIndex]?.weight || "0";
            return {weight: lastWeight, reps: "", completed: false};
          });

        return {
          ...planExercise,
          performance,
        };
      });

      // Create new session
      const sessionData = {
        userId: uid,
        planId: planId,
        planName: planData.planName,
        dayIndex: dayIndex,
        dayName: selectedDay.dayName,
        dateStarted: FieldValue.serverTimestamp(),
        status: "in_progress",
        exercises,
      };

      const docRef = await db.collection("userWorkouts").add(sessionData);

      return {
        success: true,
        sessionId: docRef.id,
        session: {
          id: docRef.id,
          ...sessionData,
        },
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error("Start workout error:", error);

      const firebaseError = error as FirebaseFunctionError;
      console.error("Error code:", firebaseError.code);
      logger.error("Error starting workout message:", firebaseError.message);
      logger.error("Error starting workout details:", firebaseError.message);
      console.error("Error message:", firebaseError.message);
      console.error("Error details:", firebaseError.details);
      throw new HttpsError("internal", "Failed to start workout session.");
    }
  });

export const updateWorkoutSession = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const {sessionId, exercises} = request.data;
    if (!sessionId || !exercises) {
      throw new HttpsError(
        "invalid-argument",
        "Session ID and exercises are required."
      );
    }

    await security.checkOwnership(uid, 'userWorkouts', sessionId, db);

    try {
      // Verify session ownership
      const sessionDoc = await db.collection("userWorkouts").doc(sessionId).get();
      if (!sessionDoc.exists || !sessionDoc.data()) {
        throw new HttpsError("not-found", "Session not found.");
      }

      const sessionData = sessionDoc.data();
      if (!sessionData || sessionData.userId !== uid) {
        throw new HttpsError(
          "permission-denied",
          "You don't have permission to update this session."
        );
      }

      // Update session
      await db.collection("userWorkouts").doc(sessionId).update({
        exercises,
        lastUpdated: FieldValue.serverTimestamp(),
      });

      return {success: true};
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Error updating workout session:", error);
      throw new HttpsError("internal", "Failed to update workout session.");
    }
  });

export const finishWorkout = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const {sessionId, exercises} = request.data;
    if (!sessionId || !exercises) {
      throw new HttpsError(
        "invalid-argument",
        "Session ID and exercises are required."
      );
    }

    try {
    // Get session and user data
      const sessionDoc = await db.collection("userWorkouts").doc(sessionId).get();
      if (!sessionDoc.exists) {
        throw new HttpsError("not-found", "Session not found.");
      }

      const sessionData = sessionDoc.data();
      if (sessionData && sessionData.userId !== uid) {
        throw new HttpsError(
          "permission-denied",
          "You don't have permission to finish this session."
        );
      }

      const userDoc = await db.collection("users").doc(uid).get();
      const userData = userDoc.data();

      if (!userData) {
        throw new HttpsError("not-found", "User not found.");
      }

      // Calculate streak
      const lastWorkoutDate = userData.stats?.lastWorkoutDate?.toDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let currentStreak =
      userData.stats?.currentStreak || 0;

      if (lastWorkoutDate) {
        const lastWorkout = new Date(lastWorkoutDate);
        lastWorkout.setHours(0, 0, 0, 0);
        const daysDiff =
        Math.floor(
          (today.getTime() - lastWorkout.getTime()) /
          (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          currentStreak++;
        } else if (daysDiff > 1) {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      const longestStreak =
      Math.max(currentStreak, userData.stats?.longestStreak || 0);

      // Calculate personal records
      const personalRecords = {...(userData.stats?.personalRecords || {})};
      exercises
        .forEach((exercise: LoggedExercise) => {
          exercise.performance.forEach((set) => {
            if (set.completed && set.weight) {
              const weight = parseFloat(set.weight);
              const exerciseName = exercise.exerciseName;

              if (
                !personalRecords[exerciseName] ||
              weight > personalRecords[exerciseName]
              ) {
                personalRecords[exerciseName] = weight;
              }
            }
          });
        });

      // Batch update
      const batch = db.batch();

      batch.update(db.collection("userWorkouts").doc(sessionId), {
        status: "completed",
        dateCompleted: FieldValue.serverTimestamp(),
        exercises,
      });

      if (!sessionData) {
        throw new HttpsError("not-found", "Session data not found.");
      }

      batch.update(db.collection("users").doc(uid), {
        "lastCompletedDayIndex": sessionData.dayIndex,
        "stats.totalWorkouts": FieldValue.increment(1),
        "stats.currentStreak": currentStreak,
        "stats.longestStreak": longestStreak,
        "stats.lastWorkoutDate": FieldValue.serverTimestamp(),
        "stats.personalRecords": personalRecords,
      });

      await batch.commit();

      return {
        success: true,
        message: "Workout completed!",
        stats: {currentStreak, longestStreak},
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Error finishing workout:", error);
      throw new HttpsError("internal", "Failed to finish workout.");
    }
  });

// ==================== HISTORY & CALENDAR FUNCTIONS ====================

export const getWorkoutHistory = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const {limit = 20, startAfter} = request.data;

    try {
      let query = db
        .collection("userWorkouts")
        .where("userId", "==", uid)
        .where("status", "==", "completed")
        .orderBy("dateCompleted", "desc")
        .limit(limit);

      if (startAfter) {
        const startDoc =
        await db.collection("userWorkouts").doc(startAfter).get();
        query = query.startAfter(startDoc);
      }

      const snapshot = await query.get();
      const sessions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        sessions,
        hasMore: sessions.length === limit,
      };
    } catch (error) {
      logger.error("Error fetching workout history:", error);
      throw new HttpsError("internal", "Failed to fetch workout history.");
    }
  });

export const getCalendarData = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const {startDate, endDate} = request.data;
    if (!startDate || !endDate) {
      throw new HttpsError("invalid-argument", "startDate and endDate are required.");
    }

    try {
      console.log("About to create Date objects...");
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      console.log("Date objects created:", {startDateObj, endDateObj});

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        throw new HttpsError("invalid-argument", "Invalid date format provided.");
      }

      console.log("About to create timestamps...");
      const startTimestamp = Timestamp.fromDate(startDateObj);
      const endTimestamp = Timestamp.fromDate(endDateObj);

      console.log("Timestamps created successfully");

      const query = await db
        .collection("userWorkouts")
        .where("userId", "==", uid)
        .where("status", "==", "completed")
        .where("dateCompleted", ">=", startTimestamp)
        .where("dateCompleted", "<=", endTimestamp)
        .get();

      const events = query.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: `${data.planName}: ${data.dayName}`,
          date: data.dateCompleted.toDate().toISOString(),
          planId: data.planId,
          dayIndex: data.dayIndex,
        };
      });

      return {events};
    } catch (error) {
      logger.error("Error fetching calendar data:", error);
      throw new HttpsError("internal", "Failed to fetch calendar data.");
    }
  });

// ==================== ANALYTICS FUNCTIONS ====================

export const getWorkoutAnalytics = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const {period = "month"} = request.data; // week, month, year

    try {
    // Calculate date range
      const now = new Date();
      const startDate = new Date();

      switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      }

      const startTimestamp = Timestamp.fromDate(startDate);

      // Get completed workouts in period
      const workoutsQuery = await db
        .collection("userWorkouts")
        .where("userId", "==", uid)
        .where("status", "==", "completed")
        .where("dateCompleted", ">=", startTimestamp)
        .get();

      // Process data
      const workoutsByDay: { [key: string]: number } = {};
      const volumeByMuscleGroup: { [key: string]: number } = {};
      let totalVolume = 0;
      let totalSets = 0;

      workoutsQuery.docs.forEach((doc) => {
        const data = doc.data();
        const date = data.dateCompleted.toDate().toISOString().split("T")[0];

        // Count workouts by day
        workoutsByDay[date] = (workoutsByDay[date] || 0) + 1;

        // Calculate volume
        data.exercises.forEach((exercise: LoggedExercise) => {
          exercise.performance.forEach((set: PerformanceSet) => {
            if (set.completed && set.weight && set.reps) {
              const weight = parseFloat(set.weight);
              const reps = parseInt(set.reps);
              const setVolume = weight * reps;

              totalVolume += setVolume;
              totalSets++;
            }
          });
        });
      });

      return {
        period,
        totalWorkouts: workoutsQuery.size,
        totalVolume,
        totalSets,
        averageWorkoutsPerWeek:
        (workoutsQuery.size /
          (period === "week" ? 1 : period === "month" ? 4 : 52))
          .toFixed(1),
        workoutsByDay,
        volumeByMuscleGroup,
      };
    } catch (error) {
      logger.error("Error fetching analytics:", error);
      throw new HttpsError("internal", "Failed to fetch analytics.");
    }
  });

// ==================== PLAN MANAGEMENT FUNCTIONS ====================

export const updateWorkoutPlan = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const {planId, planData} = request.data;
    if (!planId || !planData) {
      throw new HttpsError("invalid-argument", "Plan ID and plan data are required.");
    }

    try {
    // Verify plan exists and user has permission to edit
      const planDoc = await db.collection("workouts").doc(planId).get();
      if (!planDoc.exists) {
        throw new HttpsError("not-found", "Workout plan not found.");
      }

      const currentPlan = planDoc.data();
      if (!currentPlan || (currentPlan.type === "custom" && currentPlan.createdBy !== uid)) {
        throw new HttpsError("permission-denied", "You don't have permission to edit this plan.");
      }

      // Update the plan
      await db.collection("workouts").doc(planId).update({
        ...planData,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {success: true, message: "Plan updated successfully."};
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Error updating workout plan:", error);
      throw new HttpsError("internal", "Failed to update workout plan.");
    }
  });

export const deleteWorkoutPlan = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const {planId} = request.data;
    if (!planId) {
      throw new HttpsError("invalid-argument", "Plan ID is required.");
    }

    await security.checkOwnership(uid, 'workouts', planId, db);

    try {
    // Verify plan exists and user has permission to delete
      const planDoc = await db.collection("workouts").doc(planId).get();
      if (!planDoc.exists) {
        throw new HttpsError("not-found", "Workout plan not found.");
      }

      const planData = planDoc.data();
      if (!planData || planData.type !== "custom" || planData.createdBy !== uid) {
        throw new HttpsError("permission-denied", "You can only delete your own custom plans.");
      }

      // Check if this plan is currently active for the user
      const userDoc = await db.collection("users").doc(uid).get();
      const userData = userDoc.data();

      if (userData?.activeWorkoutPlanId === planId) {
      // Clear the active plan if deleting the currently active plan
        await db.collection("users").doc(uid).update({
          activeWorkoutPlanId: null,
          lastCompletedDayIndex: null,
        });
      }

      // Delete the plan
      await db.collection("workouts").doc(planId).delete();

      return {success: true, message: "Plan deleted successfully."};
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Error deleting workout plan:", error);
      throw new HttpsError("internal", "Failed to delete workout plan.");
    }
  });

export const getWorkoutPlan = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const {planId} = request.data;
    if (!planId) {
      throw new HttpsError("invalid-argument", "Plan ID is required.");
    }

    await security.checkOwnership(uid, 'workouts', planId, db);

    try {
      const planDoc = await db.collection("workouts").doc(planId).get();
      if (!planDoc.exists) {
        throw new HttpsError("not-found", "Workout plan not found.");
      }

      const planData = planDoc.data();
      if (!planData) {
        throw new HttpsError("not-found", "Workout plan data not found.");
      }

      // Check if user has access to this plan
      // Common plans are accessible to everyone, custom plans only to their creator
      if (planData.type === "custom" && planData.createdBy !== uid) {
        throw new HttpsError("permission-denied", "You don't have permission to view this plan.");
      }

      return {
        id: planDoc.id,
        ...planData,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Error fetching workout plan:", error);
      throw new HttpsError("internal", "Failed to fetch workout plan.");
    }
  });

// ==================== SESSION MANAGEMENT FUNCTIONS ====================

export const getWorkoutSession = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const {sessionId} = request.data;
    if (!sessionId) {
      throw new HttpsError("invalid-argument", "Session ID is required.");
    }

    try {
      const sessionDoc = await db.collection("userWorkouts").doc(sessionId).get();
      if (!sessionDoc.exists) {
        throw new HttpsError("not-found", "Workout session not found.");
      }

      const sessionData = sessionDoc.data();
      if (!sessionData || sessionData.userId !== uid) {
        throw new HttpsError("permission-denied", "You don't have permission to view this session.");
      }

      return {
        id: sessionDoc.id,
        ...sessionData,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Error fetching workout session:", error);
      throw new HttpsError("internal", "Failed to fetch workout session.");
    }
  });

export const cancelWorkoutSession = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const {sessionId} = request.data;
    if (!sessionId) {
      throw new HttpsError("invalid-argument", "Session ID is required.");
    }

    try {
    // Verify session ownership
      const sessionDoc = await db.collection("userWorkouts").doc(sessionId).get();
      if (!sessionDoc.exists || !sessionDoc.data()) {
        throw new HttpsError("not-found", "Session not found.");
      }

      const sessionData = sessionDoc.data();
      if (!sessionData || sessionData.userId !== uid) {
        throw new HttpsError("permission-denied", "You don't have permission to cancel this session.");
      }

      // Update session status to cancelled
      await db.collection("userWorkouts").doc(sessionId).update({
        status: "cancelled",
        dateCancelled: FieldValue.serverTimestamp(),
      });

      return {success: true, message: "Workout session cancelled."};
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Error cancelling workout session:", error);
      throw new HttpsError("internal", "Failed to cancel workout session.");
    }
  });

// ==================== USER PROFILE FUNCTIONS ====================

export const updateUserProfile = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const {profileData} = request.data;
    if (!profileData) {
      throw new HttpsError("invalid-argument", "Profile data is required.");
    }

    try {
      const updateData: UpdateData<UserProfileUpdate> = {};

      // Type-safe field copying
      if (profileData.displayName !== undefined) {
        updateData.displayName = profileData.displayName;
      }
      if (profileData.weightUnit !== undefined) {
        updateData.weightUnit = profileData.weightUnit;
      }
      if (profileData.timezone !== undefined) {
        updateData.timezone = profileData.timezone;
      }

      updateData.updatedAt = FieldValue.serverTimestamp();

      await db.collection("users").doc(uid).update(updateData);

      return {success: true, message: "Profile updated successfully."};
    } catch (error) {
      logger.error("Error updating user profile:", error);
      throw new HttpsError("internal", "Failed to update user profile.");
    }
  });

export const getUserProfile = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    try {
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "User profile not found.");
      }

      const userData = userDoc.data();
      if (!userData) {
        throw new HttpsError("not-found", "User data not found.");
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {hashedPassword, ...safeUserData} = userData;

      return safeUserData;
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Error fetching user profile:", error);
      throw new HttpsError("internal", "Failed to fetch user profile.");
    }
  });

// ==================== STATISTICS FUNCTIONS ====================

export const getPersonalRecords = secureCall(
  async (request, uid) => {
    initializeDb();

    if (!uid) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    try {
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "User not found.");
      }

      const userData = userDoc.data();
      const personalRecords = userData?.stats?.personalRecords || {};

      // Get recent workouts to calculate additional stats
      const recentWorkoutsQuery = await db
        .collection("userWorkouts")
        .where("userId", "==", uid)
        .where("status", "==", "completed")
        .orderBy("dateCompleted", "desc")
        .limit(50)
        .get();

      // Calculate additional statistics
      const exerciseFrequency: { [key: string]: number } = {};
      const volumeByExercise: { [key: string]: number } = {};

      recentWorkoutsQuery.docs.forEach((doc) => {
        const data = doc.data();
        data.exercises.forEach((exercise: LoggedExercise) => {
          const exerciseName = exercise.exerciseName;
          exerciseFrequency[exerciseName] = (exerciseFrequency[exerciseName] || 0) + 1;

          let exerciseVolume = 0;
          exercise.performance.forEach((set: PerformanceSet) => {
            if (set.completed && set.weight && set.reps) {
              const weight = parseFloat(set.weight);
              const reps = parseInt(set.reps);
              exerciseVolume += weight * reps;
            }
          });
          volumeByExercise[exerciseName] = (volumeByExercise[exerciseName] || 0) + exerciseVolume;
        });
      });

      return {
        personalRecords,
        exerciseFrequency,
        volumeByExercise,
        totalWorkouts: recentWorkoutsQuery.size,
      };
    } catch (error) {
      logger.error("Error fetching personal records:", error);
      throw new HttpsError("internal", "Failed to fetch personal records.");
    }
  });
