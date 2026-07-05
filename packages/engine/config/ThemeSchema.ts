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
}

export interface PrestigeDef {
  minGoldEarned: number;
  currencyName: string;
  currencyIcon: string;
  multiplierPerPoint: number;
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
  offlineCapHours: number;
}