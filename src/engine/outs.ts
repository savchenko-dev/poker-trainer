import { fullDeck, sameCard } from './cards';
import { evaluate, HandCategory, type HandValue } from './handEval';
import type { Card, DrawKind } from './types';

export const TARGET_CATEGORY: Record<DrawKind, HandCategory> = {
  gutshot: HandCategory.Straight,
  doubleGutshot: HandCategory.Straight,
  oesd: HandCategory.Straight,
  flushDraw: HandCategory.Straight,
  flushGutshot: HandCategory.Straight,
  flushOesd: HandCategory.Straight,
  comboDraw: HandCategory.Straight,
  overcards: HandCategory.OnePair,
  overcardGutshot: HandCategory.OnePair,
  overcardFlush: HandCategory.OnePair,
  pairPlusDraw: HandCategory.TwoPair,
  pairToTwoPair: HandCategory.TwoPair,
  oesdPair: HandCategory.TwoPair,
  pocketPairToSet: HandCategory.ThreeOfAKind,
  twoPairToFullHouse: HandCategory.FullHouse,
  setToFullHouse: HandCategory.FullHouse,
};

export function remainingDeck(used: readonly Card[]): Card[] {
  return fullDeck().filter((card) => !used.some((usedCard) => sameCard(card, usedCard)));
}

function pairsOnlyTheBoard(card: Card, hero: readonly Card[], board: readonly Card[]): boolean {
  return board.some((boardCard) => boardCard.rank === card.rank) && !hero.some((heroCard) => heroCard.rank === card.rank);
}

function reachesTarget(after: HandValue, card: Card, hero: readonly Card[], board: readonly Card[], drawKind: DrawKind): boolean {
  if (after.category < TARGET_CATEGORY[drawKind]) return false;
  if (after.category === HandCategory.TwoPair) return !pairsOnlyTheBoard(card, hero, board);
  if (after.category === HandCategory.OnePair) return (after.tiebreak[0] ?? 0) > Math.max(...board.map((boardCard) => boardCard.rank));
  return true;
}

export function findOuts(hero: readonly Card[], board: readonly Card[], drawKind: DrawKind): Card[] {
  const before = evaluate([...hero, ...board]);
  return remainingDeck([...hero, ...board]).filter((card) => {
    const after = evaluate([...hero, ...board, card]);
    const boardOnly = evaluate([...board, card]);
    return after.category > before.category && after.category > boardOnly.category && reachesTarget(after, card, hero, board, drawKind);
  });
}
