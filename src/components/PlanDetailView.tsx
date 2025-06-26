import React from 'react';
import { DocumentData } from 'firebase/firestore';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import ReadOnlyExercise from './ReadOnlyExercise';

// We define the types and helpers this component needs.
// In a larger app, these could be moved to a shared types/utils file.
interface Exercise {
  exerciseName: string;
  sets: number;
  reps: string;
  weight: string;
  restTime: number;
}
interface WorkoutDay {
  dayName: string;
  notes: string;
  exercises: Exercise[];
}
interface WorkoutPlan extends DocumentData {
  planName: string;
  description: string;
  days: WorkoutDay[];
  type: 'custom' | 'common';
}
const formatRestTime = (seconds: number): string => {
  if (!seconds) return 'N/A';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
};


// Define the props this component expects
interface PlanDetailViewProps {
  plan: WorkoutPlan;
  canEdit: boolean; // Prop to know whether to show the "Read-only" badge
}

export default function PlanDetailView({ plan, canEdit }: PlanDetailViewProps) {
  return (
    <div className="space-y-6">
      <div className="pr-32"> {/* Add padding to the right to not overlap the edit button */}
        <h1 className="text-3xl font-extrabold text-gray-900">{plan.planName}</h1>
        {!canEdit && (
            <div className="inline-flex items-center gap-2 px-3 py-1 mt-2 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                <LockClosedIcon className="w-4 h-4"/>
                <span>Read-only common plan</span>
            </div>
        )}
      </div>
      <p className="text-gray-600">{plan.description || 'No description provided.'}</p>
      
      <hr/>
      
      {plan.days.map((day, dayIndex) => (
        <div key={dayIndex} className="p-4 space-y-3 border-l-4 border-indigo-200 bg-slate-50 rounded-r-lg">
          <h3 className="text-xl font-bold text-gray-800">{day.dayName}</h3>
          {day.notes && <p className="text-sm text-gray-600 italic">Notes: {day.notes}</p>}
           <div className="space-y-2">
            {day.exercises.map((ex: any, exIndex: number) => (
              <ReadOnlyExercise key={exIndex} exercise={ex} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}