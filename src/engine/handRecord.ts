import { formatCard, parseCard, sameCard, SUITS } from './cards';
import { evaluate, HandCategory } from './handEval';
import { handClass, POSITIONS, preflopAnswer } from './handClass';
import { unseenCards } from './explain';
import { findOuts } from './outs';
import { exactHitChance, potOdds, toPercent } from './odds';
import type { Card, DrawKind, Position } from './types';

export type HandAction = 'fold' | 'check' | 'call' | 'bet' | 'raise';
export type HandStreet = 'preflop' | 'flop' | 'turn' | 'river';
export const HAND_STREETS: HandStreet[] = ['preflop', 'flop', 'turn', 'river'];
export const HAND_ACTIONS: HandAction[] = ['fold', 'check', 'call', 'bet', 'raise'];
export const HAND_TAGS = ['bluff', 'value', 'badBeat', 'misread', 'tilt', 'cooler'] as const;
export type HandTag = (typeof HAND_TAGS)[number];

export interface StreetEntry { pot: number; bet: number; action: HandAction }
export type DraftStreet = Omit<StreetEntry, 'action'> & { action: HandAction | null };

export const BOARD_CARDS = [0, 3, 1, 1];

export interface HandRecord {
  id: string;
  date: string;
  position: Position;
  heroCards: [Card, Card];
  board: Card[];
  streets: Partial<Record<HandStreet, StreetEntry>>;
  resultBb: number;
  tags: HandTag[];
  note?: string;
  updatedAt: number;
}

export interface PreflopMismatch { record: HandRecord; kind: 'openOutside' | 'foldInside' | 'limpInside'; hand: string }

export interface PotOddsMistake {
  record: HandRecord;
  street: 'flop' | 'turn';
  drawKind: DrawKind;
  outs: number;
  hitPercent: number;
  needPercent: number;
  betShare: number;
}

export interface HandAnalysis {
  preflopChecked: number;
  preflopMismatches: PreflopMismatch[];
  callsChecked: number;
  potOddsMistakes: PotOddsMistake[];
  byPosition: { position: Position; hands: number; netBb: number }[];
}

const BOARD_SIZE = { flop: 3, turn: 4 } as const;
const EARLY: Position[] = ['UTG', 'MP'];

export type Tip =
  | { key: 'bigBetCalls'; count: number; drawKind: DrawKind; outs: number; hit: number; maxShare: number }
  | { key: 'earlyOpens'; count: number; hands: string[] }
  | { key: 'chartFolds'; count: number; hands: string[] }
  | { key: 'losingSeat'; position: Position; lost: number; hands: number };

function parseCards(value: unknown): Card[] | null {
  if (!Array.isArray(value)) return null;
  const cards = value.map((text) => (typeof text === 'string' ? parseCard(text) : null));
  return cards.every((card) => card !== null) ? (cards as Card[]) : null;
}

const BOARD_SIZES = [0, 3, 4, 5];

function finite(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function parseStreet(value: unknown): StreetEntry | undefined {
  const entry = value as Partial<StreetEntry> | undefined;
  if (!entry || !HAND_ACTIONS.includes(entry.action as HandAction)) return undefined;
  return { pot: Math.max(0, finite(entry.pot)), bet: Math.max(0, finite(entry.bet)), action: entry.action as HandAction };
}

function parseRecord(value: unknown): HandRecord | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  const hero = parseCards(raw.heroCards);
  const board = parseCards(raw.board);
  if (typeof raw.id !== 'string' || typeof raw.date !== 'string' || !POSITIONS.includes(raw.position as Position)) return null;
  if (!hero || hero.length !== 2 || !board || !BOARD_SIZES.includes(board.length)) return null;
  const cards = [...hero, ...board];
  if (cards.some((card, index) => cards.findIndex((other) => sameCard(card, other)) !== index)) return null;
  const streets: HandRecord['streets'] = {};
  for (const street of HAND_STREETS) {
    const entry = parseStreet((raw.streets as Record<string, unknown> | undefined)?.[street]);
    if (entry) streets[street] = entry;
  }
  return {
    id: raw.id,
    date: raw.date,
    position: raw.position as Position,
    heroCards: [hero[0]!, hero[1]!],
    board,
    streets,
    resultBb: finite(raw.resultBb),
    tags: HAND_TAGS.filter((tag) => Array.isArray(raw.tags) && raw.tags.includes(tag)),
    ...(typeof raw.note === 'string' && raw.note ? { note: raw.note.slice(0, 500) } : {}),
    updatedAt: typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.parse(raw.date) || Date.now(),
  };
}

export function parseHands(value: unknown): HandRecord[] {
  const list = Array.isArray(value) ? value : (value as { hands?: unknown } | null)?.hands;
  if (!Array.isArray(list)) throw new Error('Not a hands export');
  return list.map(parseRecord).filter((record): record is HandRecord => record !== null);
}

export function actionAllowed(street: number, bet: number, position: Position | null, action: HandAction): boolean {
  const facing = street === 0 ? Math.max(bet, 1) : bet;
  const bigBlindOption = street === 0 && position === 'BB' && facing <= 1;
  if (action === 'fold') return true;
  if (action === 'raise') return facing > 0;
  if (action === 'call') return facing > 0 && !bigBlindOption;
  if (street === 0) return action === 'check' && bigBlindOption;
  return facing === 0;
}

