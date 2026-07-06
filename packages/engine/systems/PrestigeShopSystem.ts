import type { PrestigeShopItemDef, ThemeConfig } from '../config/ThemeSchema.ts';
import type { GameState } from '../core/types.ts';

export function calcShopCost(def: PrestigeShopItemDef, level: number): number {
  return Math.floor(def.baseCost * Math.pow(def.costGrowth, level));
}

export function getShopLevel(state: GameState, itemId: string): number {
  return state.prestigeShop.find((s) => s.id === itemId)?.level ?? 0;
}

function shopEffect(
  state: GameState,
  theme: ThemeConfig,
  effectType: PrestigeShopItemDef['effectType'],
): number {
  let total = 0;
  for (const entry of state.prestigeShop) {
    if (entry.level <= 0) continue;
    const def = theme.prestigeShop?.find((s) => s.id === entry.id);
    if (def?.effectType === effectType) {
      total += def.effectPerLevel * entry.level;
    }
  }
  return total;
}

export function getShopGoldBonus(state: GameState, theme: ThemeConfig): number {
  return shopEffect(state, theme, 'gold_mult_perm');
}

export function getShopOfflineBonus(state: GameState, theme: ThemeConfig): number {
  return shopEffect(state, theme, 'offline_mult_perm');
}

export function getShopDeathReduceBonus(state: GameState, theme: ThemeConfig): number {
  return shopEffect(state, theme, 'death_reduce_perm');
}

export function getShopStartingGoldBonus(state: GameState, theme: ThemeConfig): number {
  return Math.floor(shopEffect(state, theme, 'start_gold_perm'));
}

export function canBuyShopItem(
  state: GameState,
  theme: ThemeConfig,
  itemId: string,
): boolean {
  const def = theme.prestigeShop?.find((s) => s.id === itemId);
  if (!def) return false;
  const level = getShopLevel(state, itemId);
  if (level >= def.maxLevel) return false;
  const cost = calcShopCost(def, level);
  return state.prestigePoints >= cost;
}

export function buyShopItem(
  state: GameState,
  theme: ThemeConfig,
  itemId: string,
): GameState | null {
  if (!canBuyShopItem(state, theme, itemId)) return null;
  const def = theme.prestigeShop!.find((s) => s.id === itemId)!;
  const level = getShopLevel(state, itemId);
  const cost = calcShopCost(def, level);

  const prestigeShop = state.prestigeShop.map((entry) =>
    entry.id === itemId ? { ...entry, level: entry.level + 1 } : entry,
  );

  return {
    ...state,
    prestigePoints: state.prestigePoints - cost,
    prestigeShop,
  };
}