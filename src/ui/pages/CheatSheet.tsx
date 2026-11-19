import { Link } from 'react-router-dom';
import { commonDraws } from '../../content/cheatSheet';
import { alphaPercent, oddsRatio } from '../../engine/explain';
import { exactHitChance, potOdds, toPercent } from '../../engine/odds';
import { useLang } from '../../i18n/LanguageContext';
import styles from './Reference.module.css';

const BET_SIZES = [
  { fraction: '1/3', size: 1 / 3 },
  { fraction: '1/2', size: 1 / 2 },
  { fraction: '2/3', size: 2 / 3 },
  { fraction: '', size: 1 },
  { fraction: '2×', size: 2 },
];

export function CheatSheet() {
  const { t } = useLang();
  const { cheat } = t;
  return (
    <main id="main" className={`page ${styles.page}`}>
      <header className={styles.header}>
        <Link to="/" className={styles.close} aria-label={t.backHome}>
          ✕
        </Link>
        <h1 className={styles.title}>{cheat.title}</h1>
      </header>

      <section className={styles.section}>
        <h2>{cheat.drawsTitle}</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{cheat.draw}</th>
              <th scope="col">{cheat.outs}</th>
              <th scope="col">{cheat.nextCard}</th>
              <th scope="col">{cheat.byRiver}</th>
            </tr>
          </thead>
          <tbody>
            {commonDraws.map(({ id, outs, hand, board }) => (
              <tr key={id}>
                <th scope="row">
                  {cheat.draws[id]}
                  <small>{cheat.example(hand, board)}</small>
                </th>
                <td>{outs}</td>
                <td>{toPercent(exactHitChance(outs, 47, 1))}%</td>
                <td>{toPercent(exactHitChance(outs, 47, 2))}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.note}>{cheat.drawsNote}</p>
      </section>

      <section className={styles.section}>
        <h2>{cheat.betsTitle}</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{cheat.bet}</th>
              <th scope="col">{cheat.potOdds}</th>
              <th scope="col">{cheat.alpha}</th>
              <th scope="col">{cheat.mdf}</th>
            </tr>
          </thead>
          <tbody>
            {BET_SIZES.map(({ fraction, size }) => (
              <tr key={size}>
                <th scope="row">{cheat.potShare(fraction)}</th>
                <td>
                  {toPercent(potOdds(size, 1 + size))}%<small>{oddsRatio(1 + size, size)}</small>
                </td>
                <td>{alphaPercent(1, size)}%</td>
                <td>{100 - alphaPercent(1, size)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.note}>{cheat.betsNote}</p>
      </section>
    </main>
  );
}
