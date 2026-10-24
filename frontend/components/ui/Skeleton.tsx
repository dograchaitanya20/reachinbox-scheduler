import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={twMerge(
        clsx('animate-pulse rounded-md bg-neutral-200/80', className)
      )}
      {...props}
    />
  );
}

export function EmailRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3.5 px-4 border-b border-neutral-100 gap-4">
      <div className="flex items-center gap-3 w-40 flex-shrink-0">
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32 hidden md:block" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </div>
  );
}
