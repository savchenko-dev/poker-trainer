import { Link } from 'react-router-dom';
import { useLang, type Lang } from '../../i18n/LanguageContext';
import { useHands } from '../../state/HandsContext';
import { useSettings } from '../../state/SettingsContext';
import { useStats } from '../../state/StatsContext';
import styles from './Reference.module.css';

const LANGUAGES: { lang: Lang; name: string }[] = [
  { lang: 'en', name: 'English' },
  { lang: 'ru', name: 'Русский' },
];

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
      <button type="button" className={`${styles.action} ${styles.danger}`} onClick={clear}>
        {t.settings.clear}
      </button>
    </main>
  );
}
