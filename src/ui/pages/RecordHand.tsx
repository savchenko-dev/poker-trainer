import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { POSITIONS } from '../../engine/handClass';
import {
  actionAllowed,
  BOARD_CARDS,
  HAND_ACTIONS,
  HAND_STREETS,
  HAND_TAGS,
  investedBb,
  type DraftStreet,
  type HandAction,
  type HandRecord,
  type HandTag,
} from '../../engine/handRecord';
import type { Card, Position } from '../../engine/types';
import { useLang } from '../../i18n/LanguageContext';
import { useHands } from '../../state/HandsContext';
import { CardPicker } from '../components/CardPicker';
import reference from './Reference.module.css';
import styles from './RecordHand.module.css';

type Draft = DraftStreet;

const BET_PRESETS = [
  { label: '⅓', share: 1 / 3 },
  { label: '½', share: 1 / 2 },
  { label: '⅔', share: 2 / 3 },
  { label: '', share: 1 },
  { label: '', share: 0 },
];
const PREFLOP_PRESETS = [
  { pot: 1.5, bet: 0 },
  { pot: 4, bet: 2.5 },
  { pot: 4.5, bet: 3 },
  { pot: 12, bet: 9 },
];
const FIRST_STREET: Draft = { pot: 1.5, bet: 1, action: null };
const EMPTY_BOARDS: Card[][] = [[], [], [], []];

const roundHalf = (value: number) => Math.round(value * 2) / 2;

interface StepperProps { label: string; value: number; steps: number[]; min?: number; onChange: (value: number) => void }

function Stepper({ label, value, steps, min, onChange }: StepperProps) {
  const { t } = useLang();
  const deltas = [...steps.map((step) => -step).reverse(), ...steps];
  const stepButton = (delta: number) => (
    <button
      key={delta}
      type="button"
      className={styles.step}
      aria-label={t.record.stepAria(label, delta)}
      onClick={() => onChange(Math.max(min ?? -Infinity, roundHalf(value + delta)))}
    >
      {delta < 0 ? `−${-delta}` : `+${delta}`}
    </button>
  );
  const wide = steps.length > 2;
  const display = (
    <output className={`${styles.number} ${wide ? styles.full : ''}`} aria-live="polite">
      {value}
    </output>
  );
  const columns = wide ? `repeat(${deltas.length}, 1fr)` : `repeat(${steps.length}, 1fr) 1.6fr repeat(${steps.length}, 1fr)`;
  return (
    <div className={styles.stepper} role="group" aria-label={label} style={{ gridTemplateColumns: columns }}>
      <span className={styles.label}>{label}</span>
      {wide && display}
      {deltas.slice(0, steps.length).map(stepButton)}
      {!wide && display}
      {deltas.slice(steps.length).map(stepButton)}
    </div>
  );
}

