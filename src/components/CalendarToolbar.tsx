import React from 'react';
import { Navigate, type View, type ToolbarProps } from 'react-big-calendar';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

// This is our custom toolbar component.
// It receives props from React Big Calendar, including the label and navigation functions.
export default function CalendarToolbar(props: ToolbarProps) {
  const { label, onNavigate } = props;

  return (
    <div className="rbc-toolbar flex items-center justify-between p-4 bg-gray-50 rounded-t-lg">
      {/* Left side: Navigation Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate(Navigate.PREVIOUS)}
          className="px-2 py-1 text-gray-600 bg-white border rounded-md shadow-sm hover:bg-gray-100"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="w-5 h-5"/>
        </button>
        <button
          type="button"
          onClick={() => onNavigate(Navigate.TODAY)}
          className="px-4 py-1 text-sm font-semibold text-gray-700 bg-white border rounded-md shadow-sm hover:bg-gray-100"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => onNavigate(Navigate.NEXT)}
          className="px-2 py-1 text-gray-600 bg-white border rounded-md shadow-sm hover:bg-gray-100"
          aria-label="Next month"
        >
          <ChevronRightIcon className="w-5 h-5"/>
        </button>
      </div>
      
      <div className="text-xl font-bold text-gray-800">
        {label}
      </div>

      <div className="w-40"> 
      </div>
    </div>
  );
}