import React from 'react';
import CreateWorkoutForm from '../components/CreateWorkout';
import PageHeader from '../components/ui/PageHeader';

export default function CreateWorkoutPage() {
  return (
    <div className="space-y-6">
      <div>
        <PageHeader
        title="Create a New Custom Plan"
        subtitle="Build a reusable workout plan for your personal use."
      />
      </div>
      
      <CreateWorkoutForm />
    </div>
  );
}