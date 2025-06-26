import React from 'react';
import { Link, LinkProps } from 'react-router-dom';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  to?: string;
}

export default function Button({
  children,
  className = '',
  variant = 'primary',
  to,
  ...props
}: ButtonProps) {
  
  const baseClasses = "inline-flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-md shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'text-gray-800 bg-gray-100 hover:bg-gray-200 focus:ring-indigo-500',
    danger: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (to) {
    const linkProps = props as Omit<LinkProps, 'to'>;
    return (
      <Link to={to} className={combinedClasses} {...linkProps}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}