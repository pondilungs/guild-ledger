import { formatTime } from './format.ts';

export function calcTimeToAfford(current: number, target: number, rate: number): number | null {
  if (current >= target) return null;
  if (rate <= 0) return null;
  return (target - current) / rate;
}

export function formatAffordHint(
  current: number,
  target: number,
  rate: number,
  options?: { onQuest?: boolean; earnBased?: boolean },
): string {
  if (current >= target) return '';
  if (rate <= 0) return 'Gelir gerekli';
  const sec = calcTimeToAfford(current, target, rate)!;
  const prefix = options?.onQuest ? 'Görev sonrası ~' : '~';
  const label = options?.earnBased ? 'kazanım' : '';
  return `${prefix}${formatTime(sec)}${label ? ` ${label}` : ''}`;
}

export interface PurchaseOption {
  id: string;
  kind: 'party' | 'upgrade';
  cost: number;
  affordable: boolean;
  timeSec: number | null;
}

export function pickNextPurchase(options: PurchaseOption[]): string | null {
  const affordable = options.filter((o) => o.affordable);
  if (affordable.length > 0) {
    return affordable.reduce((a, b) => (a.cost <= b.cost ? a : b)).id;
  }
  const timed = options.filter((o) => o.timeSec !== null);
  if (timed.length === 0) return null;
  return timed.reduce((a, b) => (a.timeSec! <= b.timeSec! ? a : b)).id;
}