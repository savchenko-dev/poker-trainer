import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.env.DATA_DIR ?? './data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'sync.db'));
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    user_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    id TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted INTEGER NOT NULL,
    data TEXT,
    seq INTEGER NOT NULL,
    PRIMARY KEY (user_id, kind, id)
  );
  CREATE INDEX IF NOT EXISTS records_user_seq ON records (user_id, seq);
`);

const nextSeq = db.prepare('SELECT COALESCE(MAX(seq), 0) + 1 AS seq FROM records');
const upsert = db.prepare(`
  INSERT INTO records (user_id, kind, id, updated_at, deleted, data, seq)
  VALUES (@userId, @kind, @id, @updatedAt, @deleted, @data, @seq)
  ON CONFLICT (user_id, kind, id) DO UPDATE SET
    updated_at = excluded.updated_at, deleted = excluded.deleted, data = excluded.data, seq = excluded.seq
  WHERE excluded.updated_at > records.updated_at
`);
const changedSince = db.prepare(
  'SELECT kind, id, updated_at, deleted, data, seq FROM records WHERE user_id = ? AND seq > ? ORDER BY seq',
);
const maxUserSeq = db.prepare('SELECT COALESCE(MAX(seq), 0) AS seq FROM records WHERE user_id = ?');

export const sync = db.transaction((userId, since, changes) => {
  const written = new Set();
  for (const c of changes) {
    const { seq } = nextSeq.get();
    const result = upsert.run({
      userId,
      kind: c.kind,
      id: c.id,
      updatedAt: c.updatedAt,
      deleted: c.deleted ? 1 : 0,
      data: c.data === null ? null : JSON.stringify(c.data),
      seq,
    });
    if (result.changes) written.add(seq);
  }
  return {
    cursor: maxUserSeq.get(userId).seq,
    changes: changedSince
      .all(userId, since)
      .filter((r) => !written.has(r.seq))
      .map((r) => ({
        kind: r.kind,
        id: r.id,
        updatedAt: r.updated_at,
        deleted: r.deleted === 1,
        data: r.data === null ? null : JSON.parse(r.data),
      })),
  };
});

const backupDir = path.join(dataDir, 'backups');
const keepBackups = 14;

export function backup() {
  if (!fs.existsSync(backupDir)) return;
  const file = path.join(backupDir, `sync-${new Date().toISOString().slice(0, 10)}.db`);
  if (!fs.existsSync(file)) db.prepare('VACUUM INTO ?').run(file);
  const old = fs
    .readdirSync(backupDir)
    .filter((f) => /^sync-\d{4}-\d{2}-\d{2}\.db$/.test(f))
    .sort()
    .reverse()
    .slice(keepBackups);
  for (const f of old) fs.unlinkSync(path.join(backupDir, f));
}
