import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'leaderboard.json');
const PRESTIGE_100_GOAL = 50;

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
    const parsed = JSON.parse(raw);
    if (!parsed.prestige100Race) parsed.prestige100Race = {};
    return parsed;
  } catch {
    return { profiles: {}, prestige100Race: {} };
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
      await recordPrestige100File(db, profile);
      writeFileDb(db);
      return profile;
    },
    async getPrestige100Race(limit) {
      const db = readFileDb();
      return Object.values(db.prestige100Race)
        .sort((a, b) => a.reachedAt - b.reachedAt)
        .slice(0, limit);
    },
    async close() {},
  };
}

async function recordPrestige100File(db, profile) {
  if (!profile.prestige100At) return;
  const lifetime = profile.stats?.prestigePoints ?? 0;
  if (lifetime < PRESTIGE_100_GOAL) return;
  if (db.prestige100Race[profile.id]) return;
  db.prestige100Race[profile.id] = {
    id: profile.id,
    username: profile.username,
    reachedAt: profile.prestige100At,
    prestigeAtReach: lifetime,
  };
}

async function createMongoStore(uri) {
  const client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.MONGODB_DB_NAME ?? 'guild-ledger';
  const collectionName = process.env.MONGODB_COLLECTION ?? 'profiles';
  const raceCollectionName = process.env.MONGODB_PRESTIGE100_COLLECTION ?? 'prestige100_race';
  const db = client.db(dbName);
  const col = db.collection(collectionName);
  const raceCol = db.collection(raceCollectionName);

  await col.createIndex({ id: 1 }, { unique: true });
  await col.createIndex({ username: 1 }, { unique: true });
  await col.createIndex({
    'stats.prestigePoints': -1,
    'stats.prestigeCount': -1,
    'stats.totalGoldEarned': -1,
  });
  await raceCol.createIndex({ id: 1 }, { unique: true });
  await raceCol.createIndex({ reachedAt: 1 });

  console.log(`Leaderboard storage: MongoDB (${dbName}.${collectionName}, ${raceCollectionName})`);

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
      await recordPrestige100Mongo(raceCol, profile);
      return profile;
    },
    async getPrestige100Race(limit) {
      return raceCol
        .find({})
        .sort({ reachedAt: 1 })
        .limit(limit)
        .toArray();
    },
    async close() {
      await client.close();
    },
  };
}

async function recordPrestige100Mongo(raceCol, profile) {
  if (!profile.prestige100At) return;
  const lifetime = profile.stats?.prestigePoints ?? 0;
  if (lifetime < PRESTIGE_100_GOAL) return;

  await raceCol.updateOne(
    { id: profile.id },
    {
      $setOnInsert: {
        id: profile.id,
        username: profile.username,
        reachedAt: profile.prestige100At,
        prestigeAtReach: lifetime,
      },
    },
    { upsert: true },
  );
}

export async function createStore() {
  const uri = process.env.MONGODB_URI?.trim();
  if (uri) {
    return createMongoStore(uri);
  }
  return createFileStore();
}