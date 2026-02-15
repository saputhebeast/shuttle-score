import type { MatchSummary, Player, PlayerStats, TeamSide } from "./types";

/**
 * Compute per-player stats from match history.
 * Only considers matches where playerIds are present.
 */
export function computeAllPlayerStats(
  players: Player[],
  matches: MatchSummary[]
): PlayerStats[] {
  return players.map((player) => computePlayerStats(player, matches));
}

export function computePlayerStats(
  player: Player,
  matches: MatchSummary[]
): PlayerStats {
  const stats: PlayerStats = {
    playerId: player.id,
    playerName: player.name,
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    matchesDrawn: 0,
    winRate: 0,
    setsWon: 0,
    setsLost: 0,
    totalPointsFor: 0,
    totalPointsAgainst: 0,
    partnerRecord: {},
    opponentRecord: {},
    recentForm: [],
  };

  // Process matches in chronological order for recent form
  const relevantMatches = matches
    .filter((m) => {
      const ids = m.playerIds;
      if (!ids) return false;
      return (
        ids.left?.includes(player.id) || ids.right?.includes(player.id)
      );
    })
    .sort((a, b) => a.startedAt - b.startedAt);

  for (const match of relevantMatches) {
    const ids = match.playerIds!;
    const mySide: TeamSide = ids.left?.includes(player.id)
      ? "left"
      : "right";
    const opponentSide: TeamSide = mySide === "left" ? "right" : "left";

    stats.matchesPlayed++;

    // Determine match result
    const completedSets = match.sets.filter((s) => s.winner);
    const mySetsWon = completedSets.filter(
      (s) => s.winner === mySide
    ).length;
    const oppSetsWon = completedSets.filter(
      (s) => s.winner === opponentSide
    ).length;

    // Use matchWinner if available, otherwise compare sets
    let result: "W" | "L" | "D";
    if (match.matchWinner) {
      result = match.matchWinner === mySide ? "W" : "L";
    } else if (mySetsWon > oppSetsWon) {
      result = "W";
    } else if (oppSetsWon > mySetsWon) {
      result = "L";
    } else {
      result = "D";
    }

    if (result === "W") stats.matchesWon++;
    else if (result === "L") stats.matchesLost++;
    else stats.matchesDrawn++;

    stats.recentForm.push(result);

    // Sets
    stats.setsWon += mySetsWon;
    stats.setsLost += oppSetsWon;

    // Points
    for (const set of completedSets) {
      stats.totalPointsFor += set[mySide];
      stats.totalPointsAgainst += set[opponentSide];
    }

    // Partner tracking (my teammates, excluding myself)
    const myTeamIds = ids[mySide] ?? [];
    for (const partnerId of myTeamIds) {
      if (partnerId === player.id) continue;
      if (!stats.partnerRecord[partnerId]) {
        stats.partnerRecord[partnerId] = { played: 0, won: 0 };
      }
      stats.partnerRecord[partnerId].played++;
      if (result === "W") stats.partnerRecord[partnerId].won++;
    }

    // Opponent tracking
    const oppIds = ids[opponentSide] ?? [];
    for (const oppId of oppIds) {
      if (!stats.opponentRecord[oppId]) {
        stats.opponentRecord[oppId] = { played: 0, won: 0 };
      }
      stats.opponentRecord[oppId].played++;
      if (result === "W") stats.opponentRecord[oppId].won++;
    }
  }

  // Keep only last 5 for recent form
  stats.recentForm = stats.recentForm.slice(-5);

  // Win rate
  stats.winRate =
    stats.matchesPlayed > 0
      ? Math.round((stats.matchesWon / stats.matchesPlayed) * 100)
      : 0;

  return stats;
}

/**
 * Find the best partner for a player (highest win rate with >= 2 games).
 */
export function getBestPartner(
  stats: PlayerStats,
  players: Player[]
): { player: Player; winRate: number; played: number } | null {
  let best: { id: string; winRate: number; played: number } | null = null;

  for (const [partnerId, record] of Object.entries(stats.partnerRecord)) {
    if (record.played < 2) continue;
    const wr = record.won / record.played;
    if (!best || wr > best.winRate || (wr === best.winRate && record.played > best.played)) {
      best = { id: partnerId, winRate: wr, played: record.played };
    }
  }

  if (!best) return null;
  const player = players.find((p) => p.id === best!.id);
  if (!player) return null;

  return {
    player,
    winRate: Math.round(best.winRate * 100),
    played: best.played,
  };
}
