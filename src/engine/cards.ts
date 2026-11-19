import type { Card, Rank, Suit } from './types';

export const SUITS: readonly Suit[] = ['s', 'h', 'd', 'c'];
export const RANKS: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const RANK_CHARS = '23456789TJQKA';

export function fullDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })));
}

export function rankChar(rank: Rank): string {
  return RANK_CHARS.charAt(rank - 2);
}

export function parseCard(text: string): Card | null {
  const match = /^([2-9TJQKA]|10)([shdc])$/i.exec(text.trim());
  if (!match) return null;
  const rankText = match[1]!.toUpperCase() === '10' ? 'T' : match[1]!.toUpperCase();
  return { rank: (RANK_CHARS.indexOf(rankText) + 2) as Rank, suit: match[2]!.toLowerCase() as Suit };
}

export function formatCard(card: Card): string {
  return rankChar(card.rank) + card.suit;
}

export function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}
