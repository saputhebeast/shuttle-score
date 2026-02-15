"use client";

import { useState, useCallback, useMemo } from "react";
import type { NewGameConfig, Player } from "@/lib/types";
import { DEFAULT_TEAM_NAMES } from "@/lib/constants";
import { totalMatchCount, matchesPerPlayer } from "@/lib/tournament-engine";

type GameMode = "free" | "bo3" | "bo5" | "challenge";

interface NewGameModalProps {
  onStart: (config: NewGameConfig) => void;
  onStartTournament: (playerIds: string[], penalty: string) => void;
  players: Player[];
  onAddPlayer: (name: string) => Player;
}

/** Shuffle an array (Fisher-Yates) and return a new copy. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PENALTY_SUGGESTIONS = [
  "🏸 Buy shuttlecocks",
  "⚡ Buy energy drinks",
  "🍕 Buy pizza for everyone",
  "☕ Buy coffee next session",
  "🧹 Clean the court",
];

export function NewGameModal({
  onStart,
  onStartTournament,
  players,
  onAddPlayer,
}: NewGameModalProps) {
  // -- Selection state --
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  // -- Manual team assignment (2-4 players, non-challenge) --
  const [manualLeft, setManualLeft] = useState<string[]>([]);
  const [manualRight, setManualRight] = useState<string[]>([]);

  // -- Auto assignment (5+ players, non-challenge) --
  const [autoSeed, setAutoSeed] = useState(0);

  // -- Game mode --
  const [mode, setMode] = useState<GameMode>("free");
  const [durationMinutes, setDurationMinutes] = useState<number | null>(120);

  // -- Challenge penalty --
  const [penalty, setPenalty] = useState("");

  const selectedPlayers = useMemo(
    () =>
      selectedIds
        .map((id) => players.find((p) => p.id === id))
        .filter(Boolean) as Player[],
    [selectedIds, players]
  );

  const isChallenge = mode === "challenge";
  const isAutoMode = !isChallenge && selectedIds.length >= 5;

  // -- Auto-generated teams for 5+ (non-challenge only) --
  // Uses rotation-based sit-out (same algorithm as the rotation session in page.tsx)
  const autoAssignment = useMemo(() => {
    if (!isAutoMode) return null;
    const n = selectedPlayers.length;
    const sitOutCount = n - 4;
    // autoSeed determines the rotation offset (which player(s) sit out)
    const sittingOutIndices = new Set<number>();
    for (let k = 0; k < sitOutCount; k++) {
      sittingOutIndices.add((autoSeed + k) % n);
    }
    const sittingOut = selectedPlayers.filter((_, i) => sittingOutIndices.has(i));
    const playing = selectedPlayers.filter((_, i) => !sittingOutIndices.has(i));
    // Shuffle the 4 playing players for random team assignment
    const shuffled = shuffle(playing);
    return {
      left: [shuffled[0], shuffled[1]],
      right: [shuffled[2], shuffled[3]],
      sittingOut,
      rotation: autoSeed,
    };
  }, [isAutoMode, selectedPlayers, autoSeed]);

  // -- Toggle player selection --
  const togglePlayer = (id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      setManualLeft([]);
      setManualRight([]);
      return next;
    });
  };

  // -- Add new player --
  const handleAddPlayer = () => {
    const name = newPlayerName.trim();
    if (!name) return;
    const p = onAddPlayer(name);
    setNewPlayerName("");
    setShowAddPlayer(false);
    setSelectedIds((prev) => [...prev, p.id]);
  };

  // -- Manual team assignment helpers --
  const unassignedPlayers = useMemo(
    () =>
      selectedPlayers.filter(
        (p) => !manualLeft.includes(p.id) && !manualRight.includes(p.id)
      ),
    [selectedPlayers, manualLeft, manualRight]
  );

  const assignToTeam = (playerId: string, side: "left" | "right") => {
    if (side === "left" && manualLeft.length < 2) {
      setManualLeft((prev) => [...prev, playerId]);
    } else if (side === "right" && manualRight.length < 2) {
      setManualRight((prev) => [...prev, playerId]);
    }
  };

  const removeFromTeam = (playerId: string, side: "left" | "right") => {
    if (side === "left")
      setManualLeft((prev) => prev.filter((id) => id !== playerId));
    else setManualRight((prev) => prev.filter((id) => id !== playerId));
  };

  // -- Shuffle for auto mode --
  const handleShuffle = useCallback(() => {
    setAutoSeed((s) => s + 1);
  }, []);

  // -- Build team names --
  const buildTeamName = (ids: string[], fallback: string): string => {
    if (ids.length === 0) return fallback;
    const names = ids.map(
      (id) => players.find((p) => p.id === id)?.name ?? "?"
    );
    return names.join(" & ");
  };

  // -- Challenge mode info --
  const challengeMatchCount =
    selectedIds.length >= 4 ? totalMatchCount(selectedIds.length) : 0;
  const challengePerPlayer =
    selectedIds.length >= 4 ? matchesPerPlayer(selectedIds.length) : 0;
  const challengeSitOutCount =
    selectedIds.length >= 5 ? selectedIds.length - 4 : 0;

  // -- Can start? --
  const canStart = (() => {
    if (selectedIds.length < 2) return false;

    if (isChallenge) {
      return selectedIds.length >= 4 && penalty.trim().length > 0;
    }

    if (isAutoMode) {
      return selectedIds.length >= 4;
    }

    return (
      manualLeft.length > 0 &&
      manualRight.length > 0 &&
      manualLeft.length <= 2 &&
      manualRight.length <= 2
    );
  })();

  // -- Submit --
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canStart) return;

    if (isChallenge) {
      onStartTournament(selectedIds, penalty.trim());
      return;
    }

    let leftIds: string[];
    let rightIds: string[];

    if (isAutoMode && autoAssignment) {
      leftIds = autoAssignment.left.map((p) => p.id);
      rightIds = autoAssignment.right.map((p) => p.id);
    } else {
      leftIds = manualLeft;
      rightIds = manualRight;
    }

    const bestOf = isAutoMode ? 0 : mode === "bo3" ? 3 : mode === "bo5" ? 5 : 0;

    onStart({
      leftTeamName: buildTeamName(leftIds, DEFAULT_TEAM_NAMES.left),
      rightTeamName: buildTeamName(rightIds, DEFAULT_TEAM_NAMES.right),
      leftPlayerIds: leftIds,
      rightPlayerIds: rightIds,
      bestOf: bestOf as 0 | 3 | 5,
      durationMinutes: isAutoMode ? null : bestOf === 0 ? durationMinutes : null,
      allSelectedPlayerIds: isAutoMode ? selectedIds : undefined,
      initialRotation: isAutoMode && autoAssignment ? autoAssignment.rotation : undefined,
      isLastSet: isAutoMode ? true : undefined,
    });
  };

  // -- Mode change handler --
  const handleModeChange = (m: GameMode) => {
    setMode(m);
    if (m === "challenge") {
      setManualLeft([]);
      setManualRight([]);
    }
  };

  // -- Determine button label --
  const getButtonLabel = () => {
    if (selectedIds.length < 2) return "Select at least 2 players";
    if (isChallenge) {
      if (selectedIds.length < 4)
        return `Select ${4 - selectedIds.length} more player${4 - selectedIds.length > 1 ? "s" : ""}`;
      if (!penalty.trim()) return "Set a penalty to start";
      return "Start Challenge ⚔️";
    }
    if (!canStart) return "Assign players to teams";
    if (isAutoMode) return "Start Rotation 🔄";
    return "Start Match 🏸";
  };

  const showTeamAssignment = !isChallenge && selectedIds.length >= 2;
  const showManualTeams = showTeamAssignment && !isAutoMode;
  const showAutoTeams = showTeamAssignment && isAutoMode && autoAssignment;

  return (
    <div className="bg-gray-900 px-4 sm:px-6 pt-10 pb-4 animate-fade-in">
      <div className="w-full max-w-md mx-auto">
        {/* Logo / Title */}
        <div className="relative overflow-hidden mb-8 text-center">
          <div className="absolute inset-0 opacity-10 blur-3xl bg-gradient-to-b from-blue-500 via-transparent to-transparent" />
          <div className="relative">
            <div className="mb-3 text-5xl">🏸</div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Shuttle Score
            </h1>
            <p className="mt-1.5 text-sm text-white/40">
              Badminton score tracker
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Players */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <SectionLabel>Who&apos;s playing?</SectionLabel>
                {selectedIds.length > 0 && (
                  <span
                    className={`text-[11px] font-bold tabular-nums shrink-0 ${
                      selectedIds.length >= 4
                        ? "text-green-400"
                        : selectedIds.length >= 2
                          ? "text-amber-400"
                          : "text-white/30"
                    }`}
                  >
                    {selectedIds.length} selected
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowAddPlayer(!showAddPlayer)}
                className="text-[11px] sm:text-xs font-semibold text-green-400 active:text-green-300 transition-colors ml-3"
              >
                + Add
              </button>
            </div>

            {/* Add player inline form */}
            {showAddPlayer && (
              <div className="mb-3 flex gap-2 animate-slide-up">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Player name"
                  maxLength={15}
                  enterKeyHint="done"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPlayer();
                    }
                  }}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  disabled={!newPlayerName.trim()}
                  className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            )}

            {/* Player chips */}
            {players.length === 0 ? (
              <div className="rounded-2xl bg-white/[0.03] py-6 text-center">
                <p className="text-sm text-white/25">
                  Add your group to get started
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {players.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlayer(p.id)}
                      className={`rounded-xl border px-3 py-2 text-[13px] sm:text-sm font-semibold transition-all active:scale-[0.97] ${
                        isSelected
                          ? "border-green-500 bg-green-500/15 text-green-300"
                          : "border-white/10 bg-white/[0.04] text-white/60 active:bg-white/8"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[9px] font-bold text-gray-900">
                            ✓
                          </span>
                        )}
                        {p.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Game Mode */}
          {selectedIds.length >= 2 && !isAutoMode && (
            <div className="animate-slide-up">
              <div className="mb-3">
                <SectionLabel>Game Mode</SectionLabel>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: "free" as GameMode, label: "Free Play", icon: "🎯", desc: "Unlimited sets", disabled: false },
                  { value: "bo3" as GameMode, label: "Best of 3", icon: "3️⃣", desc: "First to 2 sets", disabled: false },
                  { value: "bo5" as GameMode, label: "Best of 5", icon: "5️⃣", desc: "First to 3 sets", disabled: false },
                  { value: "challenge" as GameMode, label: "Challenge", icon: "⚔️", desc: "Round-robin · Losers pay", disabled: selectedIds.length < 4 },
                ]).map(({ value, label, icon, desc, disabled }) => (
                  <button
                    key={value}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleModeChange(value)}
                    className={`rounded-2xl border p-3 text-left transition-all active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed ${
                      mode === value
                        ? value === "challenge"
                          ? "border-amber-500/50 bg-amber-500/12 ring-1 ring-amber-500/20"
                          : "border-green-500/50 bg-green-500/12 ring-1 ring-green-500/20"
                        : "border-white/8 bg-white/[0.03] active:bg-white/8"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{icon}</span>
                      <span
                        className={`text-[13px] sm:text-sm font-bold ${
                          mode === value
                            ? value === "challenge"
                              ? "text-amber-300"
                              : "text-green-400"
                            : "text-white/60"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    <p
                      className={`text-[10px] ${
                        mode === value
                          ? value === "challenge"
                            ? "text-amber-400/60"
                            : "text-green-400/50"
                          : "text-white/25"
                      }`}
                    >
                      {disabled
                        ? `Need ${4 - selectedIds.length} more`
                        : desc}
                    </p>
                  </button>
                ))}
              </div>

              {/* Free play duration */}
              {mode === "free" && (
                <div className="mt-3 space-y-2 animate-slide-up">
                  <p className="text-[11px] text-white/30">
                    Session duration (optional)
                  </p>
                  <div className="flex gap-2">
                    {[
                      { value: 60 as number | null, label: "1h" },
                      { value: 90 as number | null, label: "1.5h" },
                      { value: 120 as number | null, label: "2h" },
                      { value: null as number | null, label: "No limit" },
                    ].map(({ value, label }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setDurationMinutes(value)}
                        className={`flex-1 rounded-xl border min-h-[38px] text-xs font-semibold transition-all active:scale-[0.97] ${
                          durationMinutes === value
                            ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                            : "border-white/8 bg-white/[0.03] text-white/35 active:bg-white/8"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2b: Rotation Mode Info (5+ players, auto mode) */}
          {isAutoMode && (
            <div className="animate-slide-up">
              <div className="rounded-2xl border border-violet-500/30 bg-violet-500/8 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔄</span>
                  <span className="text-[13px] sm:text-sm font-bold text-violet-300">Rotation Mode</span>
                </div>
                <p className="text-[11px] text-violet-300/60 leading-relaxed">
                  {selectedIds.length} players · 1 set per game · Players rotate automatically after each game so everyone gets equal time.
                </p>
              </div>
            </div>
          )}

          {/* Step 3a: Manual Teams (2-4 players, non-challenge) */}
          {showManualTeams && (
            <div className="animate-slide-up space-y-3">
              <SectionLabel>Assign Teams</SectionLabel>

              {unassignedPlayers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {unassignedPlayers.map((p) => (
                    <ManualPlayerChip
                      key={p.id}
                      player={p}
                      onAssign={(side) => assignToTeam(p.id, side)}
                      leftFull={manualLeft.length >= 2}
                      rightFull={manualRight.length >= 2}
                    />
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <TeamSlot
                  label="Team 1"
                  color="blue"
                  playerIds={manualLeft}
                  players={players}
                  onRemove={(id) => removeFromTeam(id, "left")}
                />
                <TeamSlot
                  label="Team 2"
                  color="red"
                  playerIds={manualRight}
                  players={players}
                  onRemove={(id) => removeFromTeam(id, "right")}
                />
              </div>
            </div>
          )}

          {/* Step 3b: Auto Teams (5+ players, non-challenge) */}
          {showAutoTeams && autoAssignment && (
            <div className="animate-slide-up space-y-3">
              <div className="flex items-center justify-between">
                <SectionLabel>Match Up</SectionLabel>
                <button
                  type="button"
                  onClick={handleShuffle}
                  className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-amber-400 active:text-amber-300 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="16 3 21 3 21 8" />
                    <line x1="4" y1="20" x2="21" y2="3" />
                    <polyline points="21 16 21 21 16 21" />
                    <line x1="15" y1="15" x2="21" y2="21" />
                    <line x1="4" y1="4" x2="9" y2="9" />
                  </svg>
                  Rotate
                </button>
              </div>

              <div className="rounded-2xl bg-white/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-400">
                        Team 1
                      </span>
                    </div>
                    <div className="space-y-1">
                      {autoAssignment.left.map((p) => (
                        <div
                          key={p.id}
                          className="text-sm font-semibold text-white/90"
                        >
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className="text-[11px] text-white/20 font-bold">
                      VS
                    </span>
                  </div>

                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-400">
                        Team 2
                      </span>
                    </div>
                    <div className="space-y-1">
                      {autoAssignment.right.map((p) => (
                        <div
                          key={p.id}
                          className="text-sm font-semibold text-white/90"
                        >
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {autoAssignment.sittingOut.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5 text-center">
                    <span className="text-[10px] text-white/25 font-medium">
                      🪑 Sitting out:{" "}
                      {autoAssignment.sittingOut
                        .map((p) => p.name)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3c: Challenge Mode Details */}
          {isChallenge && selectedIds.length >= 2 && (
            <div className="animate-slide-up space-y-4">
              {/* Penalty Input */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <SectionLabel>Loser&apos;s Penalty 💀</SectionLabel>
                </div>
                <input
                  type="text"
                  value={penalty}
                  onChange={(e) => setPenalty(e.target.value)}
                  placeholder="e.g. Buy shuttlecocks for next week"
                  maxLength={50}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PENALTY_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPenalty(s)}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] transition-all active:scale-[0.97] ${
                        penalty === s
                          ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                          : "border-white/10 bg-white/5 text-white/40 active:bg-white/10"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tournament Info */}
              {selectedIds.length >= 4 && (
                <div className="animate-slide-up">
                  <div className="rounded-2xl bg-white/[0.04] px-4 py-3.5 space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-lg font-black text-white">
                          {selectedIds.length}
                        </div>
                        <div className="text-[10px] text-white/30 font-medium">
                          Players
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-black text-amber-400">
                          {challengeMatchCount}
                        </div>
                        <div className="text-[10px] text-white/30 font-medium">
                          Matches
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-black text-white">
                          {challengePerPlayer}
                        </div>
                        <div className="text-[10px] text-white/30 font-medium">
                          Per Player
                        </div>
                      </div>
                    </div>
                    {challengeSitOutCount > 0 && (
                      <p className="text-[11px] text-white/25 text-center border-t border-white/5 pt-2.5">
                        🪑 {challengeSitOutCount}{" "}
                        {challengeSitOutCount === 1
                          ? "player sits"
                          : "players sit"}{" "}
                        out each match
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Start Button */}
          <button
            type="submit"
            disabled={!canStart}
            className={`w-full rounded-2xl px-6 min-h-[56px] text-base sm:text-lg font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed ${
              canStart
                ? isChallenge
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 shadow-amber-600/25"
                  : "bg-gradient-to-r from-blue-600 to-violet-600 shadow-blue-600/25"
                : "bg-white/8 text-white/25 shadow-none"
            }`}
          >
            {getButtonLabel()}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Shared ---

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

// --- Manual Player Chip ---

function ManualPlayerChip({
  player,
  onAssign,
  leftFull,
  rightFull,
}: {
  player: Player;
  onAssign: (side: "left" | "right") => void;
  leftFull: boolean;
  rightFull: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);

  if (leftFull && rightFull) {
    return (
      <span className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-[13px] sm:text-sm font-semibold text-white/20 flex items-center gap-1">
        🪑 {player.name}
      </span>
    );
  }

  if (leftFull || rightFull) {
    return (
      <button
        type="button"
        onClick={() => onAssign(leftFull ? "right" : "left")}
        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] sm:text-sm font-semibold text-white/70 transition-all active:scale-[0.97] active:bg-white/8"
      >
        {player.name}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className={`rounded-xl border px-3 py-2 text-[13px] sm:text-sm font-semibold transition-all active:scale-[0.97] ${
          showPicker
            ? "border-white/25 bg-white/10 text-white"
            : "border-white/10 bg-white/[0.04] text-white/70 active:bg-white/8"
        }`}
      >
        {player.name}
      </button>
      {showPicker && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full z-10 mt-1.5 flex gap-1.5 animate-scale-in">
          <button
            type="button"
            onClick={() => {
              onAssign("left");
              setShowPicker(false);
            }}
            className="rounded-xl bg-blue-600 px-3 py-2 text-[11px] font-bold text-white shadow-lg shadow-blue-600/30 transition-all active:scale-[0.95]"
          >
            Team 1
          </button>
          <button
            type="button"
            onClick={() => {
              onAssign("right");
              setShowPicker(false);
            }}
            className="rounded-xl bg-red-600 px-3 py-2 text-[11px] font-bold text-white shadow-lg shadow-red-600/30 transition-all active:scale-[0.95]"
          >
            Team 2
          </button>
        </div>
      )}
    </div>
  );
}

// --- Team Slot ---

function TeamSlot({
  label,
  color,
  playerIds,
  players,
  onRemove,
}: {
  label: string;
  color: "blue" | "red";
  playerIds: string[];
  players: Player[];
  onRemove: (id: string) => void;
}) {
  const accent =
    color === "blue"
      ? {
          ring: "ring-blue-500/25",
          bg: "bg-blue-500/8",
          dot: "bg-blue-500",
          label: "text-blue-400",
          chip: "bg-blue-500/12 border-blue-500/20",
        }
      : {
          ring: "ring-red-500/25",
          bg: "bg-red-500/8",
          dot: "bg-red-500",
          label: "text-red-400",
          chip: "bg-red-500/12 border-red-500/20",
        };

  const hasPlayers = playerIds.length > 0;

  return (
    <div
      className={`rounded-2xl transition-all ${hasPlayers ? `${accent.bg} ring-1 ${accent.ring}` : "bg-white/[0.03]"} p-3`}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`h-2 w-2 rounded-full ${accent.dot}`} />
        <span
          className={`text-[10px] font-bold uppercase tracking-[0.12em] ${accent.label}`}
        >
          {label}
        </span>
      </div>
      {!hasPlayers ? (
        <p className="text-[11px] text-white/20 py-1">Tap a player ↑</p>
      ) : (
        <div className="space-y-1.5">
          {playerIds.map((id) => {
            const p = players.find((pl) => pl.id === id);
            if (!p) return null;
            return (
              <div
                key={id}
                className={`flex items-center justify-between rounded-xl border ${accent.chip} px-2.5 py-1.5`}
              >
                <span className="text-[13px] font-semibold text-white/90 truncate">
                  {p.name}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(id)}
                  className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-white/30 active:text-white/60 text-[10px] leading-none transition-colors"
                  aria-label={`Remove ${p.name}`}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
