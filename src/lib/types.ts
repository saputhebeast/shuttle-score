// ─── Domain Types ────────────────────────────────────────────────────────────

export interface Team {
  name: string;
  color: TeamColor;
}

export type TeamColor = "blue" | "red";

export type TeamSide = "left" | "right";

export interface SetScore {
  left: number;
  right: number;
  winner: TeamSide | null;
}

export interface GameState {
  /** Unique game ID for storage */
  id: string;
  /** Team configurations */
  teams: Record<TeamSide, Team>;
  /** Current set index (0-based) */
  currentSet: number;
  /** All sets in the match */
  sets: SetScore[];
  /** Which team is currently serving */
  serving: TeamSide;
  /** History stack for undo functionality */
  history: HistoryEntry[];
  /** Match winner (null if ongoing) */
  matchWinner: TeamSide | null;
  /** Match start timestamp */
  startedAt: number;
  /** Match end timestamp */
  endedAt: number | null;
  /** Best of N sets (0 = free play / unlimited) */
  bestOf: 0 | 3 | 5;
  /** Free play: optional session duration in minutes */
  durationMinutes?: number | null;
  /** Free play: is the current set flagged as the last one? */
  isLastSet?: boolean;
  /** Timestamps when each set started (for avg set time calculation) */
  setStartedAt?: number[];
}

export interface HistoryEntry {
  /** Which team scored */
  team: TeamSide;
  /** Set index when score happened */
  setIndex: number;
  /** Snapshot of scores before this action */
  scoreBefore: Pick<SetScore, "left" | "right">;
  /** Who was serving before this action */
  servingBefore: TeamSide;
  /** Timestamp */
  timestamp: number;
}

export interface MatchSummary {
  id: string;
  teams: Record<TeamSide, Team>;
  sets: SetScore[];
  matchWinner: TeamSide | null;
  startedAt: number;
  endedAt: number | null;
  bestOf: 0 | 3 | 5;
  stats?: SessionStats;
}

export interface SessionStats {
  /** Which side won more sets */
  sessionWinner: TeamSide | null;
  /** Sets won by each side */
  setsWon: Record<TeamSide, number>;
  /** Total points scored by each side */
  totalPoints: Record<TeamSide, number>;
  /** Average set duration in ms */
  avgSetDurationMs: number;
  /** Total duration in ms */
  totalDurationMs: number;
  /** Number of completed sets */
  completedSets: number;
  /** Closest set (smallest margin) */
  closestSet: { index: number; left: number; right: number } | null;
  /** Biggest win (largest margin) */
  biggestWin: { index: number; left: number; right: number; winner: TeamSide } | null;
}

// ─── UI Types ────────────────────────────────────────────────────────────────

export interface NewGameConfig {
  leftTeamName: string;
  rightTeamName: string;
  bestOf: 0 | 3 | 5;
  durationMinutes: number | null;
}
