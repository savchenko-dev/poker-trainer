import { RANKS, SUITS } from './cards';
import { evaluate, HandCategory } from './handEval';
import { findOuts, remainingDeck, TARGET_CATEGORY } from './outs';
import { LEVELS } from './levels';
import { int, pick, shuffle, type Rng } from './rng';
import type { Card, DealtDraw, Level, Rank, Situation, Street, Suit } from './types';

const EXPECTED_OUTS: Record<DealtDraw, number> = {
  gutshot: 4,
  doubleGutshot: 8,
  oesd: 8,
  flushDraw: 9,
  flushGutshot: 12,
  flushOesd: 15,
  overcards: 6,
  overcardGutshot: 7,
  overcardFlush: 12,
  pairPlusDraw: 14,
  pocketPairToSet: 2,
  twoPairToFullHouse: 4,
  setToFullHouse: 7,
  pairToTwoPair: 5,
  oesdPair: 13,
};

const BET_FRACTIONS = [1 / 5, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 1];

interface Spot { hero: Card[]; board: Card[] }

export function expectedOuts(kind: DealtDraw, boardSize: number): number {
  return kind === 'setToFullHouse' ? 3 * (boardSize - 1) + 1 : EXPECTED_OUTS[kind];
}

function otherSuit(rng: Rng, suit: Suit): Suit {
  return pick(rng, SUITS.filter((s) => s !== suit));
}

function straightRanks(rng: Rng, shape: 'oesd' | 'gutshot' | 'doubleGutshot'): Rank[] {
  if (shape === 'oesd') {
    const low = int(rng, 3, 10);
    return [low, low + 1, low + 2, low + 3] as Rank[];
  }
  if (shape === 'doubleGutshot') {
    const low = int(rng, 2, 8);
    return [low, low + 2, low + 3, low + 4, low + 6] as Rank[];
  }
  const low = int(rng, 2, 10);
  const missing = int(rng, 1, 3);
  return [0, 1, 2, 3, 4].filter((step) => step !== missing).map((step) => low + step) as Rank[];
}

function withSuits(rng: Rng, ranks: readonly Rank[]): Card[] {
  const cards: Card[] = [];
  for (const rank of ranks) {
    cards.push({ rank, suit: pick(rng, SUITS.filter((suit) => !cards.some((card) => card.rank === rank && card.suit === suit))) });
  }
  return cards;
}

function apart(ranks: readonly Rank[]): (card: Card) => boolean {
  return (card) => ranks.every((rank) => Math.abs(card.rank - rank) > 1);
}

function fill(rng: Rng, spot: Spot, boardSize: number, allowed: (card: Card) => boolean): Spot {
  const board = [...spot.board];
  for (const card of shuffle(rng, remainingDeck([...spot.hero, ...spot.board]).filter(allowed))) {
    if (board.length === boardSize) break;
    if (board.some((boardCard) => boardCard.rank === card.rank) || board.filter((boardCard) => boardCard.suit === card.suit).length >= 2) continue;
    board.push(card);
  }
  return { hero: spot.hero, board };
}

function split(cards: Card[]): Spot {
  return { hero: cards.slice(0, 2), board: cards.slice(2) };
}

