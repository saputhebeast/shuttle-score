"use client";

import type { Player, MatchSummary } from "@/lib/types";
import { useMemo, useState } from "react";
import { computeAllPlayerStats, getBestPartner } from "@/lib/player-stats";

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
        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-white/35">
          Player Stats
        </span>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      {!hasData ? (
        <p className="text-xs text-white/30 text-center py-3">
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
          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1.5">
            No matches yet
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allStats
              .filter((s) => s.matchesPlayed === 0)
              .map((s) => (
                <span
                  key={s.playerId}
                  className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-white/40"
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

  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

  return (
    <div className="rounded-2xl bg-white/[0.04] overflow-hidden">
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left transition-all active:bg-white/5"
      >
        {/* Rank */}
        <span className="w-6 text-center text-sm">
          {medal ?? <span className="text-white/30 text-xs">{rank}</span>}
        </span>

        {/* Name + form */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate">
              {stats.playerName}
            </span>
            {/* Recent form dots */}
            <div className="flex gap-0.5 shrink-0">
              {stats.recentForm.map((r, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${
                    r === "W"
                      ? "bg-green-400"
                      : r === "L"
                      ? "bg-red-400"
                      : "bg-yellow-400"
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-[10px] text-white/40">
            {stats.matchesPlayed} matches
          </span>
        </div>

        {/* Win rate */}
        <div className="text-right shrink-0">
          <span className={`text-base sm:text-lg font-black ${
            stats.winRate >= 60 ? "text-green-400" : stats.winRate >= 40 ? "text-white" : "text-red-400"
          }`}>
            {stats.winRate}%
          </span>
          <p className="text-[9px] text-white/30">WIN RATE</p>
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
          className={`text-white/20 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-white/5 px-3 sm:px-4 py-3 space-y-3 animate-slide-up">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Won" value={stats.matchesWon} color="text-green-400" />
            <MiniStat label="Lost" value={stats.matchesLost} color="text-red-400" />
            <MiniStat label="Drawn" value={stats.matchesDrawn} color="text-yellow-400" />
            <MiniStat label="Sets Won" value={stats.setsWon} />
            <MiniStat label="Sets Lost" value={stats.setsLost} />
            <MiniStat label="Pts For" value={stats.totalPointsFor} />
          </div>

          {/* Points ratio bar */}
          {stats.totalPointsFor + stats.totalPointsAgainst > 0 && (
            <div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="bg-green-500 transition-all"
                  style={{
                    width: `${(stats.totalPointsFor / (stats.totalPointsFor + stats.totalPointsAgainst)) * 100}%`,
                  }}
                />
                <div
                  className="bg-red-500/50 transition-all"
                  style={{
                    width: `${(stats.totalPointsAgainst / (stats.totalPointsFor + stats.totalPointsAgainst)) * 100}%`,
                  }}
                />
              </div>
              <div className="mt-0.5 flex justify-between text-[9px] text-white/30">
                <span>{stats.totalPointsFor} for</span>
                <span>{stats.totalPointsAgainst} against</span>
              </div>
            </div>
          )}

          {/* Best partner */}
          {bestPartner && (
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
              <span className="text-xs">🤝</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-white/60">Best partner</span>
                <p className="text-sm font-semibold text-white truncate">
                  {bestPartner.player.name}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-green-400">{bestPartner.winRate}%</span>
                <p className="text-[9px] text-white/30">{bestPartner.played} games</p>
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
  color = "text-white",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center">
      <p className={`text-sm font-bold ${color}`}>{value}</p>
      <p className="text-[8px] uppercase tracking-wider text-white/30">{label}</p>
    </div>
  );
}
