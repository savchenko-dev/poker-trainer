# poker-sync

Sync backend for the poker trainer. Node 22, `node:http`, better-sqlite3.

Run: `npm ci && npm start` (or `npm run dev`), Docker: `docker build -t poker-sync . && docker run -p 8787:8787 -v poker-data:/app/data poker-sync`.

Env: `PORT` (default 8787), `DATA_DIR` (default `./data`, holds `sync.db`). Create `$DATA_DIR/backups/` to enable daily `sync-YYYY-MM-DD.db` copies, 14 kept.

API: `GET /api/health` -> `{ ok: true }`. `POST /api/sync` with header `x-user-id: <64 hex>` and body `{ since, changes: [{ kind: hand|stats|settings, id, updatedAt, deleted, data }] }` -> `{ cursor, changes, serverTime }`.

Limits: 1 MB body (413), 500 changes, 60 requests/min per user id (429), malformed id or body -> 400.
