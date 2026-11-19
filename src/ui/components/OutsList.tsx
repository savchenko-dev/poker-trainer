import type { Card } from '../../engine/types';
import { useLang } from '../../i18n/LanguageContext';
import { PlayingCard } from './PlayingCard';
import styles from './Board.module.css';

export function OutsList({ cards }: { cards: Card[] }) {
  const { t } = useLang();
  return (
    <ul className={styles.row} aria-label={t.explanation.outsAria(cards.length)} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {cards.map((card) => (
        <li key={card.rank + card.suit}>
          <PlayingCard card={card} size="sm" />
        </li>
      ))}
    </ul>
  );
}
