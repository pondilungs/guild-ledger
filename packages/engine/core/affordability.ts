import { formatTime } from './format.ts';

export function calcTimeToAfford(current: number, target: number, rate: number): number | null {
  if (current >= target) return null;
  if (rate <= 0) return null;
  return (target - current) / rate;
}

export interface AffordLabels {
  needIncome: string;
  afterQuest: string;
  earnSuffix: string;
}

export function formatAffordHint(
  current: number,
  target: number,
  rate: number,
  labels: AffordLabels,
  options?: { onQuest?: boolean; earnBased?: boolean },
): string {
  if (current >= target) return '';
  if (rate <= 0) return labels.needIncome;
  const sec = calcTimeToAfford(current, target, rate)!;
  const prefix = options?.onQuest ? labels.afterQuest : '~';
  const suffix = options?.earnBased ? ` ${labels.earnSuffix}` : '';
  return `${prefix}${formatTime(sec)}${suffix}`;
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