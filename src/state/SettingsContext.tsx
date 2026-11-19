import { createContext, use, useMemo, useState, type ReactNode } from 'react';
import { loadItem, saveItem } from './storage';

interface SettingsValue {
  fourColor: boolean;
  onboardingSeen: boolean;
  setFourColor: (value: boolean) => void;
  setOnboardingSeen: (value: boolean) => void;
}

export const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [fourColor, setFourColorState] = useState(() => loadItem('fourColor') === true);
  const [onboardingSeen, setOnboardingSeenState] = useState(() => loadItem('onboardingSeen') === true);
  const value = useMemo(
    () => ({
      fourColor,
      onboardingSeen,
      setFourColor: (next: boolean) => {
        saveItem('fourColor', next);
        setFourColorState(next);
      },
      setOnboardingSeen: (next: boolean) => {
        saveItem('onboardingSeen', next);
        setOnboardingSeenState(next);
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
