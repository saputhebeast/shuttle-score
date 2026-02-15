import type { Player, Tournament, TournamentMatch, TournamentStanding, TeamSide } from "./types";

// ─── Schedule Generator ─────────────────────────────────────────────────────
//
// 4 players  → 3 matches, each player plays 3 (every 2v2 combination)
// N≥5 players → N matches, each player plays exactly 4 (sits out N−4 times)
//
// For N≥5 we use a modular‑rotation design:
//   • In match i the players who sit out are indices (i+k)%N for k=0…N−5
//   • The remaining 4 play, split into 2v2 rotating through the 3 possible
//     splits so partner combinations stay balanced.

const PAIRINGS_4: [left: [number, number], right: [number, number]][] = [
  [[0, 1], [2, 3]],
  [[0, 2], [1, 3]],
  [[0, 3], [1, 2]],
];

/**
 * Generate a balanced round-robin schedule for N ≥ 4 players.
 * Returns raw index-based match descriptors (not yet mapped to real IDs).
 */
function generateSchedule(
  playerCount: number
): { sittingOut: number[]; left: [number, number]; right: [number, number] }[] {
  if (playerCount === 4) {
    return PAIRINGS_4.map(([left, right]) => ({ sittingOut: [], left, right }));
  }

  const sitOutPerMatch = playerCount - 4;
  const matches: { sittingOut: number[]; left: [number, number]; right: [number, number] }[] = [];

  // Three possible ways to split 4 ordered players into 2v2:
  const SPLITS: [[number, number], [number, number]][] = [
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[0, 3], [1, 2]],
  ];

  for (let i = 0; i < playerCount; i++) {
    // Who sits out this match (consecutive block mod N)
    const sittingOut: number[] = [];
    for (let k = 0; k < sitOutPerMatch; k++) {
      sittingOut.push((i + k) % playerCount);
    }

    // The 4 active players (in original index order)
    const active: number[] = [];
    for (let p = 0; p < playerCount; p++) {
      if (!sittingOut.includes(p)) active.push(p);
    }

    // Rotate through splits for variety
    const [leftIdx, rightIdx] = SPLITS[i % 3];
    matches.push({
      sittingOut,
      left: [active[leftIdx[0]], active[leftIdx[1]]],
      right: [active[rightIdx[0]], active[rightIdx[1]]],
    });
  }

  return matches;
}

/**
 * How many matches each player plays in the tournament.
 */
export function matchesPerPlayer(playerCount: number): number {
  return playerCount === 4 ? 3 : 4;
}

/**
 * Total matches in a tournament of N players.
 */
export function totalMatchCount(playerCount: number): number {
  return playerCount === 4 ? 3 : playerCount;
}

/**
 * Create a new tournament for 4+ players.
 */
export function createTournament(
  playerIds: string[],
  penalty: string
): Tournament {
  const schedule = generateSchedule(playerIds.length);

  // Shuffle match order for variety
  const shuffled = [...schedule].sort(() => Math.random() - 0.5);

  const matches: TournamentMatch[] = shuffled.map((s, i) => ({
    index: i,
    leftPlayerIds: [playerIds[s.left[0]], playerIds[s.left[1]]],
    rightPlayerIds: [playerIds[s.right[0]], playerIds[s.right[1]]],
    sittingOutIds: s.sittingOut.map((idx) => playerIds[idx]),
    winner: null,
    sets: [],
    matchId: null,
  }));

  return {
    id: crypto.randomUUID(),
    playerIds,
    matches,
    penalty,
    currentMatchIndex: 0,
    createdAt: Date.now(),
    completedAt: null,
  };
}

/**
 * Record a match result in the tournament.
 * Returns updated tournament (immutable).
 */
export function recordTournamentResult(
  tournament: Tournament,
  matchIndex: number,
  winner: TeamSide,
  sets: { left: number; right: number; winner: TeamSide | null }[],
  matchId: string
): Tournament {
  const updatedMatches = tournament.matches.map((m) =>
    m.index === matchIndex ? { ...m, winner, sets, matchId } : m
  );

  const allPlayed = updatedMatches.every((m) => m.winner !== null);
  const nextIndex = allPlayed
    ? tournament.matches.length
    : updatedMatches.findIndex((m) => m.winner === null);

  return {
    ...tournament,
    matches: updatedMatches,
    currentMatchIndex: nextIndex === -1 ? tournament.matches.length : nextIndex,
    completedAt: allPlayed ? Date.now() : null,
  };
}

/**
 * Compute standings for each player in the tournament.
 * Sorts by most losses descending — bottom 2 get penalised.
 */
export function computeStandings(
  tournament: Tournament,
  players: Player[]
): TournamentStanding[] {
  const map: Record<string, { won: number; lost: number; played: number }> = {};

  // Initialise
  for (const id of tournament.playerIds) {
    map[id] = { won: 0, lost: 0, played: 0 };
  }

  // Tally from completed matches
  for (const m of tournament.matches) {
    if (!m.winner) continue;

    const winnerIds = m.winner === "left" ? m.leftPlayerIds : m.rightPlayerIds;
    const loserIds = m.winner === "left" ? m.rightPlayerIds : m.leftPlayerIds;

    for (const id of winnerIds) {
      map[id].won++;
      map[id].played++;
    }
    for (const id of loserIds) {
      map[id].lost++;
      map[id].played++;
    }
  }

  // Build standings sorted by most losses → fewest wins (worst first)
  const standings: TournamentStanding[] = tournament.playerIds.map((id) => {
    const player = players.find((p) => p.id === id);
    return {
      playerId: id,
      playerName: player?.name ?? "Unknown",
      played: map[id].played,
      won: map[id].won,
      lost: map[id].lost,
      isPenalised: false,
    };
  });

  // Sort: fewest losses first (best player at top), then most wins, then alphabetical
  standings.sort(
    (a, b) =>
      a.lost - b.lost ||
      b.won - a.won ||
      a.playerName.localeCompare(b.playerName)
  );

  // Mark bottom 2 as penalised (only when tournament is complete)
  if (tournament.completedAt && standings.length >= 2) {
    standings[standings.length - 2].isPenalised = true;
    standings[standings.length - 1].isPenalised = true;
  }

  return standings;
}

/**
 * Get team display name from player IDs.
 */
export function getTeamName(playerIds: string[], players: Player[]): string {
  return playerIds
    .map((id) => players.find((p) => p.id === id)?.name ?? "?")
    .join(" & ");
}
