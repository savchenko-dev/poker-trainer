import { Link, Navigate } from 'react-router-dom';
import { formatExplanation, formatPrompt, optionLabel } from '../../i18n/format';
import { useLang } from '../../i18n/LanguageContext';
import { useSession } from '../../state/SessionContext';
import { useStats } from '../../state/StatsContext';
import { CHAIN_STEPS, sessionKey } from '../../state/sessionReducer';
import styles from './SessionEnd.module.css';

function seconds(ms: number, unit: string): string {
  return `${(ms / 1000).toFixed(1)}\u00a0${unit}`;
}

function minutes(ms: number): string {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function SessionEnd() {
  const { t } = useLang();
  const { state, dispatch } = useSession();
  const { levels } = useStats();
  const { session } = state;
  const key = session && sessionKey(session);
  if (!session?.finishedAt || !key) return <Navigate to="/" replace />;

  const score = session.answers.filter((answer) => answer.correct).length;
  const chain = session.mode === 'stepChain';

  return (
    <main id="main" className={`page ${styles.end}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.sessionEnd.title}</h1>
        <nav className={styles.links} aria-label={t.sessionEnd.leave}>
          <Link to="/positions" state={{ from: '/session/end' }} className={styles.link}>
            {t.positions.title}
          </Link>
          <Link to="/" className={styles.link}>
            {t.sessionEnd.home}
          </Link>
        </nav>
      </header>
      <div className={styles.stats}>
        <div>
          <strong>
            {score} / {session.drills.length}
          </strong>
          <span>{t.sessionEnd.correct}</span>
        </div>
        <div>
          <strong>{minutes(session.finishedAt - session.startedAt)}</strong>
          <span>{t.sessionEnd.totalTime}</span>
        </div>
      </div>

      <ol className={styles.review}>
        {session.drills.map((drill, index) => {
          const answer = session.answers[index];
          const chosen = drill.options.find((option) => option.id === answer?.chosenOptionId);
          const correct = drill.options.find((option) => option.isCorrect);
          const title = t.drillTitles[drill.type];
          const why = formatExplanation(t, drill.explanation);
          return (
            <li key={drill.id} className={answer?.correct ? styles.ok : styles.miss}>
              <span className={styles.icon} aria-hidden="true">{answer?.correct ? '✓' : '✗'}</span>
              <div>
                <strong>
                  {chain ? t.sessionEnd.chainItem(Math.floor(index / CHAIN_STEPS) + 1, title) : `${index + 1}. ${title}`}
                  <span className={styles.sr}>{answer?.correct ? t.sessionEnd.srCorrect : t.sessionEnd.srWrong}</span>
                </strong>
                <p>{formatPrompt(t, drill.prompt)}</p>
                <p className={styles.answers}>
                  {t.sessionEnd.yourAnswer} <b>{chosen ? optionLabel(t, chosen) : '—'}</b>
                  {!answer?.correct && (
                    <>
                      {' '}· {t.sessionEnd.correctAnswer} <b>{correct && optionLabel(t, correct)}</b>
                    </>
                  )}
                  {answer && ` · ${seconds(answer.timeMs, t.sessionEnd.seconds)}`}
                </p>
                <details className={styles.why}>
                  <summary>{t.sessionEnd.why}</summary>
                  {why.formula && (
                    <p>
                      {why.formula} · <b>{why.result}</b>
                    </p>
                  )}
                  <p>{why.text}</p>
                </details>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="bottom-bar">
        <Link to={`/train/${key}`} className="button-primary" onClick={() => dispatch({ type: 'start', key, now: Date.now(), levels })}>
          {t.sessionEnd.playAgain}
        </Link>
      </div>
    </main>
  );
}
