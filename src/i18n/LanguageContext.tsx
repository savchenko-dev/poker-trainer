import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadItem, saveItem } from '../state/storage';
import { en, type Dict } from './en';
import { ru } from './ru';

export type Lang = 'en' | 'ru';

const DICTS: Record<Lang, Dict> = { en, ru };

interface LanguageValue { lang: Lang; setLang: (lang: Lang) => void; t: Dict }

export const LanguageContext = createContext<LanguageValue>({ lang: 'en', setLang: () => undefined, t: en });

function initialLang(): Lang {
  const saved = loadItem('lang');
  if (saved === 'en' || saved === 'ru') return saved;
  return navigator.language.startsWith('ru') ? 'ru' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(initialLang);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = DICTS[lang].home.title;
  }, [lang]);
  const value = useMemo(
    () => ({
      lang,
      t: DICTS[lang],
      setLang: (next: Lang) => {
        saveItem('lang', next);
        setLangState(next);
      },
    }),
    [lang],
  );
  return <LanguageContext value={value}>{children}</LanguageContext>;
}

export function useLang() {
  return use(LanguageContext);
}
