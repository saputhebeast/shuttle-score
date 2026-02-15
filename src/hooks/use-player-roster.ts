"use client";

import { useCallback } from "react";
import type { Player } from "@/lib/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { useLocalStorage } from "./use-local-storage";

/**
 * Hook for managing the player roster (CRUD operations).
 */
export function usePlayerRoster() {
  const [players, setPlayers, , hydrated] = useLocalStorage<Player[]>(
    STORAGE_KEYS.PLAYERS,
    []
  );

  const addPlayer = useCallback(
    (name: string): Player => {
      const player: Player = {
        id: crypto.randomUUID(),
        name: name.trim(),
        createdAt: Date.now(),
      };
      setPlayers((prev) => [...prev, player]);
      return player;
    },
    [setPlayers]
  );

  const removePlayer = useCallback(
    (id: string) => {
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    },
    [setPlayers]
  );

  const renamePlayer = useCallback(
    (id: string, newName: string) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: newName.trim() } : p))
      );
    },
    [setPlayers]
  );

  const getPlayer = useCallback(
    (id: string): Player | undefined => {
      return players.find((p) => p.id === id);
    },
    [players]
  );

  return {
    players,
    hydrated,
    addPlayer,
    removePlayer,
    renamePlayer,
    getPlayer,
  };
}
