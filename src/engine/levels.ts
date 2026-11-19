import type { DrawKind, Level } from './types';

export interface LevelConfig {
  drawKinds: DrawKind[];
  allowTurn: boolean;
  outsSpread: [number, number];
  percentSpread: [number, number];
  callFoldMargin: number;
  timerSeconds: number | null;
}

export const LEVELS: Record<Level, LevelConfig> = {
  1: {
    drawKinds: ['flushDraw', 'oesd'],
    allowTurn: false,
    outsSpread: [4, 8],
    percentSpread: [10, 15],
    callFoldMargin: 2,
    timerSeconds: null,
  },
  2: {
    drawKinds: ['flushDraw', 'oesd', 'gutshot', 'comboDraw', 'overcards', 'pairPlusDraw'],
    allowTurn: false,
    outsSpread: [2, 4],
    percentSpread: [5, 8],
    callFoldMargin: 2,
    timerSeconds: null,
  },
  3: {
    drawKinds: ['flushDraw', 'oesd', 'gutshot', 'comboDraw', 'overcards', 'pairPlusDraw'],
    allowTurn: true,
    outsSpread: [1, 2],
    percentSpread: [2, 4],
    callFoldMargin: 0,
    timerSeconds: 15,
  },
};
