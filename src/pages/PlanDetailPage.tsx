import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, DocumentData } from 'firebase/firestore';
import { ArrowLeftIcon, PencilSquareIcon, LockClosedIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';

import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import EditableWorkoutDays from '../components/EditWorkoutDay'; 
import PlanDetailView from '../components/PlanDetailView';
import PlanEditForm from '../components/PlanEditForm';

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
interface WorkoutPlan extends DocumentData {
  id: string;
  planName: string;
  description: string;
  days: WorkoutDay[];
  type: 'custom' | 'common';
  createdBy: string;
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

export default function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for the original plan, the form data, and UI state
  const [originalPlan, setOriginalPlan] = useState<WorkoutPlan | null>(null);
  const [formData, setFormData] = useState<Partial<WorkoutPlan>>({});
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Computed variable to check if the user has permission to edit
  const canEdit = originalPlan?.type === 'custom' && originalPlan?.createdBy === user?.uid;

  // Fetches the plan data when the component loads or the ID changes
  useEffect(() => {
    if (!planId) return;
    const fetchPlan = async () => {
      setLoading(true);
      const docRef = doc(db, 'workouts', planId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as WorkoutPlan;
        setOriginalPlan(data);
        setFormData(data); // Initialize form data with the fetched plan
      } else {
        setErrorMessage('Workout plan not found.');
        setStatus('error');
      }
      setLoading(false);
    };
    fetchPlan();
  }, [planId]);
  
  const handleFormChange = (field: keyof WorkoutPlan, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleDayChange = (dayIndex: number, field: string, value: any) => {
    const newDays = JSON.parse(JSON.stringify(formData.days || []));
    newDays[dayIndex][field] = value;
    setFormData({ ...formData, days: newDays });
  };

  const handleExerciseChange = (dayIndex: number, exIndex: number, field: string, value: any) => {    
    const newDays = JSON.parse(JSON.stringify(formData.days || []));
    newDays[dayIndex].exercises[exIndex][field] = value;
    setFormData({ ...formData, days: newDays });
  };

  const addExercise = (dayIndex: number) => {
    const newDays = JSON.parse(JSON.stringify(formData.days || []));
    newDays[dayIndex].exercises.push({ exerciseName: '', sets: 3, reps: '8-12', weight: '0', restTime: 60 });
    setFormData({ ...formData, days: newDays });
  };

  const removeExercise = (dayIndex: number, exIndex: number) => {
    const newDays = JSON.parse(JSON.stringify(formData.days || []));
    if (newDays[dayIndex].exercises.length <= 1) return;
    newDays[dayIndex].exercises = newDays[dayIndex].exercises.filter((_: any, i: number) => i !== exIndex);
    setFormData({ ...formData, days: newDays });
  };
  
  const handleCancelEdit = () => {
    setFormData(originalPlan || {});
    setIsEditMode(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !planId) return;
    setStatus('loading');
    setErrorMessage('');
    try {
      const docRef = doc(db, 'workouts', planId);
      const { id, ...dataToUpdate } = formData;
      await updateDoc(docRef, dataToUpdate);

      setOriginalPlan(formData as WorkoutPlan);
      setStatus('success');
      setIsEditMode(false);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to update plan.');
      setStatus('error');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading workout plan...</div>;
  if (!originalPlan) return <div className="p-8 text-center text-red-600">Workout plan not found.</div>;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Previous Page
      </button>

      <div className="relative p-6 bg-white rounded-lg shadow-md sm:p-8">
        <div className="absolute top-4 right-4">
          {canEdit && (isEditMode ? (
              <button onClick={handleCancelEdit} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gray-500 rounded-md shadow-sm hover:bg-gray-600">
                <XMarkIcon className="w-5 h-5"/><span>Cancel Edit</span>
              </button>
            ) : (
              <button onClick={() => setIsEditMode(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">
                <PencilSquareIcon className="w-5 h-5" /><span>Edit Plan</span>
              </button>
            )
          )}
        </div>

        {!isEditMode ? ( 
            <PlanDetailView plan={originalPlan} canEdit={canEdit} />
        ) : (
          <PlanEditForm
            formData={formData}
            onUpdate={handleUpdate}
            onFormChange={handleFormChange}
            onDayChange={handleDayChange}
            onExerciseChange={handleExerciseChange}
            onAddExercise={addExercise}
            onRemoveExercise={removeExercise}
            status={status}
            errorMessage={errorMessage}
          />
        )}
      </div>
    </div>
  );
}