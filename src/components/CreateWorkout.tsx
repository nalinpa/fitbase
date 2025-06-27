import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cloudFunctionsService } from '../services/cloudFunctionsService';
import { useAuth } from '../context/AuthContext';
import EditableWorkoutDays from './EditWorkoutDay';
import Button from './ui/Button';

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

const defaultExercise = (): Exercise => ({ exerciseName: '', sets: 3, reps: '8-12', weight: '0', restTime: 60 });
const defaultDay = (dayNumber: number): WorkoutDay => ({ dayName: `Day ${dayNumber}`, notes: '', exercises: [defaultExercise()] });

export default function CreateWorkoutForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [description, setDescription] = useState('');
  const [days, setDays] = useState<WorkoutDay[]>([defaultDay(1)]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [customWorkoutCount, setCustomWorkoutCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchWorkoutCount = async () => {
      try {
        const data = await cloudFunctionsService.getWorkoutLibrary();
        setCustomWorkoutCount(data.customWorkouts.length);
      } catch (error) {
        console.error("Error fetching workout count:", error);
      }
    };
    fetchWorkoutCount();
  }, [user]);

  const handleNumberOfDaysChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDayCount = parseInt(e.target.value, 10);
    const currentDayCount = days.length;
    if (newDayCount > currentDayCount) {
      const newDaysToAdd = Array.from({ length: newDayCount - currentDayCount }, (_, i) => defaultDay(currentDayCount + i + 1));
      setDays([...days, ...newDaysToAdd]);
    } else if (newDayCount < currentDayCount) {
      setDays(days.slice(0, newDayCount));
    }
  };

  const handleDayChange = (dayIndex: number, field: keyof WorkoutDay, value: string) => {
    const updatedDays = [...days];
    updatedDays[dayIndex] = { ...updatedDays[dayIndex], [field]: value };
    setDays(updatedDays);
  };

  const handleExerciseChange = (dayIndex: number, exIndex: number, field: keyof Exercise, value: string | number) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].exercises[exIndex] = { ...updatedDays[dayIndex].exercises[exIndex], [field]: value };
    setDays(updatedDays);
  };

  const addExercise = (dayIndex: number) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].exercises.push(defaultExercise());
    setDays(updatedDays);
  };

  const removeExercise = (dayIndex: number, exIndex: number) => {
    const updatedDays = [...days];
    if (updatedDays[dayIndex].exercises.length <= 1) return;
    updatedDays[dayIndex].exercises = updatedDays[dayIndex].exercises.filter((_, i) => i !== exIndex);
    setDays(updatedDays);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    if (!user) {
      setErrorMessage('You must be logged in to create a plan.');
      setStatus('error');
      return;
    }

    try {
      await cloudFunctionsService.createWorkoutPlan(description, days.length, days);
      setStatus('success');
      setDescription('');
      setDays([defaultDay(1)]);
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error: any) {
      console.error("Error calling createWorkoutPlan function:", error);
      setErrorMessage(error.message || 'Failed to save workout plan.');
      setStatus('error');
    }
  };
 
  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-8 bg-white rounded-lg shadow-md sm:p-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Plan Name</label>
          <div className="p-3 mt-1 text-gray-800 bg-gray-100 border border-gray-600 rounded-md">
            <p className="font-semibold text-indigo-700">
              {customWorkoutCount < 5 ? `User Custom Workout ${customWorkoutCount + 1}` : "Limit Reached"}
            </p>
            <p className="text-xs text-gray-500">({customWorkoutCount} / 5 created)</p>
          </div>
        </div>
        <div>
          <label htmlFor="numberOfDays" className="block text-sm font-medium text-gray-700">Number of Workout Days</label>
          <select id="numberOfDays" value={days.length} onChange={handleNumberOfDaysChange} className="w-full px-3 py-2 mt-1 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
            {[1, 2, 3, 4, 5, 6].map(num => <option key={num} value={num}>{num} Day{num > 1 ? 's' : ''}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 mt-1 border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="A brief description of this plan's focus"/>
        </div>
      </div>
      
      <hr />
      
      <EditableWorkoutDays
        days={days}
        onDayChange={handleDayChange}
        onExerciseChange={handleExerciseChange}
        onAddExercise={addExercise}
        onRemoveExercise={removeExercise}
      />
      
      <div className="flex items-center justify-between pt-6 border-t">
        <Button 
          type="submit"
          disabled={status === 'loading' || customWorkoutCount >= 5}
          className="inline-flex items-center gap-2 px-6 py-2 font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Saving Plan...' : 'Save Custom Plan'}
        </Button>
        {status === 'success' && <p className="text-sm font-medium text-green-600">Plan saved successfully!</p>}
        {status === 'error' && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
      </div>
    </form>
  );
}