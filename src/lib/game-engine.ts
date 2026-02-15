import type { GameState, SetScore, TeamSide, HistoryEntry, SessionStats } from "./types";
import {
  POINTS_TO_WIN,
  MIN_LEAD,
  SCORE_CAP,
  SETS_TO_WIN_BO3,
  SETS_TO_WIN_BO5,
  createInitialSet,
} from "./constants";

// ─── Pure Game Logic ─────────────────────────────────────────────────────────
// All functions are pure — they return new state without mutating the input.

/**
 * Check if a set has been won based on badminton scoring rules:
 * - First to 21 with a 2-point lead
 * - At 29-29, first to 30 wins
 */
export function isSetWon(set: SetScore): TeamSide | null {
  const { left, right } = set;

  // Cap rule: at 29-all, whoever reaches 30 first wins
  if (left >= SCORE_CAP) return "left";
  if (right >= SCORE_CAP) return "right";

  // Normal win: reach POINTS_TO_WIN with MIN_LEAD advantage
  if (left >= POINTS_TO_WIN && left - right >= MIN_LEAD) return "left";
  if (right >= POINTS_TO_WIN && right - left >= MIN_LEAD) return "right";

  return null;
}

/**
 * Check if the match has been won (best-of-N sets).
 * In free play mode (bestOf=0), the match never ends automatically.
 */
export function isMatchWon(sets: SetScore[], bestOf: 0 | 3 | 5): TeamSide | null {
  // Free play — no match winner, just keep playing sets
  if (bestOf === 0) return null;

  const setsToWin = bestOf === 3 ? SETS_TO_WIN_BO3 : SETS_TO_WIN_BO5;

  let leftWins = 0;
  let rightWins = 0;

  for (const set of sets) {
    if (set.winner === "left") leftWins++;
    if (set.winner === "right") rightWins++;
  }

  if (leftWins >= setsToWin) return "left";
  if (rightWins >= setsToWin) return "right";

  return null;
}

/**
 * Determine who serves next based on the scorer.
 * In badminton, the team that wins the rally serves next.
 */
function getNextServer(scorer: TeamSide): TeamSide {
  return scorer;
}

/**
 * Score a point for a team. Returns the new game state.
 */
export function scorePoint(state: GameState, team: TeamSide): GameState {
  // Cannot score if match is already won
  if (state.matchWinner) return state;

  const currentSetData = state.sets[state.currentSet];

  // Cannot score if current set is already won
  if (currentSetData.winner) return state;

  // Create history entry for undo
  const historyEntry: HistoryEntry = {
    team,
    setIndex: state.currentSet,
    scoreBefore: { left: currentSetData.left, right: currentSetData.right },
    servingBefore: state.serving,
    timestamp: Date.now(),
  };

  // Update the set score
  const updatedSet: SetScore = {
    ...currentSetData,
    [team]: currentSetData[team] + 1,
  };

  // Check if this set is now won
  const setWinner = isSetWon(updatedSet);
  updatedSet.winner = setWinner;

  // Build updated sets array
  const updatedSets = [...state.sets];
  updatedSets[state.currentSet] = updatedSet;

  // Determine new serving side
  const newServing = getNextServer(team);

  // Check if match is won
  const matchWinner = isMatchWon(updatedSets, state.bestOf);

  // In free play with isLastSet, treat this set ending as match end
  const isFreePlayLastSetDone = state.bestOf === 0 && state.isLastSet && setWinner;

  // If set was won but match isn't over, prepare next set
  let newCurrentSet = state.currentSet;
  const newSetStartedAt = [...(state.setStartedAt ?? [state.startedAt])];
  let newIsLastSet = state.isLastSet ?? false;

  if (setWinner && !matchWinner && !isFreePlayLastSetDone) {
    newCurrentSet = state.currentSet + 1;
    updatedSets.push(createInitialSet());
    newSetStartedAt.push(Date.now());
  }

  // Determine if session is truly over
  const sessionOver = !!matchWinner || !!isFreePlayLastSetDone;

  return {
    ...state,
    sets: updatedSets,
    currentSet: newCurrentSet,
    serving: newServing,
    history: [...state.history, historyEntry],
    matchWinner: matchWinner,
    endedAt: sessionOver ? Date.now() : null,
    isLastSet: newIsLastSet,
    setStartedAt: newSetStartedAt,
    // For free play last set done, we mark endedAt but matchWinner stays null
    // The hook will detect endedAt to show summary
  };
}

/**
 * Undo the last scored point. Returns the previous game state.
 */
export function undoLastPoint(state: GameState): GameState {
  if (state.history.length === 0) return state;

  const lastEntry = state.history[state.history.length - 1];
  const newHistory = state.history.slice(0, -1);

  // If we moved to a new set, remove it
  let updatedSets = [...state.sets];
  let newCurrentSet = state.currentSet;

  if (lastEntry.setIndex < state.currentSet) {
    // We advanced a set — remove the latest empty set
    updatedSets = updatedSets.slice(0, -1);
    newCurrentSet = lastEntry.setIndex;
  }

  // Restore the set score
  updatedSets[lastEntry.setIndex] = {
    ...updatedSets[lastEntry.setIndex],
    left: lastEntry.scoreBefore.left,
    right: lastEntry.scoreBefore.right,
    winner: null,
  };

  return {
    ...state,
    sets: updatedSets,
    currentSet: newCurrentSet,
    serving: lastEntry.servingBefore,
    history: newHistory,
    matchWinner: null,
    endedAt: null,
  };
}

