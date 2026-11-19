import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { AnswerOption } from '../../engine/types';
import { optionLabel } from '../../i18n/format';
import { useLang } from '../../i18n/LanguageContext';
import styles from './AnswerButtons.module.css';

interface AnswerButtonsProps {
  label: string;
  options: AnswerOption[];
  onAnswer: (optionId: string) => void;
}

export function AnswerButtons({ label, options, onAnswer }: AnswerButtonsProps) {
  const { t } = useLang();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const onDigit = (event: globalThis.KeyboardEvent) => {
      const option = options[Number(event.key) - 1];
      if (!option || event.metaKey || event.ctrlKey || event.altKey) return;
      event.preventDefault();
      onAnswer(option.id);
    };
    window.addEventListener('keydown', onDigit);
    return () => window.removeEventListener('keydown', onDigit);
  }, [options, onAnswer]);

  function onKeyDown(event: KeyboardEvent) {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const focused = buttons.current.findIndex((button) => button === document.activeElement);
    buttons.current[(Math.max(0, focused) + step + options.length) % options.length]?.focus();
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={styles.group}
      style={{ gridTemplateColumns: `repeat(${options.length === 4 ? 2 : options.length}, 1fr)` }}
      onKeyDown={onKeyDown}
    >
      {options.map((option, index) => (
        <button
          key={option.id}
          ref={(element) => {
            buttons.current[index] = element;
          }}
          type="button"
          className={styles.option}
          onClick={() => onAnswer(option.id)}
        >
          <span className={styles.key} aria-hidden="true">{index + 1}</span>
          <span className={styles.label}>{optionLabel(t, option)}</span>
        </button>
      ))}
    </div>
  );
}
