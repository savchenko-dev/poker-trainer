import { Link, Navigate } from 'react-router-dom';
import { BLUFF_TYPES } from '../../engine/drills';
import { POSTFLOP_TYPES } from '../../engine/types';
import { currentStreak } from '../../engine/stats';
import { useLang } from '../../i18n/LanguageContext';
import { useSession } from '../../state/SessionContext';
import { useSettings } from '../../state/SettingsContext';
import { useStats } from '../../state/StatsContext';
import { CHAIN_HANDS, type TrainerKey } from '../../state/sessionReducer';
import styles from './Home.module.css';

const MATH_TYPES = [...POSTFLOP_TYPES, ...BLUFF_TYPES];

export function Home() {
  const { t } = useLang();
  const { home } = t;
  const preflop: { key: TrainerKey; title: string; blurb: string }[] = [
    { key: 'preflopOpen', title: t.drillTitles.preflopOpen, blurb: home.blurbs.preflopOpen },
    { key: 'scenario', title: home.scenariosTitle, blurb: home.blurbs.scenario },
    { key: 'mixed', title: home.mixedTitle, blurb: home.mixedBlurb },
  ];
  const more = [
    { to: '/hands', title: home.handsTitle, blurb: home.handsBlurb },
    { to: '/stats', title: home.statsTitle, blurb: home.statsBlurb },
    { to: '/cheatsheet', title: home.cheatTitle, blurb: home.cheatBlurb },
    { to: '/settings', title: home.settingsTitle, blurb: home.settingsBlurb },
  ];
  const { dispatch } = useSession();
  const { stats, levels } = useStats();
  const { onboardingSeen } = useSettings();
  if (!onboardingSeen) return <Navigate to="/welcome" replace />;
  const start = (key: TrainerKey) => () => dispatch({ type: 'start', key, now: Date.now(), levels });
  const streak = currentStreak(stats.sessionDays, new Date());
  return (
    <main id="main" className={`page ${styles.home}`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{home.title}</h1>
          <p className={styles.lead}>{home.lead}</p>
        </div>
        <Link to="/stats" className={styles.streak} aria-label={home.streakAria(streak)}>
          <strong>{streak}</strong>
          <span>{home.streakUnit(streak)}</span>
        </Link>
      </header>

      <Link to="/train/chain" className={styles.hero} onClick={start('chain')}>
        <span className={styles.badge}>{home.badge}</span>
        <strong className={styles.heroTitle}>{home.heroTitle}</strong>
        <ol className={styles.flow}>
          {POSTFLOP_TYPES.map((type) => (
            <li key={type}>{t.drillTitles[type]}</li>
          ))}
        </ol>
        <span>{home.heroText(CHAIN_HANDS)}</span>
        <span className={`button-primary ${styles.cta}`}>{home.play}</span>
      </Link>

      <section>
        <h2 className={styles.section}>{home.math}</h2>
        <ul className={styles.grid}>
          {MATH_TYPES.map((type, index) => (
            <li key={type}>
              <Link to={`/train/${type}`} className={styles.card} onClick={start(type)}>
                <span className={styles.number} aria-hidden="true">{index + 1}</span>
                <strong>{t.drillTitles[type]}</strong>
                <span>{home.blurbs[type]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className={styles.section}>{home.preflop}</h2>
        <ul className={styles.grid}>
          {preflop.map(({ key, title, blurb }) => (
            <li key={key}>
              <Link to={`/train/${key}`} className={styles.card} onClick={start(key)}>
                <strong>{title}</strong>
                <span>{blurb}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link to="/positions" className={styles.card}>
              <strong>{home.positionsTitle}</strong>
              <span>{home.positionsBlurb}</span>
            </Link>
          </li>
        </ul>
      </section>

      <section>
        <h2 className={styles.section}>{home.more}</h2>
        <ul className={styles.grid}>
          {more.map(({ to, title, blurb }) => (
            <li key={to}>
              <Link to={to} className={styles.card}>
                <strong>{title}</strong>
                <span>{blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
