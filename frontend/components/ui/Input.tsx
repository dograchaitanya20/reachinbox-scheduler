import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  error?: string;
  pill?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', leadingIcon, trailingIcon, error, pill = false, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center w-full">
          {leadingIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-neutral-400">
              {leadingIcon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={twMerge(
              clsx(
                'w-full bg-white text-sm text-neutral-900 placeholder:text-neutral-400 border border-neutral-200 transition-colors focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed',
                pill ? 'rounded-full px-4 py-2' : 'rounded-lg px-3.5 py-2.5',
                leadingIcon ? 'pl-10' : '',
                trailingIcon ? 'pr-10' : '',
                error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
                className
              )
            )}
            {...props}
          />
          {trailingIcon && (
            <div className="absolute right-3.5 flex items-center text-neutral-400">
              {trailingIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
