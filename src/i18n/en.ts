import type { CommonDraw } from '../content/cheatSheet';
import { openingRanges } from '../content/openingRanges';
import { scenarios } from '../content/scenarios';
import { oddsRatio } from '../engine/explain';
import type { HandAction, HandStreet, HandTag, Tip } from '../engine/handRecord';
import type { Card, DrawKind, DrillType, ExplanationParams, OutsHand, OutsPart, Position, PreflopAction, PromptParams, Rank, Suit } from '../engine/types';

export interface ExplanationText { formula: string; numbers: string; result: string; text: string; rule?: string }

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const RANK_NAMES = ['Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King', 'Ace'];
const SUIT_NAMES: Record<Suit, string> = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };

const RANK_PLURALS = ['twos', 'threes', 'fours', 'fives', 'sixes', 'sevens', 'eights', 'nines', 'tens', 'jacks', 'queens', 'kings', 'aces'];

const GOALS: Record<DrawKind, string> = {
  flushDraw: 'a flush',
  oesd: 'a straight',
  gutshot: 'a straight',
  doubleGutshot: 'a straight',
  flushGutshot: 'a straight or a flush',
  flushOesd: 'a straight or a flush',
  comboDraw: 'a straight or a flush',
  overcards: 'a pair higher than every board card',
  overcardGutshot: 'a straight or a pair higher than every board card',
  overcardFlush: 'a flush or a pair higher than every board card',
  pairPlusDraw: 'a flush, two pair or trips',
  pocketPairToSet: 'a set',
  twoPairToFullHouse: 'a full house',
  setToFullHouse: 'a full house or quads',
  pairToTwoPair: 'two pair or trips',
  oesdPair: 'a straight, two pair or trips',
};

const OUTS_HINTS: Record<DrawKind, string> = {
  flushDraw: 'A suit has 13 cards. You see 4 of yours, so 13 − 4 = 9 are left.',
  oesd: '4 ranks in a row, open at both ends: 4 cards of the rank below + 4 of the rank above = 8.',
  gutshot: 'One rank fills the gap inside your straight, and that rank has 4 cards.',
  doubleGutshot: 'Two different ranks each fill an inside straight: 4 + 4 = 8.',
  flushGutshot: '9 cards of your suit, plus the gutshot cards of the other 3 suits: 9 + 3 = 12.',
  flushOesd: '9 cards of your suit, plus the straight cards of the other 3 suits: 9 + 6 = 15.',
  comboDraw: 'Add the cards that make your flush to the cards that make your straight. A card that does both counts once.',
  overcards: 'Each of your 2 high cards has 3 more cards of the same rank left: 2 × 3 = 6.',
  overcardGutshot: '4 cards fill your straight, and 3 more pair your overcard: 4 + 3 = 7.',
  overcardFlush: '9 cards of your suit, and 3 more pair your overcard: 9 + 3 = 12.',
  pairPlusDraw: '9 cards make your flush, 2 make trips and 3 pair your other card: 9 + 2 + 3 = 14.',
  pocketPairToSet: 'Only 2 cards of your pocket pair rank are left, and either one makes a set.',
  twoPairToFullHouse: 'Each of your 2 paired ranks has 2 cards left: 2 + 2 = 4.',
  setToFullHouse: 'Each other board rank has 3 cards left to fill up, plus the last card of your rank for quads.',
  pairToTwoPair: '2 cards give you trips, and 3 pair your other hole card: 2 + 3 = 5.',
  oesdPair: '8 cards make your straight, 2 give trips and 3 pair your other card: 8 + 2 + 3 = 13.',
};

const DRAW_NAMES: Record<DrawKind, string> = {
  flushDraw: 'Flush draw',
  oesd: 'Open-ended straight draw',
  gutshot: 'Gutshot',
  doubleGutshot: 'Double gutshot',
  flushGutshot: 'Flush draw + gutshot',
  flushOesd: 'Flush draw + open-ended straight draw',
  comboDraw: 'Combo draw',
  overcards: 'Overcards',
  overcardGutshot: 'Overcard + gutshot',
  overcardFlush: 'Overcard + flush draw',
  pairPlusDraw: 'Pair + flush draw',
  pocketPairToSet: 'Pocket pair',
  twoPairToFullHouse: 'Two pair',
  setToFullHouse: 'Set',
  pairToTwoPair: 'One pair',
  oesdPair: 'Pair + open-ended straight draw',
};

