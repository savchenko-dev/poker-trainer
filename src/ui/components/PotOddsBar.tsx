import { oddsRatio } from '../../engine/explain';
import { potOdds, toPercent } from '../../engine/odds';
import { useLang } from '../../i18n/LanguageContext';
import styles from './PotOddsBar.module.css';

export function PotOddsBar({ pot, bet, hitChance }: { pot: number; bet: number; hitChance?: number }) {
  const { t } = useLang();
  const need = toPercent(potOdds(bet, pot));
  const scale = Math.max(need, hitChance ?? 0) * 1.5;
  return (
    <figure className={styles.figure}>
      <div className={styles.track} role="img" aria-label={t.potBar.aria(pot, bet, need)}>
        <span className={styles.pot} style={{ flexGrow: pot }} />
        <span className={styles.call} style={{ flexGrow: bet }}>
          {need}%
        </span>
      </div>
      <div className={styles.legend} aria-hidden="true">
        <span><i className={styles.potSwatch} /> {t.potBar.reward(pot)}</span>
        <span><i className={styles.callSwatch} /> {t.potBar.risk(bet)}</span>
        <strong className={styles.ratio}>{oddsRatio(pot, bet)}</strong>
      </div>
      {hitChance !== undefined && (
        <div className={styles.meter} role="img" aria-label={t.potBar.meterAria(hitChance, need)}>
          <span className={styles.meterLabel}>
            {t.potBar.youHit} <strong>{hitChance}%</strong>
          </span>
          <span className={styles.meterTrack}>
            <span className={hitChance >= need ? styles.good : styles.bad} style={{ width: `${(hitChance / scale) * 100}%` }} />
            <i className={styles.tick} style={{ left: `${(need / scale) * 100}%` }}>
              <span>{t.potBar.need(need)}</span>
            </i>
          </span>
        </div>
      )}
    </figure>
  );
}
