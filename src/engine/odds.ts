export function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i;
  return result;
}

export function exactHitChance(outs: number, unseen: number, cardsToCome: number): number {
  return 1 - choose(unseen - outs, cardsToCome) / choose(unseen, cardsToCome);
}

export function ruleOf2And4(outs: number, cardsToCome: number): number {
  return outs * (cardsToCome === 2 ? 4 : 2);
}

export function potOdds(betToCall: number, pot: number): number {
  return betToCall / (pot + betToCall);
}

export function toPercent(fraction: number): number {
  return Math.round(fraction * 100);
}
