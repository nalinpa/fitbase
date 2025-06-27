import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { cloudFunctionsService } from '../services/cloudFunctionsService';
import { useAuth } from '../context/AuthContext';
import NextWorkoutCard from '../components/NextWorkoutCard';
import PlanOverviewCard from '../components/PlanOverviewCard';
import NoActivePlanPrompt from '../components/NoActivePlanPrompt';
import { DocumentData } from 'firebase/firestore';
import Spinner from '../components/ui/Spinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
    getNextWorkout();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cloudFunctionsService.getUserDashboardData();
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
  
  const getNextWorkout = () => {
    if (!activePlan || !userData) return null;
    const lastCompletedIndex = userData.lastCompletedDayIndex;
    const totalDays = activePlan.days.length;
    let nextDayIndex = (lastCompletedIndex === undefined || lastCompletedIndex === null || lastCompletedIndex >= totalDays - 1)
      ? 0
      : lastCompletedIndex + 1;
    setNextWorkout({ day: activePlan.days[nextDayIndex], index: nextDayIndex });
  }

  const handleStartWorkout = async (dayIndex: number) => {
    if (!activePlan) return;
    try {
      const data = await cloudFunctionsService.startWorkoutSession(activePlan.id, dayIndex);
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
        <button onClick={fetchDashboardData} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          Retry
        </button>
      </div>
    );
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