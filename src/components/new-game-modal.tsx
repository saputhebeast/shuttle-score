"use client";

import { useState } from "react";
import type { NewGameConfig, Player } from "@/lib/types";
import { DEFAULT_TEAM_NAMES } from "@/lib/constants";

interface NewGameModalProps {
  onStart: (config: NewGameConfig) => void;
  players: Player[];
  onAddPlayer: (name: string) => Player;
}

export function NewGameModal({ onStart, players, onAddPlayer }: NewGameModalProps) {
  const [leftPlayers, setLeftPlayers] = useState<Player[]>([]);
  const [rightPlayers, setRightPlayers] = useState<Player[]>([]);
  const [bestOf, setBestOf] = useState<0 | 3 | 5>(0);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(120);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  // Players not yet assigned to either team
  const availablePlayers = players.filter(
    (p) =>
      !leftPlayers.some((lp) => lp.id === p.id) &&
      !rightPlayers.some((rp) => rp.id === p.id)
  );

  const addToTeam = (player: Player, side: "left" | "right") => {
    if (side === "left" && leftPlayers.length < 2) {
      setLeftPlayers((prev) => [...prev, player]);
    } else if (side === "right" && rightPlayers.length < 2) {
      setRightPlayers((prev) => [...prev, player]);
    }
  };

  const removeFromTeam = (playerId: string, side: "left" | "right") => {
    if (side === "left") {
      setLeftPlayers((prev) => prev.filter((p) => p.id !== playerId));
    } else {
      setRightPlayers((prev) => prev.filter((p) => p.id !== playerId));
    }
  };

  const handleAddPlayer = () => {
    const name = newPlayerName.trim();
    if (!name) return;
    onAddPlayer(name);
    setNewPlayerName("");
    setShowAddPlayer(false);
  };

  const buildTeamName = (teamPlayers: Player[], fallback: string): string => {
    if (teamPlayers.length === 0) return fallback;
    return teamPlayers.map((p) => p.name).join(" & ");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      leftTeamName: buildTeamName(leftPlayers, DEFAULT_TEAM_NAMES.left),
      rightTeamName: buildTeamName(rightPlayers, DEFAULT_TEAM_NAMES.right),
      leftPlayerIds: leftPlayers.map((p) => p.id),
      rightPlayerIds: rightPlayers.map((p) => p.id),
      bestOf,
      durationMinutes: bestOf === 0 ? durationMinutes : null,
    });
  };

  const canStart = leftPlayers.length > 0 && rightPlayers.length > 0;

  return (
    <div className="flex min-h-[100dvh] items-start sm:items-center justify-center bg-gray-900 p-4 sm:p-6 overflow-y-auto safe-bottom scroll-smooth">
      <div className="w-full max-w-md py-8 sm:py-0 animate-fade-in">
        {/* Logo / Title */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="mb-2 sm:mb-3 text-4xl sm:text-5xl">🏸</div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Shuttle Score
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-white/50">
            Badminton score tracker
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Player Roster */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-white/50">
                Players
              </label>
              <button
                type="button"
                onClick={() => setShowAddPlayer(!showAddPlayer)}
                className="text-[11px] sm:text-xs font-medium text-green-400 active:text-green-300 transition-colors"
              >
                + Add Player
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
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  disabled={!newPlayerName.trim()}
                  className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            )}

            {/* Available players */}
            {players.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">
                No players yet — add your group above
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {availablePlayers.map((player) => (
                  <PlayerChip
                    key={player.id}
                    player={player}
                    onTapLeft={() => addToTeam(player, "left")}
                    onTapRight={() => addToTeam(player, "right")}
                    leftFull={leftPlayers.length >= 2}
                    rightFull={rightPlayers.length >= 2}
                  />
                ))}
                {availablePlayers.length === 0 && players.length > 0 && (
                  <p className="text-[11px] text-white/30 py-1">All players assigned</p>
                )}
              </div>
            )}
          </div>

          {/* Team Composition */}
          <div className="grid grid-cols-2 gap-3">
            <TeamSlot
              label="Team 1"
              color="blue"
              players={leftPlayers}
              onRemove={(id) => removeFromTeam(id, "left")}
              maxPlayers={2}
            />
            <TeamSlot
              label="Team 2"
              color="red"
              players={rightPlayers}
              onRemove={(id) => removeFromTeam(id, "right")}
              maxPlayers={2}
            />
          </div>

          {/* Match Format */}
          <div>
            <label className="mb-2 block text-[10px] sm:text-xs font-medium uppercase tracking-wider text-white/50">
              Match Format
            </label>
            <div className="flex gap-2">
              {([{ value: 0, label: "Free Play" }, { value: 3, label: "Best of 3" }, { value: 5, label: "Best of 5" }] as const).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBestOf(value)}
                  className={`flex-1 rounded-xl border px-2 sm:px-3 min-h-[44px] text-[13px] sm:text-sm font-semibold transition-all active:scale-[0.97] ${
                    bestOf === value
                      ? "border-green-500 bg-green-500/20 text-green-400"
                      : "border-white/10 bg-white/5 text-white/50 active:bg-white/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {bestOf === 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-white/40">
                  Session duration (optional — helps auto-detect last set)
                </p>
                <div className="flex gap-2">
                  {[
                    { value: 60, label: "1h" },
                    { value: 90, label: "1.5h" },
                    { value: 120, label: "2h" },
                    { value: null, label: "No limit" },
                  ].map(({ value, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setDurationMinutes(value)}
                      className={`flex-1 rounded-lg border px-2 min-h-[40px] text-xs font-semibold transition-all active:scale-[0.97] ${
                        durationMinutes === value
                          ? "border-amber-500 bg-amber-500/20 text-amber-400"
                          : "border-white/10 bg-white/5 text-white/40 active:bg-white/10"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Start Button */}
          <button
            type="submit"
            disabled={!canStart}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-red-600 px-6 min-h-[52px] text-base sm:text-lg font-bold text-white shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {canStart ? "Start Match 🏸" : "Assign Players to Both Teams"}
          </button>
        </form>

        {/* Quick start hint */}
        <p className="mt-3 sm:mt-4 text-center text-[11px] sm:text-xs text-white/30">
          Tap a player name, then pick a team
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PlayerChip({
  player,
  onTapLeft,
  onTapRight,
  leftFull,
  rightFull,
}: {
  player: Player;
  onTapLeft: () => void;
  onTapRight: () => void;
  leftFull: boolean;
  rightFull: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs sm:text-sm font-medium text-white/80 transition-all active:bg-white/10 active:scale-[0.97]"
      >
        {player.name}
      </button>
      {showPicker && (
        <div className="absolute left-0 top-full z-10 mt-1 flex gap-1 animate-scale-in">
          <button
            type="button"
            onClick={() => { onTapLeft(); setShowPicker(false); }}
            disabled={leftFull}
            className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-lg transition-all active:scale-[0.95] disabled:opacity-30"
          >
            Team 1
          </button>
          <button
            type="button"
            onClick={() => { onTapRight(); setShowPicker(false); }}
            disabled={rightFull}
            className="rounded-lg bg-red-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-lg transition-all active:scale-[0.95] disabled:opacity-30"
          >
            Team 2
          </button>
        </div>
      )}
    </div>
  );
}

function TeamSlot({
  label,
  color,
  players,
  onRemove,
  maxPlayers,
}: {
  label: string;
  color: "blue" | "red";
  players: Player[];
  onRemove: (id: string) => void;
  maxPlayers: number;
}) {
  const borderColor = color === "blue" ? "border-blue-500/40" : "border-red-500/40";
  const labelColor = color === "blue" ? "text-blue-400" : "text-red-400";
  const dotColor = color === "blue" ? "bg-blue-500" : "bg-red-500";
  const chipBg = color === "blue" ? "bg-blue-500/15 border-blue-500/30" : "bg-red-500/15 border-red-500/30";

  return (
    <div className={`rounded-xl border-2 border-dashed ${borderColor} p-3 min-h-[100px]`}>
      <div className="mb-2 flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${labelColor}`}>
          {label}
        </span>
      </div>
      {players.length === 0 ? (
        <p className="text-[10px] text-white/25 mt-3 text-center">
          Tap a player
        </p>
      ) : (
        <div className="space-y-1.5">
          {players.map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-lg border ${chipBg} px-2.5 py-1.5`}
            >
              <span className="text-xs sm:text-sm font-medium text-white/90 truncate">
                {p.name}
              </span>
              <button
                type="button"
                onClick={() => onRemove(p.id)}
                className="ml-1 text-white/30 active:text-white/60 text-sm leading-none"
                aria-label={`Remove ${p.name}`}
              >
                ✕
              </button>
            </div>
          ))}
          {players.length < maxPlayers && (
            <p className="text-[9px] text-white/20 text-center mt-1">
              +{maxPlayers - players.length} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}
