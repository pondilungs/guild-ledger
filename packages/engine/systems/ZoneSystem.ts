import type { ThemeConfig } from '../config/ThemeSchema.ts';
import type { GameState } from '../core/types.ts';

export function canUnlockZone(state: GameState, zoneId: string, theme: ThemeConfig): boolean {
  const zone = theme.zones.find((z) => z.id === zoneId);
  if (!zone) return false;
  return state.totalGoldEarned >= zone.unlockGold && !state.unlockedZones.includes(zoneId);
}

export function unlockZone(state: GameState, zoneId: string): GameState {
  if (state.unlockedZones.includes(zoneId)) return state;
  return {
    ...state,
    unlockedZones: [...state.unlockedZones, zoneId],
    currentZoneId: zoneId,
  };
}

export function setCurrentZone(state: GameState, zoneId: string): GameState {
  if (!state.unlockedZones.includes(zoneId)) return state;
  return { ...state, currentZoneId: zoneId };
}