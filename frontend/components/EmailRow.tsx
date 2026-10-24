'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { Pill } from '@/components/ui/Pill';
import { formatScheduledTime, stripHtml } from '@/lib/format';
import { useStarred } from '@/hooks/useStarred';
import type { Email } from '@/types';

export interface EmailRowProps {
  email: Email;
  tab: 'scheduled' | 'sent';
}

export function EmailRow({ email, tab }: EmailRowProps) {
  const router = useRouter();
  const { isStarred, toggleStar } = useStarred();
  const starred = isStarred(email.id);

  const preview = stripHtml(email.body);

  const handleClick = () => {
    router.push(`/email/${email.id}`);
  };

  const renderPill = () => {
    if (tab === 'scheduled') {
      return (
        <Pill variant="scheduled">
          {formatScheduledTime(email.scheduledAt)}
        </Pill>
      );
    }

    if (email.status === 'failed') {
      return <Pill variant="failed">Failed</Pill>;
    }

    if (email.status === 'sending') {
      return <Pill variant="sending">Sending</Pill>;
    }

    return <Pill variant="sent">Sent</Pill>;
  };

  // Extract recipient display name if available, else email prefix or full email
  const displayTo = email.to;

  return (
    <div
      onClick={handleClick}
      className="group flex items-center justify-between py-3.5 px-6 border-b border-neutral-100 hover:bg-neutral-50/80 transition-colors cursor-pointer select-none text-sm gap-4"
    >
      {/* Recipient */}
      <div className="w-44 flex-shrink-0 flex items-center text-neutral-800 font-medium truncate">
        <span className="text-neutral-500 mr-1.5 font-normal">To:</span>
        <span className="truncate">{displayTo}</span>
      </div>

      {/* Pill + Subject & Snippet */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0">{renderPill()}</div>

        <div className="flex items-center min-w-0 truncate">
          <span className="font-semibold text-neutral-900 truncate">
            {email.subject}
          </span>
          <span className="text-neutral-400 mx-1.5 flex-shrink-0">-</span>
          <span className="text-neutral-500 font-normal truncate">
            {preview || 'No additional text'}
          </span>
        </div>
      </div>

      {/* Star button */}
      <div className="flex-shrink-0 pl-2">
        <button
          type="button"
          onClick={(e) => toggleStar(email.id, e)}
          className="p-1 text-neutral-300 hover:text-amber-400 transition-colors focus:outline-none"
          title={starred ? 'Starred' : 'Not starred'}
        >
          <Star
            className={`w-4 h-4 transition-transform ${
              starred
                ? 'fill-amber-400 text-amber-400 scale-110'
                : 'text-neutral-300 hover:scale-110'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
