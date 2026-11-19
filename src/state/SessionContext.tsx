import { createContext, use, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { DRILL_TYPES, MODES } from '../engine/types';
import { initialSession, sessionReducer, type SessionAction, type SessionState } from './sessionReducer';
import { useStats } from './StatsContext';
import { SESSION_STORAGE_KEY } from './storage';

const SessionContext = createContext<{ state: SessionState; dispatch: Dispatch<SessionAction> } | null>(null);

function restoreSession(fallback: SessionState): SessionState {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) ?? 'null') as SessionState | null;
    const session = saved?.session;
    if (!saved || !session || !Array.isArray(session.drills) || !Array.isArray(session.answers)) return fallback;
    const { current } = saved;
    const valid =
      Number.isInteger(current) &&
      current >= 0 &&
      current < session.drills.length &&
      session.answers.length >= current &&
      session.answers.length <= current + 1 &&
      MODES.includes(session.mode) &&
      session.drills.every((drill) => DRILL_TYPES.includes(drill?.type) && typeof drill.prompt === 'object');
    return valid ? { ...saved, shownAt: Date.now() } : fallback;
  } catch {
    return fallback;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialSession, restoreSession);
  const { record } = useStats();
  const value = useMemo(() => ({ state, dispatch }), [state]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
    } catch {
      return;
    }
  }, [state]);

  useEffect(() => {
    const { session } = state;
    if (session && session.answers.length === session.drills.length) record(session);
  }, [state, record]);

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession() {
  const context = use(SessionContext);
  if (!context) throw new Error('useSession must be used inside SessionProvider');
  return context;
}
