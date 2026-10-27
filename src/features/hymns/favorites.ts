"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "b1app-hymn-favorites";

const readFavorites = (): string[] => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) && parsed.every((id) => typeof id === "string") ? parsed : [];
  } catch {
    return [];
  }
};

export const useHymnFavorites = () => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    setFavoriteIds(readFavorites());
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((current) => {
      const next = current.includes(id) ? current.filter((favoriteId) => favoriteId !== id) : [...current, id];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Favorites remain usable for this browser session when storage is unavailable.
      }
      return next;
    });
  }, []);

  return { favoriteIds, toggleFavorite };
};
