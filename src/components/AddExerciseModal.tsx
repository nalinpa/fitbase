import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/solid';
import Button from './ui/Button';

interface Exercise {
  exerciseName: string;
  sets: number;
  reps: string;
  weight: string;
  restTime: number;
}

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: (exercise: Exercise) => void;
}

// Common exercise templates
const exerciseTemplates = [
  { name: 'Bench Press', sets: 3, reps: '8-10', weight: '0', restTime: 180 },
  { name: 'Squat', sets: 3, reps: '8-10', weight: '0', restTime: 180 },
  { name: 'Deadlift', sets: 3, reps: '5-8', weight: '0', restTime: 240 },
  { name: 'Pull-ups', sets: 3, reps: '6-12', weight: '0', restTime: 120 },
  { name: 'Push-ups', sets: 3, reps: '10-15', weight: '0', restTime: 90 },
  { name: 'Rows', sets: 3, reps: '8-12', weight: '0', restTime: 120 },
  { name: 'Overhead Press', sets: 3, reps: '6-10', weight: '0', restTime: 150 },
  { name: 'Lunges', sets: 3, reps: '10-12', weight: '0', restTime: 90 },
  { name: 'Dips', sets: 3, reps: '8-12', weight: '0', restTime: 120 },
  { name: 'Bicep Curls', sets: 3, reps: '10-15', weight: '0', restTime: 60 },
];

const formatRestTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
};

export default function AddExerciseModal({ isOpen, onClose, onAddExercise }: AddExerciseModalProps) {
  const [exercise, setExercise] = useState<Exercise>({
    exerciseName: '',
    sets: 3,
    reps: '8-12',
    weight: '0',
    restTime: 120,
  });

  const [showCustomForm, setShowCustomForm] = useState(false);

  const handleTemplateSelect = (template: any) => {
    const newExercise = {
      exerciseName: template.name,
      sets: template.sets,
      reps: template.reps,
      weight: template.weight,
      restTime: template.restTime,
    };
    onAddExercise(newExercise);
    handleClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise.exerciseName.trim()) {
      alert('Please enter an exercise name');
      return;
    }
    onAddExercise(exercise);
    handleClose();
  };

  const handleClose = () => {
    setExercise({
      exerciseName: '',
      sets: 3,
      reps: '8-12',
      weight: '0',
      restTime: 120,
    });
    setShowCustomForm(false);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" aria-modal="true">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Add Exercise</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {!showCustomForm ? (
            /* Exercise Templates */
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Quick Add</h3>
                <button
                  onClick={() => setShowCustomForm(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  + Custom Exercise
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exerciseTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleTemplateSelect(template)}
                    className="p-4 text-left border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group"
                  >
                    <div className="font-semibold text-gray-900 group-hover:text-indigo-900">
                      {template.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {template.sets} sets × {template.reps} reps • {formatRestTime(template.restTime)} rest
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Custom Exercise Form */
            <form onSubmit={handleCustomSubmit} className="p-6 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Custom Exercise</h3>
                <button
                  type="button"
                  onClick={() => setShowCustomForm(false)}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  ← Back to Templates
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="exerciseName" className="block text-sm font-medium text-gray-700 mb-1">
                    Exercise Name *
                  </label>
                  <input
                    type="text"
                    id="exerciseName"
                    value={exercise.exerciseName}
                    onChange={(e) => setExercise({ ...exercise, exerciseName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Barbell Bench Press"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="sets" className="block text-sm font-medium text-gray-700 mb-1">
                    Sets
                  </label>
                  <input
                    type="number"
                    id="sets"
                    min="1"
                    max="10"
                    value={exercise.sets}
                    onChange={(e) => setExercise({ ...exercise, sets: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="reps" className="block text-sm font-medium text-gray-700 mb-1">
                    Reps
                  </label>
                  <input
                    type="text"
                    id="reps"
                    value={exercise.reps}
                    onChange={(e) => setExercise({ ...exercise, reps: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 8-12"
                  />
                </div>

                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                    Starting Weight
                  </label>
                  <input
                    type="text"
                    id="weight"
                    value={exercise.weight}
                    onChange={(e) => setExercise({ ...exercise, weight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 135 lbs"
                  />
                </div>

                <div>
                  <label htmlFor="restTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Rest Time: <span className="font-semibold text-indigo-600">{formatRestTime(exercise.restTime)}</span>
                  </label>
                  <input
                    type="range"
                    id="restTime"
                    min="30"
                    max="480"
                    step="30"
                    value={exercise.restTime}
                    onChange={(e) => setExercise({ ...exercise, restTime: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Exercise
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  className="px-6"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}