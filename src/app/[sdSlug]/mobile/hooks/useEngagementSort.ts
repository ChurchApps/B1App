"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// localStorage-backed view-count tracker, used to re-order cards so the most
// engaged items float to the top. Previously duplicated in DashboardPage and
// GroupsPage with different storage keys.

const readViewCounts = (storageKey: string): Record<string, number> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeViewCounts = (storageKey: string, counts: Record<string, number>) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(counts));
  } catch {
    /* ignore quota / private-mode failures */
  }
};

export interface UseEngagementSortResult<T> {
  sorted: T[];
  increment: (id: string) => void;
  viewCounts: Record<string, number>;
}

// Stable descending sort by view count. Ties preserve the original (input) order.
// `getId` extracts the identity used to store/read counts.
export function useEngagementSort<T>(
  items: T[] | null | undefined,
  storageKey: string,
  getId: (item: T) => string
): UseEngagementSortResult<T> {
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setViewCounts(readViewCounts(storageKey));
  }, [storageKey]);

  const increment = useCallback((id: string) => {
    if (!id) return;
    setViewCounts((prev) => {
      const next = { ...prev, [id]: (prev[id] || 0) + 1 };
      writeViewCounts(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const sorted = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return [];
    return items
      .map((item, index) => ({ item, index, count: viewCounts[getId(item)] || 0 }))
      .sort((a, b) => (a.count === b.count ? a.index - b.index : b.count - a.count))
      .map((entry) => entry.item);
  }, [items, viewCounts, getId]);

  return { sorted, increment, viewCounts };
}
