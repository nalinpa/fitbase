import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { BookOpenIcon, PlusIcon } from '@heroicons/react/24/solid';
import { functions } from '../firebase';
import { useAuth } from '../context/AuthContext';
import WorkoutPlanList from '../components/WorkoutPlanList';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { DocumentData } from 'firebase/firestore';

export default function WorkoutsPage() {
  const { user, refreshToken } = useAuth();
  const [commonWorkouts, setCommonWorkouts] = useState<DocumentData[]>([]);
  const [customWorkouts, setCustomWorkouts] = useState<DocumentData[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      console.log('No user found');
      setLoading(false);
      return;
    }

    console.log('User found, fetching workouts...');
    // Add a small delay to ensure auth is fully initialized
    const timer = setTimeout(() => {
      fetchWorkouts();
    }, 500);

    return () => clearTimeout(timer);
  }, [user]);

  const fetchWorkouts = async () => {
    try {
      console.log("Fetching workouts...");
      setLoading(true);
      setError(null);

      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log("User authenticated:", user.uid);

      // Ensure we have a fresh token
      await refreshToken();
      
      const getLibrary = httpsCallable(functions, 'getWorkoutLibrary');
      console.log("Calling getWorkoutLibrary function...");
      
      const result = await getLibrary();
      console.log("Function call successful, result:", result);
      
      if (!result.data) {
        throw new Error('No data returned from function');
      }
      
      const data = result.data as any;
      console.log("Parsed data:", data);

      setCommonWorkouts(data.commonWorkouts || []);
      setCustomWorkouts(data.customWorkouts || []);
      setActivePlanId(data.activePlanId || null);
      
    } catch (error: any) {
      console.error("Error fetching workouts:", error);
      
      // Log detailed error information
      if (error.code) {
        console.error("Error code:", error.code);
      }
      if (error.details) {
        console.error("Error details:", error.details);
      }
      
      // Set user-friendly error message
      let errorMessage = "Failed to load workout library";
      
      if (error.code === 'unauthenticated') {
        errorMessage = "Please log in to access your workouts";
      } else if (error.code === 'permission-denied') {
        errorMessage = "You don't have permission to access this resource";
        // Try refreshing token and retry once
        try {
          console.log("Attempting token refresh and retry...");
          await refreshToken();
          // Retry the function call once
          const getLibrary = httpsCallable(functions, 'getWorkoutLibrary');
          const result = await getLibrary();
          const data = result.data as any;
          
          setCommonWorkouts(data.commonWorkouts || []);
          setCustomWorkouts(data.customWorkouts || []);
          setActivePlanId(data.activePlanId || null);
          setError(null); // Clear error if retry succeeds
          return;
        } catch (retryError) {
          console.error("Retry failed:", retryError);
          errorMessage = "Authentication failed. Please try logging out and back in.";
        }
      } else if (error.code === 'internal') {
        errorMessage = "Server error. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      // Ensure fresh token before making the call
      await refreshToken();
      
      const selectPlan = httpsCallable(functions, 'selectWorkoutPlan');
      await selectPlan({ planId });
      
      // Update local state
      setActivePlanId(planId);
    } catch (error: any) {
      console.error("Error selecting plan:", error);
      
      let errorMessage = "Failed to select workout plan";
      if (error.code === 'unauthenticated' || error.code === 'permission-denied') {
        errorMessage = "Authentication error. Please try logging out and back in.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Workout Library...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please log in to access your workout library.</p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchWorkouts}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 mr-4"
        >
          Retry
        </button>
        <button 
          onClick={() => {
            // Force token refresh and retry
            refreshToken().then(() => fetchWorkouts());
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Refresh & Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <PageHeader
        title="Workout Library"
        subtitle="Browse common plans or create your own."
      >
        {customWorkouts.length < 5 && (
          <Button to="/workout/new">
            <PlusIcon className="w-5 h-5"/>
            <span>Create Custom Plan</span>
          </Button>
        )}
      </PageHeader>
      
      <section>
        <WorkoutPlanList
          title={`Your Custom Plans (${customWorkouts.length} / 5)`}
          workouts={customWorkouts}
          emptyStateMessage="You haven't created any custom plans yet."
          activePlanId={activePlanId}
          onSelectPlan={handleSelectPlan}
        />
      </section>
      
      <section>
        <WorkoutPlanList
          title="Common Workout Plans"
          workouts={commonWorkouts}
          emptyStateMessage="No common workout plans have been added yet."
          activePlanId={activePlanId}
          onSelectPlan={handleSelectPlan}
        />
      </section>
    </div>
  );
}