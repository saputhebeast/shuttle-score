"use client";

import { type TeamSide } from "@/lib/types";
import { TEAM_COLORS } from "@/lib/constants";

interface TeamScoreProps {
  side: TeamSide;
  name: string;
  score: number;
  isServing: boolean;
  isWinner: boolean;
  disabled: boolean;
  onScore: () => void;
}

export function TeamScore({
  side,
  name,
  score,
  isServing,
  isWinner,
  disabled,
  onScore,
}: TeamScoreProps) {
  const colors = TEAM_COLORS[side];

  return (
    <button
      onClick={onScore}
      disabled={disabled}
      aria-label={`Add point for ${name}`}
      className={`
        relative flex w-full flex-1 flex-col items-center justify-center
        select-none transition-all duration-150
        active:scale-[0.97] active:brightness-90
        ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        rounded-2xl overflow-hidden
        ${isWinner ? "ring-4 " + colors.ring : ""}
        ${colors.bg} text-white
        min-h-0
      `}
    >
      {/* Serving indicator */}
      {isServing && (
        <div className="absolute top-2 sm:top-3 flex items-center gap-1 sm:gap-1.5 rounded-full bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium backdrop-blur-sm">
          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-yellow-300 animate-pulse" />
          Serving
        </div>
      )}

      {/* Winner badge */}
      {isWinner && (
        <div className="absolute top-2 sm:top-3 rounded-full bg-yellow-400 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-gray-900">
          🏆 Winner
        </div>
      )}

      {/* Team name */}
      <span className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs font-medium uppercase tracking-wider opacity-70 truncate max-w-[90%]">
        {name}
      </span>

      {/* Score — responsive with clamp */}
      <span className="score-text font-black leading-none tabular-nums" style={{ fontSize: 'clamp(3.5rem, 18vw, 8rem)' }}>
        {score}
      </span>

      {/* Tap hint */}
      {!disabled && (
        <span className="mt-1 sm:mt-2 text-[9px] sm:text-[10px] opacity-40">Tap to score</span>
      )}
    </button>
  );
}
