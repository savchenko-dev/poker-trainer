import { useEffect, useState } from 'react';
import { useLang } from '../../i18n/LanguageContext';
import styles from './Timer.module.css';

function secondsLeft(deadline: number, seconds: number): number {
  return Math.min(seconds, Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
}

export function Timer({ seconds, deadline, onExpire }: { seconds: number; deadline: number; onExpire: () => void }) {
  const { t } = useLang();
  const [left, setLeft] = useState(() => secondsLeft(deadline, seconds));

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = secondsLeft(deadline, seconds);
      setLeft(remaining);
      if (remaining === 0) {
        clearInterval(id);
        onExpire();
      }
    }, 250);
    return () => clearInterval(id);
  }, [seconds, deadline, onExpire]);

  return (
    <div className={`${styles.timer} ${left <= 5 ? styles.low : ''}`} role="timer" aria-label={t.timer.aria(left)}>
      <span className={styles.track} aria-hidden="true">
        <span style={{ width: `${(left / seconds) * 100}%` }} />
      </span>
      <strong aria-hidden="true">{t.timer.short(left)}</strong>
    </div>
  );
}
