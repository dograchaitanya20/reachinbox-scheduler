'use client';

import * as React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Popover } from '@/components/ui/Popover';
import { Button } from '@/components/ui/Button';

export interface SendLaterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: Date | null) => void;
  selectedDate: Date | null;
  trigger: React.ReactNode;
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
      // Format as YYYY-MM-DDTHH:mm for datetime-local
      const tzOffset = selectedDate.getTimezoneOffset() * 60000;
      const localISOTime = new Date(selectedDate.getTime() - tzOffset).toISOString().slice(0, 16);
      setTempDate(localISOTime);
    } else {
      setTempDate('');
    }
  }, [selectedDate, isOpen]);

  const setTomorrowAt = (hour: number, minute: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, minute, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    setTempDate(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
  };

  const handleDone = () => {
    if (tempDate) {
      onSelect(new Date(tempDate));
    } else {
      onSelect(null);
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      align="right"
      className="w-80 p-5 shadow-2xl rounded-2xl border border-neutral-200"
      trigger={trigger}
    >
      <div className="flex flex-col gap-4 text-neutral-800">
        <h4 className="text-base font-semibold text-neutral-900">Send Later</h4>

        {/* Date & Time Input */}
        <div className="relative">
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            Pick date & time
          </label>
          <div className="relative flex items-center">
            <input
              type="datetime-local"
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              className="w-full text-xs bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Quick Picks */}
        <div className="flex flex-col gap-1 border-t border-b border-neutral-100 py-2">
          <button
            type="button"
            onClick={() => setTomorrowAt(9, 0)}
            className="text-left text-xs text-neutral-700 hover:text-brand-600 hover:bg-neutral-50 px-2.5 py-1.5 rounded-md transition-colors"
          >
            Tomorrow
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
            onClick={handleCancel}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDone}
            className="border-brand-500 text-brand-600 hover:bg-brand-50 font-medium px-4 py-1.5 text-xs rounded-full"
          >
            Done
          </Button>
        </div>
      </div>
    </Popover>
  );
}
