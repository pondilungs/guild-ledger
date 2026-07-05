import type { ThemeConfig } from '../config/ThemeSchema.ts';
import type { GameState } from '../core/types.ts';

export function canUnlockZone(state: GameState, zoneId: string, theme: ThemeConfig): boolean {
  const zone = theme.zones.find((z) => z.id === zoneId);
  if (!zone) return false;
  return !state.unlockedZones.includes(zoneId) && state.gold >= zone.unlockGold;
}

export function unlockZone(state: GameState, zoneId: string, theme: ThemeConfig): GameState {
  if (state.unlockedZones.includes(zoneId)) return state;
  const zone = theme.zones.find((z) => z.id === zoneId);
  if (!zone || state.gold < zone.unlockGold) return state;
  return {
    ...state,
    gold: state.gold - zone.unlockGold,
    unlockedZones: [...state.unlockedZones, zoneId],
  };
}

export function setCurrentZone(state: GameState, zoneId: string): GameState {
  if (!state.unlockedZones.includes(zoneId)) return state;
  return { ...state, currentZoneId: zoneId };
}