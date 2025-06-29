import React from 'react';
import { useUserPreferences } from '../hooks/useUserPreferences';

// Define the shape of the exercise data this component expects
interface Exercise {
  exerciseName: string;
  sets: number;
  reps: string;
  weight: string;
  restTime: number;
}

// Define the props interface
interface ReadOnlyExerciseProps {
  exercise: Exercise;
}

// A helper to format time
const formatRestTime = (seconds: number): string => {
  if (!seconds) return 'N/A';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
};

export default function ReadOnlyExercise({ exercise }: ReadOnlyExerciseProps) {
  const {getWeightUnitLabel} = useUserPreferences();
  const weightUnit = getWeightUnitLabel();
  return (
    <div className="p-3 bg-white border rounded-md grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-1">
      <div className="col-span-2 md:col-span-4 lg:col-span-5 font-semibold text-gray-800">
        {exercise.exerciseName}
      </div>
      <div className="text-sm">
        <span className="font-medium text-gray-500">Sets: </span>{exercise.sets}
      </div>
      <div className="text-sm">
        <span className="font-medium text-gray-500">Reps: </span>{exercise.reps}
      </div>
      <div className="text-sm">
        <span className="font-medium text-gray-500">Weight: </span>{exercise.weight}{weightUnit}
      </div>
      <div className="text-sm">
        <span className="font-medium text-gray-500">Rest: </span>{formatRestTime(exercise.restTime)}
      </div>
    </div>
  );
}