import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { queueSettings } from '../state/SettingsContext';
import { loadItem, saveItem } from '../state/storage';
import { en, type Dict } from './en';
import { ru } from './ru';

export type Lang = 'en' | 'ru';

const DICTS: Record<Lang, Dict> = { en, ru };

interface LanguageValue { lang: Lang; setLang: (lang: Lang, queue?: boolean) => void; t: Dict }

export const LanguageContext = createContext<LanguageValue>({ lang: 'en', setLang: () => undefined, t: en });

function initialLang(): Lang {
  const saved = loadItem('lang');
  if (saved === 'en' || saved === 'ru') return saved;
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
  return preferred.some((tag) => tag.toLowerCase().startsWith('ru')) ? 'ru' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(initialLang);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = DICTS[lang].home.title;
  }, [lang]);
  const setLang = useCallback((next: Lang, queue = true) => {
    saveItem('lang', next);
    setLangState(next);
    if (queue) queueSettings();
  }, []);
  const value = useMemo(() => ({ lang, t: DICTS[lang], setLang }), [lang, setLang]);
  return <LanguageContext value={value}>{children}</LanguageContext>;
}

export function useLang() {
  return use(LanguageContext);
}
