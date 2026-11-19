import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseCard } from '../../engine/cards';
import { exactHitChance, toPercent } from '../../engine/odds';
import { useLang } from '../../i18n/LanguageContext';
import { useSettings } from '../../state/SettingsContext';
import { Board } from '../components/Board';
import { PotOddsBar } from '../components/PotOddsBar';
import styles from './Onboarding.module.css';

const HERO = ['Ah', '5h'].map((text) => parseCard(text)!);
const BOARD = ['Kh', '9h', '2s'].map((text) => parseCard(text)!);

export function Onboarding() {
  const { t } = useLang();
  const { onboarding } = t;
  const SCREENS = [
    { title: onboarding.outsTitle, text: onboarding.outsText, picture: <Board heroCards={HERO} board={BOARD} size="fit" /> },
    {
      title: onboarding.hitTitle,
      text: onboarding.hitText(toPercent(exactHitChance(9, 47, 1)), toPercent(exactHitChance(9, 47, 2))),
      picture: <p className={styles.big}>9 × 2 ≈ 18% · 9 × 4 ≈ 36%</p>,
    },
    { title: onboarding.oddsTitle, text: onboarding.oddsText, picture: <PotOddsBar pot={30} bet={10} /> },
  ];
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const { setOnboardingSeen } = useSettings();
  const finish = () => {
    setOnboardingSeen(true);
    navigate('/', { replace: true });
  };
  const screen = SCREENS[index]!;
  const last = index === SCREENS.length - 1;

  return (
    <main id="main" className={`page ${styles.page}`}>
      <header className={styles.header}>
        <span className={styles.dots} role="img" aria-label={onboarding.screenOf(index + 1, SCREENS.length)}>
          {SCREENS.map((item, dot) => (
            <i key={item.title} className={dot === index ? styles.now : ''} />
          ))}
        </span>
        <button type="button" className={styles.skip} onClick={finish}>
          {onboarding.skip}
        </button>
      </header>
      <h1 className={styles.title}>{screen.title}</h1>
      <div className={styles.picture}>{screen.picture}</div>
      <p className={styles.text}>{screen.text}</p>
      <div className="bottom-bar">
        <button type="button" className="button-primary" onClick={last ? finish : () => setIndex(index + 1)} autoFocus>
          {last ? onboarding.start : onboarding.next}
        </button>
      </div>
    </main>
  );
}
