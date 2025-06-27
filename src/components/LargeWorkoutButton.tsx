import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlayCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';
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

export default function FloatingWorkoutButton() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [workoutData, setWorkoutData] = useState<NextWorkoutData | null>(null);
  const [loading, setLoading] = useState(false);
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
    // Re-show after 30 seconds (optional)
    setTimeout(() => setIsVisible(true), 30000);
  };

  // Don't render if no workout data, in active workout, or dismissed
  if (!workoutData || isInActiveWorkout || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Main Floating Button */}
      <div className="relative group">
        {/* Tooltip/Preview Card */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-white rounded-lg shadow-lg border p-3 min-w-[240px]">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Next Workout</div>
            <div className="text-sm font-bold text-gray-900">{workoutData.nextWorkout?.day.dayName}</div>
            <div className="text-xs text-gray-600 mt-1">
              {workoutData.nextWorkout?.day.exercises?.length} exercises • {workoutData.activePlan.planName}
            </div>
            {/* Tooltip Arrow */}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -left-2 w-6 h-6 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 z-10"
          aria-label="Dismiss workout button"
        >
          <XMarkIcon className="w-3 h-3" />
        </button>

        {/* Main Button */}
        <button
          onClick={handleStartWorkout}
          disabled={loading}
          className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          aria-label="Start next workout"
        >
          {loading ? (
            <Spinner size="xl" color="primary" className="mx-auto" />
          ) : (
            <PlayCircleIcon className="w-8 h-8" />
          )}
        </button>

        {/* Pulsing Animation Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 animate-ping opacity-20"></div>
      </div>
    </div>
  );
}