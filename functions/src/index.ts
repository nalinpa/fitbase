import {onCall, HttpsError, onRequest} from "firebase-functions/v2/https";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {setGlobalOptions} from "firebase-functions/v2";
import {logger} from "firebase-functions";
import * as admin from "firebase-admin";
import * as bcrypt from "bcrypt";
import cors from "cors";

setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});

// Initialize Admin SDK
admin.initializeApp();

// Initialize
const corsHandler = cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

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

// ==================== AUTH FUNCTIONS ====================
export const createUser = onRequest( {
  cors: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://fitbase-60cab.firebaseapp.com",
    "https://fitbase-60cab.web.app",
  ],
},
async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      initializeDb();
      const {email, password} = req.body;

      if (!email || !password) {
        res.status(400).send({error: "Email and password are required."});
        return;
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

      // Return success without custom token
      res.status(201).send({
        success: true,
        message: "User created successfully. Please sign in.",
        uid: userId,
      });
    } catch (error) {
      logger.error("Error creating user:", error);

      // Type guard for Firebase Auth errors
      if (error && typeof error === "object" && "code" in error) {
        const authError = error as admin.FirebaseError;

        switch (authError.code) {
        case "auth/email-already-exists":
          res.status(400).send({error: "Email already in use."});
          break;
        case "auth/invalid-email":
          res.status(400).send({error: "Invalid email address."});
          break;
        case "auth/weak-password":
          res.status(400).send({error: "Password is too weak."});
          break;
        default:
          res.status(500).send({error: "Something went wrong creating user."});
        }
      } else {
        res.status(500).send({error: "Something went wrong creating user."});
      }
    }
  });
});

export const verifyUser = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      initializeDb();
      const {email} = req.body;

      if (!email) {
        res.status(400).send({error: "Email is required."});
        return;
      }

      // Check if user exists in our database
      const userQuery = await db
        .collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();

      if (userQuery.empty) {
        res.status(404).send({error: "User not found."});
        return;
      }

      const userDoc = userQuery.docs[0];

      res.status(200).send({
        exists: true,
        uid: userDoc.id,
      });
    } catch (error) {
      logger.error("Error verifying user:", error);
      res.status(500).send({error: "Something went wrong."});
    }
  });
});

// ==================== USER DATA FUNCTIONS ====================

export const getUserDashboardData = onCall(async (request) => {
  initializeDb();

  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  try {
    // Get user data
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User not found.");
    }

    const userData = userDoc.data();

    // Get active plan if exists
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

    return {
      userData: {
        ...userData,
        hashedPassword: undefined, // Never send password to client
      },
      activePlan,
      recentWorkouts,
      nextWorkout,
    };
  } catch (error) {
    logger.error("Error fetching dashboard data:", error);
    throw new HttpsError("internal", "Failed to fetch dashboard data.");
  }
});

// ==================== WORKOUT PLAN FUNCTIONS ====================

export const getWorkoutLibrary = onCall({
  cors: true,
},
async (request) => {
  initializeDb();

  const uid = request.auth?.uid;
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

export const selectWorkoutPlan = onCall(async (request) => {
  initializeDb();

  const uid = request.auth?.uid;
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

export const createWorkoutPlan = onCall(async (request) => {
  initializeDb();

  const uid = request.auth?.uid;
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

export const startWorkoutSession = onCall(async (request) => {
  initializeDb();

  const uid = request.auth?.uid;
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
    logger.error("Error starting workout session:", error);
    throw new HttpsError("internal", "Failed to start workout session.");
  }
});

export const updateWorkoutSession = onCall(async (request) => {
  initializeDb();

  const uid = request.auth?.uid;
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

export const finishWorkout = onCall(async (request) => {
  initializeDb();

  const uid = request.auth?.uid;
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

export const getWorkoutHistory = onCall(async (request) => {
  initializeDb();

  const uid = request.auth?.uid;
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

export const getCalendarData = onCall(async (request) => {

  initializeDb();

  const uid = request.auth?.uid;
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

export const getWorkoutAnalytics = onCall(async (request) => {
  initializeDb();

  const uid = request.auth?.uid;
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
