import type { ReactNode } from 'react';
import type { Explanation } from '../../engine/types';
import { formatExplanation } from '../../i18n/format';
import { useLang } from '../../i18n/LanguageContext';
import { OutsList } from './OutsList';
import styles from './ExplanationPanel.module.css';

interface ExplanationPanelProps {
  explanation: Explanation;
  correct: boolean;
  answerLabel: string;
  chosenLabel?: string;
  formulaLabel?: string;
  children?: ReactNode;
}

export function ExplanationPanel({ explanation, correct, answerLabel, chosenLabel, formulaLabel, children }: ExplanationPanelProps) {
  const { t } = useLang();
  const { formula, numbers, result, text, rule } = formatExplanation(t, explanation);
  const ruleOfThumb = explanation.key === 'hitChance' && rule ? { label: rule, estimate: explanation.params.estimate, exact: explanation.params.exact } : null;
  return (
    <section className={styles.panel} aria-label={t.explanation.aria}>
      <p className={`${styles.verdict} ${correct ? styles.ok : styles.miss}`} aria-live="polite">
        <span className={styles.icon} aria-hidden="true">{correct ? '✓' : '✗'}</span>
        {correct
          ? t.explanation.correct(answerLabel)
          : chosenLabel
            ? t.explanation.wrong(chosenLabel, answerLabel)
            : t.explanation.timeout(answerLabel)}
      </p>
      {children}
      {explanation.highlightedOuts.length > 0 && <OutsList cards={explanation.highlightedOuts} />}
      {ruleOfThumb && (
        <div className={styles.compare}>
          <div>
            <span>{t.explanation.quickEstimate}</span>
            <strong>{ruleOfThumb.estimate}%</strong>
            <small>{ruleOfThumb.label}</small>
          </div>
          <div>
            <span>{t.explanation.exact}</span>
            <strong>{ruleOfThumb.exact}%</strong>
            <small>{numbers}</small>
          </div>
        </div>
      )}
      {formula && (
        <dl className={styles.math}>
          <dt>{formulaLabel ?? t.explanation.formula}</dt>
          <dd>{formula}</dd>
          {!ruleOfThumb && (
            <>
              <dt>{t.explanation.numbers}</dt>
              <dd>{numbers}</dd>
              <dt>{t.explanation.result}</dt>
              <dd className={styles.result}>{result}</dd>
            </>
          )}
        </dl>
      )}
      <p className={styles.text}>{text}</p>
    </section>
  );
}
