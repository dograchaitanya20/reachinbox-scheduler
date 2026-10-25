'use client';

import * as React from 'react';
import { Calendar as CalendarIcon, Clock, Check, X } from 'lucide-react';
import { Popover } from '@/components/ui/Popover';
import { Button } from '@/components/ui/Button';

export interface SendLaterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: Date | null) => void;
  selectedDate: Date | null;
  trigger: React.ReactNode;
}

// Timezone-safe local input formatter: returns YYYY-MM-DDTHH:mm in local time
function dateToInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Timezone-safe parser: parses local YYYY-MM-DDTHH:mm into local Date object
function inputValueToDate(val: string): Date | null {
  if (!val) return null;
  const [datePart, timePart] = val.split('T');
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  if (
    isNaN(year!) ||
    isNaN(month!) ||
    isNaN(day!) ||
    isNaN(hours!) ||
    isNaN(minutes!)
  ) {
    return null;
  }
  return new Date(year!, month! - 1, day!, hours!, minutes!, 0, 0);
}

export function SendLaterPopover({
  isOpen,
  onClose,
  onSelect,
  selectedDate,
  trigger,
}: SendLaterPopoverProps) {
  const [tempDate, setTempDate] = React.useState<string>('');

  React.useEffect(() => {
    if (selectedDate) {
      setTempDate(dateToInputValue(selectedDate));
    } else {
      // Default to 4 minutes in future when opening
      const d = new Date(Date.now() + 4 * 60 * 1000);
      setTempDate(dateToInputValue(d));
    }
  }, [selectedDate, isOpen]);

  const handleInputChange = (val: string) => {
    setTempDate(val);
    const parsed = inputValueToDate(val);
    if (parsed && parsed.getTime() > Date.now()) {
      onSelect(parsed);
    }
  };

  const setOffsetMinutes = (minutes: number) => {
    const d = new Date(Date.now() + minutes * 60 * 1000);
    const val = dateToInputValue(d);
    setTempDate(val);
    onSelect(d);
  };

  const setTomorrowAt = (hour: number, minute: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, minute, 0, 0);
    const val = dateToInputValue(d);
    setTempDate(val);
    onSelect(d);
  };

  const handleDone = () => {
    const parsed = inputValueToDate(tempDate);
    if (parsed) {
      onSelect(parsed);
    }
    onClose();
  };

  const handleClear = () => {
    onSelect(null);
    onClose();
  };

  const parsedDate = inputValueToDate(tempDate);
  const diffMinutes = parsedDate
    ? Math.round((parsedDate.getTime() - Date.now()) / 60000)
    : 0;

  return (
    <Popover
      isOpen={isOpen}
      onClose={() => {
        // Auto-save on closing if valid future date is picked
        const parsed = inputValueToDate(tempDate);
        if (parsed && parsed.getTime() > Date.now()) {
          onSelect(parsed);
        }
        onClose();
      }}
      align="right"
      className="w-84 p-5 shadow-2xl rounded-2xl border border-neutral-200"
      trigger={trigger}
    >
      <div className="flex flex-col gap-3.5 text-neutral-800">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-500" />
            Send Later
          </h4>
          {selectedDate && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-red-500 hover:text-red-700 font-medium"
            >
              Reset to now
            </button>
          )}
        </div>

        {/* Date & Time Input */}
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            Pick date & time
          </label>
          <input
            type="datetime-local"
            value={tempDate}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full text-xs bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:border-brand-500 font-medium"
          />
          {parsedDate && (
            <p className="mt-1 text-[11px] text-brand-600 font-medium">
              {diffMinutes > 0
                ? `Will send in ~${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`
                : 'Selected time is in the past! Please pick a future time.'}
            </p>
          )}
        </div>

        {/* Quick Picks */}
        <div className="flex flex-col gap-1 border-t border-b border-neutral-100 py-2">
          {/* 4 minutes ahead for restart test */}
          <button
            type="button"
            onClick={() => setOffsetMinutes(4)}
            className="text-left text-xs font-semibold text-brand-600 hover:bg-brand-50 px-2.5 py-1.5 rounded-md transition-colors flex items-center justify-between"
          >
            <span>In 4 minutes (Restart test)</span>
            <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">
              Recommended
            </span>
          </button>
          <button
            type="button"
            onClick={() => setOffsetMinutes(10)}
            className="text-left text-xs text-neutral-700 hover:text-brand-600 hover:bg-neutral-50 px-2.5 py-1.5 rounded-md transition-colors"
          >
            In 10 minutes
          </button>
          <button
            type="button"
            onClick={() => setTomorrowAt(9, 0)}
            className="text-left text-xs text-neutral-700 hover:text-brand-600 hover:bg-neutral-50 px-2.5 py-1.5 rounded-md transition-colors"
          >
            Tomorrow, 9:00 AM
          </button>
          <button
            type="button"
            onClick={() => setTomorrowAt(10, 0)}
            className="text-left text-xs text-neutral-700 hover:text-brand-600 hover:bg-neutral-50 px-2.5 py-1.5 rounded-md transition-colors"
          >
            Tomorrow, 10:00 AM
          </button>
          <button
            type="button"
            onClick={() => setTomorrowAt(11, 0)}
            className="text-left text-xs text-neutral-700 hover:text-brand-600 hover:bg-neutral-50 px-2.5 py-1.5 rounded-md transition-colors"
          >
            Tomorrow, 11:00 AM
          </button>
          <button
            type="button"
            onClick={() => setTomorrowAt(15, 0)}
            className="text-left text-xs text-neutral-700 hover:text-brand-600 hover:bg-neutral-50 px-2.5 py-1.5 rounded-md transition-colors"
          >
            Tomorrow, 3:00 PM
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDone}
            className="font-medium px-4 py-1.5 text-xs rounded-full"
          >
            Done
          </Button>
        </div>
      </div>
    </Popover>
  );
}
