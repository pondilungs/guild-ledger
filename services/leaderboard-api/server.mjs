import http from 'node:http';
import { createStore } from './db.mjs';

const PORT = Number(process.env.PORT ?? process.env.LEADERBOARD_PORT ?? 8787);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { ...cors, 'Content-Type': 'application/json' });
  res.end(payload);
}

function validateProfile(profile) {
  if (!profile?.id || typeof profile.id !== 'string') return false;
  if (!profile.username || !/^[a-zA-Z0-9_]{3,16}$/.test(profile.username)) return false;
  if (!profile.stats || typeof profile.stats !== 'object') return false;
  return true;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const store = await createStore();

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/leaderboard') {
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 50)));
      const profiles = await store.getLeaderboard(limit);
      const entries = profiles.map((profile, i) => ({ rank: i + 1, profile }));
      send(res, 200, entries);
      return;
    }

    const profileMatch = url.pathname.match(/^\/profiles\/([^/]+)$/);
    if (profileMatch) {
      const id = decodeURIComponent(profileMatch[1]);

      if (req.method === 'GET') {
        const profile = await store.getProfile(id);
        if (!profile) {
          send(res, 404, { error: 'not_found' });
          return;
        }
        send(res, 200, profile);
        return;
      }

      if (req.method === 'PUT') {
        const body = await readBody(req);
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
          const existing = await store.getProfile(id);
          profile.createdAt = existing?.createdAt ?? profile.createdAt ?? now;
          profile.updatedAt = now;
          await store.upsertProfile(profile);
          send(res, 200, profile);
        } catch (err) {
          if (err?.code === 11000) {
            send(res, 409, { error: 'username_taken' });
            return;
          }
          send(res, 400, { error: 'bad_json' });
        }
        return;
      }
    }

    send(res, 404, { error: 'not_found' });
  } catch (err) {
    console.error('Leaderboard API error:', err);
    send(res, 500, { error: 'server_error' });
  }
});

server.listen(PORT, () => {
  console.log(`Leaderboard API → http://localhost:${PORT} (${store.mode})`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await store.close();
    process.exit(0);
  });
}