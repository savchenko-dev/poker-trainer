export type CommonDraw =
  | 'set'
  | 'gutshot'
  | 'fullHouse'
  | 'pairToTwoPair'
  | 'overcards'
  | 'setToBoat'
  | 'overcardGutshot'
  | 'oesd'
  | 'doubleGutshot'
  | 'flushDraw'
  | 'flushGutshot'
  | 'overcardFlush'
  | 'oesdPair'
  | 'pairFlush'
  | 'flushOesd';

export const commonDraws: { id: CommonDraw; outs: number; hand: string; board: string }[] = [
  { id: 'set', outs: 2, hand: '7♠7♥', board: 'K♦9♣2♠' },
  { id: 'gutshot', outs: 4, hand: 'J♠9♥', board: 'Q♦8♣2♠' },
  { id: 'fullHouse', outs: 4, hand: 'K♠9♥', board: 'K♦9♣4♠' },
  { id: 'pairToTwoPair', outs: 5, hand: 'A♠J♥', board: 'J♦7♣3♠' },
  { id: 'overcards', outs: 6, hand: 'A♠K♥', board: '9♦6♣2♠' },
  { id: 'setToBoat', outs: 7, hand: '8♠8♥', board: '8♦K♣4♠' },
  { id: 'overcardGutshot', outs: 7, hand: 'A♠J♥', board: 'K♦T♣4♠' },
  { id: 'oesd', outs: 8, hand: '9♠8♥', board: '7♦6♣2♠' },
  { id: 'doubleGutshot', outs: 8, hand: 'J♠7♥', board: '9♦8♣5♠' },
  { id: 'flushDraw', outs: 9, hand: 'A♥5♥', board: 'K♥9♥2♠' },
  { id: 'flushGutshot', outs: 12, hand: 'J♥9♥', board: 'Q♥8♥2♠' },
  { id: 'overcardFlush', outs: 12, hand: 'A♥6♥', board: 'Q♥8♥3♠' },
  { id: 'oesdPair', outs: 13, hand: '9♠8♥', board: '9♦7♣6♠' },
  { id: 'pairFlush', outs: 14, hand: 'A♥9♥', board: 'A♠7♥2♥' },
  { id: 'flushOesd', outs: 15, hand: '9♥8♥', board: '7♥6♥2♠' },
];
