import { openingRanges, RANK_ORDER } from '../content/openingRanges';
import { rankChar } from './cards';
import type { Card, HandKind, Position, Rank } from './types';

export const POSITIONS: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];

export interface HandClass { row: number; col: number; label: string }

export function cellLabel(row: number, col: number): string {
  const high = RANK_ORDER.charAt(Math.min(row, col));
  const low = RANK_ORDER.charAt(Math.max(row, col));
  if (row === col) return high + low;
  return high + low + (row < col ? 's' : 'o');
}

export function rankAt(index: number): Rank {
  return (14 - index) as Rank;
}

export function handClass([a, b]: [Card, Card]): HandClass {
  const high = RANK_ORDER.indexOf(rankChar(Math.max(a.rank, b.rank) as Rank));
  const low = RANK_ORDER.indexOf(rankChar(Math.min(a.rank, b.rank) as Rank));
  const [row, col] = a.suit === b.suit ? [high, low] : [low, high];
  return { row, col, label: cellLabel(row, col) };
}

export function isRaise(position: Position, row: number, col: number): boolean {
  return openingRanges[position].grid[row]?.charAt(col) === 'R';
}

export function preflopAnswer(position: Position, cards: [Card, Card]): 'raise' | 'fold' {
  const { row, col } = handClass(cards);
  return isRaise(position, row, col) ? 'raise' : 'fold';
}

export function handKind(row: number, col: number): HandKind {
  if (row === col) return 'pair';
  return row < col ? 'suited' : 'offsuit';
}
