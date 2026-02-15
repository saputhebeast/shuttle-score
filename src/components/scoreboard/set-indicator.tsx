"use client";

import type { SetScore, TeamSide } from "@/lib/types";
import { TEAM_COLORS } from "@/lib/constants";

interface SetIndicatorProps {
  sets: SetScore[];
  currentSet: number;
}

export function SetIndicator({ sets, currentSet }: SetIndicatorProps) {
  return (
    <div className="flex w-full items-center justify-center overflow-x-auto px-3 sm:px-4 scrollbar-hide">
      <div className="flex items-center gap-1.5 sm:gap-2">
        {sets.map((set, i) => (
          <div
            key={i}
            className={`
              flex shrink-0 items-center gap-0.5 sm:gap-1 rounded-lg px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold
              transition-all duration-200
              ${
                i === currentSet
                  ? "bg-white text-gray-900 shadow-md scale-105"
                  : "bg-white/10 text-white/70"
              }
            `}
          >
            <span>S{i + 1}</span>
            {set.winner && (
              <span className="ml-0.5">
                {set.winner === "left" ? "◀" : "▶"}
              </span>
            )}
            {(set.winner || (!set.winner && i === currentSet)) && (
              <span className={`text-[10px] ${set.winner ? "opacity-80" : "opacity-60"}`}>
                {set.left}-{set.right}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface SetsWonIndicatorProps {
  setsWon: Record<TeamSide, number>;
  teams: Record<TeamSide, { name: string }>;
}

export function SetsWonIndicator({ setsWon, teams }: SetsWonIndicatorProps) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium">
      <div className="flex items-center gap-1 sm:gap-1.5">
        <span className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ${TEAM_COLORS.left.bg}`} />
        <span className="text-white/80 truncate max-w-[60px] sm:max-w-none">{teams.left.name}</span>
        <span className="ml-0.5 sm:ml-1 text-base sm:text-lg font-bold text-white">{setsWon.left}</span>
      </div>
      <span className="text-white/40">–</span>
      <div className="flex items-center gap-1 sm:gap-1.5">
        <span className="ml-0.5 sm:ml-1 text-base sm:text-lg font-bold text-white">{setsWon.right}</span>
        <span className="text-white/80 truncate max-w-[60px] sm:max-w-none">{teams.right.name}</span>
        <span className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ${TEAM_COLORS.right.bg}`} />
      </div>
    </div>
  );
}
