import React from 'react';
import { DocumentData } from 'firebase/firestore';
import { 
  ChartBarIcon, 
  FireIcon, 
  CalendarIcon, 
  TrophyIcon 
} from '@heroicons/react/24/solid';
import Card from './ui/Card';

interface ProgressDashboardProps {
  userData: DocumentData | null;
  recentWorkouts: DocumentData[];
}

export default function ProgressDashboard({ userData, recentWorkouts }: ProgressDashboardProps) {
  // Default stats if userData or stats is null
  const stats = userData?.stats || {
    totalWorkouts: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Never';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  const getStreakStatus = () => {
    if (!stats.lastWorkoutDate) return { message: 'Start your first workout!', isActive: false };
    
    try {
      const lastWorkout = stats.lastWorkoutDate.toDate 
        ? stats.lastWorkoutDate.toDate() 
        : new Date(stats.lastWorkoutDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      lastWorkout.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24));
      console.log(daysDiff);
      
      if (daysDiff === 0) return { message: 'Great job today! 💪', isActive: true };
      if (daysDiff === 1) return { message: 'Keep the streak alive!', isActive: true };
      return { message: `Streak ended ${daysDiff} days ago`, isActive: false };
    } catch (error) {
      console.error('Error calculating streak:', error);
      return { message: 'Unable to calculate streak', isActive: false };
    }
  };

  const streakStatus = getStreakStatus();

  // Render nothing or a fallback if userData is null
  if (!userData) {
    return (
      <div className="text-center text-gray-600">
        No progress data available. Start your fitness journey!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Workouts */}
      <Card className="relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Workouts</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalWorkouts || 0}</p>
          </div>
          <div className="p-3 bg-indigo-100 rounded-full">
            <ChartBarIcon className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />
      </Card>

      {/* Current Streak */}
      <Card className="relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Current Streak</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.currentStreak || 0} days</p>
            <p className={`text-xs mt-1 ${streakStatus.isActive ? 'text-green-600' : 'text-gray-500'}`}>
              {streakStatus.message}
            </p>
          </div>
          <div className={`p-3 rounded-full ${streakStatus.isActive ? 'bg-orange-100' : 'bg-gray-100'}`}>
            <FireIcon className={`w-6 h-6 ${streakStatus.isActive ? 'text-orange-600' : 'text-gray-400'}`} />
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${
          streakStatus.isActive ? 'from-orange-500 to-red-500' : 'from-gray-300 to-gray-400'
        }`} style={{ width: `${Math.min(((stats.currentStreak || 0) / 30) * 100, 100)}%` }} />
      </Card>

      {/* Longest Streak */}
      <Card className="relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Best Streak</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.longestStreak || 0} days</p>
            <p className="text-xs text-gray-500 mt-1">Personal record</p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-full">
            <TrophyIcon className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600" />
      </Card>

      {/* Last Workout */}
      <Card className="relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Last Workout</p>
            <p className="mt-2 text-lg font-bold text-gray-900">
              {formatDate(stats.lastWorkoutDate)}
            </p>
            {recentWorkouts.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {recentWorkouts[0]?.dayName || 'Unknown'}
              </p>
            )}
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <CalendarIcon className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600" />
      </Card>
    </div>
  );
}