export function RecordHand() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { add, hands } = useHands();
  const [position, setPosition] = useState<Position | null>(hands[0]?.position ?? null);
  const [hero, setHero] = useState<Card[]>([]);
  const [boards, setBoards] = useState<Card[][]>(EMPTY_BOARDS);
  const [streets, setStreets] = useState<Draft[]>([FIRST_STREET]);
  const [result, setResult] = useState(0);
  const [tags, setTags] = useState<HandTag[]>([]);
  const sections = useRef<(HTMLElement | null)[]>([]);
  const scrollTarget = useRef<number | null>(null);

  const last = streets[streets.length - 1]!;
  const lastIndex = streets.length - 1;
  const canAddStreet =
    streets.length < 4 && last.action !== null && last.action !== 'fold' && boards[lastIndex]!.length === BOARD_CARDS[lastIndex];
  const unset = streets.findIndex((street) => street.action === null);
  const missing =
    position === null ? t.record.missing.seat : hero.length < 2 ? t.record.missing.cards : unset >= 0 ? t.record.missing.action(HAND_STREETS[unset]!) : null;
  const wonBb = roundHalf(last.pot + last.bet);
  const lostBb = roundHalf(investedBb(position, streets));
  const clean = (list: Draft[], seat: Position | null) =>
    list.map((street, index) => (street.action && !actionAllowed(index, street.bet, seat, street.action) ? { ...street, action: null } : street));
  const updateStreet = (index: number, change: Partial<Draft>) =>
    setStreets(clean(streets.map((street, other) => (other === index ? { ...street, ...change } : street)), position));
  const chooseSeat = (seat: Position) => {
    setPosition(seat);
    setStreets(clean(streets, seat));
  };
  const addStreet = () => {
    const grow = last.action === 'call' || last.action === 'bet' || last.action === 'raise';
    scrollTarget.current = streets.length;
    setStreets([...streets, { pot: roundHalf(last.pot + (grow ? 2 * last.bet : 0)), bet: 0, action: null }]);
  };
  const keepStreets = (count: number, change?: Partial<Draft>) => {
    setBoards(boards.map((cards, index) => (index < count ? cards : [])));
    setStreets(streets.slice(0, count).map((street, index) => (change && index === count - 1 ? { ...street, ...change } : street)));
  };
  const chooseAction = (index: number, action: HandAction) =>
    action === 'fold' ? keepStreets(index + 1, { action }) : updateStreet(index, { action });
  const pickHero = (cards: Card[]) => {
    setHero(cards);
    if (cards.length === 2 && boards[1]!.length < 3) requestAnimationFrame(() => sections.current[1]?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const save = (next: boolean) => {
    if (missing || position === null) return;
    const [, flop = [], turn = [], river = []] = boards;
    const board = flop.length === 3 ? [...flop, ...turn, ...(turn.length ? river : [])] : [];
    const record: HandRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: new Date().toISOString(),
      position,
      heroCards: [hero[0]!, hero[1]!],
      board,
      streets: Object.fromEntries(streets.map((street, index) => [HAND_STREETS[index], street])),
      resultBb: result,
      tags,
      updatedAt: Date.now(),
    };
    add(record);
    if (!next) {
      navigate('/hands');
      return;
    }
    setHero([]);
    setBoards(EMPTY_BOARDS);
    setStreets([FIRST_STREET]);
    setResult(0);
    setTags([]);
    window.scrollTo(0, 0);
  };

  return (
    <main id="main" className={`page ${styles.page}`}>
      <header className={reference.header}>
        <Link to="/hands" className={reference.close} aria-label={t.record.back}>
          ✕
        </Link>
        <h1 className={reference.title}>{t.record.title}</h1>
      </header>

      <div className={styles.chips} role="group" aria-label={t.record.position}>
        {POSITIONS.map((seat) => (
          <button key={seat} type="button" aria-pressed={seat === position} className={styles.chip} onClick={() => chooseSeat(seat)}>
            {seat}
          </button>
        ))}
      </div>

      <CardPicker label={t.situation.yourHand} cards={hero} max={2} used={boards.flat()} onChange={pickHero} />

      {streets.map((street, index) => {
        const name = HAND_STREETS[index]!;
        return (
          <section
            key={name}
            ref={(node) => {
              sections.current[index] = node;
              if (node && scrollTarget.current === index) {
                scrollTarget.current = null;
                requestAnimationFrame(() => node.scrollIntoView({ behavior: 'smooth', block: 'start' }));
              }
            }}
            className={styles.street}
            aria-label={t.streets[name]}
          >
            <div className={styles.streetHeader}>
              <h2>{t.streets[name]}</h2>
              {index > 0 && index === streets.length - 1 && (
                <button type="button" className={styles.remove} onClick={() => keepStreets(streets.length - 1)}>
                  {t.record.remove}
                </button>
              )}
            </div>
            {index > 0 && (
              <CardPicker
                label={t.record.boardOptional(BOARD_CARDS[index]!)}
                cards={boards[index]!}
                max={BOARD_CARDS[index]!}
                disabled={index > 1 && boards[1]!.length < 3}
                used={[...hero, ...boards.filter((_, other) => other !== index).flat()]}
                onChange={(cards) => setBoards(boards.map((current, other) => (other === index ? cards : current)))}
              />
            )}
            <Stepper label={t.record.pot} value={street.pot} steps={index ? [1, 5] : [0.5, 1]} min={0} onChange={(pot) => updateStreet(index, { pot })} />
            <Stepper label={t.record.bet} value={street.bet} steps={index ? [1, 5] : [0.5, 1]} min={0} onChange={(bet) => updateStreet(index, { bet })} />
            <div className={styles.presets}>
              {index === 0
                ? PREFLOP_PRESETS.map((preset, which) => (
                    <button key={which} type="button" className={styles.step} onClick={() => updateStreet(index, preset)}>
                      {t.record.preflopPresets[which]}
                    </button>
                  ))
                : BET_PRESETS.map(({ label, share }) => (
                    <button key={share} type="button" className={styles.step} onClick={() => updateStreet(index, { bet: roundHalf(street.pot * share) })}>
                      {label || (share ? t.record.potPreset : t.record.checkPreset)}
                    </button>
                  ))}
            </div>
            <div className={styles.chips} role="group" aria-label={t.record.actionAria(name)}>
              {HAND_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  aria-pressed={street.action === action}
                  disabled={!actionAllowed(index, street.bet, position, action)}
                  className={styles.chip}
                  onClick={() => chooseAction(index, action)}
                >
                  {t.handActions[action]}
                </button>
              ))}
            </div>
          </section>
        );
      })}

      {canAddStreet && (
        <button type="button" className={styles.add} onClick={addStreet}>
          {t.record.addStreet(HAND_STREETS[streets.length]!)}
        </button>
      )}

      <section className={styles.street} aria-label={t.record.resultAria}>
        <Stepper label={t.record.result} value={result} steps={[1, 5, 10]} onChange={setResult} />
        <div className={styles.presets}>
          <button type="button" className={styles.step} onClick={() => setResult(wonBb)}>
            {t.record.won(wonBb)}
          </button>
          <button type="button" className={styles.step} onClick={() => setResult(-lostBb)}>
            {t.record.lost(lostBb)}
          </button>
          <button type="button" className={styles.step} onClick={() => setResult(0)}>
            0
          </button>
        </div>
        <div className={styles.tags} role="group" aria-label={t.record.tagsAria}>
          {HAND_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-pressed={tags.includes(tag)}
              className={styles.chip}
              onClick={() => setTags(tags.includes(tag) ? tags.filter((other) => other !== tag) : [...tags, tag])}
            >
              {t.record.tags[tag]}
            </button>
          ))}
        </div>
      </section>

      <div className={`bottom-bar ${styles.dock}`}>
        {!missing ? (
          <>
            <button type="button" className={styles.save} onClick={() => save(false)}>
              {t.record.save}
            </button>
            <button type="button" className="button-primary" onClick={() => save(true)}>
              {t.record.saveNext}
            </button>
          </>
        ) : (
          <button type="button" className={`button-primary ${styles.wide}`} disabled>
            {missing}
          </button>
        )}
      </div>
    </main>
  );
}
