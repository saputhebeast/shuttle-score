"use client";

import { useState, useEffect, useCallback } from "react";
import { useGame } from "@/hooks/use-game";
import { usePlayerRoster } from "@/hooks/use-player-roster";
import { useTournament } from "@/hooks/use-tournament";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { ScoreBoard } from "@/components/scoreboard/score-board";
import { NewGameModal } from "@/components/new-game-modal";
import { MatchHistory } from "@/components/match-history";
import { SessionSummary } from "@/components/session-summary";
import { PlayerAnalytics } from "@/components/player-analytics";
import { TournamentBracket } from "@/components/tournament-bracket";
import { STORAGE_KEYS } from "@/lib/constants";
import type { NewGameConfig, RotationSession } from "@/lib/types";

type View = "home" | "tournament-bracket";

export default function Home() {
  const {
    game,
    elapsedMs,
    remainingMs,
    matchHistory,
    isHydrated,
    summary,
    suggestLastSet,
    startNewGame,
    addPoint,
    undo,
    markLastSet,
    endSession,
    dismissSummary,
    clearHistory,
  } = useGame();

  const { players, hydrated: playersHydrated, addPlayer } = usePlayerRoster();
  const {
    tournament,
    hydrated: tournamentHydrated,
    currentMatch,
    isComplete,
    standings,
    startTournament,
    recordResult,
    clearTournament,
  } = useTournament(players);

  const [view, setView] = useState<View>("home");
  /** Are we currently playing a tournament match? */
  const [tournamentMatchActive, setTournamentMatchActive] = useState(false);

  /** Rotation session for 5+ player free play — persisted to survive refresh */
  const [rotationSession, setRotationSession, removeRotationSession, rotationHydrated] =
    useLocalStorage<RotationSession | null>(STORAGE_KEYS.ROTATION_SESSION, null);

  // Restore view from tournament state after hydration
  useEffect(() => {
    if (tournamentHydrated && tournament) {
      setView("tournament-bracket");
    }
  }, [tournamentHydrated, tournament]);

  // When a tournament game ends and summary is dismissed,
  // record the result and go back to bracket
  const handleTournamentDismiss = useCallback(() => {
    if (tournament && tournamentMatchActive && game?.endedAt) {
      const matchIdx = tournament.currentMatchIndex;
      // Use match winner, or determine by sets won
      let winner = game.matchWinner;
      if (!winner) {
        const leftSets = game.sets.filter((s) => s.winner === "left").length;
        const rightSets = game.sets.filter((s) => s.winner === "right").length;
        if (leftSets !== rightSets) {
          winner = leftSets > rightSets ? "left" : "right";
        } else {
          // Tie-break by total points if sets are equal (e.g. session ended early)
          const leftPts = game.sets.reduce((sum, s) => sum + s.left, 0);
          const rightPts = game.sets.reduce((sum, s) => sum + s.right, 0);
          winner = leftPts >= rightPts ? "left" : "right";
        }
      }
      recordResult(
        matchIdx,
        winner,
        game.sets.filter((s) => s.winner),
        game.id
      );
      setTournamentMatchActive(false);
    }
    dismissSummary();
    if (tournament) {
      setView("tournament-bracket");
    }
  }, [tournament, tournamentMatchActive, game, recordResult, dismissSummary]);

  const handleTournamentPlayMatch = useCallback(
    (config: NewGameConfig) => {
      setTournamentMatchActive(true);
      startNewGame(config);
    },
    [startNewGame]
  );

  const handleClearTournament = useCallback(() => {
    clearTournament();
    setView("home");
  }, [clearTournament]);

  const handleStartTournament = useCallback(
    (playerIds: string[], penalty: string) => {
      startTournament(playerIds, penalty);
      setView("tournament-bracket");
    },
    [startTournament]
  );

  /** Start a game and track rotation if 5+ players */
  const handleStartGame = useCallback(
    (config: NewGameConfig) => {
      if (config.allSelectedPlayerIds && config.allSelectedPlayerIds.length >= 5) {
        setRotationSession({
          playerIds: config.allSelectedPlayerIds,
          rotation: config.initialRotation ?? 0,
          bestOf: config.bestOf,
          durationMinutes: config.durationMinutes,
        });
        // Force single-set games for rotation: free play + isLastSet
        startNewGame({
          ...config,
          bestOf: 0,
          durationMinutes: null,
          isLastSet: true,
        });
      } else {
        removeRotationSession();
        startNewGame(config);
      }
    },
    [startNewGame, setRotationSession, removeRotationSession]
  );

  /** After a rotation game ends, rotate players and start next game */
  const handleRotationDismiss = useCallback(() => {
    if (!rotationSession) {
      dismissSummary();
      return;
    }
    dismissSummary();
    const { playerIds, rotation, bestOf, durationMinutes } = rotationSession;
    const nextRotation = rotation + 1;
    const n = playerIds.length;
    const sitOutCount = n - 4;
    const sittingOutIndices = new Set<number>();
    for (let k = 0; k < sitOutCount; k++) {
      sittingOutIndices.add((nextRotation + k) % n);
    }
    const playing = playerIds.filter((_, i) => !sittingOutIndices.has(i));
    // Shuffle the 4 playing for random team assignment
    const shuffled = [...playing].sort(() => Math.random() - 0.5);
    const leftIds = [shuffled[0], shuffled[1]];
    const rightIds = [shuffled[2], shuffled[3]];
    const getPlayerName = (id: string) =>
      players.find((p) => p.id === id)?.name ?? "?";
    const leftName = leftIds.map(getPlayerName).join(" & ");
    const rightName = rightIds.map(getPlayerName).join(" & ");

    setRotationSession({
      ...rotationSession,
      rotation: nextRotation,
    });

    startNewGame({
      leftTeamName: leftName,
      rightTeamName: rightName,
      leftPlayerIds: leftIds,
      rightPlayerIds: rightIds,
      bestOf: 0,
      durationMinutes: null,
      isLastSet: true,
    });
  }, [rotationSession, dismissSummary, startNewGame, players]);

  // Wait for localStorage to hydrate before rendering to avoid SSR mismatch
  if (!isHydrated || !playersHydrated || !tournamentHydrated || !rotationHydrated) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-900">
        <div className="text-4xl animate-pulse">🏸</div>
      </div>
    );
  }

  // Session just ended → show summary
  if (game && summary) {
    const handleDismiss = tournamentMatchActive
      ? handleTournamentDismiss
      : rotationSession
        ? handleRotationDismiss
        : dismissSummary;
    return (
      <SessionSummary
        game={game}
        stats={summary}
        onDismiss={handleDismiss}
        rotationSession={rotationSession ? {
          gameNumber: rotationSession.rotation + 1,
          totalPlayers: rotationSession.playerIds.length,
          currentSittingOut: (() => {
            const n = rotationSession.playerIds.length;
            const rot = rotationSession.rotation;
            const sitOutCount = n - 4;
            const names: string[] = [];
            for (let k = 0; k < sitOutCount; k++) {
              const idx = (rot + k) % n;
              const p = players.find(pl => pl.id === rotationSession.playerIds[idx]);
              if (p) names.push(p.name);
            }
            return names;
          })(),
          sittingOutNext: (() => {
            const n = rotationSession.playerIds.length;
            const nextRot = rotationSession.rotation + 1;
            const sitOutCount = n - 4;
            const names: string[] = [];
            for (let k = 0; k < sitOutCount; k++) {
              const idx = (nextRot + k) % n;
              const p = players.find(pl => pl.id === rotationSession.playerIds[idx]);
              if (p) names.push(p.name);
            }
            return names;
          })(),
        } : undefined}
        onEndRotation={rotationSession ? () => { removeRotationSession(); dismissSummary(); } : undefined}
      />
    );
  }

  // Active game → show scoreboard (works for both regular and tournament matches)
  if (game) {
    // Build rotation info for scoreboard display
    const rotationInfo = rotationSession ? {
      gameNumber: rotationSession.rotation + 1,
      totalPlayers: rotationSession.playerIds.length,
      sittingOut: (() => {
        const n = rotationSession.playerIds.length;
        const rot = rotationSession.rotation;
        const sitOutCount = n - 4;
        const names: string[] = [];
        for (let k = 0; k < sitOutCount; k++) {
          const idx = (rot + k) % n;
          const p = players.find(pl => pl.id === rotationSession.playerIds[idx]);
          if (p) names.push(p.name);
        }
        return names;
      })(),
    } : undefined;

    return (
      <ScoreBoard
        game={game}
        elapsedMs={elapsedMs}
        remainingMs={remainingMs}
        suggestLastSet={suggestLastSet}
        onScore={addPoint}
        onUndo={undo}
        onReset={endSession}
        onMarkLastSet={markLastSet}
        rotationInfo={rotationInfo}
      />
    );
  }

  // Tournament bracket / progress screen
  if (view === "tournament-bracket" && tournament) {
    return (
      <TournamentBracket
        tournament={tournament}
        players={players}
        standings={standings}
        currentMatch={currentMatch}
        isComplete={isComplete}
        onPlayMatch={handleTournamentPlayMatch}
        onClearTournament={handleClearTournament}
      />
    );
  }

  // No active game → show home screen
  return (
    <div className="overflow-y-auto h-[100dvh] scroll-smooth safe-bottom">
      <NewGameModal
        onStart={handleStartGame}
        onStartTournament={handleStartTournament}
        players={players}
        onAddPlayer={addPlayer}
      />

      <PlayerAnalytics players={players} matches={matchHistory} />
      <MatchHistory
        matches={matchHistory}
        players={players}
        onClearHistory={clearHistory}
        onNewGame={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />
    </div>
  );
}
