import type { ThemeConfig } from '../config/ThemeSchema.ts';
import type { GameState } from './types.ts';
import { calcGoldPerSec } from '../systems/CombatSystem.ts';
import { getShopOfflineBonus } from '../systems/PrestigeShopSystem.ts';
import { getLootCraftOfflineBonus } from '../systems/ZoneLootSystem.ts';

export interface OfflineResult {
  gold: number;
  seconds: number;
  capped: boolean;
}

export function calcOfflineEarnings(
  state: GameState,
  theme: ThemeConfig,
  now = Date.now(),
): OfflineResult {
  const elapsedSec = (now - state.lastSaveTime) / 1000;
  const capSec = theme.offlineCapHours * 3600;
  const effectiveSec = Math.min(elapsedSec, capSec);
  const gps = calcGoldPerSec(state, theme);
  const offlineMult = getOfflineMult(state, theme);
  const gold = gps * effectiveSec * offlineMult * 0.5;
  return {
    gold,
    seconds: effectiveSec,
    capped: elapsedSec > capSec,
  };
}

function getOfflineMult(state: GameState, theme: ThemeConfig): number {
  let mult = 1;
  for (const up of state.upgrades) {
    const def = theme.upgrades.find((u) => u.id === up.id);
    if (def?.effectType === 'offline_mult') {
      mult += def.effectPerLevel * up.level;
    }
  }
  return mult + getShopOfflineBonus(state, theme) + getLootCraftOfflineBonus(state, theme);
}