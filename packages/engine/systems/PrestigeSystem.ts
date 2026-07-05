import type { ThemeConfig } from '../config/ThemeSchema.ts';
import type { GameState } from '../core/types.ts';
import { createInitialState } from '../core/types.ts';

export function calcPrestigePoints(state: GameState, theme: ThemeConfig): number {
  if (state.totalGoldEarned < theme.prestige.minGoldEarned) return 0;
  const base = Math.floor(Math.sqrt(state.totalGoldEarned / theme.prestige.minGoldEarned));
  const prestigeMult = 1 + getPrestigeUpgradeBonus(state, theme);
  return Math.floor(base * prestigeMult);
}

function getPrestigeUpgradeBonus(state: GameState, theme: ThemeConfig): number {
  let bonus = 0;
  for (const up of state.upgrades) {
    const def = theme.upgrades.find((u) => u.id === up.id);
    if (def?.effectType === 'prestige_mult') {
      bonus += def.effectPerLevel * up.level;
    }
  }
  return bonus;
}

export function canPrestige(state: GameState, theme: ThemeConfig): boolean {
  return calcPrestigePoints(state, theme) > 0;
}

export function doPrestige(state: GameState, theme: ThemeConfig): GameState {
  const points = calcPrestigePoints(state, theme);
  if (points <= 0) return state;

  const fresh = createInitialState(
    theme.partySlots.map((p) => p.id),
    theme.upgrades.map((u) => u.id),
    theme.zones[0].id,
    theme.startingGold,
    theme.startingParties,
  );

  return {
    ...fresh,
    prestigePoints: state.prestigePoints + points,
    prestigeCount: state.prestigeCount + 1,
    firstPlayTime: state.firstPlayTime,
    totalPlayTime: state.totalPlayTime,
    lastSaveTime: Date.now(),
  };
}