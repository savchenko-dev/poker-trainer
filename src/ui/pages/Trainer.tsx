import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { POSTFLOP_TYPES, type Session } from '../../engine/types';
import { nextCardPercent } from '../../engine/explain';
import { handClass } from '../../engine/handClass';
import { LEVELS } from '../../engine/levels';
import { formatPrompt, optionLabel } from '../../i18n/format';
import { useLang } from '../../i18n/LanguageContext';
import { useSession } from '../../state/SessionContext';
import { useStats } from '../../state/StatsContext';
import { CHAIN_STEPS, sessionKey, TRAINER_KEYS, type TrainerKey } from '../../state/sessionReducer';
import { ActionHistory } from '../components/ActionHistory';
import { AnswerButtons } from '../components/AnswerButtons';
import { ExplanationPanel } from '../components/ExplanationPanel';
import { HandGrid } from '../components/HandGrid';
import { PotOddsBar } from '../components/PotOddsBar';
import { BetPanel, SituationPanel } from '../components/SituationPanel';
import { Timer } from '../components/Timer';
import type { PositionsState } from './Positions';
import styles from './Trainer.module.css';

export function Trainer({ chain = false }: { chain?: boolean }) {
  const { t } = useLang();
  const { type } = useParams();
  const key = (chain ? 'chain' : type) as TrainerKey;
  const valid = TRAINER_KEYS.includes(key);
  const { pathname } = useLocation();
  const { state, dispatch } = useSession();
  const { levels } = useStats();
  const { session, current } = state;
  const sameKey = session !== null && sessionKey(session) === key;
  const explanationRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLHeadingElement>(null);
  const focusPrompt = useRef(false);
  const startedFrom = useRef<Session | null | undefined>(undefined);
  const [finishing, setFinishing] = useState(false);
  const answered = sameKey && session.answers.length > current;
  const needsStart = valid && !finishing && (!sameKey || Boolean(session.finishedAt));

  useEffect(() => {
    if (!needsStart || startedFrom.current === session) return;
    startedFrom.current = session;
    dispatch({ type: 'start', key, now: Date.now(), levels });
  }, [needsStart, session, key, dispatch, levels]);

  useEffect(() => {
    if (!focusPrompt.current) return;
    focusPrompt.current = false;
    promptRef.current?.focus();
  }, [current]);

  useEffect(() => {
    if (!answered) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    explanationRef.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }, [answered]);

  const onAnswer = useCallback((optionId: string) => dispatch({ type: 'answer', optionId, now: Date.now() }), [dispatch]);
  const onTimeout = useCallback(() => dispatch({ type: 'timeout', now: Date.now() }), [dispatch]);

  if (!valid) return <Navigate to="/" replace />;
  if (finishing && sameKey && session.finishedAt) return <Navigate to="/session/end" replace />;
  const active = sameKey && !session.finishedAt ? session : null;
  const drill = active?.drills[current];
  if (!active || !drill) return null;

  const answer = active.answers[current];
  const correctOption = drill.options.find((option) => option.isCorrect);
  const chosenOption = drill.options.find((option) => option.id === answer?.chosenOptionId);
  const last = current + 1 === active.drills.length;
  const isChain = active.mode === 'stepChain';
  const step = current % CHAIN_STEPS;
  const drillType = drill.type;
  const { situation, preflop } = drill;
  const potDrill = drillType === 'potOdds' || drillType === 'callFold';
  const openSpot = drillType === 'preflopOpen' || (drillType === 'scenario' && !drill.scenario?.actionHistory.some((line) => line.includes('raises')));
  const positionsState: PositionsState = { from: pathname, position: preflop?.position };
  const timerSeconds = LEVELS[drill.level].timerSeconds;
  const prompt = formatPrompt(t, drill.prompt);
  const next = () => {
    dispatch({ type: 'next', now: Date.now() });
    if (last) setFinishing(true);
    else focusPrompt.current = true;
  };

  return (
    <main id="main" className={`page ${styles.trainer}`} data-answered={answer ? '' : undefined}>
      <header className={styles.header}>
        <Link to="/" className={styles.quit} aria-label={t.trainer.quit}>
          ✕
        </Link>
        <p className={styles.progress}>
          {isChain
            ? t.trainer.chainProgress(Math.floor(current / CHAIN_STEPS) + 1, active.drills.length / CHAIN_STEPS, step + 1, CHAIN_STEPS)
            : `${current + 1} / ${active.drills.length}`}
        </p>
        {answer && (
          <Link to="/positions" state={positionsState} className={styles.positions}>
            {t.trainer.positions}
          </Link>
        )}
        <span className={styles.bar} aria-hidden="true">
          <span style={{ width: `${((current + (answer ? 1 : 0)) / active.drills.length) * 100}%` }} />
        </span>
      </header>

      {isChain && (
        <ol className={styles.steps} aria-label={t.trainer.steps}>
          {POSTFLOP_TYPES.map((stepType, index) => {
            const done = active.answers[current - step + index];
            return (
              <li key={stepType} className={index === step ? styles.stepNow : ''} aria-current={index === step ? 'step' : undefined}>
                <span aria-hidden="true">{done ? (done.correct ? '✓' : '✗') : index + 1}</span>{' '}
                <span className={styles.stepTitle}>{t.drillTitles[stepType]}</span>
              </li>
            );
          })}
        </ol>
      )}

      {situation && <SituationPanel situation={situation} showPot={isChain || potDrill} compact={Boolean(answer)} />}
      {drill.bet && <BetPanel pot={drill.bet.pot} bet={drill.bet.bet} betLabel={drillType === 'alpha' ? t.situation.yourBluff : t.situation.theyBet} />}
      {preflop && (
        <ActionHistory position={preflop.position} heroCards={preflop.heroCards} actions={drill.scenario?.actionHistory} compact={Boolean(answer)} />
      )}

      <h1 ref={promptRef} tabIndex={-1} className={styles.prompt}>
        {prompt}
      </h1>
      {timerSeconds && !answer && <Timer key={drill.id} seconds={timerSeconds} deadline={state.shownAt + timerSeconds * 1000} onExpire={onTimeout} />}

      <div ref={explanationRef} className={styles.explanation}>
        {answer && correctOption && (
          <ExplanationPanel
            explanation={drill.explanation}
            correct={answer.correct}
            answerLabel={optionLabel(t, correctOption)}
            chosenLabel={chosenOption && optionLabel(t, chosenOption)}
            formulaLabel={preflop ? t.trainer.rule : undefined}
          >
            {situation && potDrill && (
              <PotOddsBar
                pot={situation.pot}
                bet={situation.betToCall}
                hitChance={drillType === 'callFold' ? nextCardPercent(situation, drill.explanation.highlightedOuts.length) : undefined}
              />
            )}
            {openSpot && preflop && <HandGrid position={preflop.position} hero={handClass(preflop.heroCards)} />}
          </ExplanationPanel>
        )}
      </div>

      <div className={styles.dock}>
        {answer ? (
          <button type="button" className={`button-primary ${styles.next}`} onClick={next} autoFocus>
            {last ? t.trainer.seeResults : isChain && step === CHAIN_STEPS - 1 ? t.trainer.nextHand : t.trainer.next}
          </button>
        ) : (
          <AnswerButtons key={drill.id} label={prompt} options={drill.options} onAnswer={onAnswer} />
        )}
      </div>
    </main>
  );
}
