#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const zipPath = join(root, 'release', 'guild-ledger-itch.zip');
const butler = join(root, '.tools', 'butler', 'butler');
const target = process.env.ITCH_TARGET ?? 'pondilungs/guild-ledger:html';

if (!process.env.BUTLER_API_KEY?.trim()) {
  console.error('BUTLER_API_KEY missing.');
  console.error('Get a key: https://itch.io/user/settings/api-keys (source: wharf)');
  console.error('Then run:');
  console.error('  BUTLER_API_KEY=your_key npm run upload:itch');
  process.exit(1);
}

if (!existsSync(butler)) {
  console.error(`butler not found at ${butler}`);
  console.error('Download: https://broth.itch.zone/butler/darwin-arm64/LATEST/archive/default');
  process.exit(1);
}

if (!existsSync(zipPath)) {
  console.error(`Zip missing: ${zipPath}`);
  console.error('Run: VITE_LEADERBOARD_URL=https://guild-ledger-leaderboard.onrender.com npm run build:itch');
  process.exit(1);
}

const push = spawnSync(butler, ['push', zipPath, target, '--assume-yes'], {
  stdio: 'inherit',
  env: { ...process.env, BUTLER_API_KEY: process.env.BUTLER_API_KEY.trim() },
});

process.exit(push.status ?? 1);