const TIP_DRAWS: Record<DrawKind, string> = {
  flushDraw: 'flush draws',
  oesd: 'open-ended straight draws',
  gutshot: 'gutshots',
  doubleGutshot: 'double gutshots',
  flushGutshot: 'flush draws with a gutshot',
  flushOesd: 'flush draws with an open-ended straight draw',
  comboDraw: 'combo draws',
  overcards: 'overcards',
  overcardGutshot: 'an overcard and a gutshot',
  overcardFlush: 'an overcard and a flush draw',
  pairPlusDraw: 'pair plus flush draws',
  pocketPairToSet: 'pocket pairs',
  twoPairToFullHouse: 'two pair',
  setToFullHouse: 'sets',
  pairToTwoPair: 'one pair',
  oesdPair: 'a pair and an open-ended straight draw',
};

const OUTS_HANDS: Record<Exclude<OutsHand, 'flush'>, string> = {
  straight: 'your straight',
  set: 'your set',
  trips: 'trips',
  twoPair: 'two pair',
  pair: 'a pair above the board',
  fullHouse: 'a full house',
  quads: 'quads',
};

const rankCards = (count: number, ranks: Rank[], prefix: string) =>
  ranks.length === 1
    ? `${count} ${prefix}${count === 1 ? RANK_NAMES[ranks[0]! - 2]!.toLowerCase() : RANK_PLURALS[ranks[0]! - 2]}`
    : `${count} ${prefix}cards (${ranks.map((rank) => RANK_PLURALS[rank - 2]).join(' or ')})`;

const outsPart = ({ hand, count, ranks, suit }: OutsPart, flushSuit: Suit | undefined) => {
  if (hand === 'flush') return `${count} ${SUIT_NAMES[suit]} make your flush`;
  const prefix = hand === 'straight' && flushSuit ? `non-${SUIT_NAMES[flushSuit].slice(0, -1)} ` : '';
  return `${rankCards(count, ranks, prefix)} ${count === 1 ? 'makes' : 'make'} ${OUTS_HANDS[hand]}`;
};

const outsCount = (parts: OutsPart[], outs: number) => {
  const flushSuit = parts.find((part) => part.hand === 'flush')?.suit;
  const text = parts.map((part) => outsPart(part, flushSuit)).join(', ');
  return parts.length > 1 ? `${text}: ${parts.map((part) => part.count).join(' + ')} = ${outs}.` : `${text}.`;
};

const potLine = ({ pot, bet }: { pot: number; bet: number }) => `The pot is ${pot}, including your opponent's bet of ${bet}. You must call ${bet}.`;

const prompts: { [K in DrillType]: (p: PromptParams[K]) => string } = {
  outs: (p) => `How many outs do you have to make ${GOALS[p.drawKind]}?`,
  hitChance: (p) =>
    `${p.counted === p.trueCount ? '' : `You counted ${plural(p.counted, 'out')} (the true count is ${p.trueCount}). `}With ${plural(p.counted, 'out')} on the ${p.street}, what is your chance to hit ${p.cardsToCome === 2 ? 'by the river' : 'on the next card'}?`,
  potOdds: (p) => `${potLine(p)} What are your pot odds?`,
  callFold: (p) => `${potLine(p)} Count only the next card. Call or fold?`,
  alpha: (p) => `The pot is ${p.pot}. You bluff ${p.bet}. How often must your opponent fold for the bluff to break even?`,
  mdf: (p) => `The pot is ${p.pot}. Your opponent bets ${p.bet}. How often must you call or raise so a bluff can't profit?`,
  preflopOpen: (p) => `Everyone folds to you in ${p.position}. Raise or fold?`,
  scenario: (p) => `You are in ${p.position}. What is your best action?`,
};

