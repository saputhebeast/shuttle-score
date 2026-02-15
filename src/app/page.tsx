"use client";

import { useGame } from "@/hooks/use-game";
import { ScoreBoard } from "@/components/scoreboard/score-board";
import { NewGameModal } from "@/components/new-game-modal";
import { MatchHistory } from "@/components/match-history";
import { SessionSummary } from "@/components/session-summary";

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

  // Wait for localStorage to hydrate before rendering to avoid SSR mismatch
  if (!isHydrated) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-gray-900">
        <div className="text-4xl animate-pulse">🏸</div>
      </div>
    );
  }

  // Session just ended → show summary
  if (game && summary) {
    return (
      <SessionSummary
        game={game}
        stats={summary}
        onDismiss={dismissSummary}
      />
    );
  }

  // No active game → show new game screen
  if (!game) {
    return (
      <div className="overflow-y-auto h-[100dvh] scroll-smooth safe-bottom">
        <NewGameModal onStart={startNewGame} />
        <MatchHistory
          matches={matchHistory}
          onClearHistory={clearHistory}
          onNewGame={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />
      </div>
    );
  }

  // Active game → show scoreboard
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
    />
  );
}
