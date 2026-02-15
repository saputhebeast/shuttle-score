// ─── Domain Types ────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  createdAt: number;
}

export interface Team {
  name: string;
  color: TeamColor;
  /** Player IDs on this team (1 for singles, 2 for doubles) */
  playerIds?: string[];
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
  /** Player IDs per side (for analytics) */
  playerIds?: Record<TeamSide, string[]>;
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
  leftPlayerIds: string[];
  rightPlayerIds: string[];
  bestOf: 0 | 3 | 5;
  durationMinutes: number | null;
  /** All selected player IDs when 5+ players — enables rotation between games */
  allSelectedPlayerIds?: string[];
  /** Initial rotation index for the sit-out rotation (syncs modal display with rotation logic) */
  initialRotation?: number;
  /** Start the game with isLastSet=true so it auto-ends after 1 set (rotation mode) */
  isLastSet?: boolean;
}

// ─── Player Analytics ────────────────────────────────────────────────────────

export interface PlayerStats {
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
  winRate: number;
  setsWon: number;
  setsLost: number;
  totalPointsFor: number;
  totalPointsAgainst: number;
  /** Partner ID → { played, won } */
  partnerRecord: Record<string, { played: number; won: number }>;
  /** Opponent ID → { played, won } */
  opponentRecord: Record<string, { played: number; won: number }>;
  /** Recent form: last 5 results as W/L/D */
  recentForm: ("W" | "L" | "D")[];
}

// ─── Rotation Session (5+ Player Rotation) ──────────────────────────────────

export interface RotationSession {
  /** All player IDs in the rotation pool */
  playerIds: string[];
  /** Current rotation index — determines who sits out */
  rotation: number;
  /** Game format carried from the original game config */
  bestOf: 0 | 3 | 5;
  /** Duration in minutes (free play) */
  durationMinutes: number | null;
}

// ─── Tournament (Round-Robin) ────────────────────────────────────────────────

export interface TournamentMatch {
  /** Index within the tournament (0-based) */
  index: number;
  /** Player IDs for left team */
  leftPlayerIds: [string, string];
  /** Player IDs for right team */
  rightPlayerIds: [string, string];
  /** Player IDs sitting out this match (empty for 4-player format) */
  sittingOutIds: string[];
  /** Winner side or null if not yet played */
  winner: TeamSide | null;
  /** Set scores from the completed game */
  sets: SetScore[];
  /** Match summary ID (links to match history) */
  matchId: string | null;
}

export interface TournamentStanding {
  playerId: string;
  playerName: string;
  played: number;
  won: number;
  lost: number;
  /** Is this player one of the bottom losers who pays the penalty */
  isPenalised: boolean;
}

export interface Tournament {
  id: string;
  /** The player IDs in this tournament (4+) */
  playerIds: string[];
  /** All round-robin matches */
  matches: TournamentMatch[];
  /** The penalty/fine the bottom 2 losers must pay */
  penalty: string;
  /** Current match index, or matches.length if completed */
  currentMatchIndex: number;
  /** Timestamp when tournament was created */
  createdAt: number;
  /** Timestamp when tournament was completed (all matches played) */
  completedAt: number | null;
}