const explanations: { [K in DrillType]: (p: ExplanationParams[K]) => ExplanationText } = {
  outs: (p) => ({
    formula: OUTS_HINTS[p.drawKind],
    numbers: outsCount(p.parts, p.outs),
    result: `${p.outs} outs`,
    text: `Any one of the cards above gives you ${GOALS[p.drawKind]}.`,
  }),
  hitChance: (p) => {
    const misses = p.unseen - p.counted;
    const two = p.cardsToCome === 2;
    const rule = p.cardsToCome * 2;
    const trueCount =
      p.counted === p.trueCount
        ? ''
        : ` You counted ${plural(p.counted, 'out')}, but the true count is ${p.trueCount}, which gives ${p.trueExact}%. This step uses your count so you can still practice the math.`;
    return {
      formula: two ? 'Chance = 1 − chance to miss twice' : 'Chance = outs ÷ unseen cards',
      numbers: two ? `1 − (${misses}/${p.unseen} × ${misses - 1}/${p.unseen - 1})` : `${p.counted} ÷ ${p.unseen}`,
      result: `${p.exact}%`,
      text: `${p.unseen} cards are still unseen: 52 minus your 2 and the ${p.boardSize} on the board. ${p.counted} of them help you, so you hit ${two ? 'by the river' : 'on the next card'} about ${p.exact}% of the time. Quick rule: outs × ${rule}.${trueCount}`,
      rule: `Rule of ${rule}: ${p.counted} × ${rule}`,
    };
  },
  potOdds: ({ pot, bet, odds }) => ({
    formula: 'Break-even = risk ÷ (risk + reward)',
    numbers: `Risk: your call ${bet}. Reward: the pot ${pot}. ${bet} ÷ (${bet} + ${pot}) = ${bet} ÷ ${pot + bet}`,
    result: `${odds}% · pot odds ${oddsRatio(pot, bet)}`,
    text: `You risk ${bet} to win ${pot}, so the pot gives you ${oddsRatio(pot, bet)}. Win at least ${odds}% of the time and the call breaks even.`,
  }),
  callFold: ({ pot, bet, outs, unseen, hit, odds, call }) => ({
    formula: 'Call when chance to hit ≥ risk ÷ (risk + reward)',
    numbers: `Next card: ${outs} ÷ ${unseen} = ${hit}%. Break-even: ${bet} ÷ (${bet} + ${pot}) = ${odds}% (${oddsRatio(pot, bet)}).`,
    result: `${hit}% ${call ? '≥' : '<'} ${odds}% → ${call ? 'Call' : 'Fold'}`,
    text:
      call
        ? `You risk ${bet} to win ${pot}. You hit ${hit}% of the time, at least the ${odds}% you need, so calling makes money over time.`
        : `You risk ${bet} to win ${pot}. You hit only ${hit}% of the time, below the ${odds}% you need, so folding saves chips.`,
  }),
  alpha: ({ pot, bet, alpha }) => ({
    formula: 'Alpha = risk ÷ (risk + reward)',
    numbers: `Risk: your bet ${bet}. Reward: the pot ${pot}. ${bet} ÷ (${bet} + ${pot}) = ${bet} ÷ ${pot + bet}`,
    result: `${alpha}% · reward to risk ${oddsRatio(pot, bet)}`,
    text: `Your bluff risks ${bet} to win ${pot}. If they fold more than ${alpha}% of the time, the bluff makes money. The other side is MDF: they must continue ${100 - alpha}%. Alpha ${alpha}% + MDF ${100 - alpha}% = 100%.`,
  }),
  mdf: ({ pot, bet, alpha }) => ({
    formula: 'MDF = 1 − alpha = pot ÷ (pot + bet)',
    numbers: `Their risk: the bet ${bet}. Their reward: the pot ${pot}. Alpha = ${bet} ÷ ${pot + bet} = ${alpha}%, so MDF = ${pot} ÷ ${pot + bet}`,
    result: `${100 - alpha}% · pot to bet ${oddsRatio(pot, bet)}`,
    text: `A pure bluff of ${bet} into ${pot} needs you to fold ${alpha}% of the time. Call or raise with at least ${100 - alpha}% of your hands and that bluff can't make money. Alpha ${alpha}% + MDF ${100 - alpha}% = 100%.`,
  }),
  preflopOpen: ({ position, hand, kind, raise }) => ({
    formula: 'Raise when your hand is in the opening chart for your seat, fold otherwise',
    numbers: `${hand} (${kind}) from ${position}`,
    result: `${hand} is ${raise ? 'in' : 'outside'} the ${position} range → ${raise ? 'Raise' : 'Fold'}`,
    text: openingRanges[position].note,
  }),
  scenario: ({ id }) => ({ formula: '', numbers: '', result: '', text: scenarios.find((scenario) => scenario.id === id)?.explanation ?? '' }),
};

