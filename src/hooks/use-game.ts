"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GameState, MatchSummary, SessionStats, TeamSide, NewGameConfig } from "@/lib/types";
import { createInitialGameState, STORAGE_KEYS } from "@/lib/constants";
import { scorePoint, undoLastPoint, computeSessionStats, shouldSuggestLastSet, getRemainingMs } from "@/lib/game-engine";
import { useLocalStorage } from "./use-local-storage";
import { useWakeLock } from "./use-wake-lock";

/**
 * Main game hook — orchestrates the entire game lifecycle.
 * Handles scoring, undo, persistence, and match history.
 */
export function useGame() {
  const [game, setGame, removeGame, gameHydrated] = useLocalStorage<GameState | null>(
    STORAGE_KEYS.CURRENT_GAME,
    null
  );
  const [matchHistory, setMatchHistory, , historyHydrated] = useLocalStorage<MatchSummary[]>(
    STORAGE_KEYS.MATCH_HISTORY,
    []
  );
  const [elapsedMs, setElapsedMs] = useState(0);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [summary, setSummary] = useState<SessionStats | null>(null);
  const [suggestLastSet, setSuggestLastSet] = useState(false);

  // Keep screen awake during an active game
  const isGameActive = game !== null && !game.endedAt;
  useWakeLock(isGameActive);

  // Elapsed time + remaining time ticker
  useEffect(() => {
    if (!game || game.endedAt) {
      setElapsedMs(0);
      setRemainingMs(null);
      return;
    }

    const tick = () => {
      setElapsedMs(Date.now() - game.startedAt);
      const rem = getRemainingMs(game);
      setRemainingMs(rem);

      // Auto-suggest last set
      if (!game.isLastSet && shouldSuggestLastSet(game)) {
        setSuggestLastSet(true);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [game]);

  // Detect when game ends (endedAt gets set) → show summary
  useEffect(() => {
    if (game?.endedAt && !summary) {
      const stats = computeSessionStats(game);
      setSummary(stats);

      // Save to history
      const matchSummary: MatchSummary = {
        id: game.id,
        teams: game.teams,
        sets: game.sets.filter((s) => s.winner),
        matchWinner: game.matchWinner,
        startedAt: game.startedAt,
        endedAt: game.endedAt,
        bestOf: game.bestOf,
        stats,
      };
      setMatchHistory((prev) => [matchSummary, ...prev]);
    }
  }, [game?.endedAt, summary, game, setMatchHistory]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  const startNewGame = useCallback(
    (config: NewGameConfig) => {
      const newGame = createInitialGameState(
        config.leftTeamName || undefined,
        config.rightTeamName || undefined,
        config.bestOf,
        config.durationMinutes
      );
      setSummary(null);
      setSuggestLastSet(false);
      setGame(newGame);
    },
    [setGame]
  );

  const addPoint = useCallback(
    (team: TeamSide) => {
      if (!game || game.endedAt) return;

      const newState = scorePoint(game, team);
      setGame(newState);

      // Haptic feedback
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(50);
      }
    },
    [game, setGame]
  );

  const undo = useCallback(() => {
    if (!game) return;
    const newState = undoLastPoint(game);
    setGame(newState);
  }, [game, setGame]);

  const markLastSet = useCallback(() => {
    if (!game || game.bestOf !== 0) return;
    setGame({ ...game, isLastSet: true });
    setSuggestLastSet(false);
  }, [game, setGame]);

  const endSession = useCallback(() => {
    if (!game) return;
    // Force end — compute stats now
    const endedGame: GameState = { ...game, endedAt: Date.now() };
    const stats = computeSessionStats(endedGame);
    setSummary(stats);

    // Save to history
    const matchSummary: MatchSummary = {
      id: game.id,
      teams: game.teams,
      sets: game.sets.filter((s) => s.winner),
      matchWinner: game.matchWinner,
      startedAt: game.startedAt,
      endedAt: Date.now(),
      bestOf: game.bestOf,
      stats,
    };
    setMatchHistory((prev) => [matchSummary, ...prev]);
    setGame(endedGame);
  }, [game, setGame, setMatchHistory]);

  const dismissSummary = useCallback(() => {
    setSummary(null);
    removeGame();
  }, [removeGame]);

  const clearHistory = useCallback(() => {
    setMatchHistory([]);
  }, [setMatchHistory]);

  return {
    game,
    elapsedMs,
    remainingMs,
    matchHistory,
    isGameActive,
    isHydrated: gameHydrated && historyHydrated,
    summary,
    suggestLastSet,
    startNewGame,
    addPoint,
    undo,
    markLastSet,
    endSession,
    dismissSummary,
    clearHistory,
  };
}
