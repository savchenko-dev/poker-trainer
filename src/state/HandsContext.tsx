import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { parseHands, serializeHands, type HandRecord } from '../engine/handRecord';
import { loadItem, saveItem } from './storage';

interface HandsValue {
  hands: HandRecord[];
  add: (record: HandRecord) => void;
  remove: (id: string) => void;
  replaceAll: (records: HandRecord[]) => void;
  exportFile: () => void;
  importFile: (file: File) => Promise<number>;
}

const HandsContext = createContext<HandsValue | null>(null);

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_RECORDS = 5000;

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

export function HandsProvider({ children }: { children: ReactNode }) {
  const [hands, setHands] = useState(loadHands);

  useEffect(() => saveItem('hands', serializeHands(hands)), [hands]);

  const update = useCallback((change: (current: HandRecord[]) => HandRecord[]) => setHands((current) => byDateDesc(change(current))), []);

  const value = useMemo<HandsValue>(
    () => ({
      hands,
      add: (record) => update((current) => [record, ...current]),
      remove: (id) => update((current) => current.filter((record) => record.id !== id)),
      replaceAll: (records) => update(() => records),
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
        const fresh = new Map(imported.filter((record) => !known.has(record.id)).map((record) => [record.id, record]));
        update((current) => [...new Map([...fresh, ...current.map((record) => [record.id, record] as const)]).values()]);
        return fresh.size;
      },
    }),
    [hands, update],
  );
  return <HandsContext value={value}>{children}</HandsContext>;
}

export function useHands() {
  const context = use(HandsContext);
  if (!context) throw new Error('useHands must be used inside HandsProvider');
  return context;
}
