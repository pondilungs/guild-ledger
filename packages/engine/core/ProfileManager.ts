import type { ThemeConfig } from '../config/ThemeSchema.ts';
import type { GameState } from './types.ts';

const STORAGE_KEY = 'game-lab-profile';

export interface PlayerStats {
  totalGoldEarned: number;
  gold: number;
  prestigePoints: number;
  prestigeCount: number;
  totalPlayTime: number;
  zonesUnlocked: number;
  highestZoneId: string;
  partyLevelsTotal: number;
  upgradeLevelsTotal: number;
}

export interface PlayerProfile {
  id: string;
  username: string;
  createdAt: number;
  updatedAt: number;
  stats: PlayerStats;
}

function generateId(): string {
  return crypto.randomUUID();
}

function highestUnlockedZone(state: GameState, theme: ThemeConfig): string {
  let highest = state.currentZoneId;
  let highestIdx = theme.zones.findIndex((z) => z.id === highest);
  for (const zoneId of state.unlockedZones) {
    const idx = theme.zones.findIndex((z) => z.id === zoneId);
    if (idx > highestIdx) {
      highestIdx = idx;
      highest = zoneId;
    }
  }
  return highest;
}

export function buildStats(state: GameState, theme: ThemeConfig): PlayerStats {
  return {
    totalGoldEarned: state.totalGoldEarned,
    gold: state.gold,
    prestigePoints: state.prestigeLifetime,
    prestigeCount: state.prestigeCount,
    totalPlayTime: state.totalPlayTime,
    zonesUnlocked: state.unlockedZones.length,
    highestZoneId: highestUnlockedZone(state, theme),
    partyLevelsTotal: state.parties.reduce((sum, p) => sum + p.level, 0),
    upgradeLevelsTotal: state.upgrades.reduce((sum, u) => sum + u.level, 0),
  };
}

export class ProfileManager {
  private profile: PlayerProfile;

  constructor() {
    this.profile = this.load() ?? {
      id: generateId(),
      username: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      stats: {
        totalGoldEarned: 0,
        gold: 0,
        prestigePoints: 0,
        prestigeCount: 0,
        totalPlayTime: 0,
        zonesUnlocked: 1,
        highestZoneId: 'rat_cellar',
        partyLevelsTotal: 0,
        upgradeLevelsTotal: 0,
      },
    };
    this.save();
  }

  get current(): PlayerProfile {
    return this.profile;
  }

  hasUsername(): boolean {
    return this.profile.username.trim().length >= 3;
  }

  setUsername(username: string): boolean {
    const trimmed = username.trim();
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(trimmed)) return false;
    this.profile.username = trimmed;
    this.profile.updatedAt = Date.now();
    this.save();
    return true;
  }

  updateFromState(state: GameState, theme: ThemeConfig): void {
    this.profile.stats = buildStats(state, theme);
    this.profile.updatedAt = Date.now();
    this.save();
  }

  private load(): PlayerProfile | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PlayerProfile;
    } catch {
      return null;
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
  }
}