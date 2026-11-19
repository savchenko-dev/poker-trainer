import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useLang, type Lang } from '../../i18n/LanguageContext';
import { useHands } from '../../state/HandsContext';
import { isValidPhrase, normalizePhrase } from '../../state/identity';
import { useSettings } from '../../state/SettingsContext';
import { useStats } from '../../state/StatsContext';
import { linkPhrase, useSyncState } from '../../state/sync';
import styles from './Reference.module.css';

const LANGUAGES: { lang: Lang; name: string }[] = [
  { lang: 'en', name: 'English' },
  { lang: 'ru', name: 'Русский' },
];

function Account() {
  const { t } = useLang();
  const { phrase, lastSyncAt, lastError, pending } = useSyncState();
  const [shown, setShown] = useState(false);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const copy = async () => {
    if (!phrase) return;
    try {
      await navigator.clipboard.writeText(phrase);
      setCopyNote(t.account.copied);
    } catch {
      setShown(true);
      setCopyNote(t.account.copyFailed);
    }
  };

  const link = (event: FormEvent) => {
    event.preventDefault();
    if (!isValidPhrase(input)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    if (normalizePhrase(input) === phrase || !window.confirm(t.account.confirmLink)) return;
    setInput('');
    void linkPhrase(input);
  };

  const offline = lastError !== null || !navigator.onLine;
  const status = [
    offline ? t.account.offline : lastSyncAt === null ? t.account.never : t.account.synced(Math.max(0, Math.floor((now - lastSyncAt) / 60_000))),
    ...(pending > 0 ? [t.account.pending(pending)] : []),
  ].join(' · ');

  return (
    <section className={styles.section} aria-labelledby="account-title">
      <h2 id="account-title">{t.account.title}</h2>
      <p className={styles.note}>{t.account.intro}</p>
      {phrase ? (
        <div className={styles.card}>
          {shown && <code aria-label={t.account.title}>{phrase}</code>}
          <div className={styles.segmented}>
            <button type="button" aria-pressed={shown} onClick={() => setShown(!shown)}>
              {shown ? t.account.hide : t.account.show}
            </button>
            <button type="button" onClick={() => void copy()}>
              {t.account.copy}
            </button>
          </div>
          {copyNote && (
            <p className={styles.note} role="status">
              {copyNote}
            </p>
          )}
        </div>
      ) : (
        <p className={styles.note}>{t.account.creating}</p>
      )}
      <p className={styles.note} role="status">
        {status}
      </p>
      <form className={styles.card} onSubmit={link}>
        <h2>{t.account.linkTitle}</h2>
        <p className={styles.note}>{t.account.linkHint}</p>
        <input
          type="text"
          aria-label={t.account.linkLabel}
          placeholder="amber-fox-river-42"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-invalid={invalid}
          className={styles.action}
        />
        {invalid && (
          <p className={styles.note} role="alert">
            {t.account.invalid}
          </p>
        )}
        <button type="submit" className={styles.action} disabled={!input.trim()}>
          {t.account.link}
        </button>
      </form>
    </section>
  );
}

export function Settings() {
  const { lang, setLang, t } = useLang();
  const { fourColor, setFourColor } = useSettings();
  const { reset } = useStats();
  const { replaceAll } = useHands();
  const clear = () => {
    if (!window.confirm(t.settings.confirmClear)) return;
    reset();
    replaceAll([]);
  };
  return (
    <main id="main" className={`page ${styles.page}`}>
      <header className={styles.header}>
        <Link to="/" className={styles.close} aria-label={t.backHome}>
          ✕
        </Link>
        <h1 className={styles.title}>{t.settings.title}</h1>
      </header>
      <div role="group" aria-label={t.settings.language} className={styles.segmented}>
        {LANGUAGES.map((option) => (
          <button key={option.lang} type="button" lang={option.lang} aria-pressed={lang === option.lang} onClick={() => setLang(option.lang)}>
            {option.name}
          </button>
        ))}
      </div>
      <label className={styles.toggle}>
        <span>{t.settings.fourColor}</span>
        <input type="checkbox" checked={fourColor} onChange={(event) => setFourColor(event.target.checked)} />
      </label>
      <Link to="/welcome" className={styles.action}>
        {t.settings.replayIntro}
      </Link>
      <Account />
      <button type="button" className={`${styles.action} ${styles.danger}`} onClick={clear}>
        {t.settings.clear}
      </button>
    </main>
  );
}
