import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'leaderboard.json');

export function compareProfiles(a, b) {
  const sa = a.stats ?? {};
  const sb = b.stats ?? {};
  const prestigeA = sa.prestigeLifetime ?? sa.prestigePoints ?? 0;
  const prestigeB = sb.prestigeLifetime ?? sb.prestigePoints ?? 0;
  const prestigeDiff = prestigeB - prestigeA;
  if (prestigeDiff !== 0) return prestigeDiff;
  const countDiff = (sb.prestigeCount ?? 0) - (sa.prestigeCount ?? 0);
  if (countDiff !== 0) return countDiff;
  return (sb.totalGoldEarned ?? 0) - (sa.totalGoldEarned ?? 0);
}

function readFileDb() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { profiles: {} };
  }
}

function writeFileDb(db) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function createFileStore() {
  console.log('Leaderboard storage: local file (set MONGODB_URI for production)');
  return {
    mode: 'file',
    async getLeaderboard(limit) {
      const db = readFileDb();
      return Object.values(db.profiles)
        .sort(compareProfiles)
        .slice(0, limit);
    },
    async getProfile(id) {
      const db = readFileDb();
      return db.profiles[id] ?? null;
    },
    async upsertProfile(profile) {
      const db = readFileDb();
      db.profiles[profile.id] = profile;
      writeFileDb(db);
      return profile;
    },
    async close() {},
  };
}

async function createMongoStore(uri) {
  const client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.MONGODB_DB_NAME ?? 'guild-ledger';
  const collectionName = process.env.MONGODB_COLLECTION ?? 'profiles';
  const col = client.db(dbName).collection(collectionName);

  await col.createIndex({ id: 1 }, { unique: true });
  await col.createIndex({ username: 1 }, { unique: true });
  await col.createIndex({
    'stats.prestigePoints': -1,
    'stats.prestigeCount': -1,
    'stats.totalGoldEarned': -1,
  });

  console.log(`Leaderboard storage: MongoDB (${dbName}.${collectionName})`);

  return {
    mode: 'mongo',
    async getLeaderboard(limit) {
      return col
        .find({})
        .sort({
          'stats.prestigePoints': -1,
          'stats.prestigeCount': -1,
          'stats.totalGoldEarned': -1,
        })
        .limit(limit)
        .toArray();
    },
    async getProfile(id) {
      return col.findOne({ id });
    },
    async upsertProfile(profile) {
      await col.replaceOne({ id: profile.id }, profile, { upsert: true });
      return profile;
    },
    async close() {
      await client.close();
    },
  };
}

export async function createStore() {
  const uri = process.env.MONGODB_URI?.trim();
  if (uri) {
    return createMongoStore(uri);
  }
  return createFileStore();
}