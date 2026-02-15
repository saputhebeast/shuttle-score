import type { GameState, SetScore, TeamSide } from "./types";

// ─── Badminton Rules ─────────────────────────────────────────────────────────

/** Points required to win a set normally */
export const POINTS_TO_WIN = 21;

/** Minimum lead required to win (deuce rule) */
export const MIN_LEAD = 2;

/** Absolute cap — first to 30 wins regardless of lead */
export const SCORE_CAP = 30;

/** Number of sets to win in best-of-3 */
export const SETS_TO_WIN_BO3 = 2;

/** Number of sets to win in best-of-5 */
export const SETS_TO_WIN_BO5 = 3;

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_TEAM_NAMES: Record<TeamSide, string> = {
  left: "Team A",
  right: "Team B",
};

export const TEAM_COLORS: Record<TeamSide, { bg: string; text: string; accent: string; ring: string }> = {
  left: {
    bg: "bg-blue-600",
    text: "text-blue-600",
    accent: "bg-blue-500",
    ring: "ring-blue-400",
  },
  right: {
    bg: "bg-red-600",
    text: "text-red-600",
    accent: "bg-red-500",
    ring: "ring-red-400",
  },
};

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createInitialSet(): SetScore {
  return { left: 0, right: 0, winner: null };
}

export function createInitialGameState(
  leftName: string = DEFAULT_TEAM_NAMES.left,
  rightName: string = DEFAULT_TEAM_NAMES.right,
  bestOf: 0 | 3 | 5 = 3,
  durationMinutes: number | null = null,
  leftPlayerIds: string[] = [],
  rightPlayerIds: string[] = [],
  isLastSet: boolean = false,
): GameState {
  return {
    id: crypto.randomUUID(),
    teams: {
      left: { name: leftName, color: "blue", playerIds: leftPlayerIds },
      right: { name: rightName, color: "red", playerIds: rightPlayerIds },
    },
    currentSet: 0,
    sets: [createInitialSet()],
    serving: "left",
    history: [],
    matchWinner: null,
    startedAt: Date.now(),
    endedAt: null,
    bestOf,
    durationMinutes,
    isLastSet,
    setStartedAt: [Date.now()],
  };
}

export const STORAGE_KEYS = {
  CURRENT_GAME: "badminton-current-game",
  MATCH_HISTORY: "badminton-match-history",
  PLAYERS: "badminton-players",
  TOURNAMENT: "badminton-tournament",
  ROTATION_SESSION: "badminton-rotation-session",
} as const;
