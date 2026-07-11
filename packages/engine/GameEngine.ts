import type { ThemeConfig } from './config/ThemeSchema.ts';
import { GameLoop } from './core/GameLoop.ts';
import { calcOfflineEarnings } from './core/OfflineCalc.ts';
import {
  saveGame,
  loadGame,
  resetGame,
  exportSave as exportSaveData,
  importSave as importSaveData,
} from './core/SaveManager.ts';
import type { GameState } from './core/types.ts';
import { createInitialState } from './core/types.ts';
import { trackEvent, checkDayReturn } from './core/Analytics.ts';
import {
  calcGoldPerSec,
  calcPartyDps,
  calcPartyCost,
  calcUpgradeCost,
  rollQuestResult,
} from './systems/CombatSystem.ts';
import {
  getClickBoostConfig,
  calcTapGold,
  type ClickBoostStatus,
} from './systems/ClickBoostSystem.ts';
import { canUnlockZone, unlockZone, setCurrentZone } from './systems/ZoneSystem.ts';
import { canPrestige, doPrestige, calcPrestigePoints } from './systems/PrestigeSystem.ts';
import { buyShopItem } from './systems/PrestigeShopSystem.ts';
import { craftLootItem, rollLootForKills } from './systems/ZoneLootSystem.ts';
import { createLogEntry, pushLog, type LogEntry } from './core/EventLog.ts';
import type { GameLocale } from './i18n/types.ts';

export type GameListener = () => void;
export type LocaleProvider = () => GameLocale;

export interface FlavorText {
  questCompleteMsg: (gold: number, deaths: number, zoneName: string) => string;
  questDeathMsg: (partyName: string) => string;
  hireMsg: (partyName: string, level: number) => string;
  zoneUnlockMsg: (zoneName: string) => string;
  questStartMsg: (zoneName: string, partyCount: number) => string;
  upgradeMsg: (name: string, level: number) => string;
  offlineMsg: (gold: number, hours: number) => string;
  prestigeMsg: (points: number) => string;
  shopBuyMsg: (name: string, level: number) => string;
  lootDropMsg: (lootName: string, amount: number, zoneName: string) => string;
  lootCraftMsg: (craftName: string) => string;
  clickBoostMsg?: (multiplier: number, durationSec: number) => string;
}

export class GameEngine {
  readonly theme: ThemeConfig;
  private readonly getLocale: LocaleProvider;
  state: GameState;
  private loop: GameLoop;
  private listeners = new Set<GameListener>();
  private profileSyncHooks = new Set<() => void>();
  private sessionStart = Date.now();
  offlineEarnings: { gold: number; seconds: number; capped: boolean } | null = null;
  eventLog: LogEntry[] = [];
  clickBoostLeft = 0;
  clickCooldownLeft = 0;
  lastTapGold = 0;

  constructor(theme: ThemeConfig, getLocale: LocaleProvider) {
    this.theme = theme;
    this.getLocale = getLocale;
    const saved = loadGame(theme);
    const hadSave = !!saved;
    this.state = saved ?? createInitialState(
      theme.partySlots.map((p) => p.id),
      theme.upgrades.map((u) => u.id),
      theme.zones[0].id,
      theme.startingGold,
      theme.startingParties,
      theme.prestigeShop?.map((s) => s.id) ?? [],
    );
    this.loop = new GameLoop((dt) => this.tick(dt));
    this.initSession();
    const logs = this.getLocale().logs;
    this.log(hadSave ? logs.welcomeBack : logs.welcomeNew, 'neutral');
  }

  private zoneName(zoneId: string, fallback: string): string {
    return this.getLocale().zones[zoneId]?.name ?? fallback;
  }

  private partyName(partyId: string, fallback: string): string {
    return this.getLocale().parties[partyId]?.name ?? fallback;
  }

  private upgradeName(upgradeId: string, fallback: string): string {
    return this.getLocale().upgrades[upgradeId]?.name ?? fallback;
  }

  private log(message: string, tone: LogEntry['tone'] = 'neutral'): void {
    this.eventLog = pushLog(this.eventLog, createLogEntry(message, tone));
  }

