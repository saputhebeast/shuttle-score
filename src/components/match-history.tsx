"use client";

import type { MatchSummary, TeamSide } from "@/lib/types";
import { TEAM_COLORS } from "@/lib/constants";

interface MatchHistoryProps {
  matches: MatchSummary[];
  onClearHistory: () => void;
  onNewGame: () => void;
}

export function MatchHistory({ matches, onClearHistory, onNewGame }: MatchHistoryProps) {
  if (matches.length === 0) return null;

  return (
    <div className="border-t border-white/10 px-3 sm:px-4 pb-6 pt-3 sm:pt-4">
      <div className="mb-2 sm:mb-3 flex items-center justify-between">
        <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/50">
          Recent Matches
        </h2>
        <button
          onClick={onClearHistory}
          className="text-[11px] sm:text-xs text-white/30 active:text-white/60 transition-colors min-h-[36px] flex items-center"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        {matches.slice(0, 10).map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>

      {matches.length > 0 && (
        <button
          onClick={onNewGame}
          className="mt-3 sm:mt-4 w-full rounded-xl bg-white/5 min-h-[44px] text-[13px] sm:text-sm font-medium text-white/60 active:bg-white/10 transition-all"
        >
          + Start New Match
        </button>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: MatchSummary }) {
  const date = new Date(match.startedAt);
  const winner = match.matchWinner;
  const isFreePlay = match.bestOf === 0;

  // In free play, determine who won more sets
  const leftSets = match.sets.filter((s) => s.winner === "left").length;
  const rightSets = match.sets.filter((s) => s.winner === "right").length;

  return (
    <div className="rounded-xl bg-white/5 p-2.5 sm:p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 text-[13px] sm:text-sm min-w-0">
          <TeamLabel
            name={match.teams.left.name}
            side="left"
            isWinner={isFreePlay ? leftSets > rightSets : winner === "left"}
          />
          <span className="text-white/30 text-xs">vs</span>
          <TeamLabel
            name={match.teams.right.name}
            side="right"
            isWinner={isFreePlay ? rightSets > leftSets : winner === "right"}
          />
        </div>
        <div className="flex flex-col items-end gap-0.5">
          {isFreePlay && (
            <span className="text-[9px] text-green-400/70 font-medium uppercase">Free Play</span>
          )}
          <span className="text-[10px] text-white/30">
            {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>
      <div className="mt-1.5 flex gap-2">
        {match.sets
          .filter((s) => s.winner)
          .map((set, i) => (
            <span key={i} className="text-[11px] text-white/40">
              {set.left}-{set.right}
            </span>
          ))}
      </div>
    </div>
  );
}

function TeamLabel({
  name,
  side,
  isWinner,
}: {
  name: string;
  side: TeamSide;
  isWinner: boolean;
}) {
  const colors = TEAM_COLORS[side];
  return (
    <span
      className={`flex items-center gap-1 ${
        isWinner ? "font-bold text-white" : "text-white/50"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${colors.bg}`} />
      <span className="truncate max-w-[80px]">{name}</span>
      {isWinner && <span className="text-yellow-400 text-xs">🏆</span>}
    </span>
  );
}
