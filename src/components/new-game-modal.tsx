"use client";

import { useState, useCallback, useMemo } from "react";
import type { NewGameConfig, Player } from "@/lib/types";
import { DEFAULT_TEAM_NAMES } from "@/lib/constants";
import { totalMatchCount, matchesPerPlayer } from "@/lib/tournament-engine";
import { ShuttlecockIcon, TargetIcon, NumberBadge, SwordsIcon, RotateIcon, BenchIcon, SkullIcon } from "@/components/ui/icons";

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
  "Buy shuttlecocks",
  "Buy energy drinks",
  "Buy pizza for everyone",
  "Buy coffee next session",
  "Clean the court",
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
      return "Start Challenge";
    }
    if (!canStart) return "Assign players to teams";
    if (isAutoMode) return "Start Rotation";
    return "Start Match";
  };

  const showTeamAssignment = !isChallenge && selectedIds.length >= 2;
  const showManualTeams = showTeamAssignment && !isAutoMode;
  const showAutoTeams = showTeamAssignment && isAutoMode && autoAssignment;

  return (
    <div className="bg-[#F5F5F7] px-4 sm:px-6 pt-10 pb-4 animate-fade-in">
      <div className="w-full max-w-md mx-auto">
        {/* Logo / Title */}
        <div className="relative mb-8 text-center">
          <div className="relative">
            <div className="mb-3 flex justify-center">
              <ShuttlecockIcon className="w-12 h-12 text-gray-900" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
              Shuttle Score
            </h1>
            <p className="mt-1.5 text-sm text-gray-400">
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
                        ? "text-green-600"
                        : selectedIds.length >= 2
                          ? "text-amber-600"
                          : "text-gray-400"
                    }`}
                  >
                    {selectedIds.length} selected
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowAddPlayer(!showAddPlayer)}
                className="text-[11px] sm:text-xs font-semibold text-blue-600 active:text-blue-500 transition-colors ml-3"
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
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/20 shadow-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  disabled={!newPlayerName.trim()}
                  className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-40 shadow-sm"
                >
                  Add
                </button>
              </div>
            )}

            {/* Player chips */}
            {players.length === 0 ? (
              <div className="rounded-2xl bg-white border border-gray-200 py-6 text-center shadow-sm">
                <p className="text-sm text-gray-400">
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
                      className={`rounded-xl border px-3 py-2 text-[13px] sm:text-sm font-semibold transition-all active:scale-[0.97] shadow-sm ${
                        isSelected
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-700 active:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-gray-900">
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
                  { value: "free" as GameMode, label: "Free Play", icon: <TargetIcon className="w-4 h-4" />, desc: "Unlimited sets", disabled: false },
                  { value: "bo3" as GameMode, label: "Best of 3", icon: <NumberBadge n={3} className="w-4 h-4" />, desc: "First to 2 sets", disabled: false },
                  { value: "bo5" as GameMode, label: "Best of 5", icon: <NumberBadge n={5} className="w-4 h-4" />, desc: "First to 3 sets", disabled: false },
                  { value: "challenge" as GameMode, label: "Challenge", icon: <SwordsIcon className="w-4 h-4" />, desc: "Round-robin · Losers pay", disabled: selectedIds.length < 4 },
                ]).map(({ value, label, icon, desc, disabled }) => (
                  <button
                    key={value}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleModeChange(value)}
                    className={`rounded-2xl border p-3 text-left transition-all active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed shadow-sm ${
                      mode === value
                        ? value === "challenge"
                          ? "border-gray-900 bg-white ring-1 ring-gray-900/20"
                          : "border-gray-900 bg-white ring-1 ring-gray-900/20"
                        : "border-gray-200 bg-white active:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`${
                        mode === value ? "text-gray-900" : "text-gray-400"
                      }`}>{icon}</span>
                      <span
                        className={`text-[13px] sm:text-sm font-bold ${
                          mode === value
                            ? "text-gray-900"
                            : "text-gray-600"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    <p
                      className={`text-[10px] ${
                        mode === value
                          ? "text-gray-500"
                          : "text-gray-400"
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
                  <p className="text-[11px] text-gray-400">
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
                        className={`flex-1 rounded-xl border min-h-[38px] text-xs font-semibold transition-all active:scale-[0.97] shadow-sm ${
                          durationMinutes === value
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 bg-white text-gray-500 active:bg-gray-50"
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
              <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <RotateIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-[13px] sm:text-sm font-bold text-gray-900">Rotation Mode</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
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
                  className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-blue-600 active:text-blue-500 transition-colors"
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

              <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600">
                        Team 1
                      </span>
                    </div>
                    <div className="space-y-1">
                      {autoAssignment.left.map((p) => (
                        <div
                          key={p.id}
                          className="text-sm font-semibold text-gray-900"
                        >
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className="text-[11px] text-gray-300 font-bold">
                      VS
                    </span>
                  </div>

                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-600">
                        Team 2
                      </span>
                    </div>
                    <div className="space-y-1">
                      {autoAssignment.right.map((p) => (
                        <div
                          key={p.id}
                          className="text-sm font-semibold text-gray-900"
                        >
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {autoAssignment.sittingOut.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                    <span className="text-[10px] text-gray-400 font-medium inline-flex items-center gap-1">
                      <BenchIcon className="w-3 h-3" /> Sitting out:{" "}
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
                  <SectionLabel>Loser&apos;s Penalty</SectionLabel>
                </div>
                <input
                  type="text"
                  value={penalty}
                  onChange={(e) => setPenalty(e.target.value)}
                  placeholder="e.g. Buy shuttlecocks for next week"
                  maxLength={50}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/20 shadow-sm"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PENALTY_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPenalty(s)}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] transition-all active:scale-[0.97] ${
                        penalty === s
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-500 active:bg-gray-50"
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
                  <div className="rounded-2xl bg-white border border-gray-200 px-4 py-3.5 space-y-3 shadow-sm">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-lg font-black text-gray-900">
                          {selectedIds.length}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">
                          Players
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-black text-gray-900">
                          {challengeMatchCount}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">
                          Matches
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-black text-gray-900">
                          {challengePerPlayer}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">
                          Per Player
                        </div>
                      </div>
                    </div>
                    {challengeSitOutCount > 0 && (
                      <p className="text-[11px] text-gray-400 text-center border-t border-gray-100 pt-2.5">
                        <BenchIcon className="w-3 h-3 inline-block mr-0.5 -mt-px" /> {challengeSitOutCount}{" "}
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
            className={`w-full rounded-2xl px-6 min-h-[56px] text-base sm:text-lg font-bold shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed ${
              canStart
                ? "bg-gray-900 text-white shadow-gray-900/20"
                : "bg-gray-200 text-gray-400 shadow-none"
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
      <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
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
      <span className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] sm:text-sm font-semibold text-gray-400 flex items-center gap-1">
        <BenchIcon className="w-3.5 h-3.5" /> {player.name}
      </span>
    );
  }

  if (leftFull || rightFull) {
    return (
      <button
        type="button"
        onClick={() => onAssign(leftFull ? "right" : "left")}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] sm:text-sm font-semibold text-gray-700 transition-all active:scale-[0.97] active:bg-gray-50 shadow-sm"
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
        className={`rounded-xl border px-3 py-2 text-[13px] sm:text-sm font-semibold transition-all active:scale-[0.97] shadow-sm ${
          showPicker
            ? "border-gray-900 bg-gray-50 text-gray-900"
            : "border-gray-200 bg-white text-gray-700 active:bg-gray-50"
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
            className="rounded-xl bg-blue-500 px-3 py-2 text-[11px] font-bold text-white shadow-md transition-all active:scale-[0.95]"
          >
            Team 1
          </button>
          <button
            type="button"
            onClick={() => {
              onAssign("right");
              setShowPicker(false);
            }}
            className="rounded-xl bg-red-500 px-3 py-2 text-[11px] font-bold text-white shadow-md transition-all active:scale-[0.95]"
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
          ring: "ring-blue-200",
          bg: "bg-blue-50",
          dot: "bg-blue-500",
          label: "text-blue-600",
          chip: "bg-blue-50 border-blue-200",
        }
      : {
          ring: "ring-red-200",
          bg: "bg-red-50",
          dot: "bg-red-500",
          label: "text-red-600",
          chip: "bg-red-50 border-red-200",
        };

  const hasPlayers = playerIds.length > 0;

  return (
    <div
      className={`rounded-2xl transition-all ${hasPlayers ? `${accent.bg} ring-1 ${accent.ring}` : "bg-white border border-gray-200"} p-3 shadow-sm`}
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
        <p className="text-[11px] text-gray-400 py-1">Tap a player ↑</p>
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
                <span className="text-[13px] font-semibold text-gray-900 truncate">
                  {p.name}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(id)}
                  className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-500 active:text-gray-700 text-[10px] leading-none transition-colors"
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
