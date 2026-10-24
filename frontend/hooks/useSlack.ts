'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SlackStatus } from '@/types';

export function useSlack() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<SlackStatus>({
    queryKey: ['slackStatus'],
    queryFn: () => api.getSlackStatus(),
    staleTime: 60 * 1000,
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.disconnectSlack(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slackStatus'] });
    },
  });

  const connect = () => {
    window.location.href = '/api/slack/connect';
  };

  return {
    isConnected: !!data?.connected,
    isLoading,
    connect,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
    refetch,
  };
}
