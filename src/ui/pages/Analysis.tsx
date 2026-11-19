import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { analyzeHands, tips } from '../../engine/handRecord';
import { useLang } from '../../i18n/LanguageContext';
import { useHands } from '../../state/HandsContext';
import { PotOddsBar } from '../components/PotOddsBar';
import { formatBb, HandSummary } from './Hands';
import reference from './Reference.module.css';
import styles from './Analysis.module.css';

function Section({ title, empty, children }: { title: string; empty: string | null; children: ReactNode }) {
  return (
    <section className={reference.section}>
      <h2>{title}</h2>
      {empty ? <p className={reference.note}>{empty}</p> : children}
    </section>
  );
}

export function Analysis() {
  const { t } = useLang();
  const { analysis: a } = t;
  const { hands } = useHands();
  const analysis = useMemo(() => analyzeHands(hands), [hands]);
  const advice = tips(analysis);
  const { preflopChecked, preflopMismatches, callsChecked, potOddsMistakes, byPosition } = analysis;

  return (
    <main id="main" className={`page ${styles.page}`}>
      <header className={reference.header}>
        <Link to="/hands" className={reference.close} aria-label={t.record.back}>
          ✕
        </Link>
        <h1 className={reference.title}>{a.title}</h1>
      </header>

      <Section title={a.tips} empty={advice.length ? null : a.tipsEmpty}>
        <ul className={styles.tips}>
          {advice.map((tip) => (
            <li key={tip.key + ('position' in tip ? tip.position : '')}>{t.tip(tip)}</li>
          ))}
        </ul>
      </Section>

      <Section
        title={a.preflopTitle}
        empty={preflopChecked === 0 ? a.preflopEmpty : null}
      >
        <p className={reference.note}>
          {a.preflopSummary(preflopChecked, preflopMismatches.length)}
        </p>
        <ul className={styles.list}>
          {preflopMismatches.map(({ record, kind, hand }) => (
            <li key={record.id}>
              <HandSummary record={record} />
              <p className={styles.handNote}>
                {a[kind](hand, record.position)}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title={a.callsTitle}
        empty={callsChecked === 0 ? a.callsEmpty : null}
      >
        <p className={reference.note}>
          {a.callsSummary(callsChecked, potOddsMistakes.length)}
        </p>
        <ul className={styles.list}>
          {potOddsMistakes.map(({ record, street, drawKind, outs, hitPercent }) => {
            const entry = record.streets[street]!;
            return (
              <li key={record.id + street}>
                <HandSummary record={record} />
                <p className={styles.handNote}>
                  {a.mistake(drawKind, street, outs)}
                </p>
                <PotOddsBar pot={entry.pot + entry.bet} bet={entry.bet} hitChance={hitPercent} />
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title={a.byPosition} empty={byPosition.length ? null : a.byPositionEmpty}>
        <table className={reference.table}>
          <thead>
            <tr>
              <th scope="col">{a.seat}</th>
              <th scope="col">{a.hands}</th>
              <th scope="col">{a.net}</th>
            </tr>
          </thead>
          <tbody>
            {byPosition.map(({ position, hands: count, netBb }) => (
              <tr key={position}>
                <th scope="row">{position}</th>
                <td>{count}</td>
                <td className={netBb > 0 ? styles.won : netBb < 0 ? styles.lost : ''}>{formatBb(netBb, t.bb)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </main>
  );
}
