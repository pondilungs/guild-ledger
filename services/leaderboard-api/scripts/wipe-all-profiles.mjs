import { createStore } from '../db.mjs';

const store = await createStore();
const result = await store.wipeAllProfiles();
await store.close();

console.log(`Wiped ${result.profileCount} profile(s) and ${result.raceCount} prestige100 race entry(ies).`);