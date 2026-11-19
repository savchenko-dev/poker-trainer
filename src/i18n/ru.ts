import { openingRangeNotesRu } from '../content/openingRangesRu';
import { scenarioExplanationsRu } from '../content/scenarios/explanationsRu';
import { oddsRatio } from '../engine/explain';
import type { HandStreet } from '../engine/handRecord';
import type { DrawKind, HandKind, OutsHand, OutsPart, Position, Suit } from '../engine/types';
import type { Dict } from './en';

export function ruPlural(n: number, one: string, few: string, many: string, fraction = few): string {
  if (!Number.isInteger(n)) return fraction;
  const tens = Math.abs(n) % 100;
  const units = tens % 10;
  if (tens > 10 && tens < 20) return many;
  if (units === 1) return one;
  return units >= 2 && units <= 4 ? few : many;
}

const outsWord = (n: number) => `${n} ${ruPlural(n, 'аут', 'аута', 'аутов')}`;

const RANK_NAMES = ['Двойка', 'Тройка', 'Четвёрка', 'Пятёрка', 'Шестёрка', 'Семёрка', 'Восьмёрка', 'Девятка', 'Десятка', 'Валет', 'Дама', 'Король', 'Туз'];
const SUIT_GENITIVE: Record<Suit, string> = { s: 'пик', h: 'червей', d: 'бубен', c: 'треф' };
const HAND_KINDS: Record<HandKind, string> = { pair: 'пара', suited: 'одномастная', offsuit: 'разномастная' };
const STREETS: Record<HandStreet, string> = { preflop: 'префлоп', flop: 'флоп', turn: 'тёрн', river: 'ривер' };
const STREETS_ON: Record<HandStreet, string> = { preflop: 'префлопе', flop: 'флопе', turn: 'тёрне', river: 'ривере' };

const RANK_PLURALS = ['двойки', 'тройки', 'четвёрки', 'пятёрки', 'шестёрки', 'семёрки', 'восьмёрки', 'девятки', 'десятки', 'валеты', 'дамы', 'короли', 'тузы'];
const SUIT_ADJECTIVE: Record<Suit, string> = { s: 'пиковой', h: 'червовой', d: 'бубновой', c: 'трефовой' };

const GOALS: Record<DrawKind, string> = {
  flushDraw: 'флеш',
  oesd: 'стрит',
  gutshot: 'стрит',
  doubleGutshot: 'стрит',
  flushGutshot: 'стрит или флеш',
  flushOesd: 'стрит или флеш',
  comboDraw: 'стрит или флеш',
  overcards: 'пару старше всех карт борда',
  overcardGutshot: 'стрит или пару старше всех карт борда',
  overcardFlush: 'флеш или пару старше всех карт борда',
  pairPlusDraw: 'флеш, две пары или трипс',
  pocketPairToSet: 'сет',
  twoPairToFullHouse: 'фулл-хаус',
  setToFullHouse: 'фулл-хаус или каре',
  pairToTwoPair: 'две пары или трипс',
  oesdPair: 'стрит, две пары или трипс',
};

