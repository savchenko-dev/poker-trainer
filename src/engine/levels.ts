import type { DealtDraw, Level } from './types';

export interface LevelConfig {
  drawWeights: Partial<Record<DealtDraw, number>>;
  allowTurn: boolean;
  outsSpread: [number, number];
  percentSpread: [number, number];
  callFoldMargin: number;
  timerSeconds: number | null;
}

const LEVEL_1_DRAWS: Partial<Record<DealtDraw, number>> = {
  pocketPairToSet: 2,
  gutshot: 1,
  twoPairToFullHouse: 1,
  pairToTwoPair: 2,
  overcards: 2,
  oesd: 2,
  flushDraw: 2,
};

const LEVEL_2_DRAWS: Partial<Record<DealtDraw, number>> = {
  ...LEVEL_1_DRAWS,
  overcardGutshot: 1,
  setToFullHouse: 1,
  oesd: 1,
  doubleGutshot: 1,
  flushGutshot: 2,
  pairPlusDraw: 2,
};

export const LEVELS: Record<Level, LevelConfig> = {
  1: {
    drawWeights: LEVEL_1_DRAWS,
    allowTurn: false,
    outsSpread: [4, 8],
    percentSpread: [10, 15],
    callFoldMargin: 2,
    timerSeconds: null,
  },
  2: {
    drawWeights: LEVEL_2_DRAWS,
    allowTurn: false,
    outsSpread: [2, 4],
    percentSpread: [5, 8],
    callFoldMargin: 2,
    timerSeconds: null,
  },
  3: {
    drawWeights: { ...LEVEL_2_DRAWS, flushGutshot: 1, overcardFlush: 1, oesdPair: 2, flushOesd: 2 },
    allowTurn: true,
    outsSpread: [1, 2],
    percentSpread: [2, 4],
    callFoldMargin: 0,
    timerSeconds: 15,
  },
};
