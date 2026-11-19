import { useSyncExternalStore } from 'react';
import { generatePhrase, loadPhrase, savePhrase, userIdFromPhrase } from './identity';
import { loadItem, saveItem } from './storage';

export type ChangeKind = 'hand' | 'stats' | 'settings';

export interface Change {
  kind: ChangeKind;
  id: string;
  updatedAt: number;
  deleted: boolean;
  data: object | null;
}

interface KindHandler {
  apply: (changes: Change[]) => void;
  all: () => Change[];
}

export interface SyncState {
  phrase: string | null;
  lastSyncAt: number | null;
  lastError: string | null;
  pending: number;
}

const DEBOUNCE_MS = 2000;
const INTERVAL_MS = 60_000;

const handlers: Partial<Record<ChangeKind, KindHandler>> = {};
const listeners = new Set<() => void>();
let state: SyncState = { phrase: loadPhrase(), lastSyncAt: null, lastError: null, pending: loadOutbox().length };
let running: Promise<void> | null = null;
let debounce: ReturnType<typeof setTimeout> | undefined;
let identity: Promise<string> | null = null;

function setState(patch: Partial<SyncState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function sameRecord(a: Change, b: Change): boolean {
  return a.kind === b.kind && a.id === b.id;
}

function loadOutbox(): Change[] {
  const outbox = loadItem('outbox');
  return Array.isArray(outbox) ? (outbox as Change[]) : [];
}

function saveOutbox(outbox: Change[]): void {
  saveItem('outbox', outbox);
  setState({ pending: outbox.length });
}

function enqueue(changes: Change[]): void {
  const outbox = loadOutbox();
  for (const change of changes) {
    const index = outbox.findIndex((entry) => sameRecord(entry, change));
    if (index === -1) outbox.push(change);
    else if (outbox[index]!.updatedAt <= change.updatedAt) outbox[index] = change;
  }
  saveOutbox(outbox);
}

export function queueChange(change: Change): void {
  enqueue([change]);
  clearTimeout(debounce);
  debounce = setTimeout(() => void syncNow(), DEBOUNCE_MS);
}

function queueAll(): void {
  enqueue(Object.values(handlers).flatMap((handler) => handler.all()));
}

export function registerKind(kind: ChangeKind, handler: KindHandler): () => void {
  handlers[kind] = handler;
  return () => {
    if (handlers[kind] === handler) delete handlers[kind];
  };
}

function ensureIdentity(): Promise<string> {
  identity ??= (async () => {
    let phrase = loadPhrase();
    if (!phrase) {
      phrase = generatePhrase();
      savePhrase(phrase);
      queueAll();
      setState({ phrase });
    }
    return userIdFromPhrase(phrase);
  })();
  return identity;
}

async function run(): Promise<void> {
  try {
    const userId = await ensureIdentity();
    if (!navigator.onLine) throw new Error('offline');
    const sent = loadOutbox();
    const since = Number(loadItem('syncCursor')) || 0;
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ since, changes: sent }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { cursor, changes } = (await response.json()) as { cursor: number; changes: Change[] };
    for (const kind of Object.keys(handlers) as ChangeKind[]) {
      const incoming = changes.filter((change) => change.kind === kind);
      if (incoming.length) handlers[kind]?.apply(incoming);
    }
    saveOutbox(loadOutbox().filter((entry) => !sent.some((done) => sameRecord(done, entry) && done.updatedAt >= entry.updatedAt)));
    saveItem('syncCursor', cursor);
    setState({ lastSyncAt: Date.now(), lastError: null });
  } catch (error) {
    setState({ lastError: error instanceof Error ? error.message : String(error) });
  }
}

export function syncNow(): Promise<void> {
  running ??= run().finally(() => {
    running = null;
  });
  return running;
}

export async function linkPhrase(phrase: string): Promise<void> {
  await running;
  savePhrase(phrase);
  identity = null;
  saveItem('syncCursor', 0);
  queueAll();
  setState({ phrase: loadPhrase(), lastSyncAt: null, lastError: null });
  await syncNow();
}

export function startSync(): () => void {
  void syncNow();
  const online = () => void syncNow();
  const timer = setInterval(() => {
    if (document.visibilityState === 'visible') void syncNow();
  }, INTERVAL_MS);
  window.addEventListener('online', online);
  return () => {
    clearInterval(timer);
    window.removeEventListener('online', online);
  };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSyncState(): SyncState {
  return useSyncExternalStore(subscribe, () => state);
}
