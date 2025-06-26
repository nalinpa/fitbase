import React from 'react';
import { Link } from 'react-router-dom';
import { DocumentData } from 'firebase/firestore';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import Card from './ui/Card';
import Button from './ui/Button';

interface PlanOverviewCardProps {
  activePlan: DocumentData;
}

export default function PlanOverviewCard({ activePlan }: PlanOverviewCardProps) {
  return (
    <Card className="lg:col-span-2">
      <h2 className="text-sm font-semibold tracking-widest text-gray-500 uppercase">Current Plan</h2>
      <p className="mt-2 text-2xl font-bold text-indigo-600">{activePlan.planName}</p>
      <p className="mt-2 text-gray-600 line-clamp-2 h-12">{activePlan.description}</p>
      <Button to={`/workout/${activePlan.id}`} variant="secondary" className="mt-4 !font-semibold !bg-transparent !shadow-none !p-0 text-indigo-600 hover:!bg-transparent">
        View Full Plan Details <ArrowRightIcon className="w-4 h-4" />
      </Button>
    </Card>
  );
}