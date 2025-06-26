import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BoltIcon, CalendarDaysIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // This hook can be added back if you want to redirect logged-in users away from the homepage.
  // For now, we allow them to see it, and the PublicLayout shows them a "Go to Dashboard" button.
  /*
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);
  */

  const features = [
    {
      name: 'Track Every Session',
      description: 'Log every set, rep, and weight to see your progress in real-time. Never lose track of your hard work.',
      icon: ChartBarIcon,
    },
    {
      name: 'Build & Follow Plans',
      description: 'Create your own custom workout plans or follow common templates to add structure to your training.',
      icon: BoltIcon,
    },
    {
      name: 'Visualize Your History',
      description: 'Look back at your completed workouts on a calendar view to see your consistency and stay motivated.',
      icon: CalendarDaysIcon,
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          <span className="block">Achieve Your Fitness Goals with</span>
          <span className="block text-indigo-600 font-logo">Fitbase</span>
        </h1>
        <p className="max-w-md mx-auto mt-3 text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          The ultimate platform to track your workouts, follow structured plans, and visualize your progress. Stop guessing, start growing.
        </p>
        <div className="flex justify-center max-w-md mx-auto mt-5 md:mt-8">
          <div className="rounded-md shadow">
            <Link
              to="/register"
              className="flex items-center justify-center w-full px-8 py-3 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
            >
              Get Started Free
            </Link>
          </div>
          <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
            <Link
              to="/login"
              className="flex items-center justify-center w-full px-8 py-3 text-base font-medium text-indigo-600 bg-white border border-transparent rounded-md hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 mt-12">
        <div className="max-w-xl px-4 mx-auto sm:px-6 lg:max-w-7xl lg:px-8">
          <h2 className="sr-only">A better way to track fitness.</h2>
          <div className="space-y-10 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="p-6 text-center bg-white rounded-lg shadow-md">
                <div className="flex items-center justify-center w-12 h-12 mx-auto text-white bg-indigo-500 rounded-md">
                  <feature.icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">{feature.name}</h3>
                  <p className="mt-2 text-base text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}