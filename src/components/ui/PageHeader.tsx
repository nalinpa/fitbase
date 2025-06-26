import React from 'react';

// Define the props for our header
interface PageHeaderProps {
  title: string;
  subtitle?: string; // The subtitle is optional
  children?: React.ReactNode; // 'children' will be used for any buttons or extra elements
}

export default function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    // This container uses flexbox to align the title/subtitle block
    // on the left and any children (like buttons) on the right.
    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200">
      {/* Title and Subtitle Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-lg text-gray-600">
            {subtitle}
          </p>
        )}
      </div>

      {/* Action Buttons Section (renders any children passed to the component) */}
      {children && (
        <div className="flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}