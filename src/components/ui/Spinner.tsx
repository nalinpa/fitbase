import React from 'react';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray' | 'green' | 'red';
  className?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4', 
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const colorClasses = {
  primary: 'border-indigo-600',
  white: 'border-white',
  gray: 'border-gray-600', 
  green: 'border-green-600',
  red: 'border-red-600',
};

export default function Spinner({ 
  size = 'md', 
  color = 'primary', 
  className = '' 
}: SpinnerProps) {
  const sizeClass = sizeClasses[size];
  const colorClass = colorClasses[color];

  return (
    <div 
      className={`animate-spin rounded-full border-b-2 border-transparent ${sizeClass} ${colorClass} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}