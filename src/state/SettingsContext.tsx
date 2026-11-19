import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { loadItem, saveItem } from './storage';
import { queueChange, registerKind, type Change } from './sync';

interface SettingsValue {
  fourColor: boolean;
  onboardingSeen: boolean;
  setFourColor: (value: boolean) => void;
  setOnboardingSeen: (value: boolean) => void;
}

interface SettingsData { lang?: unknown; fourColor?: unknown; onboardingSeen?: unknown }

export const SettingsContext = createContext<SettingsValue | null>(null);

function settingsChange(): Change {
  return {
    kind: 'settings',
    id: 'app',
    updatedAt: Number(loadItem('settingsUpdatedAt')) || 0,
    deleted: false,
    data: { lang: loadItem('lang'), fourColor: loadItem('fourColor') === true, onboardingSeen: loadItem('onboardingSeen') === true },
  };
}

export function queueSettings(): void {
  saveItem('settingsUpdatedAt', Date.now());
  queueChange(settingsChange());
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { setLang } = useLang();
  const [fourColor, setFourColorState] = useState(() => loadItem('fourColor') === true);
  const [onboardingSeen, setOnboardingSeenState] = useState(() => loadItem('onboardingSeen') === true);

  useEffect(
    () =>
      registerKind('settings', {
        all: () => {
          const change = settingsChange();
          return change.updatedAt > 0 ? [change] : [];
        },
        apply: (changes) => {
          const change = changes.find((entry) => entry.id === 'app');
          if (!change || change.updatedAt <= settingsChange().updatedAt) return;
          const data = (change.data ?? {}) as SettingsData;
          saveItem('settingsUpdatedAt', change.updatedAt);
          saveItem('fourColor', data.fourColor === true);
          saveItem('onboardingSeen', data.onboardingSeen === true);
          setFourColorState(data.fourColor === true);
          setOnboardingSeenState(data.onboardingSeen === true);
          if (data.lang === 'en' || data.lang === 'ru') setLang(data.lang, false);
        },
      }),
    [setLang],
  );

  const value = useMemo(
    () => ({
      fourColor,
      onboardingSeen,
      setFourColor: (next: boolean) => {
        saveItem('fourColor', next);
        setFourColorState(next);
        queueSettings();
      },
      setOnboardingSeen: (next: boolean) => {
        saveItem('onboardingSeen', next);
        setOnboardingSeenState(next);
        queueSettings();
      },
    }),
    [fourColor, onboardingSeen],
  );
  return <SettingsContext value={value}>{children}</SettingsContext>;
}

export function useSettings() {
  const context = use(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
}
