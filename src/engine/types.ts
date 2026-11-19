export type Suit = 's' | 'h' | 'd' | 'c';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export interface Card { rank: Rank; suit: Suit }
export type Street = 'flop' | 'turn';
export type Position = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB';
export type Level = 1 | 2 | 3;
export type DrillType = 'outs' | 'hitChance' | 'potOdds' | 'callFold' | 'alpha' | 'mdf' | 'preflopOpen' | 'scenario';
export type DrawKind = 'flushDraw' | 'oesd' | 'gutshot' | 'comboDraw' | 'overcards' | 'pairPlusDraw';
export type PreflopAction = 'fold' | 'call' | 'raise';
export type PostflopDrillType = 'outs' | 'hitChance' | 'potOdds' | 'callFold';

export const POSTFLOP_TYPES: PostflopDrillType[] = ['outs', 'hitChance', 'potOdds', 'callFold'];
export const DRILL_TYPES: DrillType[] = [...POSTFLOP_TYPES, 'alpha', 'mdf', 'preflopOpen', 'scenario'];
export const MODES: Mode[] = ['single', 'stepChain', 'mixed'];

export interface Situation {
  heroCards: [Card, Card];
  board: Card[];
  street: Street;
  pot: number;
  betToCall: number;
  drawKind: DrawKind;
}

export interface AnswerOption { id: string; label: string; value: number | PreflopAction; isCorrect: boolean }

export type HandKind = 'pair' | 'suited' | 'offsuit';

export interface PromptParams {
  outs: { drawKind: DrawKind };
  hitChance: { counted: number; trueCount: number; street: Street; cardsToCome: number };
  potOdds: { pot: number; bet: number };
  callFold: { pot: number; bet: number };
  alpha: { pot: number; bet: number };
  mdf: { pot: number; bet: number };
  preflopOpen: { position: Position };
  scenario: { position: Position };
}

export interface ExplanationParams {
  outs: { drawKind: DrawKind; outs: number };
  hitChance: { counted: number; trueCount: number; unseen: number; boardSize: number; cardsToCome: number; exact: number; trueExact: number; estimate: number };
  potOdds: { pot: number; bet: number; odds: number };
  callFold: { pot: number; bet: number; outs: number; unseen: number; hit: number; odds: number; call: boolean };
  alpha: { pot: number; bet: number; alpha: number };
  mdf: { pot: number; bet: number; alpha: number };
  preflopOpen: { position: Position; hand: string; kind: HandKind; raise: boolean };
  scenario: { id: string };
}

export type Prompt = { [K in DrillType]: { key: K; params: PromptParams[K] } }[DrillType];

export type Explanation = { [K in DrillType]: { key: K; params: ExplanationParams[K]; highlightedOuts: Card[] } }[DrillType];

export interface Scenario {
  id: string;
  position: Position;
  heroCards: [string, string];
  actionHistory: string[];
  options: PreflopAction[];
  bestAction: PreflopAction;
  explanation: string;
  level: Level;
}

export interface Drill {
  id: string;
  type: DrillType;
  level: Level;
  situation?: Situation;
  preflop?: { position: Position; heroCards: [Card, Card] };
  scenario?: Scenario;
  bet?: { pot: number; bet: number };
  prompt: Prompt;
  options: AnswerOption[];
  explanation: Explanation;
}

export type Mode = 'single' | 'stepChain' | 'mixed';

export interface Answer { drillId: string; chosenOptionId: string; correct: boolean; timeMs: number }

export interface Session {
  mode: Mode;
  drillType?: DrillType;
  drills: Drill[];
  answers: Answer[];
  startedAt: number;
  finishedAt?: number;
}

export interface DrillTypeStats { attempts: number; correct: number; recentResults: boolean[]; level: Level }

export interface Stats { byType: Record<DrillType, DrillTypeStats>; sessionDays: string[] }
