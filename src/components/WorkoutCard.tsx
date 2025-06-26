import React from 'react';
import { Link } from 'react-router-dom';
import { DocumentData } from 'firebase/firestore';
import { BookOpenIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import Button from './ui/Button';
import Card from './ui/Card';

// Define the props the card component needs
interface WorkoutCardProps {
  plan: DocumentData;
  isActive: boolean;
  onSelect: () => void;
}

export default function WorkoutCard({ plan, isActive, onSelect }: WorkoutCardProps) {
  return (
    <Card 
      as={Link}
      to={`/workout/${plan.id}`}
      className={`flex flex-col !p-4 transition-all ${isActive ? 'border-2 border-indigo-600 shadow-xl' : 'hover:shadow-lg'}`}
    >
      <div className="flex-grow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-full">
                  <BookOpenIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 truncate">{plan.planName}</h3>
          </div>
          {isActive && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded-full">
                  <CheckCircleIcon className="w-4 h-4"/>
              </span>
          )}
        </div>
        <p className="mt-3 text-sm text-gray-600 line-clamp-2 h-10">{plan.description || 'No description available.'}</p>

      
      <div className="pt-4 mt-auto border-t border-gray-100">
            <Button 
              onClick={(e) => {
                e.preventDefault();
                onSelect();
              }}
              disabled={isActive}
              className="w-full px-3 py-2 text-sm font-medium text-center rounded-md disabled:bg-indigo-500 disabled:text-white disabled:cursor-not-allowed bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
              {isActive ? 'Your Current Plan' : 'Select as Current Plan'}
            </Button>
      </div>
      </div>
    </Card>
  );
}