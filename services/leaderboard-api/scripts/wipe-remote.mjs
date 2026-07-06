const baseUrl = process.env.LEADERBOARD_URL ?? 'https://guild-ledger-leaderboard.onrender.com';
const token = process.env.LEADERBOARD_ADMIN_TOKEN?.trim();

if (!token) {
  console.error('LEADERBOARD_ADMIN_TOKEN missing.');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${token}` };

async function fetchJson(path) {
  const res = await fetch(`${baseUrl}${path}`);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

async function deleteProfile(id) {
  const res = await fetch(`${baseUrl}/profiles/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`delete ${id} → ${res.status}`);
  return true;
}

const leaderboard = await fetchJson('/leaderboard?limit=100');
const prestige100 = await fetchJson('/leaderboard/prestige100?limit=100');

const ids = new Set([
  ...leaderboard.map((entry) => entry.profile.id),
  ...prestige100.map((entry) => entry.id),
]);

let deleted = 0;
for (const id of ids) {
  if (await deleteProfile(id)) {
    deleted++;
    console.log(`Deleted ${id}`);
  }
}

const remaining = await fetchJson('/leaderboard?limit=100');
console.log(`Done. Deleted ${deleted} profile(s). Remaining on leaderboard: ${remaining.length}`);