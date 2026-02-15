"use client";

import { useCallback } from "react";
import type { Player, Tournament, TeamSide, SetScore } from "@/lib/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { useLocalStorage } from "./use-local-storage";
import {
  createTournament,
  recordTournamentResult,
  computeStandings,
} from "@/lib/tournament-engine";

/**
 * Hook for managing a round-robin tournament lifecycle.
 */
export function useTournament(players: Player[]) {
  const [tournament, setTournament, removeTournament, hydrated] =
    useLocalStorage<Tournament | null>(STORAGE_KEYS.TOURNAMENT, null);

  /** Start a new tournament with 4–5 players and a penalty. */
  const startTournament = useCallback(
    (playerIds: string[], penalty: string) => {
      const t = createTournament(playerIds, penalty);
      setTournament(t);
      return t;
    },
    [setTournament]
  );

  /** Record the result of the current match. */
  const recordResult = useCallback(
    (
      matchIndex: number,
      winner: TeamSide,
      sets: SetScore[],
      matchId: string
    ) => {
      if (!tournament) return;
      const updated = recordTournamentResult(
        tournament,
        matchIndex,
        winner,
        sets,
        matchId
      );
      setTournament(updated);
    },
    [tournament, setTournament]
  );

  /** Get current match (the next unplayed one), or null if all done. */
  const currentMatch =
    tournament && tournament.currentMatchIndex < tournament.matches.length
      ? tournament.matches[tournament.currentMatchIndex]
      : null;

  /** Are all matches played? */
  const isComplete = tournament?.completedAt !== null && tournament?.completedAt !== undefined;

  /** Standings (sorted worst → best). */
  const standings = tournament ? computeStandings(tournament, players) : [];

  /** Clear tournament. */
  const clearTournament = useCallback(() => {
    removeTournament();
  }, [removeTournament]);

  return {
    tournament,
    hydrated,
    currentMatch,
    isComplete,
    standings,
    startTournament,
    recordResult,
    clearTournament,
  };
}
