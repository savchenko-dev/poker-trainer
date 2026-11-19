import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { emptyStats, levelsOf, mergeDays, normalizeStats, recordResults } from '../engine/stats';
import { DRILL_TYPES, type DrillType, type DrillTypeStats, type Level, type Session, type Stats } from '../engine/types';
import { loadItem, saveItem } from './storage';
import { queueChange, registerKind, type Change } from './sync';

interface StatsValue {
  stats: Stats;
  levels: Record<DrillType, Level>;
  record: (session: Session) => void;
  reset: () => void;
}

const StatsContext = createContext<StatsValue | null>(null);

const DAYS_ID = 'days';

function typeChange(type: DrillType, entry: DrillTypeStats): Change {
  return { kind: 'stats', id: type, updatedAt: entry.updatedAt, deleted: false, data: entry };
}

function daysChange(stats: Stats): Change {
  return { kind: 'stats', id: DAYS_ID, updatedAt: stats.daysUpdatedAt, deleted: false, data: { days: stats.sessionDays } };
}

function changesBetween(previous: Stats, next: Stats): Change[] {
  const changes = DRILL_TYPES.filter((type) => next.byType[type] !== previous.byType[type]).map((type) => typeChange(type, next.byType[type]));
  return next.sessionDays !== previous.sessionDays ? [...changes, daysChange(next)] : changes;
}

function isDrillType(id: string): id is DrillType {
  return (DRILL_TYPES as string[]).includes(id);
}

function mergeRemote(local: Stats, changes: Change[]): { stats: Stats; pushDays: boolean } {
  const byType = { ...local.byType };
  let { sessionDays, daysUpdatedAt } = local;
  let pushDays = false;
  for (const change of changes) {
    if (change.id === DAYS_ID) {
      const incoming = normalizeStats({ sessionDays: (change.data as { days?: unknown } | null)?.days }).sessionDays;
      sessionDays = change.updatedAt > daysUpdatedAt && incoming.length === 0 ? [] : mergeDays(sessionDays, incoming);
      pushDays = sessionDays.length > incoming.length;
      daysUpdatedAt = Math.max(daysUpdatedAt, change.updatedAt);
    } else if (isDrillType(change.id) && change.updatedAt > byType[change.id].updatedAt) {
      byType[change.id] = { ...normalizeStats({ byType: { [change.id]: change.data } }).byType[change.id], updatedAt: change.updatedAt };
    }
  }
  return { stats: { byType, sessionDays, daysUpdatedAt }, pushDays };
}

export function StatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState(() => normalizeStats(loadItem('stats')));
  const current = useRef(stats);
  const recorded = useRef(loadItem('recordedSession'));

  useEffect(() => saveItem('stats', stats), [stats]);

  const commit = useCallback((next: Stats) => {
    changesBetween(current.current, next).forEach(queueChange);
    current.current = next;
    setStats(next);
  }, []);

  useEffect(
    () =>
      registerKind('stats', {
        all: () => {
          const { byType, daysUpdatedAt } = current.current;
          const changes = DRILL_TYPES.filter((type) => byType[type].updatedAt > 0).map((type) => typeChange(type, byType[type]));
          return daysUpdatedAt > 0 ? [...changes, daysChange(current.current)] : changes;
        },
        apply: (changes) => {
          const { stats: next, pushDays } = mergeRemote(current.current, changes);
          current.current = next;
          setStats(next);
          if (pushDays) commit({ ...next, sessionDays: [...next.sessionDays], daysUpdatedAt: Date.now() });
        },
      }),
    [commit],
  );

  const record = useCallback(
    (session: Session) => {
      if (recorded.current === session.startedAt) return;
      recorded.current = session.startedAt;
      saveItem('recordedSession', session.startedAt);
      const results = session.drills.flatMap((drill, index) => {
        const answer = session.answers[index];
        return answer ? [{ type: drill.type, level: drill.level, correct: answer.correct }] : [];
      });
      commit(recordResults(current.current, results, new Date()));
    },
    [commit],
  );

  const reset = useCallback(() => commit(emptyStats(Date.now())), [commit]);
  const value = useMemo(() => ({ stats, levels: levelsOf(stats), record, reset }), [stats, record, reset]);
  return <StatsContext value={value}>{children}</StatsContext>;
}

export function useStats() {
  const context = use(StatsContext);
  if (!context) throw new Error('useStats must be used inside StatsProvider');
  return context;
}
