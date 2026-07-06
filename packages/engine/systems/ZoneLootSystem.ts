import type { ThemeConfig, ZoneLootCraftDef } from '../config/ThemeSchema.ts';
import type { GameState } from '../core/types.ts';

export function getLootCount(state: GameState, lootId: string): number {
  return state.lootInventory[lootId] ?? 0;
}

export function isLootCraftOwned(state: GameState, craftId: string): boolean {
  return state.lootCraftsOwned.includes(craftId);
}

function craftEffect(
  state: GameState,
  theme: ThemeConfig,
  effectType: ZoneLootCraftDef['effectType'],
): number {
  let total = 0;
  for (const craftId of state.lootCraftsOwned) {
    const def = theme.zoneLootCrafts?.find((c) => c.id === craftId);
    if (def?.effectType === effectType) total += def.effectValue;
  }
  return total;
}

export function getLootCraftGoldBonus(state: GameState, theme: ThemeConfig): number {
  return craftEffect(state, theme, 'gold_mult_perm');
}

export function getLootCraftDpsBonus(state: GameState, theme: ThemeConfig): number {
  return craftEffect(state, theme, 'dps_mult_perm');
}

export function getLootCraftDeathReduceBonus(state: GameState, theme: ThemeConfig): number {
  return craftEffect(state, theme, 'death_reduce_perm');
}

export function getLootCraftOfflineBonus(state: GameState, theme: ThemeConfig): number {
  return craftEffect(state, theme, 'offline_mult_perm');
}

export function getLootCraftQuestGoldBonus(state: GameState, theme: ThemeConfig): number {
  return craftEffect(state, theme, 'quest_gold_perm');
}

export function rollLootForKills(
  state: GameState,
  theme: ThemeConfig,
  zoneId: string,
  kills: number,
): { state: GameState; dropped: { lootId: string; amount: number }[] } {
  const lootDefs = theme.zoneLoot?.filter((l) => l.zoneId === zoneId) ?? [];
  if (lootDefs.length === 0 || kills <= 0) return { state, dropped: [] };

  const inventory = { ...state.lootInventory };
  const dropped: { lootId: string; amount: number }[] = [];
  const wholeKills = Math.floor(kills);
  const frac = kills - wholeKills;

  for (const def of lootDefs) {
    let amount = 0;
    for (let i = 0; i < wholeKills; i++) {
      if (Math.random() < def.dropChancePerKill) amount++;
    }
    if (frac > 0 && Math.random() < frac * def.dropChancePerKill) amount++;
    if (amount <= 0) continue;
    inventory[def.id] = (inventory[def.id] ?? 0) + amount;
    dropped.push({ lootId: def.id, amount });
  }

  if (dropped.length === 0) return { state, dropped: [] };
  return { state: { ...state, lootInventory: inventory }, dropped };
}

export function canCraftLootItem(
  state: GameState,
  theme: ThemeConfig,
  craftId: string,
): boolean {
  const def = theme.zoneLootCrafts?.find((c) => c.id === craftId);
  if (!def) return false;
  if (isLootCraftOwned(state, craftId)) return false;
  if (!state.unlockedZones.includes(def.zoneId)) return false;
  return getLootCount(state, def.lootId) >= def.shardCost;
}

export function craftLootItem(
  state: GameState,
  theme: ThemeConfig,
  craftId: string,
): GameState | null {
  if (!canCraftLootItem(state, theme, craftId)) return null;
  const def = theme.zoneLootCrafts!.find((c) => c.id === craftId)!;
  const inventory = { ...state.lootInventory };
  inventory[def.lootId] = (inventory[def.lootId] ?? 0) - def.shardCost;
  if (inventory[def.lootId] <= 0) delete inventory[def.lootId];

  return {
    ...state,
    lootInventory: inventory,
    lootCraftsOwned: [...state.lootCraftsOwned, craftId],
  };
}

export function hasAnyLootProgress(state: GameState, theme: ThemeConfig): boolean {
  if (state.lootCraftsOwned.length > 0) return true;
  for (const lootId of Object.keys(state.lootInventory)) {
    if ((state.lootInventory[lootId] ?? 0) > 0) return true;
  }
  const lootZones = new Set(theme.zoneLoot?.map((l) => l.zoneId) ?? []);
  return state.unlockedZones.some((z) => lootZones.has(z));
}