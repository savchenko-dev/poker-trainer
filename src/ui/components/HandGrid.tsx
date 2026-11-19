import { useState } from 'react';
import { RANK_ORDER } from '../../content/openingRanges';
import { cellLabel, isRaise, type HandClass } from '../../engine/handClass';
import type { Position } from '../../engine/types';
import { useLang } from '../../i18n/LanguageContext';
import styles from './HandGrid.module.css';

const INDEXES = Array.from({ length: 13 }, (_, index) => index);

export function HandGrid({ position, hero }: { position: Position; hero?: HandClass }) {
  const { t } = useLang();
  const [picked, setPicked] = useState<[number, number] | null>(null);
  const [row, col] = picked ?? (hero ? [hero.row, hero.col] : [-1, -1]);
  const label = row >= 0 ? cellLabel(row, col) : null;
  const play = position === 'BB' ? t.grid.continue : t.grid.raise;

  return (
    <figure className={styles.figure}>
      <table className={styles.grid}>
        <caption className={styles.caption}>
          {t.grid.caption(position)}
        </caption>
        <thead>
          <tr>
            <td />
            {INDEXES.map((c) => (
              <th key={c} scope="col">{RANK_ORDER.charAt(c)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {INDEXES.map((r) => (
            <tr key={r}>
              <th scope="row">{RANK_ORDER.charAt(r)}</th>
              {INDEXES.map((c) => {
                const raise = isRaise(position, r, c);
                const isHero = hero?.row === r && hero.col === c;
                return (
                  <td key={c}>
                    <button
                      type="button"
                      className={`${styles.cell} ${raise ? styles.raise : ''} ${isHero ? styles.hero : ''} ${r === row && c === col ? styles.picked : ''}`}
                      aria-label={`${cellLabel(r, c)}, ${(raise ? play : t.grid.fold).toLowerCase()}${isHero ? `, ${t.grid.yourHand}` : ''}`}
                      onClick={() => setPicked([r, c])}
                    >
                      {cellLabel(r, c)}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className={styles.readout} aria-live="polite">
        {label ? (
          <>
            <strong>{label}</strong> {isRaise(position, row, col) ? play : t.grid.fold}
            {hero && row === hero.row && col === hero.col && ` · ${t.grid.yourHand}`}
          </>
        ) : (
          t.grid.tap
        )}
        <span className={styles.legend}>
          <i className={styles.raise} /> {play} <i /> {t.grid.fold}
        </span>
      </figcaption>
    </figure>
  );
}
