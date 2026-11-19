import { fullDeck, sameCard } from './cards';
import { evaluate, HandCategory, type HandValue } from './handEval';
import type { Card, DrawKind } from './types';

export function remainingDeck(used: readonly Card[]): Card[] {
  return fullDeck().filter((card) => !used.some((usedCard) => sameCard(card, usedCard)));
}

function pairsOnlyTheBoard(card: Card, hero: readonly Card[], board: readonly Card[]): boolean {
  return board.some((boardCard) => boardCard.rank === card.rank) && !hero.some((heroCard) => heroCard.rank === card.rank);
}

function reachesTarget(after: HandValue, card: Card, hero: readonly Card[], board: readonly Card[], drawKind: DrawKind): boolean {
  if (drawKind === 'pairPlusDraw') {
    if (after.category === HandCategory.TwoPair) return !pairsOnlyTheBoard(card, hero, board);
    return after.category > HandCategory.TwoPair;
  }
  if (drawKind !== 'overcards') return after.category >= HandCategory.Straight;
  if (after.category > HandCategory.OnePair) return true;
  const boardHigh = Math.max(...board.map((card) => card.rank));
  return after.category === HandCategory.OnePair && (after.tiebreak[0] ?? 0) > boardHigh;
}

export function findOuts(hero: readonly Card[], board: readonly Card[], drawKind: DrawKind): Card[] {
  const before = evaluate([...hero, ...board]);
  return remainingDeck([...hero, ...board]).filter((card) => {
    const after = evaluate([...hero, ...board, card]);
    const boardOnly = evaluate([...board, card]);
    return after.category > before.category && after.category > boardOnly.category && reachesTarget(after, card, hero, board, drawKind);
  });
}
