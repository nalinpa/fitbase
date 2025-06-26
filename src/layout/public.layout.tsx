import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';
import { SparklesIcon } from '@heroicons/react/24/solid';

export default function PublicLayout() {
  const { user } = useAuth();

  const handleLogout = () => {
    signOut(getAuth());
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Public Topbar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-indigo-600 font-logo">
                Fitbase
              </span>
            </Link>

            {/* Auth Links based on user login state */}
            <div className="flex items-center space-x-2">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area where pages will be rendered */}
       <main className="flex flex-col items-center justify-center flex-grow p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}