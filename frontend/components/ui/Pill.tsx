import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Clock } from 'lucide-react';

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'scheduled' | 'sent' | 'failed' | 'sending' | 'chip';
  showClock?: boolean;
}

export function Pill({
  className,
  variant = 'scheduled',
  showClock = false,
  children,
  ...props
}: PillProps) {
  const variants = {
    scheduled: 'bg-[#FFF1E3] text-[#D4570F] font-medium border border-[#FFE0C2]',
    sent: 'bg-[#F3F4F6] text-[#6B7280] font-medium border border-[#E5E7EB]',
    failed: 'bg-[#FEE2E2] text-[#DC2626] font-medium border border-[#FECACA]',
    sending: 'bg-[#FEF3C7] text-[#D97706] font-medium border border-[#FDE68A]',
    chip: 'bg-[#E4F5EA] text-[#00702A] font-medium border border-[#C2E8CF]',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap transition-colors',
          variants[variant],
          className
        )
      )}
      {...props}
    >
      {(showClock || variant === 'scheduled') && (
        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
      )}
      {children}
    </span>
  );
}
