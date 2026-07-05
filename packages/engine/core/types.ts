export interface PartyState {
  id: string;
  level: number;
  active: boolean;
}

export interface UpgradeState {
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
  prestigePoints: number;
  prestigeCount: number;
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
): GameState {
  const now = Date.now();
  const starterMap = new Map(startingParties.map((p) => [p.id, p.level]));
  return {
    gold: startingGold,
    totalGoldEarned: 0,
    prestigePoints: 0,
    prestigeCount: 0,
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