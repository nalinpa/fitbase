
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDaysIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

import { cloudFunctionsService } from '../services/cloudFunctionsService';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import { DocumentData } from 'firebase/firestore';
import Spinner from '../components/ui/Spinner';

export default function CompletedWorkoutsListPage() {
  const { user } = useAuth();
  const [completedSessions, setCompletedSessions] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchHistory();
  }, [user]);

  const fetchHistory = async (startAfter?: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await cloudFunctionsService.getWorkoutHistory(20, startAfter);
      
      if (startAfter) {
        // Append to existing sessions
        setCompletedSessions(prev => [...prev, ...data.sessions]);
      } else {
        // Replace sessions
        setCompletedSessions(data.sessions);
      }
      
      setHasMore(data.hasMore);
      if (data.sessions.length > 0) {
        setLastSessionId(data.sessions[data.sessions.length - 1].id);
      }
    } catch (error: any) {
      console.error("Error fetching history:", error);
      setError(error.message || "Failed to load workout history");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (lastSessionId && hasMore) {
      fetchHistory(lastSessionId);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Date not available';
    const date = new Date(timestamp._seconds * 1000);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading && completedSessions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="xl" color="primary" className="mx-auto" />
          <p className="mt-4 text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workout History"
        subtitle="Review your previously completed workout sessions."
      />

      <div className="p-6 bg-white rounded-lg shadow-md">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
            <button 
              onClick={() => fetchHistory()}
              className="ml-4 text-sm underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="space-y-4">
          {completedSessions.length > 0 ? (
            <>
              {completedSessions.map(session => (
                <Link
                  key={session.id}
                  to={`/workout/history/${session.id}`}
                  className="flex items-center justify-between p-4 transition-all border rounded-lg hover:bg-gray-50 hover:border-indigo-500 hover:shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <CalendarDaysIcon className="w-6 h-6 text-gray-600"/>
                    </div>
                    <div>
                      <p className="font-bold text-indigo-700">{session.planName}</p>
                      <p className="text-sm font-semibold text-gray-700">{session.dayName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">
                      {formatDate(session.dateCompleted)}
                    </p>
                    <p className="inline-flex items-center gap-1 text-xs text-gray-500">
                      View Details <ChevronRightIcon className="w-3 h-3"/>
                    </p>
                  </div>
                </Link>
              ))}
              
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center border-2 border-dashed rounded-lg">
              <p className="text-gray-600">You have no completed workouts yet.</p>
              <p className="mt-1 text-xs text-gray-400">Your completed sessions will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}