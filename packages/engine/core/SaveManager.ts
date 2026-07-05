import type { ThemeConfig } from '../config/ThemeSchema.ts';
import type { GameState } from './types.ts';
import { SAVE_VERSION, createInitialState } from './types.ts';

const SAVE_KEY = 'game-lab-save';

export function saveGame(state: GameState, themeId: string): void {
  const payload = { themeId, state: { ...state, lastSaveTime: Date.now() } };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

export function loadGame(theme: ThemeConfig): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { themeId: string; state: GameState };
    if (parsed.themeId !== theme.id || parsed.state.version !== SAVE_VERSION) {
      return null;
    }
    return parsed.state;
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
  );
}

export function exportSave(): string | null {
  return localStorage.getItem(SAVE_KEY);
}