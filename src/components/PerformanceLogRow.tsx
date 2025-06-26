import React from 'react';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { CheckCircleIcon as CheckCircleOutline } from '@heroicons/react/24/outline';

// Define the shape of the props this component needs
interface PerformanceLogRowProps {
  setIndex: number;
  performanceData: { weight: string; reps: string; completed: boolean };
  targetReps: string;
  isUnlocked: boolean;
  // This is a callback function to notify the parent component of any changes
  onUpdate: (setIndex: number, field: 'weight' | 'reps' | 'completed', value: string | boolean) => void;
}

export default function PerformanceLogRow({
  setIndex,
  performanceData,
  targetReps,
  isUnlocked,
  onUpdate,
}: PerformanceLogRowProps) {
  
  // Determine if the 'Done' button should be disabled
  const isDoneButtonDisabled = !performanceData.weight || !performanceData.reps || !isUnlocked || performanceData.completed;

  return (
    <div className={`grid items-center grid-cols-12 gap-2 p-2 rounded-lg transition-all ${performanceData.completed ? 'bg-green-100' : 'bg-white'}`}>
      <div className="col-span-2 font-bold text-center text-gray-800">{setIndex + 1}</div>
      <div className="col-span-4">
        <input
          type="text"
          placeholder="0"
          value={performanceData.weight}
          disabled={!isUnlocked || performanceData.completed}
          onChange={(e) => onUpdate(setIndex, 'weight', e.target.value)}
          className="w-full px-2 py-2 text-center bg-transparent border border-gray-300 rounded-md disabled:cursor-not-allowed disabled:bg-gray-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div className="col-span-4">
        <input
          type="number"
          placeholder={targetReps}
          value={performanceData.reps}
          disabled={!isUnlocked || performanceData.completed}
          onChange={(e) => onUpdate(setIndex, 'reps', e.target.value)}
          className="w-full px-2 py-2 text-center bg-transparent border border-gray-300 rounded-md disabled:cursor-not-allowed disabled:bg-gray-100 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div className="flex justify-center col-span-2">
        <button
          onClick={() => onUpdate(setIndex, 'completed', true)}
          disabled={isDoneButtonDisabled}
          aria-label={`Mark set ${setIndex + 1} as complete`}
        >
          {performanceData.completed ? (
            <CheckCircleSolid className="w-8 h-8 text-green-500" />
          ) : (
            <CheckCircleOutline className={`w-8 h-8 ${isDoneButtonDisabled ? 'text-gray-300' : 'text-gray-300 hover:text-green-500'}`} />
          )}
        </button>
      </div>
    </div>
  );
}