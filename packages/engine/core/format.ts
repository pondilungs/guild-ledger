export function formatNumber(n: number): string {
  if (n < 1000) return Math.floor(n).toString();
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n < 1e12) return `${(n / 1e9).toFixed(2)}B`;
  return n.toExponential(2);
}

export function formatTime(sec: number): string {
  if (sec < 60) return `${Math.ceil(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.ceil(sec % 60);
  return `${m}m ${s}s`;
}