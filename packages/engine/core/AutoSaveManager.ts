import type { GameEngine } from '../GameEngine.ts';
import type { ProfileManager } from './ProfileManager.ts';
import type { LeaderboardClient } from '../services/LeaderboardClient.ts';

export class AutoSaveManager {
  private localTimer: ReturnType<typeof setInterval> | null = null;
  private syncTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private engine: GameEngine,
    private profile: ProfileManager,
    private leaderboard: LeaderboardClient,
    private localIntervalMs = 30_000,
    private syncIntervalMs = 60_000,
  ) {}

  start(): void {
    this.stop();
    this.localTimer = setInterval(() => this.tickLocal(), this.localIntervalMs);
    this.syncTimer = setInterval(() => this.tickSync(), this.syncIntervalMs);
  }

  stop(): void {
    if (this.localTimer) clearInterval(this.localTimer);
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.localTimer = null;
    this.syncTimer = null;
  }

  flush(): void {
    this.tickLocal();
    void this.tickSync();
  }

  private tickLocal(): void {
    this.engine.persistNow();
    this.profile.updateFromState(this.engine.state, this.engine.theme);
  }

  private async tickSync(): Promise<void> {
    if (!this.leaderboard.isOnline() || !this.profile.hasUsername()) return;
    this.profile.updateFromState(this.engine.state, this.engine.theme);
    await this.leaderboard.upsertProfile(this.profile.current);
  }
}