function buildSpot(rng: Rng, kind: DealtDraw, boardSize: number): Spot {
  const suit = pick(rng, SUITS);
  const offSuit = (card: Card) => card.suit !== suit;
  const suited = shuffle(rng, remainingDeck([]).filter((card) => card.suit === suit));
  if (kind === 'flushDraw') return fill(rng, split(suited.slice(0, 4)), boardSize, offSuit);
  if (kind === 'flushGutshot' || kind === 'flushOesd') {
    const ranks = shuffle(rng, straightRanks(rng, kind === 'flushOesd' ? 'oesd' : 'gutshot'));
    return fill(rng, split(ranks.map((rank) => ({ rank, suit }))), boardSize, (card) => offSuit(card) && apart(ranks)(card));
  }
  if (kind === 'gutshot' || kind === 'oesd' || kind === 'doubleGutshot') {
    const ranks = shuffle(rng, straightRanks(rng, kind));
    return fill(rng, split(withSuits(rng, ranks)), boardSize, apart(ranks));
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
  if (kind === 'overcardGutshot') {
    const [low, middle, upper, top] = straightRanks(rng, 'gutshot');
    const spot = split(withSuits(rng, [low!, top!, middle!, upper!]));
    return fill(rng, spot, boardSize, (card) => card.rank < low! - 1);
  }
  if (kind === 'overcardFlush') {
    const high = int(rng, 11, 14) as Rank;
    const [kicker, ...board] = suited.filter((card) => card.rank < high).slice(0, 3).sort((a, b) => a.rank - b.rank);
    const ranks = [kicker!, ...board].map((card) => card.rank);
    return fill(rng, { hero: [{ rank: high, suit }, kicker!], board }, boardSize, (card) => offSuit(card) && card.rank < high && apart(ranks)(card));
  }
  if (kind === 'pairPlusDraw') {
    const [paired, kicker, c, d] = suited;
    const board = [{ rank: paired!.rank, suit: otherSuit(rng, suit) }, c!, d!];
    return fill(rng, { hero: [paired!, kicker!], board }, boardSize, offSuit);
  }
  if (kind === 'oesdPair') {
    const ranks = shuffle(rng, straightRanks(rng, 'oesd'));
    const [first, second, third, fourth] = ranks;
    return fill(rng, split(withSuits(rng, [first!, second!, first!, third!, fourth!])), boardSize, apart(ranks));
  }
  const [a, b] = shuffle(rng, RANKS);
  if (kind === 'pocketPairToSet') return fill(rng, split(withSuits(rng, [a!, a!])), boardSize, apart([a!]));
  if (kind === 'setToFullHouse') return fill(rng, split(withSuits(rng, [a!, a!, a!])), boardSize, (card) => card.rank !== a);
  if (kind === 'twoPairToFullHouse') return fill(rng, split(withSuits(rng, [a!, b!, a!, b!])), boardSize, apart([a!, b!]));
  return fill(rng, split(withSuits(rng, [a!, b!, a!])), boardSize, apart([a!, b!]));
}

function isValid(spot: Spot, kind: DealtDraw, boardSize: number): boolean {
  if (spot.board.length !== boardSize) return false;
  if (new Set(spot.board.map((card) => card.rank)).size !== boardSize) return false;
  if (SUITS.some((suit) => spot.board.filter((card) => card.suit === suit).length > 2)) return false;
  const made = evaluate([...spot.hero, ...spot.board]).category;
  if (made >= TARGET_CATEGORY[kind] || made >= HandCategory.Straight) return false;
  return findOuts(spot.hero, spot.board, kind).length === expectedOuts(kind, boardSize);
}

function pickKind(rng: Rng, weights: readonly [DealtDraw, number][]): DealtDraw {
  let roll = rng() * weights.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [kind, weight] of weights) {
    roll -= weight;
    if (roll < 0) return kind;
  }
  return weights[weights.length - 1]![0];
}

export function sizeBet(rng: Rng, accept: (pot: number, betToCall: number) => boolean): { pot: number; betToCall: number } | null {
  for (const fraction of shuffle(rng, BET_FRACTIONS)) {
    const potBeforeBet = int(rng, 2, 20) * 10;
    const betToCall = Math.max(5, Math.round((potBeforeBet * fraction) / 5) * 5);
    if (accept(potBeforeBet + betToCall, betToCall)) return { pot: potBeforeBet + betToCall, betToCall };
  }
  return null;
}

export function generateSituation(level: Level, rng: Rng, allow: (kind: DealtDraw, boardSize: number) => boolean = () => true): Situation {
  const config = LEVELS[level];
  const street: Street = config.allowTurn && rng() < 0.5 ? 'turn' : 'flop';
  const boardSize = street === 'flop' ? 3 : 4;
  const weights = (Object.entries(config.drawWeights) as [DealtDraw, number][]).filter(([kind]) => allow(kind, boardSize));
  for (let round = 0; round < 10; round++) {
    const drawKind = pickKind(rng, weights);
    for (let attempt = 0; attempt < 300; attempt++) {
      const spot = buildSpot(rng, drawKind, boardSize);
      if (!isValid(spot, drawKind, boardSize)) continue;
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
