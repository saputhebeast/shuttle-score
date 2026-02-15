"use client";

import type { GameState, SessionStats, TeamSide } from "@/lib/types";
import { TEAM_COLORS } from "@/lib/constants";
import { formatDuration } from "@/lib/game-engine";
import { TrophyIcon, HandshakeIcon, BenchIcon, RotateIcon } from "@/components/ui/icons";

interface SessionSummaryProps {
  game: GameState;
  stats: SessionStats;
  onDismiss: () => void;
  /** Rotation session info (5+ player free play) */
  rotationSession?: {
    gameNumber: number;
    totalPlayers: number;
    currentSittingOut: string[];
    sittingOutNext: string[];
  };
  /** End the rotation session early */
  onEndRotation?: () => void;
}

export function SessionSummary({ game, stats, onDismiss, rotationSession, onEndRotation }: SessionSummaryProps) {
  const winner = stats.sessionWinner;
  const isDraw = !winner && stats.setsWon.left === stats.setsWon.right;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F5F5F7] px-4 sm:px-5 py-4 sm:py-6 safe-bottom scroll-smooth">
      <div className="mx-auto max-w-md">
      {/* Header */}
      <div className="mb-4 sm:mb-6 text-center animate-scale-in">
        <div className="mb-1.5 sm:mb-2 flex justify-center">
          {winner
            ? <TrophyIcon className="w-9 h-9 sm:w-10 sm:h-10 text-amber-500" />
            : <HandshakeIcon className="w-9 h-9 sm:w-10 sm:h-10 text-gray-400" />}
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900">
          {winner
            ? `${game.teams[winner].name} Wins!`
            : isDraw
            ? "It\u2019s a Draw!"
            : "Session Over"}
        </h1>
        <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">
          {game.bestOf === 0 ? "Free Play" : `Best of ${game.bestOf}`} · {formatDuration(stats.totalDurationMs)}
        </p>
      </div>

      {/* Sets Won — Big Display */}
      <div className="mb-5 sm:mb-6 flex items-center justify-center gap-4 animate-fade-in">
        <div className="flex flex-col items-center">
          <span className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ${TEAM_COLORS.left.bg} mb-1`} />
          <span className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[80px]">{game.teams.left.name}</span>
          <span className="text-4xl sm:text-5xl font-black text-gray-900">{stats.setsWon.left}</span>
        </div>
        <span className="text-xl sm:text-2xl text-gray-300 font-light mt-5 sm:mt-6">–</span>
        <div className="flex flex-col items-center">
          <span className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ${TEAM_COLORS.right.bg} mb-1`} />
          <span className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[80px]">{game.teams.right.name}</span>
          <span className="text-4xl sm:text-5xl font-black text-gray-900">{stats.setsWon.right}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-5 sm:mb-6 grid grid-cols-2 gap-2 sm:gap-3">
        <StatCard
          label="Total Points"
          left={stats.totalPoints.left}
          right={stats.totalPoints.right}
          teams={game.teams}
        />
        <StatCard
          label="Sets Played"
          value={stats.completedSets}
        />
        <StatCard
          label="Avg Set Time"
          value={stats.avgSetDurationMs > 0 ? formatDuration(stats.avgSetDurationMs) : "—"}
        />
        <StatCard
          label="Total Time"
          value={formatDuration(stats.totalDurationMs)}
        />
      </div>

      {/* Set-by-set breakdown */}
      <div className="mb-5 sm:mb-6">
        <h2 className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400">
          Set Breakdown
        </h2>
        <div className="space-y-1.5">
          {game.sets
            .filter((s) => s.winner)
            .map((set, i) => {
              const margin = Math.abs(set.left - set.right);
              const isClosest = stats.closestSet?.index === i;
              const isBiggest = stats.biggestWin?.index === i;

              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-white border border-gray-100 px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm"
                >
                  <span className="text-xs text-gray-400">Set {i + 1}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold tabular-nums ${set.winner === "left" ? "text-blue-600" : "text-gray-400"}`}>
                      {set.left}
                    </span>
                    <span className="text-gray-300">-</span>
                    <span className={`text-sm font-bold tabular-nums ${set.winner === "right" ? "text-red-600" : "text-gray-400"}`}>
                      {set.right}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {isClosest && (
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                        Closest
                      </span>
                    )}
                    {isBiggest && (
                      <span className="rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[9px] font-bold text-purple-700">
                        Biggest
                      </span>
                    )}
                    {!isClosest && !isBiggest && (
                      <span className="text-[10px] text-gray-300">
                        {set.winner === "left" ? "◀" : "▶"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Point Distribution Bar */}
      {stats.totalPoints.left + stats.totalPoints.right > 0 && (
        <div className="mb-5 sm:mb-6">
          <h2 className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400">
            Point Distribution
          </h2>
          <div className="flex h-3 sm:h-4 w-full overflow-hidden rounded-full">
            <div
              className="bg-blue-500 transition-all duration-500"
              style={{
                width: `${(stats.totalPoints.left / (stats.totalPoints.left + stats.totalPoints.right)) * 100}%`,
              }}
            />
            <div
              className="bg-red-500 transition-all duration-500"
              style={{
                width: `${(stats.totalPoints.right / (stats.totalPoints.left + stats.totalPoints.right)) * 100}%`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-gray-400">
            <span>{stats.totalPoints.left} pts</span>
            <span>{stats.totalPoints.right} pts</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {rotationSession ? (
        <div className="mt-8 mb-6 space-y-3">
          {/* Current game info */}
          <div className="rounded-2xl bg-white border border-gray-200 px-4 py-3 text-center space-y-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
              Rotation · {rotationSession.totalPlayers} Players
            </p>
            {rotationSession.currentSittingOut.length > 0 && (
              <p className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                <BenchIcon className="w-3 h-3" /> Sat out this game: <span className="font-semibold text-gray-700">{rotationSession.currentSittingOut.join(", ")}</span>
              </p>
            )}
            <div className="border-t border-gray-100 pt-2">
              <p className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                <RotateIcon className="w-3 h-3" /> Next up to sit: <span className="font-bold text-gray-900">{rotationSession.sittingOutNext.join(", ")}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="w-full rounded-xl bg-gray-900 px-6 min-h-[52px] text-base sm:text-lg font-bold text-white shadow-sm transition-all active:scale-[0.98]"
          >
            Next Match
          </button>
          <button
            onClick={onEndRotation}
            className="w-full rounded-xl border border-gray-200 bg-white px-6 min-h-[44px] text-sm font-semibold text-gray-500 transition-all active:scale-[0.98] active:bg-gray-50 shadow-sm"
          >
            End Session
          </button>
        </div>
      ) : (
        <button
          onClick={onDismiss}
          className="mt-8 mb-6 w-full rounded-xl bg-gray-900 px-6 min-h-[52px] text-base sm:text-lg font-bold text-white shadow-sm transition-all active:scale-[0.98]"
        >
          Done
        </button>
      )}
      </div>
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  left,
  right,
  teams,
}: {
  label: string;
  value?: string | number;
  left?: number;
  right?: number;
  teams?: Record<TeamSide, { name: string }>;
}) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 p-2.5 sm:p-3 shadow-sm">
      <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-gray-400">
        {label}
      </span>
      {value !== undefined ? (
        <p className="mt-0.5 sm:mt-1 text-base sm:text-lg font-bold text-gray-900">{value}</p>
      ) : (
        <div className="mt-0.5 sm:mt-1 flex items-baseline gap-2">
          <span className="text-base sm:text-lg font-bold text-blue-600">{left}</span>
          <span className="text-[10px] sm:text-xs text-gray-300">–</span>
          <span className="text-base sm:text-lg font-bold text-red-600">{right}</span>
        </div>
      )}
    </div>
  );
}
