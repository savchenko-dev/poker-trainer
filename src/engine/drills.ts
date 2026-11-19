import { scenarios } from '../content/scenarios';
import { parseCard, SUITS } from './cards';
import { numericChoices } from './distractors';
import {
  alphaPercent,
  explainAlpha,
  explainCallFold,
  explainHitChance,
  explainMdf,
  explainOuts,
  explainPotOdds,
  explainPreflop,
  explainScenario,
  nextCardPercent,
  potOddsPercent,
  shouldCall,
  unseenCards,
} from './explain';
import { isRaise, POSITIONS, rankAt } from './handClass';
import { LEVELS } from './levels';
import { exactHitChance, potOdds, ruleOf2And4, toPercent } from './odds';
import { findOuts } from './outs';
import { int, pick, shuffle, type Rng } from './rng';
import { expectedOuts, generateSituation, sizeBet } from './situations';
import { DRILL_TYPES, POSTFLOP_TYPES, type AnswerOption, type Card, type DealtDraw, type Drill, type DrillType, type Level, type Position, type PostflopDrillType, type PreflopAction, type Scenario, type Situation } from './types';

export const BLUFF_TYPES = ['alpha', 'mdf'] as const;

export const OPEN_POSITIONS: Position[] = POSITIONS.filter((position) => position !== 'BB');

const CLASSIC_OUTS = [2, 4, 5, 6, 8, 9, 12, 15];

const CHEAPEST_ODDS = toPercent(potOdds(1, 6));

const BLUFF_SIZES: Record<Level, number[]> = {
  1: [1 / 3, 1 / 2, 1],
  2: [1 / 3, 1 / 2, 2 / 3, 3 / 4, 1],
  3: [1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1, 3 / 2, 2],
};

function drillId(type: DrillType, rng: Rng): string {
  return `${type}-${int(rng, 0, 2 ** 31).toString(36)}`;
}

function actionOptions(actions: readonly PreflopAction[], best: PreflopAction): AnswerOption[] {
  return actions.map((action) => ({ id: action, label: action, value: action, isCorrect: action === best }));
}

function numberOptions(values: number[], correct: number, suffix: string): AnswerOption[] {
  return values.map((value) => ({ id: String(value), label: `${value}${suffix}`, value, isCorrect: value === correct }));
}

function outsOf(situation: Situation) {
  return findOuts(situation.heroCards, situation.board, situation.drawKind);
}

function classicNeighbours(outs: number): number[] {
  return [CLASSIC_OUTS.filter((value) => value < outs).pop(), CLASSIC_OUTS.find((value) => value > outs)].filter((value) => value !== undefined);
}

function callFoldSituation(level: Level, rng: Rng): Situation {
  const margin = LEVELS[level].callFoldMargin;
  const wantCall = rng() < 0.5;
  const canCall = (kind: DealtDraw, boardSize: number) =>
    toPercent(exactHitChance(expectedOuts(kind, boardSize), 50 - boardSize, 1)) - CHEAPEST_ODDS > margin;
  for (let attempt = 0; attempt < 200; attempt++) {
    const situation = generateSituation(level, rng, wantCall ? canCall : undefined);
    const outs = outsOf(situation).length;
    const sized = sizeBet(rng, (pot, betToCall) => {
      const spot = { ...situation, pot, betToCall };
      return shouldCall(spot, outs) === wantCall && Math.abs(nextCardPercent(spot, outs) - toPercent(potOdds(betToCall, pot))) > margin;
    });
    if (sized) return { ...situation, ...sized };
  }
  throw new Error('No call/fold spot found');
}

function hitChanceDrill(drill: Omit<Drill, 'prompt' | 'options' | 'explanation'>, situation: Situation, counted: number, cardsToCome: number, rng: Rng): Drill {
  const correct = toPercent(exactHitChance(counted, unseenCards(situation.board), cardsToCome));
  return {
    ...drill,
    prompt: { key: 'hitChance', params: { counted, trueCount: outsOf(situation).length, street: situation.street, cardsToCome } },
    options: numberOptions(
      numericChoices(rng, correct, LEVELS[drill.level].percentSpread, [1, 99], [ruleOf2And4(counted, cardsToCome)]),
      correct,
      '%',
    ),
    explanation: explainHitChance(situation, counted, outsOf(situation), cardsToCome),
  };
}

