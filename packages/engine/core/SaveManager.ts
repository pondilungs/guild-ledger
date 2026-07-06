import type { ThemeConfig } from '../config/ThemeSchema.ts';
import type { GameState } from './types.ts';
import { SAVE_VERSION, createInitialState } from './types.ts';

const SAVE_KEY = 'game-lab-save';

export function saveGame(state: GameState, themeId: string): void {
  const payload = { themeId, state: { ...state, lastSaveTime: Date.now() } };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

export function migrateState(state: GameState, theme: ThemeConfig): GameState {
  const knownParties = new Set(state.parties.map((p) => p.id));
  const parties = [...state.parties];
  for (const def of theme.partySlots) {
    if (!knownParties.has(def.id)) {
      parties.push({ id: def.id, level: 0, active: false });
    }
  }

  const knownUpgrades = new Set(state.upgrades.map((u) => u.id));
  const upgrades = [...state.upgrades];
  for (const def of theme.upgrades) {
    if (!knownUpgrades.has(def.id)) {
      upgrades.push({ id: def.id, level: 0 });
    }
  }

  const prestigeLifetime = state.prestigeLifetime ?? state.prestigePoints ?? 0;
  const prestigePoints = state.prestigePoints ?? prestigeLifetime;

  const knownShop = new Set((state.prestigeShop ?? []).map((s) => s.id));
  const prestigeShop = [...(state.prestigeShop ?? [])];
  for (const def of theme.prestigeShop ?? []) {
    if (!knownShop.has(def.id)) {
      prestigeShop.push({ id: def.id, level: 0 });
    }
  }

  return {
    ...state,
    parties,
    upgrades,
    prestigeLifetime,
    prestigePoints,
    prestigeShop,
    lootInventory: state.lootInventory ?? {},
    lootCraftsOwned: state.lootCraftsOwned ?? [],
  };
}

export function loadGame(theme: ThemeConfig): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { themeId: string; state: GameState };
    if (parsed.themeId !== theme.id || parsed.state.version !== SAVE_VERSION) {
      return null;
    }
    return migrateState(parsed.state, theme);
  } catch {
    return null;
  }
}

export function resetGame(theme: ThemeConfig): GameState {
  localStorage.removeItem(SAVE_KEY);
  return createInitialState(
    theme.partySlots.map((p) => p.id),
    theme.upgrades.map((u) => u.id),
    theme.zones[0].id,
    theme.startingGold,
    theme.startingParties,
    theme.prestigeShop?.map((s) => s.id) ?? [],
  );
}

export function exportSave(): string | null {
  return localStorage.getItem(SAVE_KEY);
}