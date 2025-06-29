import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { 
  PlayCircleIcon, 
  BookOpenIcon, 
  CalendarIcon,
  PlusCircleIcon
} from '@heroicons/react/24/solid';

import { functions } from '../firebase';
import { useAuth } from '../context/AuthContext';
import NextWorkoutCard from '../components/NextWorkoutCard';
import PlanOverviewCard from '../components/PlanOverviewCard';
import NoActivePlanPrompt from '../components/NoActivePlanPrompt';
import ProgressDashboard from '../components/ProgressDashboard';
import Card from '../components/ui/Card';
import { Link } from 'react-router-dom';
import { DocumentData } from 'firebase/firestore';
import Spinner from '../components/ui/Spinner';
import { cloudFunctionsService } from '../services/cloudFunctionsService';
import { useUserPreferences } from '../hooks/useUserPreferences';

export default function DashboardPage() {
  const { getUserName } = useUserPreferences();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const displayName = getUserName();
  
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [activePlan, setActivePlan] = useState<DocumentData | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<DocumentData[]>([]);
  const [nextWorkout, setNextWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log("User found, fetching dashboard data...", user);
    cloudFunctionsService.testFunctionCall();
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const getDashboardData = httpsCallable(functions, 'getUserDashboardData');
      const result = await getDashboardData();
      const data = result.data as any;
      console.log("!!!", data.nextWorkout);
      
      setUserData(data.userData);
      setActivePlan(data.activePlan);
      setRecentWorkouts(data.recentWorkouts);
      setNextWorkout(data.nextWorkout);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = async (dayIndex: number) => {
    if (!activePlan) return;

    try {
      const startSession = httpsCallable(functions, 'startWorkoutSession');
      console.log(dayIndex);
      const result = await startSession({ 
        planId: activePlan.id, 
        dayIndex 
      });
      
      const data = result.data as any;
      navigate(`/session/${data.sessionId}`);
    } catch (error: any) {
      console.error("Error starting workout:", error);
      alert(error.message || "Failed to start workout session");
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="xl" color="primary" className="mx-auto" />
          <p className="mt-4 text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Welcome back, {displayName}!
        </h1>
        <p className="mt-1 text-lg text-gray-600">
          {userData && userData?.stats?.currentStreak > 0 
            ? `You're on a ${userData.stats.currentStreak} day streak! Keep it up! 🔥`
            : "Ready to train? Let's get started."}
        </p>
      </div>

      {/* Progress Statistics */}
      <ProgressDashboard userData={userData} recentWorkouts={recentWorkouts} />

      {/* Active Plan Section */}
      {activePlan && nextWorkout ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <PlanOverviewCard activePlan={activePlan} />
          <NextWorkoutCard 
            nextWorkout={nextWorkout} 
            onStartWorkout={handleStartWorkout} 
          />
        </div>
      ) : (
        <NoActivePlanPrompt />
      )}

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link 
              to="/workout/history" 
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All History →
            </Link>
          </div>
          <div className="space-y-3">
            {recentWorkouts.slice(0, 3).map((workout) => (
              <Link
                key={workout.id}
                to={`/workout/history/${workout.id}`}
                className="block p-3 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-gray-50 transition-all"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{workout.planName}</p>
                    <p className="text-sm text-gray-600">{workout.dayName}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(workout.dateCompleted._seconds * 1000).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card 
          as={Link}
          to="/workout/all"
          className="flex items-center justify-between hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div>
            <h3 className="font-semibold text-gray-900">Browse Workouts</h3>
            <p className="text-sm text-gray-600">Explore and select plans</p>
          </div>
          <BookOpenIcon className="w-8 h-8 text-indigo-600" />
        </Card>

        <Card 
          as={Link}
          to="/workout/calendar"
          className="flex items-center justify-between hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div>
            <h3 className="font-semibold text-gray-900">Calendar View</h3>
            <p className="text-sm text-gray-600">See your workout history</p>
          </div>
          <CalendarIcon className="w-8 h-8 text-green-600" />
        </Card>

        <Card 
          as={Link}
          to="/workout/new"
          className="flex items-center justify-between hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div>
            <h3 className="font-semibold text-gray-900">Create Plan</h3>
            <p className="text-sm text-gray-600">Build custom workouts</p>
          </div>
          <PlusCircleIcon className="w-8 h-8 text-purple-600" />
        </Card>
      </div>
    </div>
  );
}