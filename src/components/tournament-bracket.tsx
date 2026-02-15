"use client";

import type { Player, Tournament, TournamentMatch, TournamentStanding, NewGameConfig } from "@/lib/types";
import { getTeamName, matchesPerPlayer } from "@/lib/tournament-engine";
import { TrophyIcon, SwordsIcon, SparklesIcon, SkullIcon, CrownIcon, ShuttlecockIcon, BenchIcon } from "@/components/ui/icons";

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
    <div className="flex min-h-[100dvh] items-start justify-center bg-[#F5F5F7] overflow-y-auto safe-bottom">
      <div className="w-full max-w-md animate-fade-in">
        {/* Hero Header */}
        <div className="relative overflow-hidden px-4 pt-10 pb-6 text-center">
          <div className="relative">
            <div className="mb-3 flex justify-center">
              {isComplete
                ? <TrophyIcon className="w-12 h-12 text-amber-600" />
                : <SwordsIcon className="w-12 h-12 text-gray-900" />}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
              {isComplete ? "Challenge Complete!" : "Challenge Mode"}
            </h1>
            <p className="mt-1.5 text-sm text-gray-400">
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
                      ? "bg-gray-900"
                      : !isComplete && currentMatch?.index === m.index
                      ? "bg-gray-300 animate-pulse"
                      : "bg-gray-200"
                  }`}
                />
                <span className="text-[9px] text-gray-400 font-medium">
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
                <div className="relative rounded-2xl bg-white border border-red-200 p-5 text-center space-y-4 shadow-sm">

                  <div className="relative">
                    <div className="mb-2 flex justify-center">
                      <SparklesIcon className="w-10 h-10 text-red-400" />
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-semibold">
                      Penalty
                    </p>
                  </div>

                  {/* Losers */}
                  <div className="flex items-center justify-center gap-2">
                    {penalised.map((s, i) => (
                      <span key={s.playerId}>
                        {i > 0 && <span className="text-gray-300 mr-2">&</span>}
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3.5 py-1.5 text-sm font-bold text-red-600">
                          <SkullIcon className="w-3.5 h-3.5" /> {s.playerName}
                        </span>
                      </span>
                    ))}
                  </div>

                  {/* The penalty */}
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3.5">
                    <p className="text-lg font-black text-amber-700 leading-snug">
                      {tournament.penalty}
                    </p>
                  </div>

                  <p className="text-[11px] text-gray-400 italic">
                    No excuses. Pay up.
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
                className="group w-full rounded-2xl bg-gray-900 px-6 min-h-[56px] text-base sm:text-lg font-bold text-white shadow-sm transition-all active:scale-[0.98]"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Play Match {played + 1}</span>
                  <ShuttlecockIcon className="w-5 h-5 group-active:translate-x-0.5 transition-transform" />
                </div>
              </button>
            )}

            {isComplete && (
              <button
                type="button"
                onClick={onClearTournament}
                className="w-full rounded-2xl bg-gray-900 px-6 min-h-[56px] text-base sm:text-lg font-bold text-white shadow-sm transition-all active:scale-[0.98]"
              >
                New Challenge
              </button>
            )}

            <button
              type="button"
              onClick={onClearTournament}
              className="w-full rounded-2xl border border-gray-200 bg-white px-6 min-h-[48px] text-sm font-semibold text-gray-400 transition-all active:bg-gray-50 shadow-sm"
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
      <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
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
      className={`rounded-2xl transition-all shadow-sm ${
        isCurrent
          ? "bg-amber-50 ring-1 ring-amber-200 border border-amber-100"
          : isPlayed
          ? "bg-white border border-gray-100"
          : "bg-white border border-gray-100/60"
      }`}
    >
      <div className="flex items-center gap-3 px-3.5 py-3">
        {/* Match number badge */}
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold shrink-0 ${
            isPlayed
              ? "bg-green-50 text-green-600 border border-green-200"
              : isCurrent
              ? "bg-amber-50 text-amber-600 border border-amber-200"
              : "bg-gray-100 text-gray-400"
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
                    ? "text-green-600"
                    : "text-gray-300"
                  : "text-gray-700"
              }`}
            >
              {leftName}
            </span>
            <span className="text-gray-300 text-[10px] shrink-0 mx-0.5">vs</span>
            <span
              className={`truncate font-semibold ${
                isPlayed
                  ? match.winner === "right"
                    ? "text-green-600"
                    : "text-gray-300"
                  : "text-gray-700"
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
                  <span key={j} className="text-[11px] text-gray-400 tabular-nums">
                    {set.left}–{set.right}
                  </span>
                ))}
              {sittingOutLabel && (
                <span className="text-[10px] text-gray-300 ml-auto shrink-0 truncate max-w-[40%] inline-flex items-center gap-0.5"><BenchIcon className="w-3 h-3" /> {sittingOutLabel}</span>
              )}
            </div>
          )}

          {isCurrent && !isPlayed && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-amber-600 font-medium">Up next</span>
              {sittingOutLabel && (
                <span className="text-[10px] text-gray-300 ml-auto shrink-0 truncate max-w-[40%] inline-flex items-center gap-0.5"><BenchIcon className="w-3 h-3" /> {sittingOutLabel}</span>
              )}
            </div>
          )}

          {!isCurrent && !isPlayed && sittingOutLabel && (
            <span className="text-[10px] text-gray-300 mt-0.5 inline-flex items-center gap-0.5"><BenchIcon className="w-3 h-3" /> {sittingOutLabel}</span>
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
      className={`relative overflow-hidden rounded-2xl transition-all shadow-sm ${
        isChampion
          ? "bg-amber-50 ring-1 ring-amber-200 border border-amber-100"
          : isPenalised
          ? "bg-red-50 ring-1 ring-red-200 border border-red-100"
          : "bg-white border border-gray-100"
      }`}
    >
      {/* Win rate background bar */}
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-700 ${
          isChampion
            ? "bg-amber-100/50"
            : isPenalised
            ? "bg-red-100/50"
            : "bg-gray-50"
        }`}
        style={{ width: `${winRate}%` }}
      />

      <div className="relative flex items-center gap-3 px-3.5 py-3">
        {/* Rank badge */}
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black shrink-0 ${
            isChampion
              ? "bg-amber-100 text-amber-700"
              : isPenalised
              ? "bg-red-100 text-red-600"
              : rank === 2 && isComplete
              ? "bg-gray-100 text-gray-500"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {isChampion ? <CrownIcon className="w-4 h-4" /> : isPenalised ? <SkullIcon className="w-4 h-4" /> : `#${rank}`}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <span
            className={`text-sm font-bold truncate block ${
              isChampion
                ? "text-amber-700"
                : isPenalised
                ? "text-red-600"
                : "text-gray-900"
            }`}
          >
            {standing.playerName}
          </span>
          {/* Win/Loss dots */}
          {standing.played > 0 && (
            <div className="flex gap-1 mt-1">
              {Array.from({ length: maxMatches }).map((_, i) => {
                let color = "bg-gray-200";
                if (i < standing.won) color = "bg-green-500";
                else if (i < standing.won + standing.lost) color = "bg-red-300";
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
              <span className="text-green-600">{standing.won}W</span>
              <span className="text-gray-300">·</span>
              <span className="text-red-600">{standing.lost}L</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
