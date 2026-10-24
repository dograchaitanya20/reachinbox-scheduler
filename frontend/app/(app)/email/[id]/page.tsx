'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Star, Archive, Trash2, AlertCircle } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useEmailDetail } from '@/hooks/useEmailQueries';
import { useStarred } from '@/hooks/useStarred';
import { formatDetailDate } from '@/lib/format';

export default function EmailDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { user } = useAuth();
  const { data: email, isLoading, isError, error, refetch } = useEmailDetail(id);
  const { isStarred, toggleStar } = useStarred();

  const starred = isStarred(id);

  const sanitizedBody = React.useMemo(() => {
    if (!email?.body) return '';
    if (typeof window === 'undefined') return email.body;
    return DOMPurify.sanitize(email.body, {
      ADD_TAGS: ['img', 'style'],
      ADD_ATTR: ['src', 'alt', 'style', 'class', 'target'],
    });
  }, [email?.body]);

  const senderEmail = email?.sender?.user || 'sender@example.com';
  const senderInitial = senderEmail.charAt(0).toUpperCase();

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
      {/* Top Header Bar */}
      <div className="py-3.5 px-6 border-b border-neutral-100 flex items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors flex-shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {isLoading ? (
            <Skeleton className="h-5 w-64" />
          ) : (
            <h1 className="text-base font-semibold text-neutral-900 truncate">
              {email?.subject || 'Untitled'}
            </h1>
          )}
        </div>

        {/* Action icons & User Avatar */}
        <div className="flex items-center gap-2">
          {/* Star */}
          <button
            type="button"
            onClick={(e) => toggleStar(id, e)}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-amber-400 transition-colors"
            title={starred ? 'Starred' : 'Not starred'}
          >
            <Star
              className={`w-4 h-4 ${
                starred ? 'fill-amber-400 text-amber-400' : 'text-neutral-400'
              }`}
            />
          </button>

          {/* Archive (Disabled) */}
          <div className="relative group">
            <button
              type="button"
              disabled
              className="p-1.5 rounded-full text-neutral-300 cursor-not-allowed"
            >
              <Archive className="w-4 h-4" />
            </button>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Archive not supported
            </div>
          </div>

          {/* Trash (Disabled) */}
          <div className="relative group">
            <button
              type="button"
              disabled
              className="p-1.5 rounded-full text-neutral-300 cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Trash not supported
            </div>
          </div>

          <div className="w-px h-4 bg-neutral-200 mx-1" />

          {/* User Avatar */}
          <Avatar
            src={user?.avatar}
            name={user?.name || 'Oliver Brown'}
            size="sm"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 max-w-4xl w-full mx-auto">
        {isLoading ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="space-y-3 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <h3 className="text-base font-semibold text-neutral-900 mb-1">
              Email not found
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              {error?.message || 'Could not load this email.'}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <article className="flex flex-col gap-6">
            {/* Sender and Recipient Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00A63E] text-white flex items-center justify-center font-bold text-sm select-none shadow-sm flex-shrink-0">
                  {senderInitial}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-neutral-900">
                      {senderEmail.split('@')[0]}
                    </span>
                    <span className="text-xs text-neutral-400 font-normal">
                      &lt;{senderEmail}&gt;
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    to {email?.to}
                  </div>
                </div>
              </div>

              <div className="text-xs text-neutral-400 font-normal whitespace-nowrap">
                {email?.scheduledAt ? formatDetailDate(email.scheduledAt) : ''}
              </div>
            </div>

            {/* Email Body Content */}
            <div
              className="prose prose-neutral max-w-none text-sm text-neutral-800 leading-relaxed font-sans"
              dangerouslySetInnerHTML={{ __html: sanitizedBody }}
            />
          </article>
        )}
      </div>
    </div>
  );
}
