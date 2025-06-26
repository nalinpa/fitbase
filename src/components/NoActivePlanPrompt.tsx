import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenIcon } from '@heroicons/react/24/solid';

export default function NoActivePlanPrompt() {
  return (
    <div className="p-8 text-center bg-white rounded-lg shadow-md">
      <BookOpenIcon className="w-12 h-12 mx-auto text-indigo-400" />
      <h2 className="mt-4 text-xl font-bold text-gray-900">Select Your Training Plan</h2>
      <p className="mt-2 text-gray-600">
        You don't have an active workout plan yet. Head over to the library to choose one.
      </p>
      <Link
        to="/workout/all"
        className="inline-block px-6 py-3 mt-6 font-medium text-white bg-indigo-600 rounded-md shadow-sm text-md hover:bg-indigo-700"
      >
        Browse Workout Library
      </Link>
    </div>
  );
}