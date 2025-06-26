import React from 'react';
import { DocumentData } from 'firebase/firestore';
import { PlayCircleIcon } from '@heroicons/react/24/solid';
import Button from './ui/Button';

// This component needs the next workout data and the handler function to start it
interface NextWorkoutCardProps {
  nextWorkout: {
    day: DocumentData;
    index: number;
  };
  onStartWorkout: (dayIndex: number) => void;
}

export default function NextWorkoutCard({ nextWorkout, onStartWorkout }: NextWorkoutCardProps) {
  return (
    <div className="p-6 text-white bg-gray-800 rounded-lg shadow-md">
       <h2 className="text-sm font-semibold tracking-widest text-gray-400 uppercase">Next Up</h2>
       <p className="mt-2 text-2xl font-bold">{nextWorkout.day.dayName}</p>
       <p className="mt-2 text-gray-300">{nextWorkout.day.exercises.length} exercises planned.</p>
          <Button 
              onClick={() => onStartWorkout(nextWorkout.index)} 
              className="w-full justify-center py-3 mt-4 ..."
            >
              <PlayCircleIcon className="w-6 h-6"/>
              Start This Workout
            </Button>
    </div>
  );
}