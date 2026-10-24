'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Email, Counts, Sender } from '@/types';

export function useCounts() {
  return useQuery<Counts>({
    queryKey: ['counts'],
    queryFn: () => api.getCounts(),
    refetchInterval: 10000,
  });
}

export function useSenders() {
  return useQuery<Sender[]>({
    queryKey: ['senders'],
    queryFn: () => api.getSenders(),
    staleTime: 60 * 1000,
  });
}

export function useEmailDetail(id: string) {
  return useQuery<Email>({
    queryKey: ['email', id],
    queryFn: () => api.getEmail(id),
    enabled: Boolean(id),
  });
}

export function useEmails(
  tab: 'scheduled' | 'sent',
  searchQuery: string = '',
  filter: 'all' | 'sent' | 'failed' = 'all'
) {
  const trimmedSearch = searchQuery.trim();

  const query = useQuery<Email[]>({
    queryKey: ['emails', tab, trimmedSearch],
    queryFn: async () => {
      if (trimmedSearch) {
        return api.searchEmails(trimmedSearch);
      }
      return api.getEmails(tab === 'sent' ? 'sent' : undefined);
    },
    refetchInterval: 10000,
  });

  const rawEmails = query.data || [];

  const emails = rawEmails.filter((email) => {
    if (tab === 'scheduled') {
      return email.status === 'scheduled' || email.status === 'sending';
    } else {
      // sent tab
      if (email.status !== 'sent' && email.status !== 'failed') {
        return false;
      }
      if (filter === 'sent') return email.status === 'sent';
      if (filter === 'failed') return email.status === 'failed';
      return true;
    }
  });

  return {
    ...query,
    emails,
  };
}
