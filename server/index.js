import http from 'node:http';
import { db, sync, backup } from './db.js';

const port = Number(process.env.PORT ?? 8787);
const maxBody = 1024 * 1024;
const maxChanges = 500;
const rateLimit = 60;
const rateWindowMs = 60_000;
const kinds = new Set(['hand', 'stats', 'settings']);
const hits = new Map();

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function limited(userId, now) {
  const entry = hits.get(userId);
  if (!entry || now - entry.start >= rateWindowMs) {
    hits.set(userId, { start: now, count: 1 });
    return false;
  }
  return ++entry.count > rateLimit;
}

function readBody(req) {
  if (Number(req.headers['content-length']) > maxBody) {
    return Promise.reject(new HttpError(413, 'body too large'));
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size <= maxBody) chunks.push(chunk);
    });
    req.on('end', () =>
      size > maxBody ? reject(new HttpError(413, 'body too large')) : resolve(Buffer.concat(chunks).toString()),
    );
    req.on('error', reject);
  });
}

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

function validChange(c) {
  return (
    isObject(c) &&
    kinds.has(c.kind) &&
    typeof c.id === 'string' &&
    c.id.length > 0 &&
    c.id.length <= 64 &&
    Number.isSafeInteger(c.updatedAt) &&
    c.updatedAt >= 0 &&
    typeof c.deleted === 'boolean' &&
    (c.data === null || isObject(c.data))
  );
}

function parseSync(raw) {
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'invalid json');
  }
  if (!isObject(body) || !Number.isSafeInteger(body.since) || body.since < 0) throw new HttpError(400, 'invalid since');
  if (!Array.isArray(body.changes) || body.changes.length > maxChanges) throw new HttpError(400, 'invalid changes');
  if (!body.changes.every(validChange)) throw new HttpError(400, 'invalid change');
  return body;
}

async function handle(req, res) {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && pathname === '/api/health') return send(res, 200, { ok: true });
  if (req.method !== 'POST' || pathname !== '/api/sync') return send(res, 404, { error: 'not found' });

  const userId = req.headers['x-user-id'];
  if (typeof userId !== 'string' || !/^[0-9a-f]{64}$/.test(userId)) throw new HttpError(400, 'invalid user id');
  if (limited(userId, Date.now())) throw new HttpError(429, 'too many requests');

  const { since, changes } = parseSync(await readBody(req));
  send(res, 200, { ...sync(userId, since, changes), serverTime: Date.now() });
}

const server = http.createServer(async (req, res) => {
  const started = performance.now();
  res.on('finish', () => {
    const path = req.url.split('?')[0];
    console.log(`${req.method} ${path} ${res.statusCode} ${Math.round(performance.now() - started)}ms`);
  });
  try {
    await handle(req, res);
  } catch (err) {
    if (err instanceof HttpError) {
      if (err.status === 413) res.setHeader('connection', 'close');
      send(res, err.status, { error: err.message });
    } else {
      console.error(err);
      send(res, 500, { error: 'internal error' });
    }
  }
});

setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of hits) if (now - entry.start >= rateWindowMs) hits.delete(userId);
}, rateWindowMs).unref();

backup();
setInterval(backup, 60 * 60 * 1000).unref();

server.listen(port, () => console.log(`poker-sync listening on ${port}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => {
    db.close();
    process.exit(0);
  }));
}
