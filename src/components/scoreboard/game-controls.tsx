"use client";

import { ClockIcon } from "@/components/ui/icons";

interface GameControlsProps {
  canUndo: boolean;
  isFreePlay: boolean;
  isLastSet: boolean;
  isRotation: boolean;
  onUndo: () => void;
  onReset: () => void;
  onMarkLastSet: () => void;
  elapsedTime: string;
  isTimeWarning: boolean;
  isCountdown: boolean;
  gamePointLabel: string | null;
}

export function GameControls({
  canUndo,
  isFreePlay,
  isLastSet,
  isRotation,
  onUndo,
  onReset,
  onMarkLastSet,
  elapsedTime,
  isTimeWarning,
  isCountdown,
  gamePointLabel,
}: GameControlsProps) {
  return (
    <div className="flex w-full flex-col gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3">
      {/* Game point label */}
      {gamePointLabel && (
        <div className="flex justify-center">
          <span className="animate-pulse rounded-full bg-gray-900 px-3 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase text-white shadow-sm">
            {gamePointLabel}
          </span>
        </div>
      )}

      {/* Main controls row */}
      <div className="flex w-full items-center justify-between gap-1.5 sm:gap-2">
        {/* Undo button — min 44px tap target */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-gray-100 px-3 sm:px-4 min-h-[44px] text-[13px] sm:text-sm font-medium text-gray-700 transition-all active:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Undo last point"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          Undo
        </button>

        {/* Center — Time display */}
        <div className="flex flex-col items-center gap-0.5 min-w-0">
          <span className={`font-mono text-[13px] sm:text-sm tabular-nums ${
            isTimeWarning
              ? "text-amber-600 animate-pulse font-bold"
              : isCountdown
              ? "text-gray-600"
              : "text-gray-400"
          }`}>
            {isCountdown && <><ClockIcon className="w-3 h-3 inline-block mr-0.5 -mt-px" /> </>}{elapsedTime}
          </span>
        </div>

        {/* Right side — Last Set or End — min 44px tap target */}
        {isFreePlay && !isLastSet && !isRotation ? (
          <button
            onClick={onMarkLastSet}
            className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 sm:px-3 min-h-[44px] text-[13px] sm:text-sm font-medium text-amber-700 transition-all active:bg-amber-100 active:scale-[0.97]"
            aria-label="Mark as last set"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            Last
          </button>
        ) : (
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-gray-100 px-3 sm:px-4 min-h-[44px] text-[13px] sm:text-sm font-medium text-gray-700 transition-all active:bg-gray-200"
            aria-label="End session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            End
          </button>
        )}
      </div>
    </div>
  );
}
