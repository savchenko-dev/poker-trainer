import type { Card } from '../../engine/types';
import { useLang } from '../../i18n/LanguageContext';
import { PlayingCard, type CardSize } from './PlayingCard';
import styles from './Board.module.css';

interface BoardProps {
  heroCards: Card[];
  board: Card[];
  size: CardSize;
}

export function Board({ heroCards, board, size }: BoardProps) {
  const { t } = useLang();
  return (
    <div className={styles.board}>
      <CardRow title={t.situation.yourHand} cards={heroCards} size={size} />
      <CardRow title={t.situation.board} cards={board} size={size} />
    </div>
  );
}

function CardRow({ title, cards, size }: { title: string; cards: Card[]; size: CardSize }) {
  return (
    <section className={styles.group} aria-label={title}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.row}>
        {cards.map((card) => (
          <PlayingCard key={card.rank + card.suit} card={card} size={size} />
        ))}
      </div>
    </section>
  );
}
