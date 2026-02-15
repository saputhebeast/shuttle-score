"use client";

import type { GameState } from "@/lib/types";
import { getSetsWon, getGamePointInfo, formatElapsedTime, isDeuce, formatDuration } from "@/lib/game-engine";
import { TeamScore } from "./team-score";
import { SetIndicator, SetsWonIndicator } from "./set-indicator";
import { GameControls } from "./game-controls";

interface ScoreBoardProps {
  game: GameState;
  elapsedMs: number;
  remainingMs: number | null;
  suggestLastSet: boolean;
  onScore: (team: "left" | "right") => void;
  onUndo: () => void;
  onReset: () => void;
  onMarkLastSet: () => void;
}

export function ScoreBoard({
  game,
  elapsedMs,
  remainingMs,
  suggestLastSet,
  onScore,
  onUndo,
  onReset,
  onMarkLastSet,
}: ScoreBoardProps) {
  const currentSet = game.sets[game.currentSet];
  const setsWon = getSetsWon(game.sets);
  const gamePoint = getGamePointInfo(currentSet, game.sets, game.bestOf);
  const deuce = isDeuce(currentSet);
  const isMatchOver = game.matchWinner !== null || !!game.endedAt;
  const isFreePlay = game.bestOf === 0;

  // Build game point label
  let gamePointLabel: string | null = null;
  if (game.isLastSet) {
    if (deuce) {
      gamePointLabel = "Deuce! — Final Set";
    } else if (gamePoint) {
      gamePointLabel = `Match Point — ${game.teams[gamePoint.team].name}`;
    } else {
      gamePointLabel = "🏁 Final Set";
    }
  } else if (deuce) {
    gamePointLabel = "Deuce!";
  } else if (gamePoint) {
    const teamName = game.teams[gamePoint.team].name;
    gamePointLabel =
      gamePoint.type === "match"
        ? `Match Point — ${teamName}`
        : `Set Point — ${teamName}`;
  }

  // Time display
  const timeDisplay = remainingMs !== null && remainingMs > 0
    ? formatDuration(remainingMs)
    : formatElapsedTime(elapsedMs);
  const isTimeWarning = remainingMs !== null && remainingMs > 0 && remainingMs < 10 * 60 * 1000; // < 10 min

  return (
    <div className="flex h-[100dvh] flex-col bg-gray-900 landscape-compact short-screen-compact">
      {/* Header - Sets won overview */}
      <div className="header-section flex flex-col items-center gap-1 pt-2 pb-0.5 sm:gap-1.5 sm:pt-3 sm:pb-1">
        <h1 className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-white/40">
          {isFreePlay ? "Free Play" : `Best of ${game.bestOf}`}
        </h1>
        <SetsWonIndicator setsWon={setsWon} teams={game.teams} />
        <SetIndicator sets={game.sets} currentSet={game.currentSet} />
      </div>

      {/* Last Set Suggestion Banner */}
      {suggestLastSet && !game.isLastSet && isFreePlay && (
        <div className="mx-3 mt-1 animate-slide-up">
          <button
            onClick={onMarkLastSet}
            className="w-full rounded-xl bg-amber-500/20 border border-amber-500/30 px-3 py-2 sm:px-4 sm:py-2.5 text-center transition-all active:scale-[0.98]"
          >
            <span className="text-[11px] sm:text-xs font-bold text-amber-400">
              ⏰ Time running low — Tap to mark as last set
            </span>
          </button>
        </div>
      )}

      {/* Last Set Active Banner */}
      {game.isLastSet && !isMatchOver && (
        <div className="mx-3 mt-1 rounded-xl bg-orange-500/10 border border-orange-500/20 px-3 py-1 sm:px-4 sm:py-1.5 text-center">
          <span className="text-[10px] sm:text-[11px] font-bold text-orange-400 uppercase tracking-wider">
            🏁 Final Set
          </span>
        </div>
      )}

      {/* Match Winner Overlay */}
      {isMatchOver && game.matchWinner && (
        <div className="flex flex-col items-center gap-1 py-1.5 sm:py-2 animate-scale-in">
          <div className="rounded-2xl bg-yellow-400/90 px-4 py-1 sm:px-5 sm:py-1.5 text-center shadow-lg shadow-yellow-400/20">
            <span className="text-sm sm:text-base font-black text-gray-900">
              🏆 {game.teams[game.matchWinner].name} wins!
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-white/50">
            {game.sets
              .filter((s) => s.winner)
              .map((s) => `${s.left}-${s.right}`)
              .join(", ")}
          </p>
        </div>
      )}

      {/* Score panels — two panels stacked vertically, side-by-side in landscape */}
      <div className="score-panels flex flex-1 flex-col gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2">
        <TeamScore
          side="left"
          name={game.teams.left.name}
          score={currentSet.left}
          isServing={game.serving === "left"}
          isWinner={game.matchWinner === "left"}
          disabled={isMatchOver}
          onScore={() => onScore("left")}
        />
        <TeamScore
          side="right"
          name={game.teams.right.name}
          score={currentSet.right}
          isServing={game.serving === "right"}
          isWinner={game.matchWinner === "right"}
          disabled={isMatchOver}
          onScore={() => onScore("right")}
        />
      </div>

      {/* Controls — with safe area bottom for notched phones */}
      <div className="safe-bottom">
        <GameControls
          canUndo={game.history.length > 0}
          isFreePlay={isFreePlay}
          isLastSet={game.isLastSet ?? false}
          onUndo={onUndo}
          onReset={onReset}
          onMarkLastSet={onMarkLastSet}
          elapsedTime={timeDisplay}
          isTimeWarning={isTimeWarning}
          isCountdown={remainingMs !== null && remainingMs > 0}
          gamePointLabel={gamePointLabel}
        />
      </div>
    </div>
  );
}
