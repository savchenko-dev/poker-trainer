import { cellLabel, handKind, isRaise } from './handClass';
import { exactHitChance, potOdds, ruleOf2And4, toPercent } from './odds';
import type { Card, Explanation, Position, Scenario, Situation } from './types';

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

export function explainOuts(situation: Situation, outs: Card[]): Explanation {
  return { key: 'outs', params: { drawKind: situation.drawKind, outs: outs.length }, highlightedOuts: outs };
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
