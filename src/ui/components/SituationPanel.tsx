import type { Situation } from '../../engine/types';
import { useLang } from '../../i18n/LanguageContext';
import { Board } from './Board';
import styles from './SituationPanel.module.css';

export function SituationPanel({ situation, showPot, compact }: { situation: Situation; showPot: boolean; compact: boolean }) {
  const { t } = useLang();
  return (
    <section className={`${styles.panel} ${compact ? styles.compact : ''}`} aria-label={t.situation.aria}>
      <span className={styles.street}>{situation.street === 'flop' ? t.situation.flop : t.situation.turn}</span>
      <Board heroCards={situation.heroCards} board={situation.board} size={compact ? 'sm' : 'fit'} />
      {showPot && <PotChips pot={situation.pot} bet={situation.betToCall} betLabel={t.situation.toCall} />}
    </section>
  );
}

function PotChips({ pot, bet, betLabel }: { pot: number; bet: number; betLabel: string }) {
  const { t } = useLang();
  return (
    <dl className={styles.chips}>
      <div className={styles.chip}>
        <dt>{t.situation.pot}</dt>
        <dd>{pot}</dd>
      </div>
      <div className={`${styles.chip} ${styles.call}`}>
        <dt>{betLabel}</dt>
        <dd>{bet}</dd>
      </div>
    </dl>
  );
}

export function BetPanel(props: { pot: number; bet: number; betLabel: string }) {
  const { t } = useLang();
  return (
    <section className={styles.panel} aria-label={t.situation.aria}>
      <PotChips {...props} />
    </section>
  );
}
