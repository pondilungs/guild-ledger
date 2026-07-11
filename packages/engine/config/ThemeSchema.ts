export interface ResourceDef {
  id: string;
  name: string;
  icon: string;
}

export interface ZoneDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockGold: number;
  baseEnemyHp: number;
  baseGoldPerKill: number;
  deathChance: number;
  questDurationSec: number;
}

export interface PartySlotDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  baseDps: number;
  unlockZone: string;
}

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  baseCost: number;
  costGrowth: number;
  maxLevel: number;
  effectPerLevel: number;
  effectType: 'gold_mult' | 'dps_mult' | 'death_reduce' | 'offline_mult' | 'prestige_mult';
  unlockZone?: string;
}

export interface PrestigeDef {
  minGoldEarned: number;
  currencyName: string;
  currencyIcon: string;
  multiplierPerPoint: number;
}

export type PrestigeShopEffectType =
  | 'gold_mult_perm'
  | 'offline_mult_perm'
  | 'death_reduce_perm'
  | 'start_gold_perm'
  | 'dps_mult_perm'
  | 'prestige_mult_perm'
  | 'quest_gold_perm';

export interface PrestigeShopItemDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  baseCost: number;
  costGrowth: number;
  maxLevel: number;
  effectPerLevel: number;
  effectType: PrestigeShopEffectType;
}

export interface StarterParty {
  id: string;
  level: number;
}

export interface ClickBoostDef {
  multiplier: number;
  durationSec: number;
  cooldownSec: number;
  tapGoldFactor: number;
}

export type ZoneLootCraftEffectType =
  | 'gold_mult_perm'
  | 'dps_mult_perm'
  | 'death_reduce_perm'
  | 'offline_mult_perm'
  | 'quest_gold_perm';

export interface ZoneLootDef {
  id: string;
  zoneId: string;
  /** Craft unlocked when enough of this loot is collected. */
  craftId: string;
  name: string;
  icon: string;
  description: string;
  /** Per-kill drop probability (e.g. 0.0012 ≈ 0.12%). */
  dropChancePerKill: number;
}

export interface ZoneLootCraftDef {
  id: string;
  lootId: string;
  zoneId: string;
  name: string;
  icon: string;
  description: string;
  shardCost: number;
  effectType: ZoneLootCraftEffectType;
  effectValue: number;
}

export interface ThemeConfig {
  id: string;
  title: string;
  tagline: string;
  version?: string;
  startingGold: number;
  startingParties?: StarterParty[];
  clickBoost?: ClickBoostDef;
  resources: ResourceDef[];
  zones: ZoneDef[];
  partySlots: PartySlotDef[];
  upgrades: UpgradeDef[];
  prestige: PrestigeDef;
  prestigeShop?: PrestigeShopItemDef[];
  zoneLoot?: ZoneLootDef[];
  zoneLootCrafts?: ZoneLootCraftDef[];
  offlineCapHours: number;
}