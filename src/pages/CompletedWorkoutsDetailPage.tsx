import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DocumentData } from 'firebase/firestore';
import { cloudFunctionsService } from '../services/cloudFunctionsService';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/solid';

export default function CompletedWorkoutDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !user) return;
    fetchSession();
  }, [sessionId, user]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cloudFunctionsService.getWorkoutSession(sessionId!);
      if(data) setSession(data);
    } catch (error: any) {
      console.error("Error fetching session:", error);
      setError(error.message || "Failed to load workout details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workout details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button onClick={() => navigate('/workout/history')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          Back to History
        </button>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Previous Page
      </button>
      
      <div className="p-6 bg-white rounded-lg shadow-md sm:p-8">
        <div className="pb-4 border-b">
          <p className="text-sm font-medium text-indigo-600">
            {session.dateCompleted ? `Completed on ${new Date(session.dateCompleted._seconds * 1000).toLocaleDateString()}` : 'Completed'}
          </p>
          <h1 className="text-3xl font-extrabold text-gray-900">{session.planName}</h1>
          <h2 className="text-xl font-bold text-gray-600">{session.dayName}</h2>
        </div>

        <div className="mt-6 space-y-6">
          {session.exercises.map((ex: any, exIndex: number) => (
            <div key={exIndex} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                      <ClipboardDocumentListIcon className="w-6 h-6 text-gray-600"/>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{ex.exerciseName}</h3>
              </div>
              
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