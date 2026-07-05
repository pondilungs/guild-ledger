import { cpSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'apps/web/dist');
const releaseDir = join(root, 'release');
const zipPath = join(releaseDir, 'guild-ledger-itch.zip');

mkdirSync(releaseDir, { recursive: true });
rmSync(zipPath, { force: true });

const files = readdirSync(dist);
if (!files.includes('index.html')) {
  console.error('Build missing index.html. Run npm run build first.');
  process.exit(1);
}

// Zip contents of dist/ (index.html at archive root — required by itch.io)
execSync(`cd "${dist}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });

const size = execSync(`du -h "${zipPath}"`).toString().trim().split('\t')[0];
console.log(`\n✓ itch.io package ready: ${zipPath} (${size})`);