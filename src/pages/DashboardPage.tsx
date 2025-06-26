import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  doc, onSnapshot, DocumentData, addDoc, collection, serverTimestamp, 
  query, where, orderBy, limit, getDocs
} from 'firebase/firestore';
import { PlayCircleIcon, BookOpenIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import NextWorkoutCard from '../components/NextWorkoutCard';
import PlanOverviewCard from '../components/PlanOverviewCard';
import NoActivePlanPrompt from '../components/NoActivePlanPrompt';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [activePlan, setActivePlan] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    
    const userDocRef = doc(db, 'users', user.uid);
    const userUnsubscribe = onSnapshot(userDocRef, (userDoc) => {
      if (userDoc.exists()) {
        const uData = userDoc.data();
        setUserData(uData);
        const planId = uData.activeWorkoutPlanId;

        if (planId) {
          const planDocRef = doc(db, 'workouts', planId);
          const planUnsubscribe = onSnapshot(planDocRef, (planDoc) => {
            if (planDoc.exists()) {
              setActivePlan({ id: planDoc.id, ...planDoc.data() });
            } else {
              setActivePlan(null);
            }
            setLoading(false);
          });
          return planUnsubscribe;
        } else {
          setActivePlan(null);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => userUnsubscribe();
  }, [user]);
  
  const getNextWorkout = () => {
    if (!activePlan || !userData) return null;
    const lastCompletedIndex = userData.lastCompletedDayIndex;
    const totalDays = activePlan.days.length;
    let nextDayIndex = (lastCompletedIndex === undefined || lastCompletedIndex === null || lastCompletedIndex >= totalDays - 1)
      ? 0
      : lastCompletedIndex + 1;
    return { day: activePlan.days[nextDayIndex], index: nextDayIndex };
  };

  const nextWorkout = getNextWorkout();

  const handleStartWorkout = async (dayIndex: number) => {
    if (!user || !activePlan) return;

    try {
      // 1. Query for the most recent completed session of this specific workout day
      const previousSessionQuery = query(
        collection(db, 'userWorkouts'),
        where('userId', '==', user.uid),
        where('planId', '==', activePlan.id),
        where('dayIndex', '==', dayIndex),
        where('status', '==', 'completed'),
        orderBy('dateCompleted', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(previousSessionQuery);
      const lastSessionData = querySnapshot.empty ? null : querySnapshot.docs[0].data();

      // 2. Build the exercises array for the new session
      const newExercises = activePlan.days[dayIndex].exercises.map((planExercise: any) => {
        // Find the matching exercise from the last session, if it exists
        const lastExercisePerformance = lastSessionData?.exercises.find(
          (lastEx: any) => lastEx.exerciseName === planExercise.exerciseName
        );
        
        // Create the empty performance slots for the new session
        const newPerformance = Array(planExercise.sets).fill(null).map((_, setIndex) => {
          const lastWeight = lastExercisePerformance?.performance[setIndex]?.weight || '0';
          return { weight: lastWeight, reps: '', completed: false };
        });

        return {
          ...planExercise,
          performance: newPerformance,
        };
      });

      // 3. Create the new session document with pre-populated weights
      const newSessionData = {
        userId: user.uid,
        planId: activePlan.id,
        planName: activePlan.planName,
        dayIndex: dayIndex,
        dayName: activePlan.days[dayIndex].dayName,
        dateStarted: serverTimestamp(),
        status: 'in_progress',
        exercises: newExercises, // Use the newly constructed exercises array
      };
      
      const docRef = await addDoc(collection(db, 'userWorkouts'), newSessionData);
      
      // 4. Navigate to the live session page
      navigate(`/session/${docRef.id}`);

    } catch (error) {
      console.error("Error starting workout session:", error);
    }
  };
  
  if (loading) {
    return <div>Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Welcome back, {user?.displayName || user?.email?.split('@')[0]}!
        </h1>
        <p className="mt-1 text-lg text-gray-600">Ready to train? Let's get started.</p>
      </div>

      {activePlan && nextWorkout ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <PlanOverviewCard activePlan={activePlan} />
          
          <NextWorkoutCard nextWorkout={nextWorkout} onStartWorkout={handleStartWorkout} />
        </div>
      ) : (
        <NoActivePlanPrompt />
      )}
    </div>
  );
}