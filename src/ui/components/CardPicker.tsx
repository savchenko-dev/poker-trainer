import { use, useState } from 'react';
import { rankChar, sameCard, SUITS } from '../../engine/cards';
import type { Card, Rank, Suit } from '../../engine/types';
import { useLang } from '../../i18n/LanguageContext';
import { SettingsContext } from '../../state/SettingsContext';
import { PlayingCard } from './PlayingCard';
import styles from './CardPicker.module.css';

const RANKS_DESC = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2] as Rank[];
const SUIT_GLYPHS: Record<Suit, string> = { s: '♠︎', h: '♥︎', d: '♦︎', c: '♣︎' };
const rankLabel = (rank: Rank) => (rank === 10 ? '10' : rankChar(rank));

interface CardPickerProps {
  label: string;
  cards: Card[];
  max: number;
  used: Card[];
  onChange: (cards: Card[]) => void;
  disabled?: boolean;
}

export function CardPicker({ label, cards, max, used, onChange, disabled }: CardPickerProps) {
  const { t } = useLang();
  const [rank, setRank] = useState<Rank | null>(null);
  const fourColor = use(SettingsContext)?.fourColor;
  const taken = (card: Card) => [...used, ...cards].some((other) => sameCard(other, card));
  const full = cards.length >= max;

  const pickSuit = (suit: Suit) => {
    if (rank === null) return;
    onChange([...cards, { rank, suit }]);
    setRank(null);
  };

  return (
    <fieldset className={`${styles.picker} ${fourColor ? styles.four : ''}`} disabled={disabled}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.slots}>
        {Array.from({ length: max }, (_, index) => {
          const card = cards[index];
          return card ? (
            <button
              key={index}
              type="button"
              className={styles.slot}
              aria-label={t.removeCard(t.cardName(card))}
              onClick={() => onChange(cards.filter((_, other) => other !== index))}
            >
              <PlayingCard card={card} size="sm" />
            </button>
          ) : (
            <span key={index} className={`${styles.slot} ${styles.empty}`} aria-hidden="true" />
          );
        })}
      </div>
      {!full &&
        (rank === null ? (
          <div className={styles.ranks}>
            {RANKS_DESC.map((r) => (
              <button
                key={r}
                type="button"
                className={styles.key}
                aria-pressed={false}
                disabled={SUITS.every((suit) => taken({ rank: r, suit }))}
                onClick={() => setRank(r)}
              >
                {rankLabel(r)}
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.suits}>
            <button type="button" className={`${styles.key} ${styles.active}`} aria-pressed onClick={() => setRank(null)}>
              {rankLabel(rank)}
            </button>
            {SUITS.map((suit) => (
              <button
                key={suit}
                type="button"
                className={`${styles.key} ${styles[suit]}`}
                aria-label={t.suitNames[suit]}
                disabled={taken({ rank, suit })}
                onClick={() => pickSuit(suit)}
              >
                {SUIT_GLYPHS[suit]}
              </button>
            ))}
          </div>
        ))}
    </fieldset>
  );
}