const OUTS_HINTS: Record<DrawKind, string> = {
  flushDraw: 'В масти 13 карт. 4 карты своей масти ты видишь, значит осталось 13 − 4 = 9.',
  oesd: '4 карты подряд, стрит открыт с двух сторон: 4 карты снизу + 4 сверху = 8.',
  gutshot: 'Стрит закрывает один ранг посередине, а карт этого ранга 4.',
  doubleGutshot: 'Два разных ранга закрывают по стриту с дыркой: 4 + 4 = 8.',
  flushGutshot: '9 карт твоей масти, плюс карты на гатшот трёх других мастей: 9 + 3 = 12.',
  flushOesd: '9 карт твоей масти, плюс карты на стрит трёх других мастей: 9 + 6 = 15.',
  comboDraw: 'Сложи карты на флеш и карты на стрит. Карту, которая даёт и то и другое, считай один раз.',
  overcards: 'К каждой из двух твоих старших карт осталось ещё по 3 карты того же ранга: 2 × 3 = 6.',
  overcardGutshot: '4 карты закрывают стрит, ещё 3 спаривают твою старшую карту: 4 + 3 = 7.',
  overcardFlush: '9 карт твоей масти, ещё 3 спаривают твою старшую карту: 9 + 3 = 12.',
  pairPlusDraw: '9 карт дают флеш, 2 дают трипс, ещё 3 спаривают вторую карту: 9 + 2 + 3 = 14.',
  pocketPairToSet: 'Карт твоего ранга осталось только 2, и любая из них даёт сет.',
  twoPairToFullHouse: 'К каждой из двух твоих пар осталось по 2 карты: 2 + 2 = 4.',
  setToFullHouse: 'К каждой другой карте борда осталось по 3 карты на фулл-хаус, и ещё последняя карта твоего ранга даёт каре.',
  pairToTwoPair: '2 карты дают трипс, ещё 3 спаривают вторую карту: 2 + 3 = 5.',
  oesdPair: '8 карт дают стрит, 2 дают трипс, ещё 3 спаривают вторую карту: 8 + 2 + 3 = 13.',
};

const DRAW_NAMES: Record<DrawKind, string> = {
  flushDraw: 'Флеш-дро',
  oesd: 'Двустороннее стрит-дро',
  gutshot: 'Гатшот',
  doubleGutshot: 'Двойной гатшот',
  flushGutshot: 'Флеш-дро + гатшот',
  flushOesd: 'Флеш-дро + двустороннее стрит-дро',
  comboDraw: 'Комбо-дро',
  overcards: 'Оверкарты',
  overcardGutshot: 'Оверкарта + гатшот',
  overcardFlush: 'Оверкарта + флеш-дро',
  pairPlusDraw: 'Пара + флеш-дро',
  pocketPairToSet: 'Карманная пара',
  twoPairToFullHouse: 'Две пары',
  setToFullHouse: 'Сет',
  pairToTwoPair: 'Пара',
  oesdPair: 'Пара + двустороннее стрит-дро',
};

const TIP_DRAWS: Record<DrawKind, string> = {
  flushDraw: 'флеш-дро',
  oesd: 'двусторонним стрит-дро',
  gutshot: 'гатшотом',
  doubleGutshot: 'двойным гатшотом',
  flushGutshot: 'флеш-дро и гатшотом',
  flushOesd: 'флеш-дро и двусторонним стрит-дро',
  comboDraw: 'комбо-дро',
  overcards: 'оверкартами',
  overcardGutshot: 'оверкартой и гатшотом',
  overcardFlush: 'оверкартой и флеш-дро',
  pairPlusDraw: 'парой и флеш-дро',
  pocketPairToSet: 'карманной парой',
  twoPairToFullHouse: 'двумя парами',
  setToFullHouse: 'сетом',
  pairToTwoPair: 'парой',
  oesdPair: 'парой и двусторонним стрит-дро',
};

const OUTS_HANDS: Record<Exclude<OutsHand, 'flush'>, string> = {
  straight: 'стрит',
  set: 'сет',
  trips: 'трипс',
  twoPair: 'две пары',
  pair: 'пару старше борда',
  fullHouse: 'фулл-хаус',
  quads: 'каре',
};

const cardsWord = (n: number) => `${n} ${ruPlural(n, 'карта', 'карты', 'карт')}`;

const outsPart = ({ hand, count, ranks, suit }: OutsPart, flushSuit: Suit | undefined) => {
  const give = ruPlural(count, 'даёт', 'дают', 'дают');
  if (hand === 'flush') return `${cardsWord(count)} ${SUIT_GENITIVE[suit]} ${give} флеш`;
  const other = hand === 'straight' && flushSuit ? ` не ${SUIT_ADJECTIVE[flushSuit]} масти` : '';
  const names = count === 1 ? RANK_NAMES[ranks[0]! - 2]!.toLowerCase() : ranks.map((rank) => RANK_PLURALS[rank - 2]).join(' или ');
  return `${cardsWord(count)}${other} ${give} ${OUTS_HANDS[hand]} (${names})`;
};