  private initSession(): void {
    const loaded = loadGame(this.theme);
    if (loaded) {
      const offline = calcOfflineEarnings(loaded, this.theme);
      if (offline.gold > 0) {
        this.offlineEarnings = offline;
      }
    }
    checkDayReturn(this.state.firstPlayTime);
    const ref = new URLSearchParams(window.location.search).get('ref') ?? 'direct';
    trackEvent({ type: 'session_start', themeId: this.theme.id, ref });
    this.sessionStart = Date.now();
  }

  start(): void {
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
    this.state.totalPlayTime += (Date.now() - this.sessionStart) / 1000;
    trackEvent({ type: 'session_end', durationSec: (Date.now() - this.sessionStart) / 1000 });
    saveGame(this.state, this.theme.id);
  }

  subscribe(fn: GameListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onProfileSync(fn: () => void): () => void {
    this.profileSyncHooks.add(fn);
    return () => this.profileSyncHooks.delete(fn);
  }

  private syncProfile(): void {
    for (const fn of this.profileSyncHooks) fn();
  }

  notify(): void {
    for (const fn of this.listeners) fn();
  }

  private tick(dt: number): void {
    this.tickClickBoost(dt);

    if (this.state.activeQuest) {
      this.state.activeQuest.progress += dt;
      if (this.state.activeQuest.progress >= this.state.activeQuest.durationSec) {
        this.completeQuest();
      }
    } else {
      const gps = calcGoldPerSec(this.state, this.theme);
      if (gps > 0) {
        this.addGold(gps * dt * this.getClickBoostMult());
        const zone = this.theme.zones.find((z) => z.id === this.state.currentZoneId);
        if (zone) {
          const dps = calcPartyDps(this.state, this.theme);
          const kills = (dps / zone.baseEnemyHp) * dt;
          this.applyLootDrops(this.state.currentZoneId, kills);
        }
      }
    }
    this.state.totalPlayTime += dt;
    this.notify();
  }

  private tickClickBoost(dt: number): void {
    const wasActive = this.clickBoostLeft > 0;
    if (this.clickBoostLeft > 0) {
      this.clickBoostLeft = Math.max(0, this.clickBoostLeft - dt);
      if (this.clickBoostLeft === 0) {
        this.clickCooldownLeft = getClickBoostConfig(this.theme.clickBoost).cooldownSec;
      }
    } else if (this.clickCooldownLeft > 0) {
      this.clickCooldownLeft = Math.max(0, this.clickCooldownLeft - dt);
    }
    if (wasActive && this.clickBoostLeft === 0) this.notify();
  }

  clickBoost(): void {
    const config = getClickBoostConfig(this.theme.clickBoost);
    const gps = calcGoldPerSec(this.state, this.theme);
    const tapGold = calcTapGold(gps, config);
    this.addGold(tapGold);
    this.lastTapGold = tapGold;

    const hasIncome = calcPartyDps(this.state, this.theme) > 0;
    if (hasIncome && this.clickBoostLeft <= 0 && this.clickCooldownLeft <= 0) {
      this.clickBoostLeft = config.durationSec;
      const flavor = this.getLocale().flavor;
      const msg = flavor.clickBoostMsg?.(config.multiplier, config.durationSec)
        ?? `+${config.multiplier}×`;
      this.log(msg, 'profit');
      trackEvent({ type: 'click_boost_start', multiplier: config.multiplier });
    }

    this.notify();
  }

  getClickBoostMult(): number {
    if (this.clickBoostLeft <= 0) return 1;
    return getClickBoostConfig(this.theme.clickBoost).multiplier;
  }

  getClickBoostStatus(): ClickBoostStatus {
    const config = getClickBoostConfig(this.theme.clickBoost);
    return {
      active: this.clickBoostLeft > 0,
      boostLeft: this.clickBoostLeft,
      cooldownLeft: this.clickCooldownLeft,
      multiplier: config.multiplier,
    };
  }

  collectOffline(): void {
    if (!this.offlineEarnings) return;
    const { gold, seconds } = this.offlineEarnings;
    this.addGold(gold);
    this.log(this.getLocale().flavor.offlineMsg(gold, seconds / 3600), 'profit');
    this.offlineEarnings = null;
    this.persist();
    this.notify();
  }

  hireParty(partyId: string): boolean {
    const def = this.theme.partySlots.find((p) => p.id === partyId);
    const party = this.state.parties.find((p) => p.id === partyId);
    if (!def || !party) return false;
    if (!this.state.unlockedZones.includes(def.unlockZone)) return false;
    const cost = calcPartyCost(def, party.level);
    if (this.state.gold < cost) return false;
    this.state.gold -= cost;
    party.level += 1;
    this.log(this.getLocale().flavor.hireMsg(this.partyName(partyId, def.name), party.level), 'neutral');
    trackEvent({ type: 'party_hire', partyId, level: party.level });
    this.persist();
    this.notify();
    return true;
  }

  buyUpgrade(upgradeId: string): boolean {
    const def = this.theme.upgrades.find((u) => u.id === upgradeId);
    const up = this.state.upgrades.find((u) => u.id === upgradeId);
    if (!def || !up || up.level >= def.maxLevel) return false;
    if (def.unlockZone && !this.state.unlockedZones.includes(def.unlockZone)) return false;
    const cost = calcUpgradeCost(def, up.level);
    if (this.state.gold < cost) return false;
    this.state.gold -= cost;
    up.level += 1;
    this.log(this.getLocale().flavor.upgradeMsg(this.upgradeName(upgradeId, def.name), up.level), 'milestone');
    trackEvent({ type: 'upgrade_buy', upgradeId, level: up.level });
    this.persist();
    this.notify();
    return true;
  }

  startQuest(): boolean {
    if (this.state.activeQuest) return false;
    const activeParties = this.state.parties.filter((p) => p.level > 0);
    if (activeParties.length === 0) return false;
    const zone = this.theme.zones.find((z) => z.id === this.state.currentZoneId)!;
    this.state.activeQuest = {
      zoneId: zone.id,
      partyIds: activeParties.map((p) => p.id),
      startedAt: Date.now(),
      durationSec: zone.questDurationSec,
      progress: 0,
    };
    this.log(
      this.getLocale().flavor.questStartMsg(this.zoneName(zone.id, zone.name), activeParties.length),
      'neutral',
    );
    this.notify();
    return true;
  }

  private completeQuest(): void {
    const quest = this.state.activeQuest;
    if (!quest) return;
    const zone = this.theme.zones.find((z) => z.id === quest.zoneId)!;
    const result = rollQuestResult(this.state, this.theme);
    this.addGold(result.gold);
    const dps = calcPartyDps(this.state, this.theme);
    const kills = Math.max(1, (dps * quest.durationSec) / zone.baseEnemyHp);
    this.applyLootDrops(quest.zoneId, kills);
    for (const pid of result.deaths) {
      const party = this.state.parties.find((p) => p.id === pid);
      const def = this.theme.partySlots.find((p) => p.id === pid);
      if (party && party.level > 0) {
        party.level -= 1;
        if (def) this.log(this.getLocale().flavor.questDeathMsg(this.partyName(pid, def.name)), 'danger');
      }
    }
    this.log(
      this.getLocale().flavor.questCompleteMsg(
        result.gold,
        result.deaths.length,
        this.zoneName(zone.id, zone.name),
      ),
      'profit',
    );
    trackEvent({
      type: 'quest_complete',
      zoneId: quest.zoneId,
      gold: result.gold,
      deaths: result.deaths.length,
    });
    this.state.activeQuest = null;
    this.persist();
    this.notify();
  }

  tryUnlockZone(zoneId: string): boolean {
    if (!canUnlockZone(this.state, zoneId, this.theme)) return false;
    this.state = unlockZone(this.state, zoneId, this.theme);
    const zone = this.theme.zones.find((z) => z.id === zoneId)!;
    this.log(this.getLocale().flavor.zoneUnlockMsg(this.zoneName(zoneId, zone.name)), 'milestone');
    trackEvent({ type: 'zone_unlock', zoneId });
    this.persist();
    this.notify();
    return true;
  }

  selectZone(zoneId: string): boolean {
    if (this.state.activeQuest) return false;
    if (!this.state.unlockedZones.includes(zoneId)) return false;
    this.state = setCurrentZone(this.state, zoneId);
    this.persist();
    this.notify();
    return true;
  }

  prestige(): boolean {
    if (!canPrestige(this.state, this.theme)) return false;
    const points = calcPrestigePoints(this.state, this.theme);
    this.state = doPrestige(this.state, this.theme);
    this.log(this.getLocale().flavor.prestigeMsg(points), 'milestone');
    trackEvent({ type: 'prestige', points, total: this.state.prestigeLifetime });
    this.persist();
    this.syncProfile();
    this.notify();
    return true;
  }

  private applyLootDrops(zoneId: string, kills: number): void {
    const { state, dropped } = rollLootForKills(this.state, this.theme, zoneId, kills);
    if (dropped.length === 0) return;
    this.state = state;
    const zone = this.theme.zones.find((z) => z.id === zoneId);
    const zoneName = zone ? this.zoneName(zoneId, zone.name) : zoneId;
    for (const drop of dropped) {
      const def = this.theme.zoneLoot?.find((l) => l.id === drop.lootId);
      const lootName = this.getLocale().zoneLoot[drop.lootId]?.name ?? def?.name ?? drop.lootId;
      this.log(
        this.getLocale().flavor.lootDropMsg(lootName, drop.amount, zoneName),
        'milestone',
      );
    }
  }

  craftZoneLoot(craftId: string): boolean {
    const next = craftLootItem(this.state, this.theme, craftId);
    if (!next) return false;
    const def = this.theme.zoneLootCrafts?.find((c) => c.id === craftId);
    if (def) {
      const name = this.getLocale().zoneLootCrafts[def.id]?.name ?? def.name;
      this.log(this.getLocale().flavor.lootCraftMsg(name), 'milestone');
    }
    this.state = next;
    this.persist();
    this.notify();
    return true;
  }

  buyPrestigeShop(itemId: string): boolean {
    const next = buyShopItem(this.state, this.theme, itemId);
    if (!next) return false;
    const def = this.theme.prestigeShop?.find((s) => s.id === itemId);
    const entry = next.prestigeShop.find((s) => s.id === itemId);
    if (def && entry) {
      const name = this.getLocale().prestigeShop[def.id]?.name ?? def.name;
      this.log(this.getLocale().flavor.shopBuyMsg(name, entry.level), 'milestone');
    }
    this.state = next;
    this.persist();
    this.notify();
    return true;
  }

  reset(): void {
    this.state = resetGame(this.theme);
    this.offlineEarnings = null;
    this.eventLog = [];
    this.clickBoostLeft = 0;
    this.clickCooldownLeft = 0;
    this.lastTapGold = 0;
    this.log(this.getLocale().logs.reset, 'neutral');
    this.notify();
  }

  exportSave(): string | null {
    this.persistNow();
    return exportSaveData();
  }

  importSave(raw: string): boolean {
    const state = importSaveData(raw, this.theme);
    if (!state) return false;
    this.state = state;
    this.offlineEarnings = null;
    this.eventLog = [];
    this.clickBoostLeft = 0;
    this.clickCooldownLeft = 0;
    this.lastTapGold = 0;
    this.log(this.getLocale().logs.welcomeBack, 'neutral');
    this.notify();
    return true;
  }

  private addGold(amount: number): void {
    this.state.gold += amount;
    this.state.totalGoldEarned += amount;
  }

  persistNow(): void {
    saveGame(this.state, this.theme.id);
  }

  private persist(): void {
    this.persistNow();
  }

  getGoldPerSec(): number {
    return calcGoldPerSec(this.state, this.theme) * this.getClickBoostMult();
  }

  getBaseGoldPerSec(): number {
    return calcGoldPerSec(this.state, this.theme);
  }
}