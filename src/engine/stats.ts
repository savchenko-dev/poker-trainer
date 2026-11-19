import { DRILL_TYPES as ALL_TYPES, type DrillType, type DrillTypeStats, type Level, type Stats } from './types';

export const RECENT_WINDOW = 20;

function freshType(): DrillTypeStats {
  return { attempts: 0, correct: 0, recentResults: [], level: 1 };
}

export function emptyStats(): Stats {
  return { byType: Object.fromEntries(ALL_TYPES.map((type) => [type, freshType()])) as Record<DrillType, DrillTypeStats>, sessionDays: [] };
}

function isLevel(value: unknown): value is Level {
  return value === 1 || value === 2 || value === 3;
}

function count(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0 ? (value as number) : 0;
}

export function normalizeStats(raw: unknown): Stats {
  const stats = emptyStats();
  if (typeof raw !== 'object' || raw === null) return stats;
  const { byType, sessionDays } = raw as Partial<Record<keyof Stats, unknown>>;
  for (const type of ALL_TYPES) {
    const entry = (byType as Record<string, Partial<DrillTypeStats>> | undefined)?.[type];
    if (!entry) continue;
    const attempts = count(entry.attempts);
    stats.byType[type] = {
      attempts,
      correct: Math.min(attempts, count(entry.correct)),
      recentResults: Array.isArray(entry.recentResults)
        ? entry.recentResults.filter((result): result is boolean => typeof result === 'boolean').slice(-RECENT_WINDOW)
        : [],
      level: isLevel(entry.level) ? entry.level : 1,
    };
  }
  if (Array.isArray(sessionDays)) stats.sessionDays = sessionDays.filter((day): day is string => typeof day === 'string');
  return stats;
}

function applyResult(entry: DrillTypeStats, correct: boolean, drillLevel: Level): DrillTypeStats {
  const totals = { attempts: entry.attempts + 1, correct: entry.correct + (correct ? 1 : 0) };
  if (drillLevel !== entry.level) return { ...entry, ...totals };
  const recentResults = [...entry.recentResults, correct].slice(-RECENT_WINDOW);
  const next = { ...totals, recentResults, level: entry.level };
  if (recentResults.length < RECENT_WINDOW) return next;
  const accuracy = recentResults.filter(Boolean).length / RECENT_WINDOW;
  const level = accuracy >= 0.8 ? Math.min(3, entry.level + 1) : accuracy < 0.5 ? Math.max(1, entry.level - 1) : entry.level;
  return level === entry.level ? next : { ...next, level: level as Level, recentResults: [] };
}

export function localDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function recordResults(stats: Stats, results: { type: DrillType; level: Level; correct: boolean }[], now: Date): Stats {
  const byType = { ...stats.byType };
  for (const { type, level, correct } of results) byType[type] = applyResult(byType[type], correct, level);
  const today = localDay(now);
  const sessionDays = stats.sessionDays.includes(today) ? stats.sessionDays : [...stats.sessionDays, today].sort().slice(-400);
  return { byType, sessionDays };
}

export function currentStreak(sessionDays: string[], now: Date): number {
  const days = new Set(sessionDays);
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDay(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function levelsOf(stats: Stats): Record<DrillType, Level> {
  return Object.fromEntries(ALL_TYPES.map((type) => [type, stats.byType[type].level])) as Record<DrillType, Level>;
}