const outsCount = (parts: OutsPart[], outs: number) => {
  const flushSuit = parts.find((part) => part.hand === 'flush')?.suit;
  const text = parts.map((part) => outsPart(part, flushSuit)).join(', ');
  return parts.length > 1 ? `${text}: ${parts.map((part) => part.count).join(' + ')} = ${outs}.` : `${text}.`;
};

const potLine = ({ pot, bet }: { pot: number; bet: number }) => `В банке ${pot}, включая ставку оппонента ${bet}. Колл стоит ${bet}.`;

const ruNumber = (amount: string) => Number(amount).toLocaleString('ru');

const bigBlinds = (amount: string) =>
  `${ruNumber(amount)} ${ruPlural(Number(amount), 'большой блайнд', 'больших блайнда', 'больших блайндов', 'большого блайнда')}`;

export const ru: Dict = {
  skipLink: 'К содержимому',
  backHome: 'На главную',
  bb: 'бб',
  drillTitles: {
    outs: 'Ауты',
    hitChance: 'Шанс попасть',
    potOdds: 'Пот-оддсы',
    callFold: 'Колл или фолд',
    alpha: 'Блеф: альфа',
    mdf: 'Защита: MDF',
    preflopOpen: 'Опен на префлопе',
    scenario: 'Сценарий',
  },
  actions: { fold: 'Фолд', call: 'Колл', raise: 'Рейз' },
  handActions: { fold: 'фолд', check: 'чек', call: 'колл', bet: 'бет', raise: 'рейз' },
  streets: STREETS,
  drawNames: DRAW_NAMES,
  cardName: (card) => `${RANK_NAMES[card.rank - 2]} ${SUIT_GENITIVE[card.suit]}`,
  suitNames: { s: 'пики', h: 'черви', d: 'бубны', c: 'трефы' },
  removeCard: (name) => `Убрать: ${name}`,
  positionNote: (position) => openingRangeNotesRu[position],
  prompts: {
    outs: (p) => `Сколько у тебя аутов, чтобы собрать ${GOALS[p.drawKind]}?`,
    hitChance: (p) =>
      `${p.counted === p.trueCount ? '' : `Ты насчитал ${outsWord(p.counted)} (на самом деле их ${p.trueCount}). `}У тебя ${outsWord(p.counted)} на ${STREETS_ON[p.street]}. Какой шанс попасть ${p.cardsToCome === 2 ? 'к риверу' : 'следующей картой'}?`,
    potOdds: (p) => `${potLine(p)} Какие у тебя пот-оддсы?`,
    callFold: (p) => `${potLine(p)} Считай только следующую карту. Колл или фолд?`,
    alpha: (p) => `В банке ${p.pot}. Ты блефуешь на ${p.bet}. Как часто оппонент должен фолдить, чтобы блеф вышел в ноль?`,
    mdf: (p) => `В банке ${p.pot}. Оппонент ставит ${p.bet}. Как часто нужно коллировать или рейзить, чтобы его блеф не приносил прибыль?`,
    preflopOpen: (p) => `До тебя все сфолдили, ты на ${p.position}. Рейз или фолд?`,
    scenario: (p) => `Ты на ${p.position}. Какое действие лучше?`,
  },
  explanations: {
    outs: (p) => ({
      formula: OUTS_HINTS[p.drawKind],
      numbers: outsCount(p.parts, p.outs),
      result: outsWord(p.outs),
      text: `Любая из этих карт даёт тебе ${GOALS[p.drawKind]}.`,
    }),
    hitChance: (p) => {
      const misses = p.unseen - p.counted;
      const two = p.cardsToCome === 2;
      const rule = p.cardsToCome * 2;
      const trueCount =
        p.counted === p.trueCount
          ? ''
          : ` Ты насчитал ${outsWord(p.counted)}, а на самом деле их ${p.trueCount}, это ${p.trueExact}%. Здесь считаем по твоему числу, чтобы ты потренировал математику.`;
      return {
        formula: two ? 'Шанс = 1 − шанс промахнуться дважды' : 'Шанс = ауты ÷ невидимые карты',
        numbers: two ? `1 − (${misses}/${p.unseen} × ${misses - 1}/${p.unseen - 1})` : `${p.counted} ÷ ${p.unseen}`,
        result: `${p.exact}%`,
        text: `Ты не видишь ещё ${p.unseen} карт: 52 минус две твои и ${p.boardSize} на борде. ${p.counted} из них тебе помогают, поэтому ${two ? 'к риверу' : 'следующей картой'} ты попадаешь примерно в ${p.exact}% случаев. Быстрое правило: ауты × ${rule}.${trueCount}`,
        rule: `Правило ${rule}: ${p.counted} × ${rule}`,
      };
    },
    potOdds: ({ pot, bet, odds }) => ({
      formula: 'Безубыток = риск ÷ (риск + выигрыш)',
      numbers: `Риск: твой колл ${bet}. Выигрыш: банк ${pot}. ${bet} ÷ (${bet} + ${pot}) = ${bet} ÷ ${pot + bet}`,
      result: `${odds}% · пот-оддсы ${oddsRatio(pot, bet)}`,
      text: `Ты рискуешь ${bet}, чтобы выиграть ${pot}, то есть банк даёт тебе ${oddsRatio(pot, bet)}. Выигрывай хотя бы в ${odds}% случаев, и колл выйдет в ноль.`,
    }),
    callFold: ({ pot, bet, outs, unseen, hit, odds, call }) => ({
      formula: 'Колл, когда шанс попасть ≥ риск ÷ (риск + выигрыш)',
      numbers: `Следующая карта: ${outs} ÷ ${unseen} = ${hit}%. Безубыток: ${bet} ÷ (${bet} + ${pot}) = ${odds}% (${oddsRatio(pot, bet)}).`,
      result: `${hit}% ${call ? '≥' : '<'} ${odds}% → ${call ? 'Колл' : 'Фолд'}`,
      text:
        call
          ? `Ты рискуешь ${bet}, чтобы выиграть ${pot}. Ты попадаешь в ${hit}% случаев, а нужно ${odds}%. На дистанции колл приносит деньги.`
          : `Ты рискуешь ${bet}, чтобы выиграть ${pot}. Ты попадаешь только в ${hit}% случаев, а нужно ${odds}%. Фолд сбережёт фишки.`,
    }),
    alpha: ({ pot, bet, alpha }) => ({
      formula: 'Альфа = риск ÷ (риск + выигрыш)',
      numbers: `Риск: твоя ставка ${bet}. Выигрыш: банк ${pot}. ${bet} ÷ (${bet} + ${pot}) = ${bet} ÷ ${pot + bet}`,
      result: `${alpha}% · выигрыш к риску ${oddsRatio(pot, bet)}`,
      text: `Блеф рискует ${bet}, чтобы выиграть ${pot}. Если оппонент фолдит чаще, чем в ${alpha}% случаев, блеф приносит деньги. Обратная сторона — MDF: ему нужно продолжать в ${100 - alpha}% случаев. Альфа ${alpha}% + MDF ${100 - alpha}% = 100%.`,
    }),
    mdf: ({ pot, bet, alpha }) => ({
      formula: 'MDF = 1 − альфа = банк ÷ (банк + ставка)',
      numbers: `Его риск: ставка ${bet}. Его выигрыш: банк ${pot}. Альфа = ${bet} ÷ ${pot + bet} = ${alpha}%, значит MDF = ${pot} ÷ ${pot + bet}`,
      result: `${100 - alpha}% · банк к ставке ${oddsRatio(pot, bet)}`,
      text: `Чистому блефу на ${bet} в банк ${pot} нужно, чтобы ты фолдил в ${alpha}% случаев. Коллируй или рейзи хотя бы с ${100 - alpha}% рук, и такой блеф не принесёт прибыли. Альфа ${alpha}% + MDF ${100 - alpha}% = 100%.`,
    }),
    preflopOpen: ({ position, hand, kind, raise }) => ({
      formula: 'Рейз, если рука есть в чарте опенов для твоей позиции. Иначе фолд',
      numbers: `${hand} (${HAND_KINDS[kind]}) с ${position}`,
      result: `${hand} ${raise ? 'входит' : 'не входит'} в диапазон ${position} → ${raise ? 'Рейз' : 'Фолд'}`,
      text: openingRangeNotesRu[position],
    }),
    scenario: ({ id }) => ({ formula: '', numbers: '', result: '', text: scenarioExplanationsRu[id] ?? '' }),
  },
  tip: (t) => {
    if (t.key === 'bigBetCalls')
      return `Ты ${t.count} ${ruPlural(t.count, 'раз', 'раза', 'раз')} коллировал с дро против ставок от половины банка, чаще всего с ${TIP_DRAWS[t.drawKind]}. С ${t.outs} аутами ты попадаешь следующей картой в ${t.hit}% случаев, так что коллируй ставки примерно до ${t.maxShare}% банка.`;
    if (t.key === 'earlyOpens')
      return `Ты сыграл с UTG или MP ${t.count} ${ruPlural(t.count, 'руку', 'руки', 'рук')}, которые чарт фолдит (${t.hands.join(', ')}). Там за тобой ходят почти все, так что фолди их и открывай только руки из чарта.`;
    if (t.key === 'chartFolds')
      return `Ты сфолдил ${t.count} ${ruPlural(t.count, 'руку', 'руки', 'рук')}, которые чарт открывает (${t.hands.join(', ')}). Когда до тебя все сфолдили, рейзи их.`;
    return `С ${t.position} ты проиграл ${t.lost} бб за ${t.hands} ${ruPlural(t.hands, 'раздачу', 'раздачи', 'раздач')}. Играй там меньше рук и сверяй их с чартом.`;
  },
  home: {
    title: 'Покерная математика',
    lead: 'Короткие задания про математику, которая стоит за каждым коллом.',
    streakAria: (n) => `Серия ${n} ${ruPlural(n, 'день', 'дня', 'дней')} подряд. Открыть статистику`,
    streakUnit: (n) => `${ruPlural(n, 'день', 'дня', 'дней')} подряд`,
    badge: 'Начни отсюда',
    heroTitle: 'Целая раздача: ауты → шансы → решение',
    heroText: (hands) => `Одна раздача, четыре коротких шага. ${hands} ${ruPlural(hands, 'раздача', 'раздачи', 'раздач')} за сессию.`,
    play: 'Играть',
    math: 'Математика',
    preflop: 'Префлоп',
    more: 'Ещё',
    blurbs: {
      outs: 'Посчитай карты, которые собирают твоё дро.',
      hitChance: 'Переведи ауты в проценты по правилу 2 и 4.',
      potOdds: 'Сравни свой колл с размером банка.',
      callFold: 'Стоит ли твой шанс попасть этой цены?',
      alpha: 'Как часто оппонент должен фолдить на твой блеф?',
      mdf: 'Как часто нужно защищаться против ставки?',
      preflopOpen: 'До тебя все сфолдили: рейз или фолд?',
      scenario: 'Реальные споты с действиями до тебя.',
    },
    scenariosTitle: 'Сценарии',
    mixedTitle: 'Микс',
    mixedBlurb: 'Десять заданий всех типов.',
    positionsTitle: 'Позиции',
    positionsBlurb: 'Диапазон опена для каждой позиции.',
    handsTitle: 'Мои раздачи',
    handsBlurb: 'Записывай сыгранные раздачи и получай советы.',
    statsTitle: 'Статистика',
    statsBlurb: 'Точность и уровень по каждому заданию.',
    cheatTitle: 'Шпаргалка',
    cheatBlurb: 'Ауты, шансы попасть и пот-оддсы для разных ставок.',
    settingsTitle: 'Настройки',
    settingsBlurb: 'Язык, четырёхцветная колода, интро, сброс.',
  },
  trainer: {
    quit: 'Выйти на главную',
    chainProgress: (hand, hands, step, steps) => `Раздача ${hand}/${hands} · Шаг ${step}/${steps}`,
    positions: 'Позиции',
    steps: 'Шаги',
    seeResults: 'Итоги',
    nextHand: 'Следующая раздача',
    next: 'Дальше',
    rule: 'Правило',
  },
  explanation: {
    aria: 'Разбор',
    correct: (answer) => `Верно! Ответ: ${answer}.`,
    wrong: (chosen, answer) => `Не совсем. Ты выбрал ${chosen}, а правильный ответ: ${answer}.`,
    timeout: (answer) => `Время вышло. Ответ: ${answer}.`,
    quickEstimate: 'Быстрая оценка',
    exact: 'Точно',
    formula: 'Формула',
    numbers: 'Твои числа',
    result: 'Итог',
    outsAria: (n) => `Ауты: ${n} ${ruPlural(n, 'карта', 'карты', 'карт')}`,
  },
  potBar: {
    aria: (pot, bet, need) => `Итоговый банк ${pot + bet}: банк ${pot}, твой колл ${bet}. Для колла нужно ${need}%.`,
    reward: (pot) => `Выигрыш: банк ${pot}`,
    risk: (bet) => `Риск: твой колл ${bet}`,
    meterAria: (hit, need) => `Ты попадаешь в ${hit}%, нужно ${need}%.`,
    youHit: 'Попадаешь',
    need: (need) => `нужно ${need}%`,
  },
  situation: {
    aria: 'Ситуация',
    flop: 'Флоп',
    turn: 'Тёрн',
    pot: 'Банк',
    toCall: 'Колл',
    yourBluff: 'Твой блеф',
    theyBet: 'Ставка',
    yourHand: 'Твоя рука',
    board: 'Борд',
  },
  history: {
    aria: 'Действия до тебя',
    fold: 'фолд',
    raise: (amount, gloss) => (gloss ? `рейз до ${bigBlinds(amount)}` : `рейз ${ruNumber(amount)}бб`),
    call: (amount, gloss) => (gloss ? `колл ${bigBlinds(amount)}` : `колл ${ruNumber(amount)}бб`),
    you: 'Ты · твой ход',
  },
  timer: {
    aria: (left) => `Осталось ${left} ${ruPlural(left, 'секунда', 'секунды', 'секунд')}`,
    short: (left) => `${left} с`,
  },
  grid: {
    caption: (position: Position) =>
      `${position === 'BB' ? 'Диапазон защиты BB против одного рейза' : `Диапазон опена ${position}`}. Одномастные руки выше диагонали, разномастные ниже.`,
    continue: 'Продолжать',
    raise: 'Рейз',
    fold: 'Фолд',
    yourHand: 'твоя рука',
    tap: 'Нажми на руку, чтобы проверить.',
  },
  sessionEnd: {
    title: 'Сессия окончена',
    leave: 'Выход',
    home: 'Главная',
    correct: 'верно',
    totalTime: 'общее время',
    chainItem: (hand, title) => `Раздача ${hand} · ${title}`,
    srCorrect: ', верно',
    srWrong: ', ошибка',
    yourAnswer: 'Твой ответ:',
    correctAnswer: 'Правильно:',
    seconds: 'с',
    why: 'Почему?',
    playAgain: 'Ещё раз',
  },
  positions: {
    title: 'Позиции',
    backToDrill: 'К заданию',
    back: 'Назад',
    seat: 'Позиция',
  },
  stats: {
    title: 'Статистика',
    note: (streak) =>
      `Серия: ${streak} ${ruPlural(streak, 'день', 'дня', 'дней')}. Уровень меняется после 20 ответов: растёт от 80% верных, падает ниже 50%.`,
    level: (level) => `Уровень ${level}`,
    answered: (n) => `${n} ${ruPlural(n, 'ответ', 'ответа', 'ответов')}`,
    correct: (percent) => `${percent}% верно`,
    recentAria: (hits, total) => `С последней смены уровня: ${hits} из ${total} верно`,
  },
  cheat: {
    title: 'Шпаргалка',
    drawsTitle: 'Дро на флопе',
    draw: 'Дро',
    outs: 'Ауты',
    nextCard: 'След. карта',
    byRiver: 'К риверу',
    draws: {
      set: 'Карманная пара → сет',
      gutshot: 'Гатшот',
      fullHouse: 'Две пары → фулл-хаус',
      pairToTwoPair: 'Пара → две пары или трипс',
      overcards: 'Две оверкарты',
      setToBoat: 'Сет → фулл-хаус или каре',
      overcardGutshot: 'Оверкарта + гатшот',
      oesd: 'Двустороннее стрит-дро',
      doubleGutshot: 'Двойной гатшот',
      flushDraw: 'Флеш-дро',
      flushGutshot: 'Флеш-дро + гатшот',
      overcardFlush: 'Оверкарта + флеш-дро',
      oesdPair: 'Пара + двустороннее стрит-дро',
      pairFlush: 'Пара + флеш-дро',
      flushOesd: 'Флеш-дро + двустороннее стрит-дро',
    },
    example: (hand, board) => `${hand} на ${board}`,
    drawsNote: 'Следующая карта = ауты ÷ 47. К риверу = 1 − шанс промахнуться дважды. Быстрое правило: ауты × 2 или ауты × 4.',
    betsTitle: 'Размер ставки',
    bet: 'Ставка',
    potOdds: 'Пот-оддсы',
    alpha: 'Альфа',
    mdf: 'MDF',
    potShare: (fraction) => (fraction ? `${fraction} банка` : 'Банк'),
    betsNote:
      'Каждая колонка — это риск ÷ (риск + выигрыш). Пот-оддсы: как часто должен выигрывать колл. Альфа: как часто должен срабатывать блеф. MDF: как часто защищаться, 100% − альфа.',
  },
  settings: {
    title: 'Настройки',
    language: 'Язык',
    fourColor: 'Четырёхцветная колода (синие бубны, зелёные трефы)',
    replayIntro: 'Показать интро заново',
    clear: 'Сбросить прогресс',
    confirmClear: 'Стереть всю статистику, уровни, серию и записанные раздачи?',
  },
  account: {
    title: 'Аккаунт',
    intro: 'Эта фраза и есть твой аккаунт. Введи её на другом устройстве, чтобы прогресс был общим. Никому её не показывай.',
    creating: 'Создаём фразу…',
    show: 'Показать фразу',
    hide: 'Скрыть фразу',
    copy: 'Скопировать',
    copied: 'Скопировано',
    copyFailed: 'Не получилось скопировать. Перепиши фразу вручную.',
    never: 'Ещё не синхронизировано',
    synced: (minutes) => (minutes < 1 ? 'Синхронизировано только что' : `Синхронизировано ${minutes} мин назад`),
    pending: (count) => `Ждут синхронизации: ${count}`,
    offline: 'Нет связи. Изменения сохранены на этом устройстве.',
    linkTitle: 'Подключить другое устройство',
    linkHint: 'Введи фразу с другого устройства. Данные с обоих устройств объединятся.',
    linkLabel: 'Фраза с другого устройства',
    link: 'Подключить',
    invalid: 'Фраза выглядит так: amber-fox-river-42.',
    confirmLink: 'Переключить это устройство на эту фразу? Данные отсюда останутся и объединятся с тем аккаунтом.',
  },
  onboarding: {
    outsTitle: 'Ауты',
    outsText:
      'Ауты — это карты в колоде, которые собирают твою руку. У тебя две червы, и на борде ещё две. В масти 13 карт, значит 13 − 4 = 9 червей собирают флеш.',
    hitTitle: 'Шанс попасть',
    hitText: (next, river) =>
      `На флопе ты не видишь 47 карт. 9 из них тебе помогают, поэтому следующая карта попадает в 9 ÷ 47 ≈ ${next}% случаев, а к риверу — в ${river}%. Быстрое правило: ауты × 2 на одну карту, ауты × 4 на две.`,
    oddsTitle: 'Пот-оддсы',
    oddsText:
      'Смешай коктейль 3:1: три части тоника, одна часть джина. Джин — 1 из 4 частей, то есть 25%. С пот-оддсами так же. В банке 30, колл стоит 10: ты рискуешь одной частью, чтобы выиграть три. Значит, выигрывать нужно 1 раз из 4, это 25%.',
    screenOf: (screen, total) => `Экран ${screen} из ${total}`,
    skip: 'Пропустить',
    start: 'Начать',
    next: 'Дальше',
  },
  hands: {
    title: 'Мои раздачи',
    analysis: 'Анализ',
    export: 'Экспорт',
    import: 'Импорт',
    imported: (n) => `Новых раздач загружено: ${n}.`,
    badFile: 'Это не файл с раздачами.',
    empty: 'Раздач пока нет. Запиши раздачу сразу после игры, это займёт секунд 30.',
    deleteAria: (position) => `Удалить раздачу с ${position}`,
    confirmDelete: 'Удалить эту раздачу?',
    record: 'Записать раздачу',
  },
  record: {
    back: 'Назад к моим раздачам',
    title: 'Запись раздачи',
    position: 'Твоя позиция',
    remove: 'Убрать',
    boardOptional: (n) => `Борд, можно пропустить (${n} ${ruPlural(n, 'карта', 'карты', 'карт')})`,
    pot: 'Банк до ставки, бб',
    bet: 'Ставка против тебя, бб',
    potPreset: 'Банк',
    checkPreset: 'Чек (0)',
    preflopPresets: ['Без рейза', 'Опен 2.5', 'Опен 3', '3-бет 9'],
    actionAria: (street) => `Твоё действие на ${STREETS_ON[street]}`,
    addStreet: (street) => `+ Добавить ${STREETS[street]}`,
    resultAria: 'Результат',
    result: 'Результат, бб (выиграл + / проиграл −)',
    tagsAria: 'Метки (можно пропустить)',
    tags: { bluff: 'блеф', value: 'вэлью', badBeat: 'бэд-бит', misread: 'не так прочитал', tilt: 'тилт', cooler: 'кулер' },
    won: (bb) => `Выиграл +${bb}`,
    lost: (bb) => `Проиграл −${bb}`,
    save: 'Сохранить',
    saveNext: 'Сохранить и ещё',
    missing: {
      seat: 'Выбери позицию',
      cards: 'Выбери свои карты',
      action: (street) => `Выбери действие на ${STREETS_ON[street]}`,
    },
    stepAria: (label, delta) => `${label} ${delta < 0 ? 'минус' : 'плюс'} ${Math.abs(delta)}`,
  },
  analysis: {
    title: 'Анализ',
    tips: 'Советы',
    tipsEmpty: 'Советы появятся, когда одна ошибка повторится хотя бы 3 раза. Продолжай записывать раздачи.',
    preflopTitle: 'Префлоп против чарта',
    preflopEmpty: 'Запиши раздачу, где до тебя все сфолдили до флопа (ставка 1 бб или меньше).',
    preflopSummary: (checked, off) => `Проверено спотов без рейза до тебя: ${checked}, мимо чарта: ${off}.`,
    openOutside: (hand, position) => `Сыграл ${hand}, а чарт ${position} её фолдит.`,
    foldInside: (hand, position) => `Сфолдил ${hand}, а чарт ${position} её рейзит.`,
    limpInside: (hand, position) => `Залимпил ${hand}, а чарт ${position} её рейзит.`,
    callsTitle: 'Коллы по пот-оддсам',
    callsEmpty: 'Запиши колл на флопе или тёрне с флеш-дро или стрит-дро, вместе с картами борда.',
    callsSummary: (checked, bad) => `Проверено коллов с дро: ${checked}, слишком дорогих: ${bad}.`,
    mistake: (drawKind, street, outs) => `${DRAW_NAMES[drawKind]} на ${STREETS_ON[street]}, ${outsWord(outs)}.`,
    byPosition: 'По позициям',
    byPositionEmpty: 'Запиши несколько раздач, чтобы увидеть результат по каждой позиции.',
    seat: 'Позиция',
    hands: 'Раздачи',
    net: 'Итог',
  },
  error: {
    title: 'Что-то пошло не так',
  },
};
