'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'reachinbox_starred_emails';

export function useStarred() {
  const [starredSet, setStarredSet] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) {
          setStarredSet(new Set(arr));
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
    setMounted(true);
  }, []);

  const toggleStar = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setStarredSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // Ignore localStorage write errors
      }
      return next;
    });
  }, []);

  const isStarred = useCallback(
    (id: string) => {
      if (!mounted) return false;
      return starredSet.has(id);
    },
    [starredSet, mounted]
  );

  return { isStarred, toggleStar };
}
