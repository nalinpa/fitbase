import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';
import FloatingWorkoutButton from '../components/WorkoutButton';

import {
  ChartBarIcon,
  HomeIcon,
  FolderIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function Layout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    signOut(getAuth());
  };
  
  const navLinkClasses = ({ isActive }: { isActive: boolean }): string => {
    const baseClasses = "flex items-center px-4 py-2 text-gray-700 rounded-lg group";
    const activeClasses = "bg-indigo-100 text-indigo-600";
    const inactiveClasses = "hover:bg-gray-100 hover:text-gray-900";
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  const navItems = [
    { label: 'Dashboard', icon: HomeIcon, to: '/dashboard' },
    { label: 'Workout Library', icon: FolderIcon, to: '/workout/all' },
    { label: 'History', icon: ChartBarIcon, to: '/workout/history' },
    { label: 'Calendar', icon: CalendarIcon, to: '/workout/calendar' },    
    { label: 'Create Workout', icon: SparklesIcon, to: '/workout/new' }, 
    { label: 'Settings', icon: Cog6ToothIcon, to: '/settings' },
  ];

  const sidebarContent = (
    <>
      {/* Logo Area */}
       <div className="flex items-center h-16 px-4 border-b">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-indigo-600 font-logo">
            Fitbase
          </span>
        </Link>
      </div>
      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <NavLink key={item.label} to={item.to} className={navLinkClasses} end>
            <item.icon className="w-6 h-6 mr-3" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      {/* User Info / Logout */}
      <div className="px-4 py-4 border-t">
        <p className="text-sm text-gray-500 truncate" title={user?.email || ''}>{user?.email}</p>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 mt-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100"
        >
          <ArrowRightOnRectangleIcon className="w-6 h-6 mr-3" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="relative min-h-screen md:flex bg-gray-100">
      <div
        className={`fixed inset-0 bg-gray-900 bg-opacity-30 z-30 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
      
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between h-16 bg-white shadow-sm md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-4 text-gray-500 hover:text-gray-700"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="px-4 font-bold">Fitbase</div>
        </header>
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
        <FloatingWorkoutButton />
      </div>
    </div>
  );
}