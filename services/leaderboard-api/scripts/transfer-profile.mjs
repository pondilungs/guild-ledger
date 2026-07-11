import { createStore } from '../db.mjs';

const [fromUsername, toUsername] = process.argv.slice(2);
if (!fromUsername || !toUsername) {
  console.error('Usage: node scripts/transfer-profile.mjs <fromUsername> <toUsername>');
  process.exit(1);
}

const store = await createStore();
const result = await store.transferProfile(fromUsername, toUsername);
await store.close();

if (!result) {
  console.error(`Transfer failed: one or both profiles not found (${fromUsername}, ${toUsername})`);
  process.exit(1);
}

console.log(`Transferred stats from "${fromUsername}" to "${toUsername}". Source profile deleted.`);
