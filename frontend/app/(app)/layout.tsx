'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';

function SlackToastListener() {
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const slackParam = searchParams.get('slack');
    if (slackParam === 'connected') {
      toast.success('Slack connected successfully!');
      const url = new URL(window.location.href);
      url.searchParams.delete('slack');
      window.history.replaceState({}, '', url.pathname + url.search);
    } else if (slackParam === 'error') {
      toast.error('Failed to connect Slack.');
      const url = new URL(window.location.href);
      url.searchParams.delete('slack');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [searchParams]);

  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-neutral-400 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      <React.Suspense fallback={null}>
        <SlackToastListener />
      </React.Suspense>
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {children}
      </main>
    </div>
  );
}