const tip = (t: Tip): string => {
  if (t.key === 'bigBetCalls')
    return `You called ${t.count} draws against bets of half pot or more, most often ${TIP_DRAWS[t.drawKind]}. With ${t.outs} outs you hit ${t.hit}% on the next card, so call only bets up to about ${t.maxShare}% of the pot.`;
  if (t.key === 'earlyOpens')
    return `You played ${t.count} hands from UTG or MP that the chart folds (${t.hands.join(', ')}). Most players still act after you there, so fold these and open only chart hands.`;
  if (t.key === 'chartFolds') return `You folded ${t.count} hands the chart opens (${t.hands.join(', ')}). When it folds to you, raise them.`;
  return `From ${t.position} you lost ${t.lost} bb over ${t.hands} hands. Play fewer hands there and check them against the chart.`;
};

export const en = {
  skipLink: 'Skip to content',
  backHome: 'Back to home',
  bb: 'bb',
  drillTitles: {
    outs: 'Outs',
    hitChance: 'Hit chance',
    potOdds: 'Pot odds',
    callFold: 'Call or fold',
    alpha: 'Bluff math: Alpha',
    mdf: 'Defense: MDF',
    preflopOpen: 'Preflop open',
    scenario: 'Scenario',
  } as Record<DrillType, string>,
  actions: { fold: 'Fold', call: 'Call', raise: 'Raise' } as Record<PreflopAction, string>,
  handActions: { fold: 'fold', check: 'check', call: 'call', bet: 'bet', raise: 'raise' } as Record<HandAction, string>,
  streets: { preflop: 'preflop', flop: 'flop', turn: 'turn', river: 'river' } as Record<HandStreet, string>,
  drawNames: DRAW_NAMES,
  cardName: (card: Card) => `${RANK_NAMES[card.rank - 2]} of ${SUIT_NAMES[card.suit]}`,
  suitNames: { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' } as Record<Suit, string>,
  removeCard: (name: string) => `Remove ${name}`,
  positionNote: (position: Position) => openingRanges[position].note,
  prompts,
  explanations,
  tip,
  home: {
    title: 'Poker Math Trainer',
    lead: 'Short drills that teach the math behind every call.',
    streakAria: (n: number) => `${n}-day streak. Open stats`,
    streakUnit: (() => 'day streak') as (n: number) => string,
    badge: 'Start here',
    heroTitle: 'Full hand: outs → odds → decision',
    heroText: (hands: number) => `One hand, four small steps. ${hands} hands per session.`,
    play: 'Play',
    math: 'Math drills',
    preflop: 'Preflop',
    more: 'More',
    blurbs: {
      outs: 'Count the cards that complete your draw.',
      hitChance: 'Turn outs into a percent with the rule of 2 and 4.',
      potOdds: 'How big your call is compared to the pot.',
      callFold: 'Is your chance to hit worth the price?',
      alpha: 'How often must they fold to your bluff?',
      mdf: 'How often must you defend against a bet?',
      preflopOpen: 'Folded to you: raise or fold?',
      scenario: 'Real spots with action before you.',
    } as Record<DrillType, string>,
    scenariosTitle: 'Scenarios',
    mixedTitle: 'Mixed set',
    mixedBlurb: 'Ten drills from every type.',
    positionsTitle: 'Positions',
    positionsBlurb: 'Opening range for every seat.',
    handsTitle: 'My hands',
    handsBlurb: 'Record hands you played and get tips.',
    statsTitle: 'Stats',
    statsBlurb: 'Accuracy and level for every drill.',
    cheatTitle: 'Cheat sheet',
    cheatBlurb: 'Outs, hit chances and bet-size odds.',
    settingsTitle: 'Settings',
    settingsBlurb: 'Language, four-color deck, intro, reset.',
  },
  trainer: {
    quit: 'Quit to home',
    chainProgress: (hand: number, hands: number, step: number, steps: number) => `Hand ${hand}/${hands} · Step ${step}/${steps}`,
    positions: 'Positions',
    steps: 'Steps',
    seeResults: 'See results',
    nextHand: 'Next hand',
    next: 'Next',
    rule: 'Rule',
  },
  explanation: {
    aria: 'Explanation',
    correct: (answer: string) => `Correct! The answer is ${answer}.`,
    wrong: (chosen: string, answer: string) => `Not quite. You picked ${chosen}, the answer is ${answer}.`,
    timeout: (answer: string) => `Time's up. The answer is ${answer}.`,
    quickEstimate: 'Quick estimate',
    exact: 'Exact',
    formula: 'Formula',
    numbers: 'Your numbers',
    result: 'Result',
    outsAria: (n: number) => plural(n, 'out card'),
  },
  potBar: {
    aria: (pot: number, bet: number, need: number) => `Final pot ${pot + bet}: pot ${pot}, your call ${bet}. You need ${need}% to call.`,
    reward: (pot: number) => `Reward: pot ${pot}`,
    risk: (bet: number) => `Risk: your call ${bet}`,
    meterAria: (hit: number, need: number) => `You hit ${hit}%, you need ${need}%.`,
    youHit: 'You hit',
    need: (need: number) => `need ${need}%`,
  },
  situation: {
    aria: 'Situation',
    flop: 'Flop',
    turn: 'Turn',
    pot: 'Pot',
    toCall: 'To call',
    yourBluff: 'Your bluff',
    theyBet: 'They bet',
    yourHand: 'Your hand',
    board: 'Board',
  },
  history: {
    aria: 'Action before you',
    fold: 'folds',
    raise: (amount: string, gloss: boolean) => (gloss ? `raises to ${amount} big blinds` : `raises ${amount}bb`),
    call: (amount: string, gloss: boolean) => (gloss ? `calls ${amount} big blinds` : `calls ${amount}bb`),
    you: 'You · to act',
  },
  timer: {
    aria: (left: number) => `${left} seconds left`,
    short: (left: number) => `${left} s`,
  },
  grid: {
    caption: (position: Position) =>
      `${position === 'BB' ? 'BB defending range vs one raise' : `${position} opening range`}. Suited hands above the diagonal, offsuit below.`,
    continue: 'Continue',
    raise: 'Raise',
    fold: 'Fold',
    yourHand: 'your hand',
    tap: 'Tap a hand to check it.',
  },
  sessionEnd: {
    title: 'Session complete',
    leave: 'Leave',
    home: 'Home',
    correct: 'correct',
    totalTime: 'total time',
    chainItem: (hand: number, title: string) => `Hand ${hand} · ${title}`,
    srCorrect: ', correct',
    srWrong: ', wrong',
    yourAnswer: 'Your answer:',
    correctAnswer: 'Correct:',
    seconds: 's',
    why: 'Why?',
    playAgain: 'Play again',
  },
  positions: {
    title: 'Positions',
    backToDrill: 'Back to drill',
    back: 'Back',
    seat: 'Seat',
  },
  stats: {
    title: 'Stats',
    note: (streak: number) => `Streak: ${plural(streak, 'day')}. Levels move after 20 answers: up at 80% or more, down below 50%.`,
    level: (level: number) => `Level ${level}`,
    answered: (n: number) => `${n} answered`,
    correct: (percent: number) => `${percent}% correct`,
    recentAria: (hits: number, total: number) => `Since the last level change: ${hits} of ${total} correct`,
  },
  cheat: {
    title: 'Cheat sheet',
    drawsTitle: 'Draws on the flop',
    draw: 'Draw',
    outs: 'Outs',
    nextCard: 'Next card',
    byRiver: 'By river',
    draws: {
      set: 'Pocket pair to a set',
      gutshot: 'Gutshot straight draw',
      fullHouse: 'Two pair to a full house',
      pairToTwoPair: 'Pair to two pair or trips',
      overcards: 'Two overcards',
      setToBoat: 'Set to a full house or quads',
      overcardGutshot: 'Overcard + gutshot',
      oesd: 'Open-ended straight draw',
      doubleGutshot: 'Double gutshot',
      flushDraw: 'Flush draw',
      flushGutshot: 'Flush draw + gutshot',
      overcardFlush: 'Overcard + flush draw',
      oesdPair: 'Pair + open-ended straight draw',
      pairFlush: 'Pair + flush draw',
      flushOesd: 'Flush draw + open-ended straight draw',
    } as Record<CommonDraw, string>,
    example: (hand: string, board: string) => `${hand} on ${board}`,
    drawsNote: 'Next card = outs ÷ 47. By the river = 1 − chance to miss twice. Quick rule: outs × 2 or outs × 4.',
    betsTitle: 'Bet sizes',
    bet: 'Bet',
    potOdds: 'Pot odds',
    alpha: 'Alpha',
    mdf: 'MDF',
    potShare: (fraction: string) => (fraction ? `${fraction} pot` : 'Pot'),
    betsNote:
      'Every column is risk ÷ (risk + reward). Pot odds: how often a call must win. Alpha: how often a bluff must work. MDF: how often to defend, 100% − alpha.',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    fourColor: 'Four-color deck (blue diamonds, green clubs)',
    replayIntro: 'Replay the intro',
    clear: 'Clear progress',
    confirmClear: 'Clear all stats, levels, your streak and recorded hands?',
  },
  onboarding: {
    outsTitle: 'Outs',
    outsText:
      'Outs are the cards still in the deck that finish your hand. You hold two hearts and the board shows two more. A suit has 13 cards, so 13 − 4 = 9 hearts make your flush.',
    hitTitle: 'Hit chance',
    hitText: (next: number, river: number) =>
      `On the flop 47 cards are unseen. 9 of them help you, so the next card hits 9 ÷ 47 ≈ ${next}% of the time, and by the river ${river}%. Quick rule: outs × 2 for one card, outs × 4 for two.`,
    oddsTitle: 'Pot odds',
    oddsText:
      'Mix a drink 3:1: three parts tonic, one part gin. Gin is 1 of 4 parts, so 25%. Pot odds work the same way. The pot is 30 and you call 10: you risk 1 part to win 3, so you must win 1 time in 4, which is 25%.',
    screenOf: (screen: number, total: number) => `Screen ${screen} of ${total}`,
    skip: 'Skip',
    start: 'Start training',
    next: 'Next',
  },
  hands: {
    title: 'My hands',
    analysis: 'Analysis',
    export: 'Export',
    import: 'Import',
    imported: (n: number) => `Imported ${plural(n, 'new hand')}.`,
    badFile: 'This file is not a hands export.',
    empty: 'No hands yet. Record one right after you play it, it takes about 30 seconds.',
    deleteAria: (position: Position) => `Delete hand from ${position}`,
    confirmDelete: 'Delete this hand?',
    record: 'Record a hand',
  },
  record: {
    back: 'Back to my hands',
    title: 'Record a hand',
    position: 'Your position',
    remove: 'Remove',
    boardOptional: (n: number) => `Board, optional (${plural(n, 'card')})`,
    pot: 'Pot before the bet, bb',
    bet: 'Bet you face, bb',
    potPreset: 'Pot',
    checkPreset: 'Check (0)',
    preflopPresets: ['Unopened', 'vs open 2.5', 'vs open 3', 'vs 3-bet 9'],
    actionAria: (street: HandStreet) => `Your action on the ${street}`,
    addStreet: (street: HandStreet) => `+ I saw the ${street}`,
    resultAria: 'Result',
    result: 'Result, bb (won + / lost −)',
    tagsAria: 'Tags (optional)',
    tags: { bluff: 'bluff', value: 'value', badBeat: 'bad beat', misread: 'misread', tilt: 'tilt', cooler: 'cooler' } as Record<HandTag, string>,
    won: (bb: number) => `Won +${bb}`,
    lost: (bb: number) => `Lost −${bb}`,
    save: 'Save',
    saveNext: 'Save & next',
    missing: {
      seat: 'Pick your seat',
      cards: 'Pick your cards',
      action: (street: HandStreet) => `Pick your ${street} action`,
    },
    stepAria: (label: string, delta: number) => `${label} ${delta < 0 ? 'minus' : 'plus'} ${Math.abs(delta)}`,
  },
  analysis: {
    title: 'Analysis',
    tips: 'Tips',
    tipsEmpty: 'Tips show up when a mistake repeats at least 3 times. Keep recording hands.',
    preflopTitle: 'Preflop vs chart',
    preflopEmpty: 'Record a hand where it folded to you before the flop (bet 1 bb or less).',
    preflopSummary: (checked: number, off: number) => `${plural(checked, 'unopened spot')} checked, ${off} off the chart.`,
    openOutside: (hand: string, position: Position) => `Played ${hand}, the ${position} chart folds it.`,
    foldInside: (hand: string, position: Position) => `Folded ${hand}, the ${position} chart raises it.`,
    limpInside: (hand: string, position: Position) => `Limped ${hand}, the ${position} chart raises it.`,
    callsTitle: 'Pot-odds calls',
    callsEmpty: 'Record a flop or turn call with a flush or straight draw, including the board cards.',
    callsSummary: (checked: number, bad: number) => `${plural(checked, 'call')} with a draw checked, ${bad} too expensive.`,
    mistake: (drawKind: DrawKind, street: 'flop' | 'turn', outs: number) => `${DRAW_NAMES[drawKind]} on the ${street}, ${outs} outs.`,
    byPosition: 'By position',
    byPositionEmpty: 'Record a few hands to see your result for each seat.',
    seat: 'Seat',
    hands: 'Hands',
    net: 'Net',
  },
  error: {
    title: 'Something went wrong',
  },
};

export type Dict = typeof en;
