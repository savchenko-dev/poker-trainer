import { SUITS } from './cards';
import { evaluate, HandCategory } from './handEval';
import { findOuts, remainingDeck } from './outs';
import { LEVELS } from './levels';
import { int, pick, shuffle, type Rng } from './rng';
import type { Card, DrawKind, Level, Rank, Situation, Street, Suit } from './types';

const EXPECTED_OUTS: Record<DrawKind, [number, number]> = {
  flushDraw: [9, 9],
  oesd: [8, 8],
  gutshot: [4, 4],
  comboDraw: [12, 15],
  overcards: [6, 6],
  pairPlusDraw: [14, 14],
};

const TARGET_CATEGORY: Record<DrawKind, HandCategory> = {
  flushDraw: HandCategory.Straight,
  oesd: HandCategory.Straight,
  gutshot: HandCategory.Straight,
  comboDraw: HandCategory.Straight,
  overcards: HandCategory.OnePair,
  pairPlusDraw: HandCategory.TwoPair,
};

const BET_FRACTIONS = [1 / 5, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 1];

interface Spot { hero: Card[]; board: Card[] }

function otherSuit(rng: Rng, suit: Suit): Suit {
  return pick(rng, SUITS.filter((s) => s !== suit));
}

function straightRanks(rng: Rng, gutshot: boolean): Rank[] {
  if (!gutshot) {
    const low = int(rng, 3, 10);
    return [low, low + 1, low + 2, low + 3] as Rank[];
  }
  const low = int(rng, 2, 10);
  const missing = int(rng, 1, 3);
  return [0, 1, 2, 3, 4].filter((step) => step !== missing).map((step) => low + step) as Rank[];
}

function fill(rng: Rng, spot: Spot, boardSize: number, allowed: (card: Card) => boolean): Spot {
  const pool = shuffle(rng, remainingDeck([...spot.hero, ...spot.board]).filter(allowed));
  return { hero: spot.hero, board: [...spot.board, ...pool.slice(0, boardSize - spot.board.length)] };
}

function buildSpot(rng: Rng, kind: DrawKind, boardSize: number): Spot {
  const suit = pick(rng, SUITS);
  const offSuit = (card: Card) => card.suit !== suit;
  if (kind === 'flushDraw') {
    const [a, b, c, d] = shuffle(rng, remainingDeck([]).filter((card) => card.suit === suit));
    return fill(rng, { hero: [a!, b!], board: [c!, d!] }, boardSize, offSuit);
  }
  if (kind === 'oesd' || kind === 'gutshot') {
    const ranks = shuffle(rng, straightRanks(rng, kind === 'gutshot'));
    const cards = ranks.map((rank) => ({ rank, suit: pick(rng, SUITS) }));
    return fill(rng, { hero: cards.slice(0, 2), board: cards.slice(2) }, boardSize, () => true);
  }
  if (kind === 'comboDraw') {
    const ranks = shuffle(rng, straightRanks(rng, rng() < 0.5));
    const hero = ranks.slice(0, 2).map((rank) => ({ rank, suit }));
    const board = ranks.slice(2).map((rank) => ({ rank, suit }));
    return fill(rng, { hero, board }, boardSize, offSuit);
  }
  if (kind === 'overcards') {
    const [high, low] = shuffle(rng, [10, 11, 12, 13, 14] as Rank[]);
    const hero = [
      { rank: high!, suit },
      { rank: low!, suit: otherSuit(rng, suit) },
    ];
    const lowest = Math.min(high!, low!);
    return fill(rng, { hero, board: [] }, boardSize, (card) => card.rank < lowest - 1);
  }
  const [paired, kicker, c, d] = shuffle(rng, remainingDeck([]).filter((card) => card.suit === suit));
  const board = [{ rank: paired!.rank, suit: otherSuit(rng, suit) }, c!, d!];
  return fill(rng, { hero: [paired!, kicker!], board }, boardSize, offSuit);
}

function isValid(spot: Spot, kind: DrawKind): boolean {
  const ranks = new Set(spot.board.map((card) => card.rank));
  if (ranks.size !== spot.board.length) return false;
  if (evaluate([...spot.hero, ...spot.board]).category >= TARGET_CATEGORY[kind]) return false;
  const [min, max] = EXPECTED_OUTS[kind];
  const outs = findOuts(spot.hero, spot.board, kind).length;
  return outs >= min && outs <= max;
}

export function sizeBet(rng: Rng, accept: (pot: number, betToCall: number) => boolean): { pot: number; betToCall: number } | null {
  for (const fraction of shuffle(rng, BET_FRACTIONS)) {
    const potBeforeBet = int(rng, 2, 20) * 10;
    const betToCall = Math.max(5, Math.round((potBeforeBet * fraction) / 5) * 5);
    if (accept(potBeforeBet + betToCall, betToCall)) return { pot: potBeforeBet + betToCall, betToCall };
  }
  return null;
}

export function generateSituation(level: Level, rng: Rng): Situation {
  const config = LEVELS[level];
  const first = pick(rng, config.drawKinds);
  const street: Street = config.allowTurn && rng() < 0.5 ? 'turn' : 'flop';
  const boardSize = street === 'flop' ? 3 : 4;
  for (const drawKind of [first, ...shuffle(rng, config.drawKinds.filter((kind) => kind !== first))]) {
    for (let attempt = 0; attempt < 300; attempt++) {
      const spot = buildSpot(rng, drawKind, boardSize);
      if (!isValid(spot, drawKind)) continue;
      return {
        heroCards: [spot.hero[0]!, spot.hero[1]!],
        board: shuffle(rng, spot.board),
        street,
        ...sizeBet(rng, () => true)!,
        drawKind,
      };
    }
  }
  throw new Error(`No draw spot found on the ${street}`);
}
