import React from 'react';
import { Outlet } from 'react-router-dom';

export default function FullScreenLayout() {
  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <Outlet />
    </div>
  );
}