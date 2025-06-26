import React from 'react';
import { DocumentData } from 'firebase/firestore';
import WorkoutCard from './WorkoutCard'; // Import our new reusable card

// Define the props for this list component
interface WorkoutPlanListProps {
  title: string;
  workouts: DocumentData[];
  emptyStateMessage: string;
  activePlanId: string | null;
  onSelectPlan: (planId: string) => void;
}

export default function WorkoutPlanList({
  title,
  workouts,
  emptyStateMessage,
  activePlanId,
  onSelectPlan,
}: WorkoutPlanListProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-6">
        {title}
      </h2>
      {workouts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workouts.map(plan => (
            <WorkoutCard 
              key={plan.id} 
              plan={plan} 
              isActive={plan.id === activePlanId} 
              onSelect={() => onSelectPlan(plan.id)}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center bg-white border-2 border-dashed rounded-lg">
          <p className='text-sm text-gray-500'>{emptyStateMessage}</p>
        </div>
      )}
    </section>
  );
}