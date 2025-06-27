import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlayIcon, XMarkIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { cloudFunctionsService } from '../services/cloudFunctionsService';
import { useAuth } from '../context/AuthContext';
import Spinner from './ui/Spinner';

interface NextWorkoutData {
  activePlan: any;
  nextWorkout: {
    day: any;
    dayIndex: number;
  } | null;
}

export default function CompactFloatingWorkoutButton() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [workoutData, setWorkoutData] = useState<NextWorkoutData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Hide button during active workout sessions
  const isInActiveWorkout = location.pathname.startsWith('/session/');

  useEffect(() => {
    if (!user || isInActiveWorkout) {
      setWorkoutData(null);
      return;
    }

    fetchNextWorkout();
  }, [user, isInActiveWorkout]);

  const fetchNextWorkout = async () => {
    try {
      const data = await cloudFunctionsService.getUserDashboardData();
      
      if (data.activePlan && data.nextWorkout) {
        setWorkoutData({
          activePlan: data.activePlan,
          nextWorkout: data.nextWorkout
        });
      } else {
        setWorkoutData(null);
      }
    } catch (error) {
      console.error("Error fetching next workout:", error);
      setWorkoutData(null);
    }
  };

  const handleStartWorkout = async () => {
    if (!workoutData?.activePlan || !workoutData?.nextWorkout) return;
    
    setLoading(true);
    try {
      const sessionData = await cloudFunctionsService.startWorkoutSession(
        workoutData.activePlan.id, 
        workoutData.nextWorkout.dayIndex
      );
      
      navigate(`/session/${sessionData.sessionId}`);
    } catch (error: any) {
      console.error("Error starting workout:", error);
      alert(error.message || "Failed to start workout session");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Re-show after 30 seconds
    setTimeout(() => setIsVisible(true), 30000);
  };

  // Don't render if no workout data, in active workout, or dismissed
  if (!workoutData || isInActiveWorkout || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col items-end space-y-2">
        {/* Expanded Card */}
        {isExpanded && (
          <div className="relative bg-white rounded-lg shadow-xl border p-4 min-w-[280px] animate-in slide-in-from-bottom-2 duration-200">
            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 w-6 h-6 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center"
              aria-label="Dismiss"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>

            <div className="pr-8">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Ready to Train?</div>
              <div className="text-lg font-bold text-gray-900 mb-1">{workoutData.nextWorkout?.day.dayName}</div>
              <div className="text-sm text-gray-600 mb-3">
                {workoutData.nextWorkout?.day.exercises?.length} exercises • {workoutData.activePlan.planName}
              </div>
              
              <button
                onClick={handleStartWorkout}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Spinner size="xl" color="primary" className="mx-auto" />
                    Starting...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <PlayIcon className="w-4 h-4 mr-2" />
                    Start Workout
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Compact Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center ${
            isExpanded ? 'rotate-180' : ''
          }`}
          aria-label="Toggle workout options"
        >
          {isExpanded ? (
            <ChevronUpIcon className="w-6 h-6" />
          ) : (
            <PlayIcon className="w-6 h-6" />
          )}
        </button>

        {/* Activity Indicator Dot */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
      </div>
    </div>
  );
}