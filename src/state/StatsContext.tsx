import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { emptyStats, levelsOf, normalizeStats, recordResults } from '../engine/stats';
import type { DrillType, Level, Session, Stats } from '../engine/types';
import { loadItem, saveItem } from './storage';

interface StatsValue {
  stats: Stats;
  levels: Record<DrillType, Level>;
  record: (session: Session) => void;
  reset: () => void;
}

const StatsContext = createContext<StatsValue | null>(null);

export function StatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState(() => normalizeStats(loadItem('stats')));
  const recorded = useRef(loadItem('recordedSession'));

  useEffect(() => saveItem('stats', stats), [stats]);

  const record = useCallback((session: Session) => {
    if (recorded.current === session.startedAt) return;
    recorded.current = session.startedAt;
    saveItem('recordedSession', session.startedAt);
    const results = session.drills.flatMap((drill, index) => {
      const answer = session.answers[index];
      return answer ? [{ type: drill.type, level: drill.level, correct: answer.correct }] : [];
    });
    setStats((current) => recordResults(current, results, new Date()));
  }, []);

  const reset = useCallback(() => setStats(emptyStats()), []);
  const value = useMemo(() => ({ stats, levels: levelsOf(stats), record, reset }), [stats, record, reset]);
  return <StatsContext value={value}>{children}</StatsContext>;
}

export function useStats() {
  const context = use(StatsContext);
  if (!context) throw new Error('useStats must be used inside StatsProvider');
  return context;
}
