import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const variants = {
      primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm',
      secondary: 'bg-brand-100 hover:bg-brand-200 text-brand-600',
      outline:
        'border border-brand-500 text-brand-600 hover:bg-brand-50 bg-white shadow-sm',
      ghost: 'hover:bg-neutral-100 text-neutral-700',
      danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded-full',
      md: 'text-sm px-5 py-2.5 rounded-full',
      lg: 'text-base px-6 py-3 rounded-full',
      icon: 'h-9 w-9 rounded-full p-0 flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
