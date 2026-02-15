"use client";

import type { Player, Tournament, TournamentMatch, TournamentStanding, NewGameConfig } from "@/lib/types";
import { getTeamName, matchesPerPlayer } from "@/lib/tournament-engine";

interface TournamentBracketProps {
  tournament: Tournament;
  players: Player[];
  standings: TournamentStanding[];
  currentMatch: TournamentMatch | null;
  isComplete: boolean;
  onPlayMatch: (config: NewGameConfig) => void;
  onClearTournament: () => void;
}

export function TournamentBracket({
  tournament,
  players,
  standings,
  currentMatch,
  isComplete,
  onPlayMatch,
  onClearTournament,
}: TournamentBracketProps) {
  const handlePlayNext = () => {
    if (!currentMatch) return;
    const leftName = getTeamName(currentMatch.leftPlayerIds, players);
    const rightName = getTeamName(currentMatch.rightPlayerIds, players);
    onPlayMatch({
      leftTeamName: leftName,
      rightTeamName: rightName,
      leftPlayerIds: [...currentMatch.leftPlayerIds],
      rightPlayerIds: [...currentMatch.rightPlayerIds],
      bestOf: 3,
      durationMinutes: null,
    });
  };

  const played = tournament.matches.filter((m) => m.winner).length;
  const total = tournament.matches.length;
  const penalised = standings.filter((s) => s.isPenalised);

  return (
    <div className="flex min-h-[100dvh] items-start justify-center bg-gray-900 overflow-y-auto safe-bottom">
      <div className="w-full max-w-md animate-fade-in">
        {/* Hero Header */}
        <div className="relative overflow-hidden px-4 pt-10 pb-6 text-center">
          {/* Background glow */}
          <div
            className={`absolute inset-0 opacity-20 blur-3xl ${
              isComplete
                ? "bg-gradient-to-b from-amber-500 to-transparent"
                : "bg-gradient-to-b from-orange-500 to-transparent"
            }`}
          />
          <div className="relative">
            <div className="mb-3 text-5xl">{isComplete ? "🏆" : "⚔️"}</div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isComplete ? "Challenge Complete!" : "Challenge Mode"}
            </h1>
            <p className="mt-1.5 text-sm text-white/40">
              {isComplete
                ? "The results are in..."
                : `Match ${Math.min(played + 1, total)} of ${total}`}
            </p>
          </div>
        </div>

        <div className="space-y-6 px-4 pb-10">
          {/* Progress Steps */}
          <div className="flex items-center gap-1">
            {tournament.matches.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                    m.winner
                      ? "bg-gradient-to-r from-amber-500 to-orange-500"
                      : !isComplete && currentMatch?.index === m.index
                      ? "bg-amber-500/30 animate-pulse"
                      : "bg-white/8"
                  }`}
                />
                <span className="text-[9px] text-white/30 font-medium">
                  {m.winner ? "Done" : !isComplete && currentMatch?.index === m.index ? "Next" : `#${i + 1}`}
                </span>
              </div>
            ))}
          </div>

          {/* Match Cards */}
          <div className="space-y-2.5">
            <SectionLabel>Matches</SectionLabel>
            {tournament.matches.map((match, i) => (
              <MatchCard
                key={i}
                match={match}
                matchNumber={i + 1}
                players={players}
                isCurrent={!isComplete && currentMatch?.index === match.index}
              />
            ))}
          </div>

          {/* Standings */}
          <div className="space-y-2.5">
            <SectionLabel>{isComplete ? "Final Standings" : "Standings"}</SectionLabel>
            <div className="space-y-1.5">
              {standings.map((s, i) => (
                <StandingRow
                  key={s.playerId}
                  standing={s}
                  rank={i + 1}
                  isComplete={isComplete}
                  totalPlayers={tournament.playerIds.length}
                />
              ))}
            </div>
          </div>

          {/* Penalty Reveal */}
          {isComplete && penalised.length > 0 && (
            <div className="animate-scale-in">
              <div className="relative rounded-2xl overflow-hidden">
                {/* Animated border */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/30 via-orange-500/20 to-red-500/30 p-[1px]" />
                <div className="relative rounded-2xl bg-gray-900 p-5 text-center space-y-4">
                  {/* Glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-red-500/15 blur-2xl rounded-full" />

                  <div className="relative">
                    <div className="text-4xl mb-2">😈</div>
                    <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-semibold">
                      Penalty
                    </p>
                  </div>

                  {/* Losers */}
                  <div className="flex items-center justify-center gap-2">
                    {penalised.map((s, i) => (
                      <span key={s.playerId}>
                        {i > 0 && <span className="text-white/20 mr-2">&</span>}
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/25 px-3.5 py-1.5 text-sm font-bold text-red-400">
                          💀 {s.playerName}
                        </span>
                      </span>
                    ))}
                  </div>

                  {/* The penalty */}
                  <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-4 py-3.5">
                    <p className="text-lg font-black text-amber-300 leading-snug">
                      {tournament.penalty}
                    </p>
                  </div>

                  <p className="text-[11px] text-white/25 italic">
                    No excuses. Pay up 😤
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {!isComplete && currentMatch && (
              <button
                type="button"
                onClick={handlePlayNext}
                className="group w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 min-h-[56px] text-base sm:text-lg font-bold text-white shadow-lg shadow-amber-600/25 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Play Match {played + 1}</span>
                  <span className="text-xl group-active:translate-x-0.5 transition-transform">🏸</span>
                </div>
              </button>
            )}

            {isComplete && (
              <button
                type="button"
                onClick={onClearTournament}
                className="w-full rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 min-h-[56px] text-base sm:text-lg font-bold text-white shadow-lg shadow-green-600/25 transition-all active:scale-[0.98]"
              >
                New Challenge ⚔️
              </button>
            )}

            <button
              type="button"
              onClick={onClearTournament}
              className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-6 min-h-[48px] text-sm font-semibold text-white/40 transition-all active:bg-white/8"
            >
              {isComplete ? "Back to Home" : "Cancel Challenge"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Label ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-white/35">
        {children}
      </span>
      <div className="flex-1 h-px bg-white/8" />
    </div>
  );
}

// ─── Match Card ─────────────────────────────────────────────────────────────

function MatchCard({
  match,
  matchNumber,
  players,
  isCurrent,
}: {
  match: TournamentMatch;
  matchNumber: number;
  players: Player[];
  isCurrent: boolean;
}) {
  const leftName = getTeamName(match.leftPlayerIds, players);
  const rightName = getTeamName(match.rightPlayerIds, players);
  const isPlayed = match.winner !== null;
  const sittingOutNames = match.sittingOutIds.length > 0
    ? match.sittingOutIds.map((id) => players.find((p) => p.id === id)?.name ?? "?")
    : null;
  const sittingOutLabel = sittingOutNames ? sittingOutNames.join(", ") : null;

  return (
    <div
      className={`rounded-2xl transition-all ${
        isCurrent
          ? "bg-amber-500/8 ring-1 ring-amber-500/30"
          : isPlayed
          ? "bg-white/[0.04]"
          : "bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center gap-3 px-3.5 py-3">
        {/* Match number badge */}
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold shrink-0 ${
            isPlayed
              ? "bg-green-500/15 text-green-400"
              : isCurrent
              ? "bg-amber-500/20 text-amber-400"
              : "bg-white/5 text-white/20"
          }`}
        >
          {isPlayed ? "✓" : matchNumber}
        </div>

        {/* Teams */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[13px] sm:text-sm">
            <span
              className={`truncate font-semibold ${
                isPlayed
                  ? match.winner === "left"
                    ? "text-green-400"
                    : "text-white/30"
                  : "text-white/80"
              }`}
            >
              {leftName}
            </span>
            <span className="text-white/15 text-[10px] shrink-0 mx-0.5">vs</span>
            <span
              className={`truncate font-semibold ${
                isPlayed
                  ? match.winner === "right"
                    ? "text-green-400"
                    : "text-white/30"
                  : "text-white/80"
              }`}
            >
              {rightName}
            </span>
          </div>

          {/* Set scores */}
          {isPlayed && (
            <div className="flex items-center gap-2 mt-0.5">
              {match.sets
                .filter((s) => s.winner)
                .map((set, j) => (
                  <span key={j} className="text-[11px] text-white/25 tabular-nums">
                    {set.left}–{set.right}
                  </span>
                ))}
              {sittingOutLabel && (
                <span className="text-[10px] text-white/15 ml-auto shrink-0 truncate max-w-[40%]">🪑 {sittingOutLabel}</span>
              )}
            </div>
          )}

          {isCurrent && !isPlayed && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-amber-400/70 font-medium">Up next</span>
              {sittingOutLabel && (
                <span className="text-[10px] text-white/20 ml-auto shrink-0 truncate max-w-[40%]">🪑 {sittingOutLabel}</span>
              )}
            </div>
          )}

          {!isCurrent && !isPlayed && sittingOutLabel && (
            <span className="text-[10px] text-white/15 mt-0.5 block truncate">🪑 {sittingOutLabel}</span>
          )}
        </div>

        {/* Status */}
        {isCurrent && !isPlayed && (
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
        )}
      </div>
    </div>
  );
}

// ─── Standing Row ───────────────────────────────────────────────────────────

function StandingRow({
  standing,
  rank,
  isComplete,
  totalPlayers,
}: {
  standing: TournamentStanding;
  rank: number;
  isComplete: boolean;
  totalPlayers: number;
}) {
  const isChampion = rank === 1 && isComplete;
  const isPenalised = standing.isPenalised;

  // Each player plays: 3 matches (4 players) or 4 matches (5+ players)
  const maxMatches = matchesPerPlayer(totalPlayers);

  // Win rate bar width
  const winRate = standing.played > 0 ? (standing.won / standing.played) * 100 : 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl transition-all ${
        isChampion
          ? "bg-gradient-to-r from-amber-500/10 to-yellow-500/5 ring-1 ring-amber-500/25"
          : isPenalised
          ? "bg-red-500/8 ring-1 ring-red-500/15"
          : "bg-white/[0.04]"
      }`}
    >
      {/* Win rate background bar */}
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-700 ${
          isChampion
            ? "bg-amber-500/5"
            : isPenalised
            ? "bg-red-500/5"
            : "bg-white/[0.02]"
        }`}
        style={{ width: `${winRate}%` }}
      />

      <div className="relative flex items-center gap-3 px-3.5 py-3">
        {/* Rank badge */}
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black shrink-0 ${
            isChampion
              ? "bg-amber-500/20 text-amber-400"
              : isPenalised
              ? "bg-red-500/15 text-red-400"
              : rank === 2 && isComplete
              ? "bg-white/8 text-white/60"
              : "bg-white/5 text-white/30"
          }`}
        >
          {isChampion ? "👑" : isPenalised ? "💀" : `#${rank}`}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <span
            className={`text-sm font-bold truncate block ${
              isChampion
                ? "text-amber-300"
                : isPenalised
                ? "text-red-400"
                : "text-white/90"
            }`}
          >
            {standing.playerName}
          </span>
          {/* Win/Loss dots */}
          {standing.played > 0 && (
            <div className="flex gap-1 mt-1">
              {Array.from({ length: maxMatches }).map((_, i) => {
                let color = "bg-white/8";
                if (i < standing.won) color = "bg-green-500";
                else if (i < standing.won + standing.lost) color = "bg-red-500/70";
                return (
                  <div key={i} className={`h-1.5 w-4 rounded-full ${color}`} />
                );
              })}
            </div>
          )}
        </div>

        {/* Record */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-2 text-xs font-bold tabular-nums">
              <span className="text-green-400">{standing.won}W</span>
              <span className="text-white/15">·</span>
              <span className="text-red-400">{standing.lost}L</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
