import { useRef, useState, type KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { POSITIONS } from '../../engine/handClass';
import type { Position } from '../../engine/types';
import { useLang } from '../../i18n/LanguageContext';
import { HandGrid } from '../components/HandGrid';
import styles from './Positions.module.css';

export interface PositionsState { from?: string; position?: Position }

export function Positions() {
  const { t } = useLang();
  const state = (useLocation().state ?? {}) as PositionsState;
  const [seat, setSeat] = useState<Position>(state.position ?? 'UTG');
  const back = state.from ?? '/';
  const backLabel = back.startsWith('/train') ? t.positions.backToDrill : t.positions.back;
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const onTabKey = (event: KeyboardEvent) => {
    const index = POSITIONS.indexOf(seat);
    const target = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: POSITIONS.length - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = (target + POSITIONS.length) % POSITIONS.length;
    setSeat(POSITIONS[next]!);
    tabs.current[next]?.focus();
  };

  return (
    <main id="main" className={`page ${styles.page}`}>
      <header className={styles.header}>
        <Link to={back} className={styles.close} aria-label={backLabel}>
          ✕
        </Link>
        <h1 className={styles.title}>{t.positions.title}</h1>
      </header>

      <div role="tablist" aria-label={t.positions.seat} className={styles.tabs} onKeyDown={onTabKey}>
        {POSITIONS.map((position, index) => (
          <button
            key={position}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`tab-${position}`}
            aria-selected={position === seat}
            tabIndex={position === seat ? 0 : -1}
            aria-controls="seat-panel"
            className={styles.tab}
            onClick={() => setSeat(position)}
          >
            {position}
          </button>
        ))}
      </div>

      <section id="seat-panel" role="tabpanel" aria-labelledby={`tab-${seat}`} className={styles.panel}>
        <p className={styles.note}>{t.positionNote(seat)}</p>
        <HandGrid key={seat} position={seat} />
      </section>

      {state.from && (
        <div className="bottom-bar">
          <Link to={back} className="button-primary">
            {backLabel}
          </Link>
        </div>
      )}
    </main>
  );
}
