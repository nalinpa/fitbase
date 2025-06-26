import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CheckCircleIcon as CheckCircleSolid, XMarkIcon } from '@heroicons/react/24/solid';
import RestTimerModal from '../components/RestTimerModal';
import ActiveExercise from '../components/ActiveExercise';

export default function ActiveWorkoutPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRestTime, setCurrentRestTime] = useState(0);
  
  useEffect(() => {
    if (!sessionId || !user) {
      navigate('/dashboard');
      return;
    }
    
    setLoading(true);
    const sessionDocRef = doc(db, 'userWorkouts', sessionId);
    
    // We still use realtime listener for the active session
    // This is the one place where realtime updates are crucial
    const unsubscribe = onSnapshot(sessionDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().userId === user.uid) {
        const data = docSnap.data();
        // Ensure all performance data has completed field
        data.exercises.forEach((ex: any) => {
          if (ex.performance) {
            ex.performance.forEach((p: any) => {
              if (p.completed === undefined) {
                p.completed = false;
              }
            });
          }
        });
        setSession({ id: docSnap.id, ...data });
      } else {
        console.error("Session not found or permission denied.");
        navigate('/dashboard');
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [sessionId, user, navigate]);

  useEffect(() => {
    if (currentRestTime > 0) {
      setIsModalOpen(true);
    }
  }, [currentRestTime]);
  
  const handleSetUpdate = async (exIndex: number, setIndex: number, field: 'weight' | 'reps' | 'completed', value: string | boolean) => {
    if (!session) return;
    
    // Update local state immediately for responsive UI
    const newExercises = JSON.parse(JSON.stringify(session.exercises));
    newExercises[exIndex].performance[setIndex][field] = value;
    setSession({ ...session, exercises: newExercises });
    
    // Show rest timer if set completed
    if (field === 'completed' && value === true) {
      const rest = session.exercises[exIndex].restTime || 0;
      if (rest > 0) {
        setCurrentRestTime(rest);
        setIsModalOpen(true);
      }
    }

    // Debounced save to cloud function
    if (handleSetUpdate.timeout) {
      clearTimeout(handleSetUpdate.timeout);
    }
    
    handleSetUpdate.timeout = setTimeout(async () => {
      try {
        const updateSession = httpsCallable(functions, 'updateWorkoutSession');
        await updateSession({
          sessionId: session.id,
          exercises: newExercises
        });
      } catch (error) {
        console.error("Error saving progress:", error);
      }
    }, 1000); // Save after 1 second of inactivity
  };
  
  // Add timeout property to function
  handleSetUpdate.timeout = null as any;

  const handleFinishWorkout = async () => {
    if (!sessionId || !session) return;

    try {
      setSaving(true);
      
      const finishWorkout = httpsCallable(functions, 'finishWorkout');
      await finishWorkout({
        sessionId: sessionId,
        exercises: session.exercises
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Error finishing workout:", error);
      alert(error.message || "Failed to finish workout");
      setSaving(false);
    }
  };

  const handleCancelWorkout = () => {
    if (window.confirm("Are you sure you want to cancel this workout? Your progress will be saved but the workout won't be marked as complete.")) {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workout session...</p>
        </div>
      </div>
    );
  }
  
  if (!session) return null;

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
          {session.exercises.map((ex: any, exIndex: number) => (
            <ActiveExercise
              key={exIndex}
              exercise={ex}
              exerciseIndex={exIndex}
              onSetUpdate={handleSetUpdate}
            />
          ))}
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
        isOpen={isModalOpen}
        restTime={currentRestTime}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}