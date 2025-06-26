import React from 'react';
import { XCircleIcon } from '@heroicons/react/24/solid';
import Button from './ui/Button';

// Define the shape of our data structures
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

// A helper to format time
const formatRestTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
};

// Define the props that this component needs from its parent
interface EditableWorkoutDaysProps {
  days: WorkoutDay[];
  onDayChange: (dayIndex: number, field: keyof WorkoutDay, value: string) => void;
  onExerciseChange: (dayIndex: number, exIndex: number, field: keyof Exercise, value: string | number) => void;
  onAddExercise: (dayIndex: number) => void;
  onRemoveExercise: (dayIndex: number, exIndex: number) => void;
}

export default function EditableWorkoutDays({
  days,
  onDayChange,
  onExerciseChange,
  onAddExercise,
  onRemoveExercise,
}: EditableWorkoutDaysProps) {
  // This component now contains all the JSX for rendering the dynamic list
  return (
    <div className="space-y-6">
      {days.map((day, dayIndex) => (
        <div key={dayIndex} className="p-6 space-y-4 border border-gray-200 rounded-xl">
          <input
            type="text"
            value={day.dayName}
            onChange={(e) => onDayChange(dayIndex, 'dayName', e.target.value)}
            className="w-full text-xl font-bold border-0 border-b-2 border-transparent focus:ring-0 focus:border-indigo-500"
          />
          <textarea
            placeholder="Add any notes for this day (e.g., focus, intensity...)"
            value={day.notes}
            onChange={(e) => onDayChange(dayIndex, 'notes', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-900 rounded-md shadow-sm"
          />
          
          <div className="space-y-4">
            {day.exercises.map((exercise, exIndex) => (
              <div key={exIndex} className="relative p-4 pt-5 bg-slate-100 rounded-lg">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                  <div className="col-span-1 sm:col-span-6">
                    <label className="text-xs font-semibold text-gray-500">Exercise Name</label>
                    <input type="text" value={exercise.exerciseName} onChange={(e) => onExerciseChange(dayIndex, exIndex, 'exerciseName', e.target.value)} required className="w-full px-2 py-1 border border-gray-600 rounded-md"/>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-500">Sets</label>
                    <input type="number" value={exercise.sets} onChange={(e) => onExerciseChange(dayIndex, exIndex, 'sets', parseInt(e.target.value))} required className="w-full px-2 py-1 border border-gray-600 rounded-md"/>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-500">Reps</label>
                    <input type="text" value={exercise.reps} onChange={(e) => onExerciseChange(dayIndex, exIndex, 'reps', e.target.value)} required className="w-full px-2 py-1 border border-gray-600 rounded-md"/>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-500">Weight (kg/lbs)</label>
                    <input type="text" value={exercise.weight} onChange={(e) => onExerciseChange(dayIndex, exIndex, 'weight', e.target.value)} required className="w-full px-2 py-1 border border-gray-600 rounded-md"/>
                  </div>
                  <div className="col-span-1 sm:col-span-6">
                    <label className="flex items-center justify-between text-xs font-semibold text-gray-500">
                      <span>Rest Time</span>
                      <span className="px-2 py-1 text-xs font-bold text-indigo-800 bg-indigo-100 rounded-full">{formatRestTime(exercise.restTime)}</span>
                    </label>
                    <input type="range" min="30" max="480" step="30" value={exercise.restTime} onChange={(e) => onExerciseChange(dayIndex, exIndex, 'restTime', parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                </div>
                <button type="button" onClick={() => onRemoveExercise(dayIndex, exIndex)} className="absolute text-gray-400 -top-2 -right-2 hover:text-red-500 disabled:opacity-50" disabled={day.exercises.length <= 1}>
                  <XCircleIcon className="w-6 h-6 bg-white rounded-full"/>
                </button>
              </div>
            ))}
              <Button 
              onClick={() => onAddExercise(dayIndex)}
              className="w-full px-4 py-2 mt-4 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
            >
               + Add Exercise to Day {dayIndex + 1}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}