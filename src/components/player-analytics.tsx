"use client";

import type { Player, MatchSummary } from "@/lib/types";
import { useMemo, useState } from "react";
import { computeAllPlayerStats, getBestPartner } from "@/lib/player-stats";
import { MedalIcon, HandshakeIcon } from "@/components/ui/icons";

interface PlayerAnalyticsProps {
  players: Player[];
  matches: MatchSummary[];
}

export function PlayerAnalytics({ players, matches }: PlayerAnalyticsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allStats = useMemo(
    () =>
      computeAllPlayerStats(players, matches).sort(
        (a, b) => b.winRate - a.winRate || b.matchesWon - a.matchesWon
      ),
    [players, matches]
  );

  // Only show if there's at least 1 player with matches
  const hasData = allStats.some((s) => s.matchesPlayed > 0);
  if (players.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 pb-4 pt-2 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
          Player Stats
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {!hasData ? (
        <p className="text-xs text-gray-400 text-center py-3">
          Play some matches to see stats here
        </p>
      ) : (
        <div className="space-y-2">
          {allStats.map((stats, rank) => (
            <PlayerRow
              key={stats.playerId}
              stats={stats}
              rank={rank + 1}
              players={players}
              isExpanded={expandedId === stats.playerId}
              onToggle={() =>
                setExpandedId(
                  expandedId === stats.playerId ? null : stats.playerId
                )
              }
            />
          ))}
        </div>
      )}

      {/* Players with no matches yet */}
      {allStats.filter((s) => s.matchesPlayed === 0).length > 0 && hasData && (
        <div className="mt-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
            No matches yet
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allStats
              .filter((s) => s.matchesPlayed === 0)
              .map((s) => (
                <span
                  key={s.playerId}
                  className="rounded-lg bg-white border border-gray-200 px-2.5 py-1 text-xs text-gray-400 shadow-sm"
                >
                  {s.playerName}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Player Row ──────────────────────────────────────────────────────────────

function PlayerRow({
  stats,
  rank,
  players,
  isExpanded,
  onToggle,
}: {
  stats: ReturnType<typeof computeAllPlayerStats>[0];
  rank: number;
  players: Player[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  if (stats.matchesPlayed === 0) return null;

  const bestPartner = getBestPartner(stats, players);

  const medal = rank === 1
    ? <MedalIcon className="w-4 h-4 text-amber-500" />
    : rank === 2
    ? <MedalIcon className="w-4 h-4 text-gray-400" />
    : rank === 3
    ? <MedalIcon className="w-4 h-4 text-amber-700" />
    : null;

  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left transition-all active:bg-gray-50"
      >
        {/* Rank */}
        <span className="w-6 text-center text-sm">
          {medal ?? <span className="text-gray-400 text-xs">{rank}</span>}
        </span>

        {/* Name + form */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 truncate">
              {stats.playerName}
            </span>
            {/* Recent form dots */}
            <div className="flex gap-0.5 shrink-0">
              {stats.recentForm.map((r, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${
                    r === "W"
                      ? "bg-green-500"
                      : r === "L"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-[10px] text-gray-400">
            {stats.matchesPlayed} matches
          </span>
        </div>

        {/* Win rate */}
        <div className="text-right shrink-0">
          <span className={`text-base sm:text-lg font-black ${
            stats.winRate >= 60 ? "text-green-600" : stats.winRate >= 40 ? "text-gray-900" : "text-red-600"
          }`}>
            {stats.winRate}%
          </span>
          <p className="text-[9px] text-gray-400">WIN RATE</p>
        </div>

        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-gray-300 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-3 sm:px-4 py-3 space-y-3 animate-slide-up">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Won" value={stats.matchesWon} color="text-green-600" />
            <MiniStat label="Lost" value={stats.matchesLost} color="text-red-600" />
            <MiniStat label="Drawn" value={stats.matchesDrawn} color="text-yellow-600" />
            <MiniStat label="Sets Won" value={stats.setsWon} />
            <MiniStat label="Sets Lost" value={stats.setsLost} />
            <MiniStat label="Pts For" value={stats.totalPointsFor} />
          </div>

          {/* Points ratio bar */}
          {stats.totalPointsFor + stats.totalPointsAgainst > 0 && (
            <div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="bg-green-500 transition-all"
                  style={{
                    width: `${(stats.totalPointsFor / (stats.totalPointsFor + stats.totalPointsAgainst)) * 100}%`,
                  }}
                />
                <div
                  className="bg-red-300 transition-all"
                  style={{
                    width: `${(stats.totalPointsAgainst / (stats.totalPointsFor + stats.totalPointsAgainst)) * 100}%`,
                  }}
                />
              </div>
              <div className="mt-0.5 flex justify-between text-[9px] text-gray-400">
                <span>{stats.totalPointsFor} for</span>
                <span>{stats.totalPointsAgainst} against</span>
              </div>
            </div>
          )}

          {/* Best partner */}
          {bestPartner && (
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
              <HandshakeIcon className="w-4 h-4 text-gray-400" />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-500">Best partner</span>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {bestPartner.player.name}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-green-600">{bestPartner.winRate}%</span>
                <p className="text-[9px] text-gray-400">{bestPartner.played} games</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  color = "text-gray-900",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 px-2 py-1.5 text-center">
      <p className={`text-sm font-bold ${color}`}>{value}</p>
      <p className="text-[8px] uppercase tracking-wider text-gray-400">{label}</p>
    </div>
  );
}
