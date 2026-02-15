"use client";

import { type TeamSide } from "@/lib/types";
import { TrophyIcon } from "@/components/ui/icons";

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
  const isLeft = side === "left";

  return (
    <button
      onClick={onScore}
      disabled={disabled}
      aria-label={`Add point for ${name}`}
      className={`
        relative flex w-full flex-1 flex-col items-center justify-center
        select-none transition-all duration-150
        active:scale-[0.98] active:brightness-95
        ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        rounded-2xl overflow-hidden
        ${isWinner ? "ring-2 " + (isLeft ? "ring-blue-400" : "ring-red-400") : ""}
        ${isLeft ? "bg-blue-50 border border-blue-100" : "bg-red-50 border border-red-100"}
        min-h-0
      `}
    >
      {/* Serving indicator */}
      {isServing && (
        <div className={`absolute top-2 sm:top-3 flex items-center gap-1 sm:gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-gray-600 shadow-sm border ${isLeft ? "border-blue-200" : "border-red-200"}`}>
          <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${isLeft ? "bg-blue-500" : "bg-red-500"} animate-pulse`} />
          Serving
        </div>
      )}

      {/* Winner badge */}
      {isWinner && (
        <div className="absolute top-2 sm:top-3 rounded-full bg-gray-900 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-white shadow-sm inline-flex items-center gap-1">
          <TrophyIcon className="w-3 h-3" /> Winner
        </div>
      )}

      {/* Team name */}
      <span className={`mb-0.5 sm:mb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate max-w-[90%] ${isLeft ? "text-blue-600/70" : "text-red-600/70"}`}>
        {name}
      </span>

      {/* Score — responsive with clamp */}
      <span className="score-text font-black leading-none tabular-nums text-gray-900" style={{ fontSize: 'clamp(3.5rem, 18vw, 8rem)' }}>
        {score}
      </span>

      {/* Tap hint */}
      {!disabled && (
        <span className="mt-1 sm:mt-2 text-[9px] sm:text-[10px] text-gray-400">Tap to score</span>
      )}
    </button>
  );
}