const BLINDS: Partial<Record<Position, number>> = { SB: 0.5, BB: 1 };

export function investedBb(position: Position | null, streets: DraftStreet[]): number {
  return streets.reduce(
    (sum, entry) => sum + (entry.action === 'call' || entry.action === 'bet' || entry.action === 'raise' ? entry.bet : 0),
    position ? (BLINDS[position] ?? 0) : 0,
  );
}

export function serializeHands(records: HandRecord[]) {
  return {
    version: 1,
    hands: records.map((record) => ({ ...record, heroCards: record.heroCards.map(formatCard), board: record.board.map(formatCard) })),
  };
}

export function detectDraw(hero: readonly Card[], board: readonly Card[]): { drawKind: DrawKind; outs: number } | null {
  if (evaluate([...hero, ...board]).category >= HandCategory.TwoPair) return null;
  const outs = findOuts(hero, board, 'comboDraw').length;
  const flush = SUITS.some((suit) => [...hero, ...board].filter((card) => card.suit === suit).length === 4 && hero.some((card) => card.suit === suit));
  if (outs >= 12 || (flush && outs > 9)) return { drawKind: 'comboDraw', outs };
  if (flush) return { drawKind: 'flushDraw', outs };
  if (outs >= 8) return { drawKind: 'oesd', outs };
  if (outs >= 4) return { drawKind: 'gutshot', outs };
  return null;
}

function checkPreflop(record: HandRecord): PreflopMismatch | null | undefined {
  const entry = record.streets.preflop;
  if (!entry || record.position === 'BB' || entry.bet > 1 || entry.action === 'check') return undefined;
  const chart = preflopAnswer(record.position, record.heroCards);
  const hand = handClass(record.heroCards).label;
  if (entry.action === 'fold') return chart === 'raise' ? { record, kind: 'foldInside', hand } : null;
  if (entry.action === 'call' && chart === 'raise') return { record, kind: 'limpInside', hand };
  return chart === 'fold' ? { record, kind: 'openOutside', hand } : null;
}

function checkCall(record: HandRecord, street: 'flop' | 'turn'): PotOddsMistake | null | undefined {
  const entry = record.streets[street];
  const board = record.board.slice(0, BOARD_SIZE[street]);
  if (!entry || entry.action !== 'call' || entry.bet <= 0 || board.length < BOARD_SIZE[street]) return undefined;
  const draw = detectDraw(record.heroCards, board);
  if (!draw) return undefined;
  const hit = exactHitChance(draw.outs, unseenCards(board), 1);
  const need = potOdds(entry.bet, entry.pot + entry.bet);
  if (hit >= need) return null;
  return { record, street, ...draw, hitPercent: toPercent(hit), needPercent: toPercent(need), betShare: entry.pot > 0 ? entry.bet / entry.pot : 1 };
}

export function analyzeHands(records: HandRecord[]): HandAnalysis {
  const preflop = records.map(checkPreflop).filter((result) => result !== undefined);
  const calls = records.flatMap((record) => [checkCall(record, 'flop'), checkCall(record, 'turn')]).filter((result) => result !== undefined);
  return {
    preflopChecked: preflop.length,
    preflopMismatches: preflop.filter((result) => result !== null),
    callsChecked: calls.length,
    potOddsMistakes: calls.filter((result) => result !== null),
    byPosition: POSITIONS.map((position) => {
      const mine = records.filter((record) => record.position === position);
      return { position, hands: mine.length, netBb: mine.reduce((sum, record) => sum + record.resultBb, 0) };
    }).filter(({ hands }) => hands > 0),
  };
}

function mostCommon<T>(items: T[]): T | undefined {
  return items.toSorted((a, b) => items.filter((item) => item === b).length - items.filter((item) => item === a).length)[0];
}

export function tips(analysis: HandAnalysis): Tip[] {
  const result: Tip[] = [];
  const bigBetCalls = analysis.potOddsMistakes.filter((mistake) => mistake.betShare >= 0.5);
  const sample = mostCommon(bigBetCalls.map((mistake) => mistake.drawKind));
  const example = bigBetCalls.find((mistake) => mistake.drawKind === sample);
  if (bigBetCalls.length >= 3 && example) {
    const maxShare = Math.floor((example.hitPercent / (100 - 2 * example.hitPercent)) * 100);
    result.push({ key: 'bigBetCalls', count: bigBetCalls.length, drawKind: example.drawKind, outs: example.outs, hit: example.hitPercent, maxShare });
  }
  const earlyOpens = analysis.preflopMismatches.filter((m) => m.kind === 'openOutside' && EARLY.includes(m.record.position));
  if (earlyOpens.length >= 3) {
    result.push({ key: 'earlyOpens', count: earlyOpens.length, hands: [...new Set(earlyOpens.map((m) => m.hand))].slice(0, 3) });
  }
  const folds = analysis.preflopMismatches.filter((m) => m.kind === 'foldInside');
  if (folds.length >= 3) {
    result.push({ key: 'chartFolds', count: folds.length, hands: [...new Set(folds.map((m) => m.hand))].slice(0, 3) });
  }
  for (const { position, hands, netBb } of analysis.byPosition) {
    if (hands >= 5 && netBb / hands <= -2) {
      result.push({ key: 'losingSeat', position, lost: Math.abs(netBb), hands });
    }
  }
  return result;
}
