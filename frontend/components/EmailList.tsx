'use client';

import * as React from 'react';
import { Search, Filter, RotateCw, AlertCircle } from 'lucide-react';
import { EmailRow } from './EmailRow';
import { Input } from '@/components/ui/Input';
import { EmailRowSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Popover } from '@/components/ui/Popover';
import { useDebounce } from '@/hooks/useDebounce';
import { useEmails } from '@/hooks/useEmailQueries';

export interface EmailListProps {
  tab: 'scheduled' | 'sent';
}

export function EmailList({ tab }: EmailListProps) {
  const [searchInput, setSearchInput] = React.useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [filter, setFilter] = React.useState<'all' | 'sent' | 'failed'>('all');
  const [filterMenuOpen, setFilterMenuOpen] = React.useState(false);

  const {
    emails,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useEmails(tab, debouncedSearch, filter);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
      {/* Top Header / Search Bar Bar */}
      <div className="py-4 px-6 border-b border-neutral-100 flex items-center justify-between gap-4">
        <div className="max-w-md w-full">
          <Input
            pill
            leadingIcon={<Search className="w-4 h-4" />}
            placeholder="Search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-neutral-50 border-neutral-200/80 focus:bg-white text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Popover */}
          <Popover
            isOpen={filterMenuOpen}
            onClose={() => setFilterMenuOpen(false)}
            align="right"
            className="w-36 py-1"
            trigger={
              <button
                type="button"
                onClick={() => setFilterMenuOpen((prev) => !prev)}
                className={`p-2 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-colors ${
                  filter !== 'all' ? 'bg-brand-50 text-brand-600' : ''
                }`}
                title="Filter emails"
              >
                <Filter className="w-4 h-4" />
              </button>
            }
          >
            <div className="flex flex-col text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setFilter('all');
                  setFilterMenuOpen(false);
                }}
                className={`px-3 py-1.5 text-left rounded-md hover:bg-neutral-50 ${
                  filter === 'all' ? 'text-brand-600 font-semibold bg-brand-50' : 'text-neutral-700'
                }`}
              >
                All
              </button>
              {tab === 'sent' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setFilter('sent');
                      setFilterMenuOpen(false);
                    }}
                    className={`px-3 py-1.5 text-left rounded-md hover:bg-neutral-50 ${
                      filter === 'sent' ? 'text-brand-600 font-semibold bg-brand-50' : 'text-neutral-700'
                    }`}
                  >
                    Sent
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilter('failed');
                      setFilterMenuOpen(false);
                    }}
                    className={`px-3 py-1.5 text-left rounded-md hover:bg-neutral-50 ${
                      filter === 'failed' ? 'text-red-600 font-semibold bg-red-50' : 'text-neutral-700'
                    }`}
                  >
                    Failed
                  </button>
                </>
              )}
            </div>
          </Popover>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching || isLoading}
            className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-colors disabled:opacity-50"
            title="Refresh list"
          >
            <RotateCw
              className={`w-4 h-4 ${isRefetching ? 'animate-spin text-brand-500' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="divide-y divide-neutral-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <EmailRowSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <h4 className="text-base font-semibold text-neutral-800 mb-1">
              Failed to load emails
            </h4>
            <p className="text-sm text-neutral-500 mb-4 max-w-sm">
              {error?.message || 'An unexpected error occurred while fetching emails.'}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : emails.length === 0 ? (
          <EmptyState
            title={
              debouncedSearch
                ? 'No matching emails found'
                : tab === 'scheduled'
                ? 'No scheduled emails'
                : 'No sent emails yet'
            }
            description={
              debouncedSearch
                ? `No emails matched "${debouncedSearch}". Try a different search query.`
                : tab === 'scheduled'
                ? 'You do not have any scheduled emails waiting to be sent.'
                : 'Emails you send or schedule will show up here once processed.'
            }
          />
        ) : (
          <div className="divide-y divide-neutral-100">
            {emails.map((email) => (
              <EmailRow key={email.id} email={email} tab={tab} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
