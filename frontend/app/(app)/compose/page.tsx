'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Paperclip, Clock, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { RecipientInput } from '@/components/RecipientInput';
import { RichTextEditor } from '@/components/RichTextEditor';
import { SendLaterPopover } from '@/components/SendLaterPopover';
import { useSenders } from '@/hooks/useEmailQueries';
import { api, ApiError } from '@/lib/api';
import type { SchedulePayload } from '@/types';

export default function ComposePage() {
  const router = useRouter();
  const { data: senders = [] } = useSenders();

  // Form states
  const [selectedSenderId, setSelectedSenderId] = React.useState<string>('');
  const [leads, setLeads] = React.useState<string[]>([]);
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [delaySec, setDelaySec] = React.useState<string>('');
  const [hourlyLimit, setHourlyLimit] = React.useState<string>('');

  // Send later popover state
  const [isSendLaterOpen, setIsSendLaterOpen] = React.useState(false);
  const [scheduledTime, setScheduledTime] = React.useState<Date | null>(null);

  // Validation / errors
  const [fieldErrors, setFieldErrors] = React.useState<{
    subject?: string[];
    body?: string[];
    leads?: string[];
    startTime?: string[];
  }>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSend = async () => {
    setFieldErrors({});

    // Client-side quick checks
    const errors: { [key: string]: string[] } = {};
    if (leads.length === 0) {
      errors.leads = ['Please add at least one recipient email address'];
    }
    if (!subject.trim()) {
      errors.subject = ['Subject is required'];
    }
    if (!body.trim() || body === '<p></p>') {
      errors.body = ['Email body is required'];
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const startTime = scheduledTime ? scheduledTime.toISOString() : new Date().toISOString();

      const payload: SchedulePayload = {
        subject: subject.trim(),
        body,
        leads,
        startTime,
      };

      if (selectedSenderId) {
        payload.senderId = selectedSenderId;
      }

      if (delaySec.trim()) {
        const parsedDelay = parseInt(delaySec, 10);
        if (!isNaN(parsedDelay) && parsedDelay >= 0) {
          payload.delaySec = parsedDelay;
        }
      }

      if (hourlyLimit.trim()) {
        const parsedLimit = parseInt(hourlyLimit, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          payload.hourlyLimit = parsedLimit;
        }
      }

      const res = await api.scheduleEmails(payload);
      toast.success(`${res.scheduled} emails scheduled`);
      router.push('/scheduled');
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && err.data) {
        const data = err.data as { fieldErrors?: { [key: string]: string[] } };
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
          toast.error('Please resolve the errors highlighted below.');
          return;
        }
      }
      toast.error((err as Error).message || 'Failed to schedule emails.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
      {/* Top Header */}
      <div className="py-3.5 px-6 border-b border-neutral-100 flex items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 rounded-full hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-neutral-900">
            Compose New Email
          </h1>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Paperclip (Disabled) */}
          <div className="relative group">
            <button
              type="button"
              disabled
              className="p-2 rounded-full text-neutral-400 hover:text-neutral-600 cursor-not-allowed"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Attachments not supported yet
            </div>
          </div>

          {/* Clock icon opening Send Later popover */}
          <SendLaterPopover
            isOpen={isSendLaterOpen}
            onClose={() => setIsSendLaterOpen(false)}
            onSelect={(date) => setScheduledTime(date)}
            selectedDate={scheduledTime}
            trigger={
              <button
                type="button"
                onClick={() => setIsSendLaterOpen((prev) => !prev)}
                className={`p-2 rounded-full hover:bg-neutral-100 transition-colors ${
                  scheduledTime
                    ? 'text-brand-600 bg-brand-50'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
                title={
                  scheduledTime
                    ? `Scheduled for: ${scheduledTime.toLocaleString()}`
                    : 'Schedule Send Later'
                }
              >
                <Clock className="w-4 h-4" />
              </button>
            }
          />

          {/* Send / Send Later Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSend}
            disabled={isSubmitting}
            className="border-brand-500 text-brand-600 hover:bg-brand-50 font-medium px-5 py-2 text-xs rounded-full min-w-[70px]"
          >
            {isSubmitting
              ? 'Scheduling...'
              : scheduledTime
              ? 'Send Later'
              : 'Send'}
          </Button>
        </div>
      </div>

      {/* Scheduled Time Banner (when Send Later is active) */}
      {scheduledTime && (
        <div className="bg-[#FFF1E3] border-b border-[#FFE0C2] px-6 py-2 flex items-center justify-between text-xs text-[#D4570F]">
          <div className="flex items-center gap-2 font-medium">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>
              Scheduled to send on: <strong>{scheduledTime.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</strong>
              {' '}(in {Math.max(1, Math.round((scheduledTime.getTime() - Date.now()) / 60000))} min)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setScheduledTime(null)}
            className="text-xs font-semibold underline hover:text-[#9A3412] ml-4"
          >
            Clear (send now)
          </button>
        </div>
      )}

      {/* Main Form Fields */}
      <div className="flex-1 overflow-y-auto px-8 py-6 max-w-4xl w-full mx-auto flex flex-col gap-4">
        {/* From Row */}
        <div className="flex items-center py-2 border-b border-neutral-100 gap-4 text-sm">
          <label className="w-16 flex-shrink-0 text-neutral-500 font-medium">
            From
          </label>
          <div className="relative flex-1 max-w-sm">
            <select
              value={selectedSenderId}
              onChange={(e) => setSelectedSenderId(e.target.value)}
              className="w-full appearance-none bg-transparent py-1 pr-8 text-neutral-800 font-medium text-sm focus:outline-none cursor-pointer"
            >
              <option value="">Auto-rotate senders</option>
              {senders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* To Row */}
        <div className="flex items-start py-2 border-b border-neutral-100 gap-4 text-sm">
          <label className="w-16 flex-shrink-0 pt-2 text-neutral-500 font-medium">
            To
          </label>
          <div className="flex-1 min-w-0">
            <RecipientInput
              value={leads}
              onChange={setLeads}
              error={fieldErrors.leads?.[0]}
            />
          </div>
        </div>

        {/* Subject Row */}
        <div className="flex items-center py-2 border-b border-neutral-100 gap-4 text-sm">
          <label className="w-16 flex-shrink-0 text-neutral-500 font-medium">
            Subject
          </label>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-transparent py-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none font-medium"
            />
            {fieldErrors.subject?.[0] && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                {fieldErrors.subject[0]}
              </p>
            )}
          </div>
        </div>

        {/* Delay & Hourly Limit Row */}
        <div className="flex items-center flex-wrap gap-6 py-2 border-b border-neutral-100 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-neutral-500 font-normal">
              Delay between 2 emails
            </span>
            <input
              type="number"
              min="0"
              placeholder="00"
              value={delaySec}
              onChange={(e) => setDelaySec(e.target.value)}
              className="w-14 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-center text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-neutral-500 font-normal">Hourly Limit</span>
            <input
              type="number"
              min="1"
              placeholder="00"
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(e.target.value)}
              className="w-14 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-center text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Rich Text Editor */}
        <div className="mt-2 flex-1 flex flex-col">
          <RichTextEditor
            content={body}
            onChange={setBody}
            placeholder="Type Your Reply..."
          />
          {fieldErrors.body?.[0] && (
            <p className="text-xs text-red-600 mt-1 font-medium">
              {fieldErrors.body[0]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