/**
 * Get the number of sets won by each team.
 */
export function getSetsWon(sets: SetScore[]): Record<TeamSide, number> {
  return sets.reduce(
    (acc, set) => {
      if (set.winner === "left") acc.left++;
      if (set.winner === "right") acc.right++;
      return acc;
    },
    { left: 0, right: 0 }
  );
}

/**
 * Check if the game is in a deuce situation (both teams at 20+ and equal).
 */
export function isDeuce(set: SetScore): boolean {
  return set.left >= 20 && set.right >= 20 && set.left === set.right;
}

/**
 * Check if it's a set point or match point for either team.
 */
export function getGamePointInfo(
  set: SetScore,
  sets: SetScore[],
  bestOf: 0 | 3 | 5
): { team: TeamSide; type: "set" | "match" } | null {
  const setsToWin = bestOf === 0 ? Infinity : bestOf === 3 ? SETS_TO_WIN_BO3 : SETS_TO_WIN_BO5;
  const setsWon = getSetsWon(sets);

  for (const side of ["left", "right"] as TeamSide[]) {
    const other = side === "left" ? "right" : "left";
    const isAtSetPoint =
      (set[side] >= POINTS_TO_WIN - 1 && set[side] - set[other] >= MIN_LEAD - 1) ||
      (set[side] === SCORE_CAP - 1);

    if (isAtSetPoint && set[side] > set[other]) {
      const isMatchPoint = setsWon[side] === setsToWin - 1;
      return { team: side, type: isMatchPoint ? "match" : "set" };
    }
  }

  return null;
}

/**
 * Format elapsed time from milliseconds to mm:ss.
 */
export function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format elapsed time as h:mm:ss for longer durations.
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// ─── Session Stats ───────────────────────────────────────────────────────────

/**
 * Calculate average set duration from set start timestamps.
 */
export function getAverageSetDurationMs(setStartedAt: number[] | undefined): number {
  if (!setStartedAt || setStartedAt.length < 2) return 0;
  const durations: number[] = [];
  for (let i = 1; i < setStartedAt.length; i++) {
    durations.push(setStartedAt[i] - setStartedAt[i - 1]);
  }
  return durations.reduce((a, b) => a + b, 0) / durations.length;
}

/**
 * Determine if the app should suggest marking the next set as last.
 * Returns true when remaining time < average set duration.
 */
export function shouldSuggestLastSet(state: GameState): boolean {
  if (state.bestOf !== 0) return false;
  if (state.isLastSet) return false;
  if (!state.durationMinutes) return false;

  const completedSets = state.sets.filter((s) => s.winner).length;
  if (completedSets < 1) return false; // need at least 1 completed set for avg

  const elapsedMs = Date.now() - state.startedAt;
  const totalMs = state.durationMinutes * 60 * 1000;
  const remainingMs = totalMs - elapsedMs;

  if (remainingMs <= 0) return true;

  const avgSetMs = getAverageSetDurationMs(state.setStartedAt ?? []);
  if (avgSetMs <= 0) return false;

  // Suggest last set if remaining time can't fit 2 more sets
  return remainingMs < avgSetMs * 1.5;
}

/**
 * Get remaining time for a timed free play session.
 */
export function getRemainingMs(state: GameState): number | null {
  if (!state.durationMinutes) return null;
  const totalMs = state.durationMinutes * 60 * 1000;
  const elapsedMs = Date.now() - state.startedAt;
  return Math.max(0, totalMs - elapsedMs);
}

/**
 * Compute session stats from a completed game state.
 */
export function computeSessionStats(state: GameState): SessionStats {
  const completedSets = state.sets.filter((s) => s.winner);
  const setsWon = getSetsWon(completedSets);

  // Total points
  const totalPoints = completedSets.reduce(
    (acc, set) => ({
      left: acc.left + set.left,
      right: acc.right + set.right,
    }),
    { left: 0, right: 0 }
  );

  // Session winner (who won more sets)
  let sessionWinner: TeamSide | null = null;
  if (state.matchWinner) {
    sessionWinner = state.matchWinner;
  } else if (setsWon.left > setsWon.right) {
    sessionWinner = "left";
  } else if (setsWon.right > setsWon.left) {
    sessionWinner = "right";
  }

  // Average set duration
  const avgSetDurationMs = getAverageSetDurationMs(state.setStartedAt ?? []);

  // Total duration
  const totalDurationMs = (state.endedAt || Date.now()) - state.startedAt;

  // Closest set (smallest margin)
  let closestSet: SessionStats["closestSet"] = null;
  let smallestMargin = Infinity;
  completedSets.forEach((set, i) => {
    const margin = Math.abs(set.left - set.right);
    if (margin < smallestMargin) {
      smallestMargin = margin;
      closestSet = { index: i, left: set.left, right: set.right };
    }
  });

  // Biggest win (largest margin)
  let biggestWin: SessionStats["biggestWin"] = null;
  let largestMargin = 0;
  completedSets.forEach((set, i) => {
    const margin = Math.abs(set.left - set.right);
    if (margin > largestMargin && set.winner) {
      largestMargin = margin;
      biggestWin = { index: i, left: set.left, right: set.right, winner: set.winner };
    }
  });

  return {
    sessionWinner,
    setsWon,
    totalPoints,
    avgSetDurationMs,
    totalDurationMs,
    completedSets: completedSets.length,
    closestSet,
    biggestWin,
  };
}
