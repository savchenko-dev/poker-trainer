import { POSITIONS } from '../../engine/handClass';
import { useLang } from '../../i18n/LanguageContext';
import type { Card, Position } from '../../engine/types';
import { PlayingCard } from './PlayingCard';
import styles from './ActionHistory.module.css';

interface ActionHistoryProps {
  position: Position;
  heroCards: [Card, Card];
  actions?: readonly string[];
  compact?: boolean;
}

export function ActionHistory({ position, heroCards, actions, compact }: ActionHistoryProps) {
  const { t } = useLang();
  const lines = actions ?? POSITIONS.slice(0, POSITIONS.indexOf(position)).map((seat) => `${seat} folds`);
  const glossAt = lines.findIndex((line) => /\dbb/.test(line));
  return (
    <section className={styles.panel} aria-label={t.situation.aria}>
      <div className={styles.hand}>
        {heroCards.map((card) => (
          <PlayingCard key={card.rank + card.suit} card={card} size={compact ? 'sm' : 'fit'} />
        ))}
      </div>
      <ol className={styles.seats} aria-label={t.history.aria}>
        {lines.map((line, index) => {
          const [seat, verb, size = ''] = line.split(' ');
          const amount = size.replace('bb', '');
          return (
            <li key={index} className={verb === 'folds' ? styles.fold : ''}>
              <b>{seat}</b>{' '}
              {verb === 'folds' ? t.history.fold : verb === 'raises' ? t.history.raise(amount, index === glossAt) : t.history.call(amount, index === glossAt)}
            </li>
          );
        })}
        <li className={styles.hero} aria-current="true">
          <b>{position}</b> {t.history.you}
        </li>
      </ol>
    </section>
  );
}
