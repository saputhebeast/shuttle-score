"use client";

import { useState } from "react";
import type { NewGameConfig } from "@/lib/types";
import { DEFAULT_TEAM_NAMES } from "@/lib/constants";

interface NewGameModalProps {
  onStart: (config: NewGameConfig) => void;
}

export function NewGameModal({ onStart }: NewGameModalProps) {
  const [leftName, setLeftName] = useState("");
  const [rightName, setRightName] = useState("");
  const [bestOf, setBestOf] = useState<0 | 3 | 5>(0);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(120);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      leftTeamName: leftName.trim() || DEFAULT_TEAM_NAMES.left,
      rightTeamName: rightName.trim() || DEFAULT_TEAM_NAMES.right,
      bestOf,
      durationMinutes: bestOf === 0 ? durationMinutes : null,
    });
  };

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
          {/* Team Names */}
          <div className="space-y-3">
            <div>
              <label htmlFor="left-team" className="mb-1 block text-[10px] sm:text-xs font-medium uppercase tracking-wider text-blue-400">
                Team 1
              </label>
              <input
                id="left-team"
                type="text"
                value={leftName}
                onChange={(e) => setLeftName(e.target.value)}
                placeholder={DEFAULT_TEAM_NAMES.left}
                maxLength={20}
                enterKeyHint="next"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 sm:px-4 py-3 text-white placeholder-white/30 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="right-team" className="mb-1 block text-[10px] sm:text-xs font-medium uppercase tracking-wider text-red-400">
                Team 2
              </label>
              <input
                id="right-team"
                type="text"
                value={rightName}
                onChange={(e) => setRightName(e.target.value)}
                placeholder={DEFAULT_TEAM_NAMES.right}
                maxLength={20}
                enterKeyHint="done"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 sm:px-4 py-3 text-white placeholder-white/30 outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              />
            </div>
          </div>

          {/* Best of */}
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">
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
                <p className="text-xs text-white/40">
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
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-red-600 px-6 min-h-[52px] text-base sm:text-lg font-bold text-white shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] active:shadow-xl active:shadow-blue-500/30"
          >
            Start Match 🏸
          </button>
        </form>

        {/* Quick start hint */}
        <p className="mt-3 sm:mt-4 text-center text-[11px] sm:text-xs text-white/30">
          Leave names empty for default team names
        </p>
      </div>
    </div>
  );
}
