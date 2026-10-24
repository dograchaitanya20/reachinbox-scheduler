'use client';

import * as React from 'react';
import { Upload, X, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import { isValidEmail, extractEmails } from '@/lib/email';
import { Pill } from '@/components/ui/Pill';

export interface RecipientInputProps {
  value: string[];
  onChange: (recipients: string[]) => void;
  error?: string;
  max?: number;
}

export function RecipientInput({
  value = [],
  onChange,
  error,
  max = 5000,
}: RecipientInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [invalidEntriesWarning, setInvalidEntriesWarning] = React.useState<string | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addEmails = (candidates: string[]) => {
    const valid: string[] = [];
    const invalid: string[] = [];

    candidates.forEach((cand) => {
      const trimmed = cand.trim().toLowerCase();
      if (!trimmed) return;
      if (isValidEmail(trimmed)) {
        valid.push(trimmed);
      } else {
        invalid.push(cand);
      }
    });

    if (invalid.length > 0) {
      setInvalidEntriesWarning(
        `${invalid.length} invalid email${invalid.length > 1 ? 's' : ''} skipped: ${invalid.slice(0, 3).join(', ')}${invalid.length > 3 ? '...' : ''}`
      );
    } else {
      setInvalidEntriesWarning(null);
    }

    if (valid.length > 0) {
      const merged = Array.from(new Set([...value, ...valid]));
      if (merged.length > max) {
        setInvalidEntriesWarning(`Maximum limit of ${max} recipients reached.`);
        onChange(merged.slice(0, max));
      } else {
        onChange(merged);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', ' ', ';'].includes(e.key)) {
      e.preventDefault();
      if (inputValue.trim()) {
        const found = extractEmails(inputValue);
        if (found.length > 0) {
          addEmails(found);
        } else {
          addEmails([inputValue]);
        }
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last email on backspace
      onChange(value.slice(0, -1));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const emails = extractEmails(pastedText);
    if (emails.length > 0) {
      addEmails(emails);
      setInputValue('');
    } else if (pastedText.trim()) {
      addEmails(pastedText.split(/[\s,;]+/));
      setInputValue('');
    }
  };

  const removeEmail = (indexToRemove: number) => {
    onChange(value.filter((_, i) => i !== indexToRemove));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const textContent = JSON.stringify(results.data);
        const extracted = extractEmails(textContent);
        if (extracted.length > 0) {
          addEmails(extracted);
        } else {
          setInvalidEntriesWarning('No valid email addresses found in the uploaded file.');
        }
      },
      error: () => {
        setInvalidEntriesWarning('Failed to parse uploaded file. Please ensure it is CSV or TXT format.');
      },
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const visibleChips = isExpanded ? value : value.slice(0, 3);
  const remainingCount = value.length - 3;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2">
        <div
          onClick={() => inputRef.current?.focus()}
          className="flex-1 flex flex-wrap items-center gap-1.5 py-1 min-h-[38px] cursor-text"
        >
          {visibleChips.map((email, idx) => (
            <span
              key={`${email}-${idx}`}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E4F5EA] text-[#00702A] border border-[#C2E8CF] animate-in fade-in-50"
            >
              <span>{email}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEmail(idx);
                }}
                className="hover:text-red-600 focus:outline-none p-0.5 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {!isExpanded && remainingCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E4F5EA] text-[#00702A] border border-[#C2E8CF] hover:bg-[#D4EDDE] transition-colors"
            >
              +{remainingCount}
            </button>
          )}

          {isExpanded && value.length > 3 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="text-xs text-neutral-500 hover:text-neutral-800 underline ml-1"
            >
              Show less
            </button>
          )}

          <input
            ref={inputRef}
            type="text"
            placeholder={value.length === 0 ? 'recipient@example.com' : ''}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={() => {
              if (inputValue.trim()) {
                const found = extractEmails(inputValue);
                if (found.length > 0) {
                  addEmails(found);
                } else {
                  addEmails([inputValue]);
                }
                setInputValue('');
              }
            }}
            className="flex-1 min-w-[160px] bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none py-1"
          />
        </div>

        {/* Upload List Button */}
        <div className="flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-full transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-500" />
            <span>Upload List</span>
          </button>
        </div>
      </div>

      {/* Recipient Counter & Warnings */}
      <div className="flex items-center justify-between text-xs mt-1">
        {value.length > 0 && (
          <span className="text-neutral-500 font-medium">
            {value.length} recipient{value.length === 1 ? '' : 's'} detected
          </span>
        )}

        {invalidEntriesWarning && (
          <span className="flex items-center gap-1 text-amber-600 font-medium ml-auto">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {invalidEntriesWarning}
          </span>
        )}

        {error && (
          <span className="text-red-600 font-medium ml-auto">{error}</span>
        )}
      </div>
    </div>
  );
}
