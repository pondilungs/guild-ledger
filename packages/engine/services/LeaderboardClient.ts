import type { PlayerProfile } from '../core/ProfileManager.ts';

export interface LeaderboardEntry {
  rank: number;
  profile: PlayerProfile;
}

const CACHE_KEY = 'game-lab-leaderboard-cache';

export function resolveLeaderboardUrl(): string {
  const envUrl = import.meta.env.VITE_LEADERBOARD_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (import.meta.env.DEV) return '/api';
  return '';
}

export class LeaderboardClient {
  private cache: LeaderboardEntry[] = [];

  constructor(private readonly baseUrl: string) {
    this.cache = this.loadCache();
  }

  isOnline(): boolean {
    return this.baseUrl.length > 0;
  }

  getCached(): LeaderboardEntry[] {
    return this.cache;
  }

  async fetchLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
    if (!this.isOnline()) return this.cache;
    try {
      const res = await fetch(`${this.baseUrl}/leaderboard?limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as LeaderboardEntry[];
      this.cache = data;
      this.saveCache(data);
      return data;
    } catch {
      return this.cache;
    }
  }

  async fetchProfile(id: string): Promise<PlayerProfile | null> {
    if (!this.isOnline()) {
      const hit = this.cache.find((e) => e.profile.id === id);
      return hit?.profile ?? null;
    }
    try {
      const res = await fetch(`${this.baseUrl}/profiles/${id}`);
      if (!res.ok) return null;
      return (await res.json()) as PlayerProfile;
    } catch {
      return null;
    }
  }

  async upsertProfile(profile: PlayerProfile): Promise<boolean> {
    if (!this.isOnline()) return false;
    try {
      const res = await fetch(`${this.baseUrl}/profiles/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private loadCache(): LeaderboardEntry[] {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as LeaderboardEntry[];
    } catch {
      return [];
    }
  }

  private saveCache(entries: LeaderboardEntry[]): void {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  }
}