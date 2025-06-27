import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import PublicLayout from './layout/public.layout';
import UserRoute from './lib/UserRoute';
import Auth from './components/Auth';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import CreateWorkoutPage from './pages/CreateWorkoutPage';
import PlanDetailPage from './pages/PlanDetailPage';
import ActiveWorkoutPage from './pages/ActiveWorkoutPage';
import FullScreenLayout from './layout/fullscreen.layout';
import Layout from './layout/main.layout';
import WorkoutsPage from './pages/ViewWorkoutsPage';
import CompletedWorkoutsListPage from './pages/CompletedWorkoutsListPage';
import CompletedWorkoutDetailPage from './pages/CompletedWorkoutsDetailPage';
import CalendarViewPage from './pages/CalendarViewPage';
import ProgressDashboardPage from './pages/ProgressDashboardPage';

const router = createBrowserRouter([
  // --- Public Routes ---
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <Auth /> },
      { path: '/register', element: <Auth /> },
    ],
  },
  // --- Protected Routes ---
  {
    element: <UserRoute />, // All routes inside here require a user to be logged in
    children: [
      // Group 1: Routes using the standard layout with a topbar
      {
        element: <Layout />,
        children: [
          { path: '/dashboard', element: <ProgressDashboardPage /> },
          { path: '/workout/all', element: <WorkoutsPage /> },
          { path: '/workout/new', element: <CreateWorkoutPage /> },
          { path: '/workout/:planId', element: <PlanDetailPage /> },
          { path: '/workout/history', element: <CompletedWorkoutsListPage /> },
          { path: '/workout/history/:sessionId', element: <CompletedWorkoutDetailPage /> },
          { path: '/workout/calendar', element: <CalendarViewPage /> },       
        ]
      },
      // Group 2: Routes using the new full-screen layout
      {
        element: <FullScreenLayout />,
        children: [
          { path: '/session/:sessionId', element: <ActiveWorkoutPage /> }
        ]
      }
    ]
  },
]);

  
  function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Loading Application...</p>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

export default App;