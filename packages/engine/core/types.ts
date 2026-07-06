export interface PartyState {
  id: string;
  level: number;
  active: boolean;
}

export interface UpgradeState {
  id: string;
  level: number;
}

export interface PrestigeShopState {
  id: string;
  level: number;
}

export interface QuestState {
  zoneId: string;
  partyIds: string[];
  startedAt: number;
  durationSec: number;
  progress: number;
}

export interface GameState {
  gold: number;
  totalGoldEarned: number;
  /** Spendable prestige currency (header balance). */
  prestigePoints: number;
  /** Lifetime prestige earned — leaderboard & income multiplier. */
  prestigeLifetime: number;
  prestigeCount: number;
  prestigeShop: PrestigeShopState[];
  /** Zone-specific loot shards — persists through prestige. */
  lootInventory: Record<string, number>;
  /** One-time permanent crafts bought with loot. */
  lootCraftsOwned: string[];
  currentZoneId: string;
  unlockedZones: string[];
  parties: PartyState[];
  upgrades: UpgradeState[];
  activeQuest: QuestState | null;
  lastSaveTime: number;
  firstPlayTime: number;
  totalPlayTime: number;
  version: number;
}

export const SAVE_VERSION = 1;

export function createInitialState(
  partyIds: string[],
  upgradeIds: string[],
  startZoneId: string,
  startingGold = 0,
  startingParties: { id: string; level: number }[] = [],
  prestigeShopIds: string[] = [],
): GameState {
  const now = Date.now();
  const starterMap = new Map(startingParties.map((p) => [p.id, p.level]));
  return {
    gold: startingGold,
    totalGoldEarned: 0,
    prestigePoints: 0,
    prestigeLifetime: 0,
    prestigeCount: 0,
    prestigeShop: prestigeShopIds.map((id) => ({ id, level: 0 })),
    lootInventory: {},
    lootCraftsOwned: [],
    currentZoneId: startZoneId,
    unlockedZones: [startZoneId],
    parties: partyIds.map((id) => ({
      id,
      level: starterMap.get(id) ?? 0,
      active: false,
    })),
    upgrades: upgradeIds.map((id) => ({ id, level: 0 })),
    activeQuest: null,
    lastSaveTime: now,
    firstPlayTime: now,
    totalPlayTime: 0,
    version: SAVE_VERSION,
  };
}