import { useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { HandRecord } from '../../engine/handRecord';
import { useLang } from '../../i18n/LanguageContext';
import { useHands } from '../../state/HandsContext';
import { PlayingCard } from '../components/PlayingCard';
import reference from './Reference.module.css';
import styles from './Analysis.module.css';

export function formatBb(value: number, unit: string): string {
  return `${value > 0 ? '+' : ''}${value} ${unit}`;
}

export function HandSummary({ record, children }: { record: HandRecord; children?: ReactNode }) {
  const { t, lang } = useLang();
  const tone = record.resultBb > 0 ? styles.won : record.resultBb < 0 ? styles.lost : '';
  return (
    <div className={styles.hand}>
      <div className={styles.cards}>
        {record.heroCards.map((card) => (
          <PlayingCard key={card.rank + card.suit} card={card} size="sm" />
        ))}
      </div>
      <div className={styles.meta}>
        <strong>{record.position}</strong>
        <span>{new Date(record.date).toLocaleString(lang, { dateStyle: 'short', timeStyle: 'short' })}</span>
      </div>
      <span className={`${styles.result} ${tone}`}>{formatBb(record.resultBb, t.bb)}</span>
      {children}
    </div>
  );
}

export function Hands() {
  const { t } = useLang();
  const { hands, remove, exportFile, importFile } = useHands();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const added = await importFile(file);
      setMessage(t.hands.imported(added));
    } catch {
      setMessage(t.hands.badFile);
    }
  };

  return (
    <main id="main" className={`page ${styles.page}`}>
      <header className={reference.header}>
        <Link to="/" className={reference.close} aria-label={t.backHome}>
          ✕
        </Link>
        <h1 className={reference.title}>{t.hands.title}</h1>
      </header>

      <div className={styles.tools}>
        <Link to="/hands/analysis" className={reference.action}>
          {t.hands.analysis}
        </Link>
        <button type="button" className={reference.action} onClick={exportFile} disabled={hands.length === 0}>
          {t.hands.export}
        </button>
        <button type="button" className={reference.action} onClick={() => fileInput.current?.click()}>
          {t.hands.import}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            void onImport(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </div>
      {message && (
        <p className={reference.note} role="status">
          {message}
        </p>
      )}

      {hands.length === 0 ? (
        <p className={reference.note}>{t.hands.empty}</p>
      ) : (
        <ul className={styles.list}>
          {hands.map((record) => (
            <li key={record.id}>
              <HandSummary record={record}>
                <button
                  type="button"
                  className={styles.delete}
                  aria-label={t.hands.deleteAria(record.position)}
                  onClick={() => window.confirm(t.hands.confirmDelete) && remove(record.id)}
                >
                  ✕
                </button>
              </HandSummary>
              {record.note && <p className={styles.handNote}>{record.note}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="bottom-bar">
        <Link to="/hands/new" className="button-primary">
          {t.hands.record}
        </Link>
      </div>
    </main>
  );
}
