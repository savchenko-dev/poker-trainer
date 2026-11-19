import { useLang } from './i18n/LanguageContext';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HandsProvider } from './state/HandsContext';
import { SessionProvider } from './state/SessionContext';
import { SettingsProvider } from './state/SettingsContext';
import { StatsProvider } from './state/StatsContext';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { Analysis } from './ui/pages/Analysis';
import { CheatSheet } from './ui/pages/CheatSheet';
import { Hands } from './ui/pages/Hands';
import { Home } from './ui/pages/Home';
import { Onboarding } from './ui/pages/Onboarding';
import { Positions } from './ui/pages/Positions';
import { RecordHand } from './ui/pages/RecordHand';
import { SessionEnd } from './ui/pages/SessionEnd';
import { Settings } from './ui/pages/Settings';
import { Stats } from './ui/pages/Stats';
import { Trainer } from './ui/pages/Trainer';

export function App() {
  const { t } = useLang();
  return (
    <BrowserRouter>
      <SettingsProvider>
        <StatsProvider>
          <HandsProvider>
            <SessionProvider>
              <a href="#main" className="skip-link">
                {t.skipLink}
              </a>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/train/chain" element={<Trainer chain />} />
                  <Route path="/train/:type" element={<Trainer />} />
                  <Route path="/session/end" element={<SessionEnd />} />
                  <Route path="/positions" element={<Positions />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/cheatsheet" element={<CheatSheet />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/welcome" element={<Onboarding />} />
                  <Route path="/hands" element={<Hands />} />
                  <Route path="/hands/new" element={<RecordHand />} />
                  <Route path="/hands/analysis" element={<Analysis />} />
                </Routes>
              </ErrorBoundary>
            </SessionProvider>
          </HandsProvider>
        </StatsProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
