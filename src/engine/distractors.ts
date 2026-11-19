import { int, shuffle, type Rng } from './rng';

export function numericChoices(
  rng: Rng,
  correct: number,
  [nearest, farthest]: [number, number],
  [low, high]: [number, number],
  exclude: number[] = [],
  include: number[] = [],
): number[] {
  const inRange = (value: number) => value >= low && value <= high && value !== correct && !exclude.includes(value);
  const forced = [...new Set(include)].filter(inRange).slice(0, 3);
  const allowed = (value: number) => inRange(value) && !forced.includes(value);
  const needed = 3 - forced.length;
  const room = (sign: number) => {
    let count = 0;
    for (let value = correct + sign; value >= low && value <= high; value += sign) if (allowed(value)) count++;
    return count;
  };
  const side = (sign: number, count: number) => {
    for (let widen = 0; ; widen++) {
      const values: number[] = [];
      for (let offset = Math.max(1, nearest - widen); offset <= farthest + widen; offset++) {
        if (allowed(correct + sign * offset)) values.push(correct + sign * offset);
      }
      if (values.length >= count) return shuffle(rng, values).slice(0, count);
    }
  };
  if (room(1) + room(-1) < needed) throw new Error(`No room for 3 distractors around ${correct}`);
  const below = int(rng, Math.max(0, needed - room(1)), Math.min(needed, room(-1)));
  return shuffle(rng, [correct, ...forced, ...side(-1, below), ...side(1, needed - below)]);
}
