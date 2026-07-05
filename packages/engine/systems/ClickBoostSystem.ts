import type { ClickBoostDef } from '../config/ThemeSchema.ts';

export const DEFAULT_CLICK_BOOST: ClickBoostDef = {
  multiplier: 2,
  durationSec: 30,
  cooldownSec: 30,
  tapGoldFactor: 0.08,
};

export interface ClickBoostStatus {
  active: boolean;
  boostLeft: number;
  cooldownLeft: number;
  multiplier: number;
}

export function getClickBoostConfig(config?: ClickBoostDef): ClickBoostDef {
  return config ?? DEFAULT_CLICK_BOOST;
}

export function calcTapGold(gps: number, config: ClickBoostDef): number {
  if (gps <= 0) return 1;
  return Math.max(1, gps * config.tapGoldFactor);
}