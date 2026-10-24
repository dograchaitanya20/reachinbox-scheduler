'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, Send, ChevronDown, LogOut, MessageSquare, Plus } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useCounts } from '@/hooks/useEmailQueries';
import { useSlack } from '@/hooks/useSlack';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { data: counts } = useCounts();
  const { isConnected: isSlackConnected, connect: connectSlack, disconnect: disconnectSlack } = useSlack();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const scheduledActive = pathname.startsWith('/scheduled');
  const sentActive = pathname.startsWith('/sent');

  return (
    <aside className="w-64 flex-shrink-0 h-screen bg-white border-r border-neutral-200/80 flex flex-col justify-between p-4 select-none">
      <div className="flex flex-col gap-6">
        {/* Pixel Logo */}
        <div className="pt-2 px-1">
          <Link href="/scheduled" className="inline-block">
            <span className="font-pixel text-2xl font-black tracking-tight text-neutral-900 hover:opacity-85 transition-opacity">
              ONB
            </span>
          </Link>
        </div>

        {/* User Card Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-200/60 text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                src={user?.avatar}
                name={user?.name || 'Oliver Brown'}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900 truncate">
                  {user?.name || 'Oliver Brown'}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {user?.email || 'oliver.brown@domain.io'}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-neutral-400 flex-shrink-0 ml-1 transition-transform ${
                userMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-neutral-200/80 py-1.5 z-50">
              {isSlackConnected ? (
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    disconnectSlack();
                  }}
                  className="w-full px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5 text-left"
                >
                  <MessageSquare className="w-4 h-4 text-neutral-500" />
                  Disconnect Slack
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    connectSlack();
                  }}
                  className="w-full px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5 text-left"
                >
                  <MessageSquare className="w-4 h-4 text-neutral-500" />
                  Connect Slack
                </button>
              )}
              <div className="h-px bg-neutral-100 my-1" />
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 text-left"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Compose Button */}
        <div>
          <Link href="/compose" className="block w-full">
            <Button
              variant="outline"
              className="w-full border-brand-500 text-brand-600 hover:bg-brand-50 font-medium py-2 rounded-full flex items-center justify-center gap-2"
            >
              Compose
            </Button>
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="flex flex-col gap-1.5">
          <div className="px-2 pb-1">
            <span className="text-[11px] font-bold text-neutral-400 tracking-wider uppercase">
              CORE
            </span>
          </div>

          <Link
            href="/scheduled"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              scheduledActive
                ? 'bg-brand-100 text-brand-600'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4" />
              <span>Scheduled</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                scheduledActive
                  ? 'bg-brand-200/70 text-brand-700 font-semibold'
                  : 'text-neutral-400 font-normal'
              }`}
            >
              {counts?.scheduled ?? 0}
            </span>
          </Link>

          <Link
            href="/sent"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              sentActive
                ? 'bg-brand-100 text-brand-600'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Send className="w-4 h-4" />
              <span>Sent</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                sentActive
                  ? 'bg-brand-200/70 text-brand-700 font-semibold'
                  : 'text-neutral-400 font-normal'
              }`}
            >
              {counts?.sent ?? 0}
            </span>
          </Link>
        </div>
      </div>

      <div className="text-xs text-neutral-400 px-2 pb-2">
        <span>ReachInbox Scheduler</span>
      </div>
    </aside>
  );
}