function drillFor(type: PostflopDrillType, level: Level, rng: Rng, situation: Situation, cardsToCome: number): Drill {
  const config = LEVELS[level];
  const base = { id: drillId(type, rng), type, level, situation };
  const outs = outsOf(situation);

  if (type === 'outs') {
    return {
      ...base,
      prompt: { key: 'outs', params: { drawKind: situation.drawKind } },
      options: numberOptions(numericChoices(rng, outs.length, config.outsSpread, [1, 20], [], classicNeighbours(outs.length)), outs.length, ''),
      explanation: explainOuts(situation, outs),
    };
  }

  if (type === 'hitChance') return hitChanceDrill(base, situation, outs.length, cardsToCome, rng);

  if (type === 'potOdds') {
    const odds = potOddsPercent(situation);
    return {
      ...base,
      prompt: { key: 'potOdds', params: { pot: situation.pot, bet: situation.betToCall } },
      options: numberOptions(numericChoices(rng, odds, config.percentSpread, [1, 99]), odds, '%'),
      explanation: explainPotOdds(situation),
    };
  }

  return {
    ...base,
    prompt: { key: 'callFold', params: { pot: situation.pot, bet: situation.betToCall } },
    options: actionOptions(['call', 'fold'], shouldCall(situation, outs.length) ? 'call' : 'fold'),
    explanation: explainCallFold(situation, outs),
  };
}

function edgeCell(position: Position, row: number, col: number): boolean {
  const raise = isRaise(position, row, col);
  return [[-1, 0], [1, 0], [0, -1], [0, 1]].some(
    ([dr, dc]) => row + dr! >= 0 && row + dr! < 13 && col + dc! >= 0 && col + dc! < 13 && isRaise(position, row + dr!, col + dc!) !== raise,
  );
}

function clearCell(position: Position, row: number, col: number): boolean {
  const raise = isRaise(position, row, col);
  for (let r = Math.max(0, row - 1); r <= Math.min(12, row + 1); r++) {
    for (let c = Math.max(0, col - 1); c <= Math.min(12, col + 1); c++) if (isRaise(position, r, c) !== raise) return false;
  }
  return true;
}

function dealCell(row: number, col: number, rng: Rng): [Card, Card] {
  const [first, second] = shuffle(rng, SUITS);
  const high = rankAt(Math.min(row, col));
  const low = rankAt(Math.max(row, col));
  return [
    { rank: high, suit: first! },
    { rank: low, suit: row < col ? first! : second! },
  ];
}

function buildPreflopDrill(level: Level, rng: Rng): Drill {
  const position = pick(rng, OPEN_POSITIONS);
  const raise = rng() < 0.5;
  const fits = level === 1 ? clearCell : level === 3 ? edgeCell : () => true;
  const cells = Array.from({ length: 169 }, (_, index) => [Math.floor(index / 13), index % 13] as const).filter(
    ([row, col]) => isRaise(position, row, col) === raise && fits(position, row, col),
  );
  const [row, col] = pick(rng, cells);
  const heroCards = dealCell(row, col, rng);
  return {
    id: drillId('preflopOpen', rng),
    type: 'preflopOpen',
    level,
    preflop: { position, heroCards },
    prompt: { key: 'preflopOpen', params: { position } },
    options: actionOptions(['raise', 'fold'], raise ? 'raise' : 'fold'),
    explanation: explainPreflop(position, row, col),
  };
}

