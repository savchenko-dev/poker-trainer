const APP = 'pokerTrainer';
const PREFIX = `${APP}.v1.`;
export const SESSION_STORAGE_KEY = `${APP}.v2.session`;

export function loadItem(key: string): unknown {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveItem(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    return;
  }
}
