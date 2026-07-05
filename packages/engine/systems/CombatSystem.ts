import type { ThemeConfig } from '../config/ThemeSchema.ts';
import type { GameState } from '../core/types.ts';

export function calcPartyDps(state: GameState, theme: ThemeConfig): number {
  let dps = 0;
  for (const party of state.parties) {
    if (party.level <= 0) continue;
    const def = theme.partySlots.find((p) => p.id === party.id);
    if (!def) continue;
    dps += def.baseDps * party.level;
  }
  return dps * getMultiplier(state, theme, 'dps_mult');
}

export function calcGoldPerSec(state: GameState, theme: ThemeConfig): number {
  const zone = theme.zones.find((z) => z.id === state.currentZoneId);
  if (!zone) return 0;
  const dps = calcPartyDps(state, theme);
  const goldMult = getMultiplier(state, theme, 'gold_mult');
  const prestigeMult = 1 + state.prestigePoints * theme.prestige.multiplierPerPoint;
  return (dps / zone.baseEnemyHp) * zone.baseGoldPerKill * goldMult * prestigeMult;
}

export function getMultiplier(
  state: GameState,
  theme: ThemeConfig,
  type: 'gold_mult' | 'dps_mult' | 'death_reduce' | 'offline_mult' | 'prestige_mult',
): number {
  let mult = 1;
  for (const up of state.upgrades) {
    const def = theme.upgrades.find((u) => u.id === up.id);
    if (def?.effectType === type && up.level > 0) {
      mult += def.effectPerLevel * up.level;
    }
  }
  return mult;
}

export function calcPartyCost(def: ThemeConfig['partySlots'][0], level: number): number {
  return Math.floor(def.baseCost * Math.pow(def.costGrowth, level));
}

export function calcUpgradeCost(def: ThemeConfig['upgrades'][0], level: number): number {
  return Math.floor(def.baseCost * Math.pow(def.costGrowth, level));
}

export function rollQuestResult(state: GameState, theme: ThemeConfig): {
  gold: number;
  deaths: string[];
} {
  const zone = theme.zones.find((z) => z.id === state.currentZoneId)!;
  const dps = calcPartyDps(state, theme);
  const goldMult = getMultiplier(state, theme, 'gold_mult');
  const prestigeMult = 1 + state.prestigePoints * theme.prestige.multiplierPerPoint;
  const kills = Math.max(1, Math.floor(dps * zone.questDurationSec / zone.baseEnemyHp));
  const gold = kills * zone.baseGoldPerKill * goldMult * prestigeMult * 1.65;

  const deathReduce = getMultiplier(state, theme, 'death_reduce');
  const effectiveDeath = Math.max(0.02, zone.deathChance / deathReduce);
  const deaths: string[] = [];
  if (state.activeQuest) {
    for (const pid of state.activeQuest.partyIds) {
      const party = state.parties.find((p) => p.id === pid);
      if (party && party.level > 0 && Math.random() < effectiveDeath) {
        deaths.push(pid);
      }
    }
  }
  return { gold, deaths };
}