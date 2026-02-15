"use client";

import type { MatchSummary, Player, TeamSide } from "@/lib/types";
import { TEAM_COLORS } from "@/lib/constants";
import { TrophyIcon } from "@/components/ui/icons";

interface MatchHistoryProps {
  matches: MatchSummary[];
  players: Player[];
  onClearHistory: () => void;
  onNewGame: () => void;
}

export function MatchHistory({ matches, players, onClearHistory, onNewGame }: MatchHistoryProps) {
  if (matches.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 pb-6 pt-2 max-w-md mx-auto">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
            Recent Matches
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <button
          onClick={onClearHistory}
          className="text-[11px] text-gray-400 active:text-gray-600 transition-colors ml-3 min-h-[36px] flex items-center"
        >
          Clear
        </button>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        {matches.slice(0, 10).map((match) => (
          <MatchCard key={match.id} match={match} players={players} />
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match, players }: { match: MatchSummary; players: Player[] }) {
  const date = new Date(match.startedAt);
  const winner = match.matchWinner;
  const isFreePlay = match.bestOf === 0;

  // In free play, determine who won more sets
  const leftSets = match.sets.filter((s) => s.winner === "left").length;
  const rightSets = match.sets.filter((s) => s.winner === "right").length;

  // Resolve player names for each side
  const getPlayerNames = (side: TeamSide): string[] => {
    const ids = match.playerIds?.[side] ?? match.teams[side].playerIds ?? [];
    return ids
      .map((id) => players.find((p) => p.id === id)?.name)
      .filter(Boolean) as string[];
  };
  const leftPlayerNames = getPlayerNames("left");
  const rightPlayerNames = getPlayerNames("right");

  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 text-[13px] sm:text-sm min-w-0">
          <TeamLabel
            name={match.teams.left.name}
            side="left"
            isWinner={isFreePlay ? leftSets > rightSets : winner === "left"}
          />
          <span className="text-gray-300 text-xs">vs</span>
          <TeamLabel
            name={match.teams.right.name}
            side="right"
            isWinner={isFreePlay ? rightSets > leftSets : winner === "right"}
          />
        </div>
        <div className="flex flex-col items-end gap-0.5">
          {isFreePlay && (
            <span className="text-[9px] text-green-600 font-medium uppercase">Free Play</span>
          )}
          <span className="text-[10px] text-gray-400">
            {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>
      {/* Player names */}
      {(leftPlayerNames.length > 0 || rightPlayerNames.length > 0) && (
        <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
          <span className="truncate">{leftPlayerNames.join(", ") || "—"}</span>
          <span className="text-gray-300">vs</span>
          <span className="truncate">{rightPlayerNames.join(", ") || "—"}</span>
        </div>
      )}
      <div className="mt-1.5 flex gap-2">
        {match.sets
          .filter((s) => s.winner)
          .map((set, i) => (
            <span key={i} className="text-[11px] text-gray-400">
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
        isWinner ? "font-bold text-gray-900" : "text-gray-400"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${colors.bg}`} />
      <span className="truncate max-w-[80px]">{name}</span>
      {isWinner && <TrophyIcon className="w-3 h-3 text-amber-500" />}
    </span>
  );
}
