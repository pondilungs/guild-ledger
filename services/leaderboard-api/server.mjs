import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'leaderboard.json');
const PORT = Number(process.env.PORT ?? process.env.LEADERBOARD_PORT ?? 8787);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function readDb() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { profiles: {} };
  }
}

function writeDb(db) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { ...cors, 'Content-Type': 'application/json' });
  res.end(payload);
}

function compareProfiles(a, b) {
  const sa = a.stats ?? {};
  const sb = b.stats ?? {};
  const prestigeDiff = (sb.prestigePoints ?? 0) - (sa.prestigePoints ?? 0);
  if (prestigeDiff !== 0) return prestigeDiff;
  const countDiff = (sb.prestigeCount ?? 0) - (sa.prestigeCount ?? 0);
  if (countDiff !== 0) return countDiff;
  return (sb.totalGoldEarned ?? 0) - (sa.totalGoldEarned ?? 0);
}

function validateProfile(profile) {
  if (!profile?.id || typeof profile.id !== 'string') return false;
  if (!profile.username || !/^[a-zA-Z0-9_]{3,16}$/.test(profile.username)) return false;
  if (!profile.stats || typeof profile.stats !== 'object') return false;
  return true;
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/leaderboard') {
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 50)));
    const db = readDb();
    const sorted = Object.values(db.profiles)
      .sort(compareProfiles)
      .slice(0, limit)
      .map((profile, i) => ({ rank: i + 1, profile }));
    send(res, 200, sorted);
    return;
  }

  const profileMatch = url.pathname.match(/^\/profiles\/([^/]+)$/);
  if (profileMatch) {
    const id = decodeURIComponent(profileMatch[1]);
    const db = readDb();

    if (req.method === 'GET') {
      const profile = db.profiles[id];
      if (!profile) {
        send(res, 404, { error: 'not_found' });
        return;
      }
      send(res, 200, profile);
      return;
    }

    if (req.method === 'PUT') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          const profile = JSON.parse(body);
          if (profile.id !== id) {
            send(res, 400, { error: 'id_mismatch' });
            return;
          }
          if (!validateProfile(profile)) {
            send(res, 400, { error: 'invalid_profile' });
            return;
          }
          const now = Date.now();
          const existing = db.profiles[id];
          profile.createdAt = existing?.createdAt ?? profile.createdAt ?? now;
          profile.updatedAt = now;
          db.profiles[id] = profile;
          writeDb(db);
          send(res, 200, profile);
        } catch {
          send(res, 400, { error: 'bad_json' });
        }
      });
      return;
    }
  }

  send(res, 404, { error: 'not_found' });
});

server.listen(PORT, () => {
  console.log(`Leaderboard API → http://localhost:${PORT}`);
});