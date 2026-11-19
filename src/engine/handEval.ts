import type { Card, Rank } from './types';

export const HandCategory = {
  HighCard: 0,
  OnePair: 1,
  TwoPair: 2,
  ThreeOfAKind: 3,
  Straight: 4,
  Flush: 5,
  FullHouse: 6,
  FourOfAKind: 7,
  StraightFlush: 8,
} as const;
export type HandCategory = (typeof HandCategory)[keyof typeof HandCategory];

export interface HandValue { category: HandCategory; tiebreak: number[] }

function straightHigh(ranks: readonly number[]): number | null {
  const present = new Set(ranks);
  if (present.has(14)) present.add(1);
  for (let high = 14; high >= 5; high--) {
    if ([0, 1, 2, 3, 4].every((step) => present.has(high - step))) return high;
  }
  return null;
}

export function evaluate(cards: readonly Card[]): HandValue {
  const bySuit = new Map<string, Rank[]>();
  const counts = new Map<number, number>();
  for (const { rank, suit } of cards) {
    bySuit.set(suit, [...(bySuit.get(suit) ?? []), rank]);
    counts.set(rank, (counts.get(rank) ?? 0) + 1);
  }
  const flushRanks = [...bySuit.values()].find((ranks) => ranks.length >= 5)?.sort((a, b) => b - a);
  if (flushRanks) {
    const high = straightHigh(flushRanks);
    if (high !== null) return { category: HandCategory.StraightFlush, tiebreak: [high] };
  }
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const ranksWith = (count: number) => groups.filter(([, c]) => c >= count).map(([rank]) => rank);
  const kickers = (exclude: number[], n: number) =>
    groups.map(([rank]) => rank).filter((rank) => !exclude.includes(rank)).sort((a, b) => b - a).slice(0, n);

  const [quad] = ranksWith(4);
  if (quad !== undefined) return { category: HandCategory.FourOfAKind, tiebreak: [quad, ...kickers([quad], 1)] };
  const [trips] = ranksWith(3);
  if (trips !== undefined) {
    const pair = ranksWith(2).find((rank) => rank !== trips);
    if (pair !== undefined) return { category: HandCategory.FullHouse, tiebreak: [trips, pair] };
  }
  if (flushRanks) return { category: HandCategory.Flush, tiebreak: flushRanks.slice(0, 5) };
  const high = straightHigh([...counts.keys()]);
  if (high !== null) return { category: HandCategory.Straight, tiebreak: [high] };
  if (trips !== undefined) return { category: HandCategory.ThreeOfAKind, tiebreak: [trips, ...kickers([trips], 2)] };
  const pairs = ranksWith(2);
  const [topPair, secondPair] = pairs;
  if (topPair !== undefined && secondPair !== undefined) {
    return { category: HandCategory.TwoPair, tiebreak: [topPair, secondPair, ...kickers([topPair, secondPair], 1)] };
  }
  if (topPair !== undefined) return { category: HandCategory.OnePair, tiebreak: [topPair, ...kickers([topPair], 3)] };
  return { category: HandCategory.HighCard, tiebreak: kickers([], 5) };
}
