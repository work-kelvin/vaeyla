import React from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'px-4 py-2 rounded font-medium transition-colors focus:outline-none',
          variant === 'outline'
            ? 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
            : 'bg-blue-600 text-white hover:bg-blue-700',
          size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button; 