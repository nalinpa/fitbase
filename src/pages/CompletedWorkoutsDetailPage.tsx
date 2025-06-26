import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/solid';

// This helper can be moved to a shared utils file
const formatRestTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
};

export default function CompletedWorkoutDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Data fetching logic is unchanged ---
  useEffect(() => {
    if (!sessionId || !user) return;
    const sessionDocRef = doc(db, 'userWorkouts', sessionId);
    const unsubscribe = onSnapshot(sessionDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().userId === user.uid) {
        setSession({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.error("Session not found or permission denied.");
        navigate('/history');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [sessionId, user, navigate]);

  if (loading) return <div className="p-8 text-center">Loading workout details...</div>;
  if (!session) return null;

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Previous Page
      </button>
      
      {/* Main content card */}
      <div className="p-6 bg-white rounded-lg shadow-md sm:p-8">
        {/* Header Section */}
        <div className="pb-4 border-b">
          <p className="text-sm font-medium text-indigo-600">
            {session.dateCompleted ? `Completed on ${new Date(session.dateCompleted.seconds * 1000).toLocaleDateString()}` : 'Completed'}
          </p>
          <h1 className="text-3xl font-extrabold text-gray-900">{session.planName}</h1>
          <h2 className="text-xl font-bold text-gray-600">{session.dayName}</h2>
        </div>

        {/* Exercises Section */}
        <div className="mt-6 space-y-6">
          {session.exercises.map((ex: any, exIndex: number) => (
            <div key={exIndex} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                      <ClipboardDocumentListIcon className="w-6 h-6 text-gray-600"/>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{ex.exerciseName}</h3>
              </div>
              
              {/* Performance Log Table */}
              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-500 uppercase">
                  <div className="text-center">Set</div>
                  <div className="text-center">Target</div>
                  <div className="text-center">Weight Logged</div>
                  <div className="text-center">Reps Logged</div>
                </div>

                {ex.performance.map((perf: any, setIndex: number) => (
                  <div key={setIndex} className="grid items-center grid-cols-4 gap-2 p-2 text-sm text-center bg-gray-50 rounded-md">
                    <div className="font-bold text-gray-800">{setIndex + 1}</div>
                    <div className="text-gray-600">{ex.reps}</div>
                    <div className="font-semibold text-gray-800">{perf.weight || '--'}</div>
                    <div className="font-semibold text-gray-800">{perf.reps || '--'}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}