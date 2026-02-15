"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook that persists state to localStorage with SSR safety.
 * Falls back to initial value if localStorage is unavailable.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  // Read from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch {
      console.warn(`Error reading localStorage key "${key}":`, key);
    }
    setHydrated(true);
  }, [key]);

  // Persist to localStorage on change (only after initial hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      console.warn(`Error writing localStorage key "${key}":`, key);
    }
  }, [key, storedValue, hydrated]);

  const remove = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch {
      console.warn(`Error removing localStorage key "${key}":`, key);
    }
  }, [key, initialValue]);

  return [storedValue, setStoredValue, remove, hydrated] as const;
}
