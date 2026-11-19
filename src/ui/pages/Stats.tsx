import { Link } from 'react-router-dom';
import { DRILL_TYPES } from '../../engine/types';
import { currentStreak } from '../../engine/stats';
import { useLang } from '../../i18n/LanguageContext';
import { useStats } from '../../state/StatsContext';
import styles from './Reference.module.css';

export function Stats() {
  const { t } = useLang();
  const { stats } = useStats();
  const streak = currentStreak(stats.sessionDays, new Date());
  return (
    <main id="main" className={`page ${styles.page}`}>
      <header className={styles.header}>
        <Link to="/" className={styles.close} aria-label={t.backHome}>
          ✕
        </Link>
        <h1 className={styles.title}>{t.stats.title}</h1>
      </header>
      <p className={styles.note}>
        {t.stats.note(streak)}
      </p>
      {DRILL_TYPES.map((type) => {
        const { attempts, correct, recentResults, level } = stats.byType[type];
        const hits = recentResults.filter(Boolean).length;
        return (
          <section key={type} className={styles.card} aria-label={t.drillTitles[type]}>
            <div className={styles.row}>
              <strong>{t.drillTitles[type]}</strong>
              <span className={styles.level}>{t.stats.level(level)}</span>
            </div>
            <div className={styles.row}>
              <span>{t.stats.answered(attempts)}</span>
              <span>{t.stats.correct(attempts ? Math.round((correct / attempts) * 100) : 0)}</span>
            </div>
            {recentResults.length > 0 && (
              <div className={styles.recent} role="img" aria-label={t.stats.recentAria(hits, recentResults.length)}>
                {recentResults.map((ok, index) => (
                  <span key={index} className={ok ? styles.hit : styles.miss} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}
