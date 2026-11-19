import { cellLabel, handKind, isRaise } from './handClass';
import { evaluate, HandCategory } from './handEval';
import { exactHitChance, potOdds, ruleOf2And4, toPercent } from './odds';
import type { Card, Explanation, OutsHand, OutsPart, Position, Scenario, Situation } from './types';

const OUTS_HANDS: OutsHand[] = ['flush', 'straight', 'set', 'trips', 'twoPair', 'pair', 'fullHouse', 'quads'];

export function unseenCards(board: readonly Card[]): number {
  return 52 - 2 - board.length;
}

export function nextCardPercent(situation: Situation, outs: number): number {
  return toPercent(exactHitChance(outs, unseenCards(situation.board), 1));
}

export function shouldCall(situation: Situation, outs: number): boolean {
  return exactHitChance(outs, unseenCards(situation.board), 1) >= potOdds(situation.betToCall, situation.pot);
}

export function potOddsPercent(situation: Situation): number {
  return toPercent(potOdds(situation.betToCall, situation.pot));
}

function outsHand(hero: readonly Card[], board: readonly Card[], card: Card): OutsHand {
  const { category } = evaluate([...hero, ...board, card]);
  if (category === HandCategory.Flush || category === HandCategory.StraightFlush) return 'flush';
  if (category === HandCategory.Straight) return 'straight';
  if (category === HandCategory.FullHouse) return 'fullHouse';
  if (category === HandCategory.FourOfAKind) return 'quads';
  if (category === HandCategory.ThreeOfAKind) return hero[0]?.rank === hero[1]?.rank ? 'set' : 'trips';
  return category === HandCategory.TwoPair ? 'twoPair' : 'pair';
}

function outsParts(hero: readonly Card[], board: readonly Card[], outs: readonly Card[]): OutsPart[] {
  return OUTS_HANDS.flatMap((hand) => {
    const cards = outs.filter((card) => outsHand(hero, board, card) === hand);
    if (cards.length === 0) return [];
    return [{ hand, count: cards.length, ranks: [...new Set(cards.map((card) => card.rank))].sort((a, b) => a - b), suit: cards[0]!.suit }];
  });
}

export function explainOuts(situation: Situation, outs: Card[]): Explanation {
  return {
    key: 'outs',
    params: { drawKind: situation.drawKind, outs: outs.length, parts: outsParts(situation.heroCards, situation.board, outs) },
    highlightedOuts: outs,
  };
}

export function explainHitChance(situation: Situation, counted: number, outs: Card[], cardsToCome: number): Explanation {
  const unseen = unseenCards(situation.board);
  return {
    key: 'hitChance',
    params: {
      counted,
      trueCount: outs.length,
      unseen,
      boardSize: situation.board.length,
      cardsToCome,
      exact: toPercent(exactHitChance(counted, unseen, cardsToCome)),
      trueExact: toPercent(exactHitChance(outs.length, unseen, cardsToCome)),
      estimate: ruleOf2And4(counted, cardsToCome),
    },
    highlightedOuts: outs,
  };
}

export function oddsRatio(reward: number, risk: number): string {
  return `${+(reward / risk).toFixed(1)}:1`;
}

export function explainPotOdds(situation: Situation): Explanation {
  return { key: 'potOdds', params: { pot: situation.pot, bet: situation.betToCall, odds: potOddsPercent(situation) }, highlightedOuts: [] };
}

export function explainCallFold(situation: Situation, outs: Card[]): Explanation {
  return {
    key: 'callFold',
    params: {
      pot: situation.pot,
      bet: situation.betToCall,
      outs: outs.length,
      unseen: unseenCards(situation.board),
      hit: nextCardPercent(situation, outs.length),
      odds: potOddsPercent(situation),
      call: shouldCall(situation, outs.length),
    },
    highlightedOuts: outs,
  };
}

export function alphaPercent(pot: number, bet: number): number {
  return toPercent(bet / (pot + bet));
}

export function explainAlpha(pot: number, bet: number): Explanation {
  return { key: 'alpha', params: { pot, bet, alpha: alphaPercent(pot, bet) }, highlightedOuts: [] };
}

export function explainMdf(pot: number, bet: number): Explanation {
  return { key: 'mdf', params: { pot, bet, alpha: alphaPercent(pot, bet) }, highlightedOuts: [] };
}

export function explainPreflop(position: Position, row: number, col: number): Explanation {
  return {
    key: 'preflopOpen',
    params: { position, hand: cellLabel(row, col), kind: handKind(row, col), raise: isRaise(position, row, col) },
    highlightedOuts: [],
  };
}

export function explainScenario(scenario: Scenario): Explanation {
  return { key: 'scenario', params: { id: scenario.id }, highlightedOuts: [] };
}
