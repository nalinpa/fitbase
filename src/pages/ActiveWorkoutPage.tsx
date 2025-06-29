import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { cloudFunctionsService } from '../services/cloudFunctionsService';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../hooks/useConfirm';
import { CheckCircleIcon as CheckCircleSolid, XMarkIcon, PlusIcon } from '@heroicons/react/24/solid';
import RestTimerModal from '../components/RestTimerModal';
import ActiveExercise from '../components/ActiveExercise';
import AddExerciseModal from '../components/AddExerciseModal';
import Spinner from '../components/ui/Spinner';

interface PerformanceSet {
  weight: string;
  reps: string;
  completed: boolean;
}

interface Exercise {
  exerciseName: string;
  sets: number;
  reps: string;
  weight: string;
  restTime: number;
  performance: PerformanceSet[];
}

interface WorkoutSession {
  id: string;
  planName: string;
  dayName: string;
  exercises: Exercise[];
  userId: string;
  status: string;
  dateStarted: any;
  planId: string;
  dayIndex: number;
}

export default function ActiveWorkoutPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirm } = useConfirm();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [currentRestTime, setCurrentRestTime] = useState(0);
  
  // Use useRef for timeout management
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!sessionId || !user) {
      navigate('/dashboard');
      return;
    }
    fetchSession();
  }, [sessionId, user, navigate]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const data = await cloudFunctionsService.getWorkoutSession(sessionId!);
      
      // Type the response data safely
      const sessionData = data as any;
      
      // Validate the structure of the returned data
      if (!sessionData || typeof sessionData !== 'object') {
        throw new Error('Invalid session data received');
      }

      // Ensure exercises array exists
      if (!sessionData.exercises || !Array.isArray(sessionData.exercises)) {
        throw new Error('Session exercises data is invalid');
      }

      // Process exercises to ensure proper structure
      const processedExercises: Exercise[] = sessionData.exercises.map((ex: any) => {
        // Ensure performance array exists
        if (!ex.performance || !Array.isArray(ex.performance)) {
          ex.performance = Array(ex.sets || 3).fill(null).map(() => ({
            weight: ex.weight || '0',
            reps: '',
            completed: false
          }));
        } else {
          // Ensure all performance entries have completed field
          ex.performance.forEach((p: any) => {
            if (p.completed === undefined) {
              p.completed = false;
            }
          });
        }
        return ex as Exercise;
      });

      const validatedSession: WorkoutSession = {
        id: sessionData.id || sessionId!,
        planName: sessionData.planName || 'Unknown Plan',
        dayName: sessionData.dayName || 'Unknown Day',
        exercises: processedExercises,
        userId: sessionData.userId || user!.uid,
        status: sessionData.status || 'in_progress',
        dateStarted: sessionData.dateStarted,
        planId: sessionData.planId || '',
        dayIndex: sessionData.dayIndex || 0
      };

      setSession(validatedSession);
    } catch (error: any) {
      console.error("Error fetching session:", error);
      toast.error(error.message || "Failed to load workout session");
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentRestTime > 0) {
      setIsRestModalOpen(true);
    }
  }, [currentRestTime]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  const handleSetUpdate = async (exIndex: number, setIndex: number, field: 'weight' | 'reps' | 'completed', value: string | boolean) => {
    if (!session || !session.exercises || exIndex >= session.exercises.length) return;
    
    const exercise = session.exercises[exIndex];
    if (!exercise || !exercise.performance || setIndex >= exercise.performance.length) return;
    
    // Create a deep copy of exercises
    const newExercises: Exercise[] = session.exercises.map((ex, idx) => {
      if (idx === exIndex) {
        const newPerformance = [...ex.performance];
        newPerformance[setIndex] = {
          ...newPerformance[setIndex],
          [field]: value
        };
        return {
          ...ex,
          performance: newPerformance
        };
      }
      return ex;
    });

    setSession({ ...session, exercises: newExercises });
    
    if (field === 'completed' && value === true) {
      const rest = exercise.restTime || 0;
      if (rest > 0) {
        setCurrentRestTime(rest);
        setIsRestModalOpen(true);
      }
    }

    // Clear existing timeout and set new one
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await cloudFunctionsService.updateWorkoutSession(session.id, newExercises);
      } catch (error) {
        console.error("Error saving progress:", error);
      }
    }, 1000);
  };

  const handleAddExercise = (newExercise: Omit<Exercise, 'performance'>) => {
    if (!session) return;
    
    // Create performance array for the new exercise
    const performance: PerformanceSet[] = Array(newExercise.sets).fill(null).map(() => ({
      weight: newExercise.weight || '0',
      reps: '',
      completed: false
    }));

    const exerciseWithPerformance: Exercise = {
      ...newExercise,
      performance
    };

    const newExercises = [...session.exercises, exerciseWithPerformance];
    setSession({ ...session, exercises: newExercises });
    
    // Save immediately
    saveExercisesUpdate(newExercises);
  };

  const handleRemoveExercise = async(exerciseIndex: number) => {
    if (!session || !session.exercises || exerciseIndex >= session.exercises.length) return;
    const confirmed = await confirm({
      title: 'Remove Exercise?',
      message: 'Are you sure you want to remove this exercise from your workout?',
      confirmText: 'Yes',
      cancelText: 'Cancel',
      confirmColor: 'red'
    });
    
    if (confirmed) {
      const newExercises = session.exercises.filter((_, index) => index !== exerciseIndex);
      setSession({ ...session, exercises: newExercises });
      
      // Save immediately
      saveExercisesUpdate(newExercises);
    }
  };

  const handleDuplicateExercise = (exerciseIndex: number) => {
    if (!session || !session.exercises || exerciseIndex >= session.exercises.length) return;
    
    const exerciseToDuplicate = session.exercises[exerciseIndex];
    const duplicatedExercise: Exercise = {
      ...exerciseToDuplicate,
      exerciseName: `${exerciseToDuplicate.exerciseName} (Copy)`,
      performance: Array(exerciseToDuplicate.sets).fill(null).map(() => ({
        weight: exerciseToDuplicate.performance[0]?.weight || '0',
        reps: '',
        completed: false
      }))
    };

    const newExercises = [
      ...session.exercises.slice(0, exerciseIndex + 1),
      duplicatedExercise,
      ...session.exercises.slice(exerciseIndex + 1)
    ];
    
    setSession({ ...session, exercises: newExercises });
    saveExercisesUpdate(newExercises);
  };

  const handleAddSet = (exerciseIndex: number) => {
    if (!session || !session.exercises || exerciseIndex >= session.exercises.length) return;
    
    const exercise = session.exercises[exerciseIndex];
    if (exercise.performance.length >= 10) return; // Limit to 10 sets
    
    // Create new set with weight from last set
    const lastSet = exercise.performance[exercise.performance.length - 1];
    const newSet: PerformanceSet = {
      weight: lastSet?.weight || exercise.weight || '0',
      reps: '',
      completed: false
    };

    const newExercises = session.exercises.map((ex, idx) => {
      if (idx === exerciseIndex) {
        return {
          ...ex,
          sets: ex.sets + 1, // Update the sets count
          performance: [...ex.performance, newSet]
        };
      }
      return ex;
    });

    setSession({ ...session, exercises: newExercises });
    saveExercisesUpdate(newExercises);
  };

  const handleRemoveSet = async(exerciseIndex: number, setIndex: number) => {
    if (!session || !session.exercises || exerciseIndex >= session.exercises.length) return;
    
    const exercise = session.exercises[exerciseIndex];
    if (exercise.performance.length <= 1 || setIndex === 0) return; 
  
    const confirmed = await confirm({
      title: 'Remove Set?',
      message: 'Are you sure you want to remove this set?',
      confirmText: 'Yes',
      cancelText: 'Cancel',
      confirmColor: 'red'
    });
    
    if (confirmed) {
      const newExercises = session.exercises.map((ex, idx) => {
        if (idx === exerciseIndex) {
          return {
            ...ex,
            sets: ex.sets - 1, // Update the sets count
            performance: ex.performance.filter((_, sIdx) => sIdx !== setIndex)
          };
        }
        return ex;
      });

      setSession({ ...session, exercises: newExercises });
      saveExercisesUpdate(newExercises);
    }
  };

  const saveExercisesUpdate = async (exercises: Exercise[]) => {
    if (!session) return;
    
    try {
      await cloudFunctionsService.updateWorkoutSession(session.id, exercises);
    } catch (error) {
      console.error("Error saving exercise changes:", error);
      toast.error("Failed to save changes. Please try again.");
    }
  };

  const handleFinishWorkout = async () => {
    if (!sessionId || !session) return;
    try {
      setSaving(true);
      await cloudFunctionsService.finishWorkout(sessionId, session.exercises);
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Error finishing workout:", error);
      toast.error(error.message || "Failed to finish workout");
      setSaving(false);
    }
  };

  const handleCancelWorkout = async () => {
    if (!sessionId) return;

    const confirmed = await confirm({
      title: 'Cancel Workout?',
      message: 'Are you sure you want to cancel this workout? Your progress will be saved but the workout won\'t be marked as complete.',
      confirmText: 'Yes, Cancel',
      cancelText: 'Keep Going',
      confirmColor: 'red'
    });

    if (confirmed) {
      try {
        await cloudFunctionsService.cancelWorkoutSession(sessionId);
        navigate('/dashboard');
      } catch (error: any) {
        console.error("Error cancelling workout:", error);
        navigate('/dashboard');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="xl" color="primary" className="mx-auto" />
          <p className="mt-4 text-gray-600">Loading workout session...</p>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Failed to load workout session.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="p-6 bg-white rounded-lg shadow-2xl sm:p-8">
        <div className="pb-4 mb-6 border-b">
          <p className="text-sm font-semibold text-green-600 uppercase animate-pulse">
            Live Workout In Progress
          </p>
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {session.planName}
          </h1>
          <h2 className="text-xl font-bold text-gray-700">{session.dayName}</h2>
        </div>
        
        <div className="space-y-8">
          {session.exercises && session.exercises.length > 0 ? (
            session.exercises.map((ex: Exercise, exIndex: number) => (
              <ActiveExercise
                key={`${exIndex}-${ex.exerciseName}`}
                exercise={ex}
                exerciseIndex={exIndex}
                onSetUpdate={handleSetUpdate}
                onRemoveExercise={handleRemoveExercise}
                onAddSet={handleAddSet}
                onRemoveSet={handleRemoveSet}
                showRemoveButton={session.exercises.length > 1}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-600">
              No exercises in this workout. Add some exercises to get started!
            </div>
          )}
          
          {/* Add Exercise Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setIsAddExerciseModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 text-indigo-600 border-2 border-dashed border-indigo-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200"
            >
              <PlusIcon className="w-5 h-5" />
              Add Exercise to Workout
            </button>
          </div>
        </div>
        
        <div className="flex flex-col gap-4 pt-6 mt-8 border-t sm:flex-row-reverse">
          <button
            onClick={handleFinishWorkout}
            disabled={saving}
            className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 font-semibold text-white bg-green-500 rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircleSolid className="w-6 h-6"/>
            {saving ? 'Saving...' : 'Finish & Save Workout'}
          </button>
          <button
            onClick={handleCancelWorkout}
            disabled={saving}
            className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 font-semibold text-gray-700 bg-gray-100 rounded-md shadow-sm hover:bg-gray-200 disabled:opacity-50"
          >
            <XMarkIcon className="w-6 h-6"/>
            Cancel Workout
          </button>
        </div>
      </div>
      
      <RestTimerModal
        isOpen={isRestModalOpen}
        restTime={currentRestTime}
        onClose={() => setIsRestModalOpen(false)}
      />

      <AddExerciseModal
        isOpen={isAddExerciseModalOpen}
        onClose={() => setIsAddExerciseModalOpen(false)}
        onAddExercise={handleAddExercise}
      />
    </div>
  );
}