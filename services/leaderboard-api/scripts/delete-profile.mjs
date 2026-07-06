import { createStore } from '../db.mjs';

const username = process.argv[2];
if (!username) {
  console.error('Usage: node scripts/delete-profile.mjs <username>');
  process.exit(1);
}

const store = await createStore();
const deleted = await store.deleteProfileByUsername(username);
await store.close();

if (!deleted) {
  console.error(`Profile not found: ${username}`);
  process.exit(1);
}

console.log(`Deleted profile: ${username}`);