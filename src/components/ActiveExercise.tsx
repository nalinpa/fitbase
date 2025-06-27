import React from 'react';
import { DocumentData } from 'firebase/firestore';
import { 
  CheckCircleIcon as CheckCircleSolid, 
  LockClosedIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/solid';
import { CheckCircleIcon as CheckCircleOutline } from '@heroicons/react/24/outline';
import PerformanceLogRow from './PerformanceLogRow';

interface ActiveExerciseProps {
  exercise: DocumentData;
  exerciseIndex: number;
  onSetUpdate: (exIndex: number, setIndex: number, field: 'weight' | 'reps' | 'completed', value: string | boolean) => void;
  onRemoveExercise?: (exerciseIndex: number) => void;
  onAddSet?: (exerciseIndex: number) => void;
  onRemoveSet?: (exerciseIndex: number, setIndex: number) => void;
  showRemoveButton?: boolean;
}

export default function ActiveExercise({ 
  exercise, 
  exerciseIndex, 
  onSetUpdate, 
  onRemoveExercise,
  onAddSet,
  onRemoveSet,
  showRemoveButton = true
}: ActiveExerciseProps) {
  
  const isSetUnlocked = (setIndex: number): boolean => {
    if (setIndex === 0) {
      return true;
    }
    const previousSet = exercise.performance[setIndex - 1];
    return previousSet?.completed || false;
  };

  return (
    <div className={`p-4 rounded-xl transition-all bg-slate-50 relative`}>
      {/* Exercise Controls */}
      <div className="absolute top-2 right-2 flex gap-1">
        {onRemoveExercise && showRemoveButton && (
          <button
            onClick={() => onRemoveExercise(exerciseIndex)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded-lg transition-all duration-200"
            title="Remove exercise"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Exercise Title and Target */}
      <div className={`pb-3 mb-3 border-b border-slate-200 pr-20`}>
        <h3 className={`text-xl font-bold text-gray-800`}>{exercise.exerciseName}</h3>
        <p className="text-sm text-gray-500">
          Target: <span className="font-semibold">{exercise.sets} sets</span> of{' '}
          <span className="font-semibold">{exercise.reps} reps</span> @{' '}
          <span className="font-semibold">{exercise.weight}</span>
        </p>
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
          <div key={setIndex} className="relative">
            <PerformanceLogRow
              setIndex={setIndex}
              performanceData={perf}
              targetReps={exercise.reps}
              isUnlocked={isSetUnlocked(setIndex)}
              onUpdate={(sIndex, field, value) => onSetUpdate(exerciseIndex, sIndex, field, value)}
            />
            
            {/* Remove Set Button - only show if more than 1 set and not the first set */}
            {onRemoveSet && exercise.performance.length > 1 && setIndex > 0 && (
              <button
                onClick={() => onRemoveSet(exerciseIndex, setIndex)}
                className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                title="Remove this set"
              >
                <MinusIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {/* Add Set Button */}
        {onAddSet && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => onAddSet(exerciseIndex)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 border border-dashed border-indigo-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200"
              disabled={exercise.performance.length >= 10} // Limit to 10 sets
            >
              <PlusIcon className="w-4 h-4" />
              Add Set ({exercise.performance.length + 1})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}