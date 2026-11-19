import { use } from 'react';
import { rankChar } from '../../engine/cards';
import type { Card, Suit } from '../../engine/types';
import { useLang } from '../../i18n/LanguageContext';
import { SettingsContext } from '../../state/SettingsContext';
import styles from './PlayingCard.module.css';

const SUIT_GLYPHS: Record<Suit, string> = { s: '♠︎', h: '♥︎', d: '♦︎', c: '♣︎' };

function suitColor(suit: Suit, fourColor: boolean): string {
  if (suit === 'h') return 'var(--suit-red)';
  if (suit === 's') return 'var(--suit-black)';
  if (!fourColor) return suit === 'd' ? 'var(--suit-red)' : 'var(--suit-black)';
  return suit === 'd' ? 'var(--suit-blue)' : 'var(--suit-green)';
}

export type CardSize = 'sm' | 'fit';

export function PlayingCard({ card, size }: { card: Card; size: CardSize }) {
  const settings = use(SettingsContext);
  const { t } = useLang();
  const rank = card.rank === 10 ? '10' : rankChar(card.rank);
  const glyph = SUIT_GLYPHS[card.suit];
  return (
    <svg
      className={`${styles.card} ${styles[size]}`}
      viewBox="0 0 100 140"
      role="img"
      aria-label={t.cardName(card)}
      fill={suitColor(card.suit, settings?.fourColor ?? false)}
    >
      <rect x="1.5" y="1.5" width="97" height="137" rx="9" className={styles.face} />
      <text x="9" y="34" className={styles.rank} textLength={rank.length > 1 ? 36 : undefined}>{rank}</text>
      <text x="10" y="60" className={styles.cornerSuit}>{glyph}</text>
      <text x="50" y="112" textAnchor="middle" className={styles.pip}>{glyph}</text>
    </svg>
  );
}
