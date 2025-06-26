import React from 'react';

type CardOwnProps<E extends React.ElementType> = {
  children: React.ReactNode;
  className?: string;
  as?: E; 
}

type CardProps<E extends React.ElementType> = CardOwnProps<E> &
  Omit<React.ComponentProps<E>, keyof CardOwnProps<E>>;

export default function Card<E extends React.ElementType = 'div'>({
  children,
  className = '',
  as,
  ...props
}: CardProps<E>) {
  const Component = as || 'div';  const combinedClasses = `bg-white rounded-lg shadow-md p-6 ${className}`;

  return (
    <Component className={combinedClasses} {...props}>
      {children}
    </Component>
  );
}