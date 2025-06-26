import React from 'react';
import { DocumentData } from 'firebase/firestore';
import { CheckCircleIcon as CheckCircleSolid, LockClosedIcon } from '@heroicons/react/24/solid';
import { CheckCircleIcon as CheckCircleOutline } from '@heroicons/react/24/outline';
import PerformanceLogRow from './PerformanceLogRow';

// Define the shape of the props this component needs
interface ActiveExerciseProps {
  exercise: DocumentData;
  exerciseIndex: number;
  onSetUpdate: (exIndex: number, setIndex: number, field: 'weight' | 'reps' | 'completed', value: string | boolean) => void;
}

export default function ActiveExercise({ exercise, exerciseIndex, onSetUpdate }: ActiveExerciseProps) {
  
  // This helper logic is now self-contained within the component.
  // It determines if a specific set should be editable.
  const isSetUnlocked = (setIndex: number): boolean => {

    // The first set is always unlocked (if the exercise is).
    if (setIndex === 0) {
      return true;
    }
    // Subsequent sets are unlocked only if the previous set is complete.
    const previousSet = exercise.performance[setIndex - 1];
    return previousSet?.completed || false;
  };

  return (
    <div className={`p-4 rounded-xl transition-all bg-slate-50`}>
      {/* Exercise Title and Target */}
      <div className={`pb-3 mb-3 border-b border-slate-200`}>
        <p className="flex items-center gap-1 text-xs font-bold text-gray-500"><LockClosedIcon className="w-3 h-3"/> LOCKED</p>
        <h3 className={`text-xl font-bold text-gray-800`}>{exercise.exerciseName}</h3>
        <p className="text-sm text-gray-500">Target: <span className="font-semibold">{exercise.sets} sets</span> of <span className="font-semibold">{exercise.reps} reps</span> @ <span className="font-semibold">{exercise.weight}</span></p>
      </div>
      
      {/* Performance Logging Table */}
      <div className="space-y-3">
        <div className="grid items-center grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase">
          <div className="col-span-2 text-center">Set</div>
          <div className="col-span-4">Weight (kg/lbs)</div>
          <div className="col-span-4">Reps</div>
          <div className="col-span-2 text-center">Done</div>
        </div>

         {exercise.performance.map((perf: any, setIndex: number) => (
          <PerformanceLogRow
            key={setIndex}
            setIndex={setIndex}
            performanceData={perf}
            targetReps={exercise.reps}
            isUnlocked={isSetUnlocked(setIndex)}
            onUpdate={(sIndex, field, value) => onSetUpdate(exerciseIndex, sIndex, field, value)}
          />
        ))}
      </div>
    </div>
  );
}