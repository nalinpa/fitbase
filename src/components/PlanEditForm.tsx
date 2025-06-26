import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import EditableWorkoutDays from './EditWorkoutDay'; // We will use our other reusable component inside this one
import { DocumentData } from 'firebase/firestore';
import Button from './ui/Button';

// We define all the props that the parent page needs to pass down to this form
interface PlanEditFormProps {
  formData: Partial<DocumentData>;
  onFormChange: (field: string, value: any) => void;
  onDayChange: (dayIndex: number, field: string, value: any) => void;
  onExerciseChange: (dayIndex: number, exIndex: number, field: string, value: any) => void;
  onAddExercise: (dayIndex: number) => void;
  onRemoveExercise: (dayIndex: number, exIndex: number) => void;
  onUpdate: (e: React.FormEvent) => Promise<void>;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage: string;
}

export default function PlanEditForm({
  formData,
  onFormChange,
  onDayChange,
  onExerciseChange,
  onAddExercise,
  onRemoveExercise,
  onUpdate,
  status,
  errorMessage,
}: PlanEditFormProps) {
  return (
    <form onSubmit={onUpdate} className="space-y-6">
      {/* Plan Name and Description Inputs */}
      <div className="pr-40"> {/* Padding to avoid overlapping with the Cancel button */}
        <label htmlFor="planName" className="block text-sm font-medium text-gray-700">Plan Name</label>
        <input
          id="planName"
          type="text"
          value={formData.planName || ''}
          onChange={(e) => onFormChange('planName', e.target.value)}
          required
          className="w-full mt-1 border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => onFormChange('description', e.target.value)}
          rows={3}
          className="w-full mt-1 border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <hr/>
      
      <EditableWorkoutDays
        days={formData.days || []}
        onDayChange={onDayChange}
        onExerciseChange={onExerciseChange}
        onAddExercise={onAddExercise}
        onRemoveExercise={onRemoveExercise}
      />
      
      <div className="flex items-center justify-between pt-6 border-t">
          <Button
            type="submit"
            disabled={status === 'loading'}
            className="inline-flex items-center gap-2 px-6 py-2 font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 disabled:bg-green-400"
          >
              <CheckCircleIcon className="inline w-5 h-5 mr-2"/>
              {status === 'loading' ? 'Saving...' : 'Save Changes'}
            </Button>
        {status === 'success' && <p className="text-sm font-medium text-green-600">Plan updated successfully!</p>}
        {status === 'error' && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
      </div>
    </form>
  );
}