import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { parseHands, serializeHands, type HandRecord } from '../engine/handRecord';
import { loadItem, saveItem } from './storage';
import { queueChange, registerKind, type Change } from './sync';

interface HandsValue {
  hands: HandRecord[];
  add: (record: HandRecord) => void;
  remove: (id: string) => void;
  replaceAll: (records: HandRecord[]) => void;
  exportFile: () => void;
  importFile: (file: File) => Promise<number>;
}

interface Tombstone { id: string; updatedAt: number }

const HandsContext = createContext<HandsValue | null>(null);

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_RECORDS = 5000;
const MAX_TOMBSTONES = 1000;

function byDateDesc(records: HandRecord[]): HandRecord[] {
  return records.toSorted((a, b) => b.date.localeCompare(a.date));
}

function loadHands(): HandRecord[] {
  try {
    return byDateDesc(parseHands(loadItem('hands')));
  } catch {
    return [];
  }
}

function loadTombstones(): Tombstone[] {
  const raw = loadItem('deletedHands');
  return Array.isArray(raw) ? raw.filter((entry): entry is Tombstone => typeof entry?.id === 'string' && typeof entry?.updatedAt === 'number') : [];
}

function saveTombstones(tombstones: Tombstone[]): void {
  saveItem('deletedHands', tombstones.slice(-MAX_TOMBSTONES));
}

function handChange(record: HandRecord): Change {
  return { kind: 'hand', id: record.id, updatedAt: record.updatedAt, deleted: false, data: serializeHands([record]).hands[0]! };
}

function tombstoneChange({ id, updatedAt }: Tombstone): Change {
  return { kind: 'hand', id, updatedAt, deleted: true, data: null };
}

export function HandsProvider({ children }: { children: ReactNode }) {
  const [hands, setHands] = useState(loadHands);
  const current = useRef(hands);

  useEffect(() => saveItem('hands', serializeHands(hands)), [hands]);

  const commit = useCallback((next: HandRecord[]) => {
    current.current = byDateDesc(next);
    setHands(current.current);
  }, []);

  const upsert = useCallback(
    (records: HandRecord[]) => {
      const ids = new Set(records.map((record) => record.id));
      saveTombstones(loadTombstones().filter((tombstone) => !ids.has(tombstone.id)));
      commit([...records, ...current.current.filter((record) => !ids.has(record.id))]);
      records.forEach((record) => queueChange(handChange(record)));
    },
    [commit],
  );

  const removeIds = useCallback(
    (ids: string[]) => {
      const now = Date.now();
      const removed = ids.map((id) => ({ id, updatedAt: now }));
      saveTombstones([...loadTombstones().filter((tombstone) => !ids.includes(tombstone.id)), ...removed]);
      commit(current.current.filter((record) => !ids.includes(record.id)));
      removed.forEach((tombstone) => queueChange(tombstoneChange(tombstone)));
    },
    [commit],
  );

  useEffect(
    () =>
      registerKind('hand', {
        all: () => [...current.current.map(handChange), ...loadTombstones().map(tombstoneChange)],
        apply: (changes) => {
          const records = new Map(current.current.map((record) => [record.id, record]));
          const tombstones = new Map(loadTombstones().map((tombstone) => [tombstone.id, tombstone]));
          for (const change of changes) {
            const localAt = records.get(change.id)?.updatedAt ?? tombstones.get(change.id)?.updatedAt ?? -1;
            if (change.updatedAt <= localAt) continue;
            if (change.deleted) {
              records.delete(change.id);
              tombstones.set(change.id, { id: change.id, updatedAt: change.updatedAt });
              continue;
            }
            const [record] = parseHands([change.data]);
            if (!record || record.id !== change.id) continue;
            records.set(change.id, { ...record, updatedAt: change.updatedAt });
            tombstones.delete(change.id);
          }
          saveTombstones([...tombstones.values()]);
          commit([...records.values()]);
        },
      }),
    [commit],
  );

  const value = useMemo<HandsValue>(
    () => ({
      hands,
      add: (record) => upsert([record]),
      remove: (id) => removeIds([id]),
      replaceAll: (records) => {
        const keep = new Set(records.map((record) => record.id));
        removeIds(current.current.filter((record) => !keep.has(record.id)).map((record) => record.id));
        upsert(records);
      },
      exportFile: () => {
        const blob = new Blob([JSON.stringify(serializeHands(hands), null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `poker-hands-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      },
      importFile: async (file) => {
        if (file.size > MAX_FILE_BYTES) throw new Error('File too large');
        const imported = parseHands(JSON.parse(await file.text())).slice(0, MAX_RECORDS);
        const known = new Set(hands.map((record) => record.id));
        const now = Date.now();
        const fresh = new Map(imported.filter((record) => !known.has(record.id)).map((record) => [record.id, { ...record, updatedAt: now }]));
        upsert([...fresh.values()]);
        return fresh.size;
      },
    }),
    [hands, upsert, removeIds],
  );
  return <HandsContext value={value}>{children}</HandsContext>;
}

export function useHands() {
  const context = use(HandsContext);
  if (!context) throw new Error('useHands must be used inside HandsProvider');
  return context;
}