function scenarioDrill(scenario: Scenario, level: Level, rng: Rng): Drill {
  const heroCards = scenario.heroCards.map((text) => parseCard(text)!) as [Card, Card];
  return {
    id: drillId('scenario', rng),
    type: 'scenario',
    level,
    preflop: { position: scenario.position, heroCards },
    scenario,
    prompt: { key: 'scenario', params: { position: scenario.position } },
    options: actionOptions(shuffle(rng, scenario.options), scenario.bestAction),
    explanation: explainScenario(scenario),
  };
}

function scenarioPool(level: Level): Scenario[] {
  const pool = scenarios.filter((scenario) => scenario.level <= level);
  if (pool.length === 0) throw new Error(`No scenarios up to level ${level}`);
  return pool;
}

export function buildScenarioDrills(level: Level, count: number, rng: Rng): Drill[] {
  const pool = shuffle(rng, scenarioPool(level));
  return Array.from({ length: count }, (_, index) => scenarioDrill(pool[index % pool.length]!, level, rng));
}

function bluffDrill(type: (typeof BLUFF_TYPES)[number], level: Level, rng: Rng): Drill {
  let pot = 0;
  let bet = 0;
  do {
    pot = int(rng, 2, 20) * 10;
    bet = Math.max(5, Math.round((pot * pick(rng, BLUFF_SIZES[level])) / 5) * 5);
  } while (((100 * bet) / (pot + bet)) % 1 === 0.5);
  const alpha = alphaPercent(pot, bet);
  const correct = type === 'alpha' ? alpha : 100 - alpha;
  return {
    id: drillId(type, rng),
    type,
    level,
    bet: { pot, bet },
    prompt: { key: type, params: { pot, bet } },
    options: numberOptions(numericChoices(rng, correct, LEVELS[level].percentSpread, [1, 99]), correct, '%'),
    explanation: type === 'alpha' ? explainAlpha(pot, bet) : explainMdf(pot, bet),
  };
}

export function buildDrill(type: DrillType, level: Level, rng: Rng): Drill {
  if (type === 'alpha' || type === 'mdf') return bluffDrill(type, level, rng);
  if (type === 'preflopOpen') return buildPreflopDrill(level, rng);
  if (type === 'scenario') return scenarioDrill(pick(rng, scenarioPool(level)), level, rng);
  const situation = type === 'callFold' ? callFoldSituation(level, rng) : generateSituation(level, rng);
  return drillFor(type, level, rng, situation, situation.street === 'flop' && rng() < 0.5 ? 2 : 1);
}

function repeats(drills: readonly Drill[], drill: Drill): boolean {
  const last = drills.at(-1);
  if (last?.situation && last.situation.drawKind === drill.situation?.drawKind) return true;
  const correct = (item: Drill) => item.options.find((option) => option.isCorrect)?.value;
  return drill.type === 'outs' && drills.length >= 2 && drills.slice(-2).every((item) => correct(item) === correct(drill));
}

export function buildDrills(type: DrillType, level: Level, count: number, rng: Rng): Drill[] {
  const drills: Drill[] = [];
  while (drills.length < count) {
    const drill = buildDrill(type, level, rng);
    if (!repeats(drills, drill)) drills.push(drill);
  }
  return drills;
}

export function buildStepChain(level: Level, rng: Rng): Drill[] {
  const situation = callFoldSituation(level, rng);
  return POSTFLOP_TYPES.map((type) => drillFor(type, level, rng, situation, 1));
}

export function hitChanceStep(drill: Drill, counted: number, rng: Rng): Drill {
  if (!drill.situation) return drill;
  return hitChanceDrill(drill, drill.situation, counted, 1, rng);
}

export function buildMixedSession(levels: Record<DrillType, Level>, rng: Rng, length = 10): Drill[] {
  const types = shuffle(rng, [...DRILL_TYPES, ...Array.from({ length: Math.max(0, length - DRILL_TYPES.length) }, () => pick(rng, DRILL_TYPES))]).slice(0, length);
  const picked = buildScenarioDrills(levels.scenario, types.filter((type) => type === 'scenario').length, rng);
  return types.map((type) => (type === 'scenario' ? picked.pop()! : buildDrill(type, levels[type], rng)));
}
