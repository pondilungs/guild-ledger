import type { GameEngine } from '../GameEngine.ts';
import { formatNumber, formatTime } from '../core/format.ts';
import { formatAffordHint, pickNextPurchase, type PurchaseOption } from '../core/affordability.ts';
import { TutorialManager } from '../core/TutorialManager.ts';
import { renderTutorialOverlay, applyTutorialHighlight } from './TutorialOverlay.ts';
import { calcPartyCost, calcUpgradeCost } from '../systems/CombatSystem.ts';
import { canUnlockZone } from '../systems/ZoneSystem.ts';
import { canPrestige, calcPrestigePoints } from '../systems/PrestigeSystem.ts';
import { calcShopCost, canBuyShopItem, getShopLevel } from '../systems/PrestigeShopSystem.ts';
import {
  canCraftLootItem,
  getLootCount,
  getZoneLootPairs,
  isLootCraftOwned,
} from '../systems/ZoneLootSystem.ts';
import type { LocaleManager, LocaleId } from '../core/LocaleManager.ts';
import type { GameLocale } from '../i18n/types.ts';
import type { GameState } from '../core/types.ts';
import type { ThemeConfig } from '../config/ThemeSchema.ts';
import type { ClickBoostStatus } from '../systems/ClickBoostSystem.ts';
import { shouldShowPatchNotes, dismissPatchNotes } from '../core/PatchNotes.ts';
import { renderSeal, ensureSealSprite } from './icons.ts';

export interface GameUIOptions {
  localeManager: LocaleManager;
  getLocale: () => GameLocale;
  getDisplayUsername: () => string;
}

interface RenderContext {
  engine: GameEngine;
  state: GameState;
  theme: ThemeConfig;
  locale: GameLocale;
  ui: GameLocale['ui'];
  baseGps: number;
  gps: number;
  clickStatus: ClickBoostStatus;
  onQuest: boolean;
  nextBuyId: string | null;
  currentLocale: LocaleId;
  tutorial: TutorialManager;
  displayUsername: string;
  showPatchNotes: boolean;
}

function renderBrandTitle(title: string): string {
  const words = title.split(' ');
  if (words.length < 2) return title;
  const last = words.pop();
  return `${words.join(' ')} <span class="brand-accent">${last}</span>`;
}

function isUpgradeUnlocked(
  def: ThemeConfig['upgrades'][0],
  state: GameState,
): boolean {
  return !def.unlockZone || state.unlockedZones.includes(def.unlockZone);
}

function affordHintText(
  current: number,
  cost: number,
  gps: number,
  ui: GameLocale['ui'],
  onQuest: boolean,
  earnBased = false,
): string {
  return formatAffordHint(current, cost, gps, ui, { onQuest, earnBased });
}

function affordHintHtml(
  current: number,
  cost: number,
  gps: number,
  ui: GameLocale['ui'],
  onQuest: boolean,
  affordKey: string,
  earnBased = false,
): string {
  const text = affordHintText(current, cost, gps, ui, onQuest, earnBased);
  return text ? `<span class="afford-hint" data-afford="${affordKey}">${text}</span>` : `<span class="afford-hint" data-afford="${affordKey}"></span>`;
}

function computeStructureKey(ctx: RenderContext): string {
  const { state, theme, engine, tutorial, baseGps, currentLocale } = ctx;
  return [
    currentLocale,
    ctx.displayUsername,
    !!engine.offlineEarnings,
    !!state.activeQuest,
    baseGps > 0,
    state.prestigeLifetime > 0,
    state.prestigePoints,
    state.prestigeShop.map((s) => `${s.id}:${s.level}`).join(','),
    state.currentZoneId,
    state.unlockedZones.join(','),
    state.parties.map((p) => p.level).join(','),
    state.upgrades.map((u) => `${u.id}:${u.level}`).join(','),
    canPrestige(state, theme),
    tutorial.active ? tutorial.current?.id ?? '' : 'off',
    engine.eventLog.length,
    state.parties.some((p) => p.level > 0) ? 1 : 0,
    theme.partySlots.map((def) => (state.unlockedZones.includes(def.unlockZone) ? 1 : 0)).join(''),
    theme.zones.map((z) => (state.unlockedZones.includes(z.id) ? 1 : 0)).join(''),
    ctx.showPatchNotes ? 1 : 0,
    theme.upgrades.map((def) => (isUpgradeUnlocked(def, state) ? 1 : 0)).join(''),
  ].join('|');
}

function buildPrestigeShopHTML(ctx: RenderContext): string {
  const { state, theme, locale, ui } = ctx;
  const items = theme.prestigeShop ?? [];
  if (items.length === 0) return '';

  const cards = items.map((def, i) => {
    const loc = locale.prestigeShop[def.id];
    const level = getShopLevel(state, def.id);
    const maxed = level >= def.maxLevel;
    const cost = calcShopCost(def, level);
    const canBuy = canBuyShopItem(state, theme, def.id);
    const reqNumber = `REQ-${String(i + 1).padStart(2, '0')}`;
    return `
      <div class="item-card shop-item-card ${maxed ? 'maxed-card' : ''}" data-shop-card="${def.id}">
        <span class="shop-req-number">${reqNumber}</span>
        ${maxed ? '<span class="shop-approved-stamp">APPROVED</span>' : ''}
        <div class="item-header">
          <span class="item-icon">${renderSeal(def.icon)}</span>
          <div>
            <strong>${loc?.name ?? def.name}</strong>
            <span class="item-level">${level}/${def.maxLevel}</span>
          </div>
        </div>
        <p class="item-desc">${loc?.description ?? def.description}</p>
        ${maxed
          ? ''
          : `<div class="buy-row">
              <button class="btn btn-sm ${canBuy ? 'btn-ready' : 'disabled'}"
                data-action="buy-prestige-shop" data-shop-item="${def.id}"
                ${canBuy ? '' : 'disabled'}>
                ${ui.buyWithPrestige} (${cost} ${renderSeal('rank', 'seal-inline')})
              </button>
            </div>`
        }
      </div>
    `;
  }).join('');

  return `
    <div class="modal-backdrop" data-prestige-shop data-modal-backdrop>
      <div class="modal-card modal-prestige-shop" role="dialog">
        <div class="modal-header">
          <h2 class="modal-title">${ui.prestigeShop}</h2>
          <button class="modal-close" data-action="close-prestige-shop" type="button" aria-label="${ui.close}">×</button>
        </div>
        <p class="modal-desc">${ui.prestigeShopDesc}</p>
        <div class="prestige-shop-balance">
          <span>${ui.prestigeBalance}: <strong data-bind="shop-balance">${state.prestigePoints}</strong> ${renderSeal('rank', 'seal-inline')}</span>
          <span>${ui.prestigeLifetime}: <strong data-bind="shop-lifetime">${state.prestigeLifetime}</strong></span>
        </div>
        <div class="prestige-shop-list">${cards}</div>
      </div>
    </div>
  `;
}

function computeShopStructureKey(ctx: RenderContext): string {
  return `${ctx.currentLocale}|${(ctx.theme.prestigeShop ?? []).map((s) => s.id).join(',')}`;
}

function patchPrestigeShop(root: HTMLElement, ctx: RenderContext): void {
  const { state, theme, ui } = ctx;

  setText(root.querySelector('[data-bind="shop-balance"]'), formatNumber(state.prestigePoints));
  setText(root.querySelector('[data-bind="shop-lifetime"]'), String(state.prestigeLifetime));

  for (const def of theme.prestigeShop ?? []) {
    const level = getShopLevel(state, def.id);
    const maxed = level >= def.maxLevel;
    const card = root.querySelector(`[data-shop-card="${def.id}"]`);
    if (!card) continue;

    const levelEl = card.querySelector('.item-level');
    if (levelEl) {
      const levelText = `${level}/${def.maxLevel}`;
      if (levelEl.textContent !== levelText) levelEl.textContent = levelText;
    }

    if (maxed) {
      card.classList.add('maxed-card');
      if (!card.querySelector('.shop-approved-stamp')) {
        const buyRow = card.querySelector('.buy-row');
        const stamp = document.createElement('span');
        stamp.className = 'shop-approved-stamp';
        stamp.textContent = 'APPROVED';
        if (buyRow) buyRow.replaceWith(stamp);
        else card.appendChild(stamp);
      }
      continue;
    }

    const cost = calcShopCost(def, level);
    const canBuy = canBuyShopItem(state, theme, def.id);
    const btn = card.querySelector('[data-action="buy-prestige-shop"]') as HTMLButtonElement | null;
    if (!btn) continue;

    const ready = canBuy;
    if (btn.disabled !== !ready) btn.disabled = !ready;
    btn.classList.toggle('btn-ready', ready);
    btn.classList.toggle('disabled', !ready);

    const label = `${ui.buyWithPrestige} (${cost} ${renderSeal('rank', 'seal-inline')})`;
    if (btn.innerHTML !== label) btn.innerHTML = label;
  }
}

function lootWorkshopAvailable(state: GameState, theme: ThemeConfig): boolean {
  if ((theme.zoneLootCrafts?.length ?? 0) === 0) return false;
  const lootZones = new Set(theme.zoneLoot?.map((l) => l.zoneId) ?? []);
  return state.unlockedZones.some((z) => lootZones.has(z));
}

function buildLootPairCard(
  ctx: RenderContext,
  loot: NonNullable<ThemeConfig['zoneLoot']>[number],
  craft: NonNullable<ThemeConfig['zoneLootCrafts']>[number],
): string {
  const { state, theme, locale, ui } = ctx;
  const lootLoc = locale.zoneLoot[loot.id];
  const craftLoc = locale.zoneLootCrafts[craft.id];
  const zoneDef = theme.zones.find((z) => z.id === loot.zoneId);
  const zoneLoc = locale.zones[loot.zoneId];
  const owned = isLootCraftOwned(state, craft.id);
  const zoneUnlocked = state.unlockedZones.includes(loot.zoneId);
  const count = getLootCount(state, loot.id);
  const canCraft = canCraftLootItem(state, theme, craft.id);
  const progress = Math.min(100, Math.round((count / craft.shardCost) * 100));
  const zoneLabel = `${renderSeal(zoneDef?.icon ?? 'coin', 'row-seal')} ${zoneLoc?.name ?? loot.zoneId}`;
  const lootName = lootLoc?.name ?? loot.name;
  const craftName = craftLoc?.name ?? craft.name;
  const craftHint = craftLoc?.description ?? craft.description;

  if (!zoneUnlocked) {
    return `
      <div class="loot-card is-locked" data-loot-pair="${craft.id}" data-loot-id="${loot.id}">
        <div class="loot-card-locked-row">
          <span class="loot-card-zone">${zoneLabel}</span>
          <span class="loot-card-locked-gear">${renderSeal(craft.icon, 'row-seal')} ${craftName}</span>
          <span class="loot-card-lock-tag">${ui.lootZoneLocked}</span>
        </div>
      </div>
    `;
  }

  const action = owned
    ? `<div class="loot-card-owned"><span aria-hidden="true">✓</span> ${ui.lootOwned}</div>`
    : `<button class="btn btn-sm loot-card-craft ${canCraft ? 'btn-ready' : 'disabled'}"
        data-action="craft-zone-loot" data-loot-craft="${craft.id}"
        ${canCraft ? '' : 'disabled'}>
        <span>${ui.craftWithLoot}</span>
        <span class="loot-card-cost">${craft.shardCost} ${renderSeal(loot.icon, 'seal-inline')}</span>
      </button>`;

  return `
    <div class="loot-card ${owned ? 'is-owned' : ''} ${canCraft && !owned ? 'can-craft' : ''}"
      data-loot-pair="${craft.id}" data-loot-id="${loot.id}">
      <div class="loot-card-head">
        <span class="loot-card-zone">${zoneLabel}</span>
        <span class="loot-card-meter" data-bind="loot-count">${count} / ${craft.shardCost}</span>
      </div>
      <div class="loot-card-flow">
        <div class="loot-card-tile is-shard">
          <span class="loot-card-emoji">${renderSeal(loot.icon)}</span>
          <div class="loot-card-tile-meta">
            <span class="loot-card-tile-label">${ui.lootDropsIn}</span>
            <span class="loot-card-tile-name">${lootName}</span>
          </div>
        </div>
        <span class="loot-card-arrow" aria-hidden="true">→</span>
        <div class="loot-card-tile is-gear">
          <span class="loot-card-emoji">${renderSeal(craft.icon)}</span>
          <div class="loot-card-tile-meta">
            <span class="loot-card-tile-label">${ui.lootCraftsInto}</span>
            <span class="loot-card-tile-name">${craftName}</span>
          </div>
        </div>
      </div>
      <div class="loot-card-progress-row">
        <div class="loot-progress-track">
          <div class="loot-progress-bar" data-bind="loot-progress" style="width:${progress}%"></div>
        </div>
        <span class="loot-card-pct" data-bind="loot-pct">${progress}%</span>
      </div>
      <p class="loot-card-desc">${craftHint}</p>
      ${action}
    </div>
  `;
}

function buildPatchNotesHTML(ctx: RenderContext): string {
  const { theme, locale, ui } = ctx;
  const notes = locale.patchNotes;
  if (!notes?.items?.length || !theme.version) return '';

  const items = notes.items.map((item) => `<li>${item}</li>`).join('');
  const headline = notes.headline
    ? `<p class="modal-desc patch-notes-headline">${notes.headline}</p>`
    : '';

  return `
    <div class="modal-backdrop" data-patch-notes data-modal-backdrop>
      <div class="modal-card modal-patch-notes" role="dialog" aria-labelledby="patch-notes-title">
        <div class="modal-header">
          <h2 class="modal-title" id="patch-notes-title">${ui.patchNotesTitle} · v${theme.version}</h2>
          <button class="modal-close" data-action="close-patch-notes" type="button" aria-label="${ui.close}">×</button>
        </div>
        ${headline}
        <ul class="patch-notes-list">${items}</ul>
        <button class="btn btn-primary btn-block patch-notes-dismiss" data-action="close-patch-notes" type="button">
          ${ui.patchNotesGotIt}
        </button>
      </div>
    </div>
  `;
}

function computePatchNotesKey(ctx: RenderContext): string {
  const items = ctx.locale.patchNotes?.items?.join('|') ?? '';
  return `${ctx.currentLocale}|${ctx.theme.version ?? ''}|${items}`;
}

function syncPatchNotes(
  root: HTMLElement,
  ctx: RenderContext,
  open: boolean,
  keyRef: { key: string },
): void {
  const hasNotes = (ctx.locale.patchNotes?.items?.length ?? 0) > 0;
  const shouldOpen = open && ctx.showPatchNotes && hasNotes;
  const existing = root.querySelector('[data-patch-notes]');

  if (!shouldOpen) {
    existing?.remove();
    if (!open) keyRef.key = '';
    return;
  }

  const structureKey = computePatchNotesKey(ctx);
  if (!existing || structureKey !== keyRef.key) {
    existing?.remove();
    root.insertAdjacentHTML('beforeend', buildPatchNotesHTML(ctx));
    keyRef.key = structureKey;
  }
}

function buildLootWorkshopHTML(ctx: RenderContext): string {
  const { theme, ui } = ctx;
  const pairs = getZoneLootPairs(theme);
  if (pairs.length === 0) return '';

  const cards = pairs.map(({ loot, craft }) => buildLootPairCard(ctx, loot, craft)).join('');

  return `
    <div class="modal-backdrop" data-loot-workshop data-modal-backdrop>
      <div class="modal-card modal-loot-workshop" role="dialog">
        <div class="loot-workshop-head">
          <div class="modal-header">
            <h2 class="modal-title">${ui.zoneLootWorkshop}</h2>
            <button class="modal-close" data-action="close-loot-workshop" type="button" aria-label="${ui.close}">×</button>
          </div>
          <span class="scroll-hint loot-scroll-hint" data-bind="loot-scroll-hint" hidden>${ui.lootWorkshopScrollHint}</span>
        </div>
        <p class="modal-desc loot-modal-desc">${ui.zoneLootWorkshopDesc}</p>
        <div class="loot-card-list" data-scroll-panel="loot-workshop">${cards}</div>
      </div>
    </div>
  `;
}

function computeLootStructureKey(ctx: RenderContext): string {
  return `${ctx.currentLocale}|${(ctx.theme.zoneLootCrafts ?? []).map((c) => c.id).join(',')}|${ctx.state.unlockedZones.join(',')}`;
}

function updateLootWorkshopScroll(root: HTMLElement): void {
  const list = root.querySelector<HTMLElement>('[data-scroll-panel="loot-workshop"]');
  if (!list) return;

  const overflows = list.scrollHeight > list.clientHeight + 4;
  list.classList.toggle('has-overflow', overflows);

  const hint = root.querySelector<HTMLElement>('[data-bind="loot-scroll-hint"]');
  if (hint) hint.hidden = !overflows;
}

function patchLootWorkshop(root: HTMLElement, ctx: RenderContext): void {
  const { state, theme } = ctx;

  for (const { loot, craft } of getZoneLootPairs(theme)) {
    const card = root.querySelector(`[data-loot-pair="${craft.id}"]`);
    if (!card) continue;

    const owned = isLootCraftOwned(state, craft.id);
    const zoneUnlocked = state.unlockedZones.includes(loot.zoneId);
    card.classList.toggle('is-owned', owned);
    card.classList.toggle('is-locked', !zoneUnlocked);
    if (zoneUnlocked && !owned) {
      card.classList.toggle('can-craft', canCraftLootItem(state, theme, craft.id));
    } else {
      card.classList.remove('can-craft');
    }

    const count = getLootCount(state, loot.id);
    const progress = Math.min(100, Math.round((count / craft.shardCost) * 100));
    const countEl = card.querySelector('[data-bind="loot-count"]');
    const countText = `${count} / ${craft.shardCost}`;
    if (countEl && countEl.textContent !== countText) countEl.textContent = countText;

    const pctEl = card.querySelector('[data-bind="loot-pct"]');
    const pctText = `${progress}%`;
    if (pctEl && pctEl.textContent !== pctText) pctEl.textContent = pctText;

    const bar = card.querySelector<HTMLElement>('[data-bind="loot-progress"]');
    if (bar) bar.style.width = `${progress}%`;

    if (owned || !zoneUnlocked) continue;

    const canCraft = canCraftLootItem(state, theme, craft.id);
    const btn = card.querySelector<HTMLButtonElement>('.loot-card-craft');
    if (btn) {
      btn.disabled = !canCraft;
      btn.classList.toggle('btn-ready', canCraft);
      btn.classList.toggle('disabled', !canCraft);
    }
  }

  updateLootWorkshopScroll(root);
}

function syncLootWorkshop(
  root: HTMLElement,
  ctx: RenderContext,
  open: boolean,
  lootKeyRef: { key: string },
): void {
  const existing = root.querySelector('[data-loot-workshop]');
  if (!open) {
    existing?.remove();
    lootKeyRef.key = '';
    return;
  }

  const structureKey = computeLootStructureKey(ctx);
  if (!existing || structureKey !== lootKeyRef.key) {
    existing?.remove();
    root.insertAdjacentHTML('beforeend', buildLootWorkshopHTML(ctx));
    lootKeyRef.key = structureKey;
    requestAnimationFrame(() => updateLootWorkshopScroll(root));
    return;
  }

  patchLootWorkshop(root, ctx);
}

function syncPrestigeShop(
  root: HTMLElement,
  ctx: RenderContext,
  open: boolean,
  shopKeyRef: { key: string },
): void {
  const existing = root.querySelector('[data-prestige-shop]');
  if (!open) {
    existing?.remove();
    shopKeyRef.key = '';
    return;
  }

  const structureKey = computeShopStructureKey(ctx);
  if (!existing || structureKey !== shopKeyRef.key) {
    existing?.remove();
    root.insertAdjacentHTML('beforeend', buildPrestigeShopHTML(ctx));
    shopKeyRef.key = structureKey;
    return;
  }

  patchPrestigeShop(root, ctx);
}

function buildHTML(ctx: RenderContext): string {
  const { engine, state, theme, locale, ui, baseGps, gps, clickStatus, onQuest, nextBuyId, currentLocale, tutorial } = ctx;
  const prestigePts = calcPrestigePoints(state, theme);
  const quest = state.activeQuest;
  const displayZoneId = quest?.zoneId ?? state.currentZoneId;
  const zone = theme.zones.find((z) => z.id === displayZoneId)!;
  const zoneLoc = locale.zones[zone.id];
  const clickConfig = theme.clickBoost ?? { multiplier: 2, durationSec: 30, cooldownSec: 30, tapGoldFactor: 0.08 };
  const prestigeReady = canPrestige(state, theme);

  return `
    <div data-game-shell>
      <header class="header">
        <div class="brand">
          <div>
            <h1>${renderBrandTitle(theme.title)}</h1>
            <p class="tagline">${locale.tagline}</p>
          </div>
        </div>
        <div class="resources" data-tutorial-target="resources">
          <div class="resource gold">
            <span class="row-seal">${renderSeal('coin')}</span>
            <span class="resource-value" data-bind="gold">${formatNumber(state.gold)}</span>
            <span class="resource-rate ${clickStatus.active ? 'boosted' : ''}" data-bind="gps">+${formatNumber(gps)}/s${clickStatus.active ? ` (${clickStatus.multiplier}×)` : ''}</span>
          </div>
          ${baseGps > 0 ? `
            <button
              class="click-boost-btn ${clickStatus.active ? 'active' : ''} ${clickStatus.cooldownLeft > 0 && !clickStatus.active ? 'cooldown' : ''}"
              data-action="click-boost"
              type="button"
              title="${ui.collectBoost.replace('{mult}', String(clickConfig.multiplier))}"
            >
              <span class="click-boost-label" data-bind="click-boost-label">
                ${clickStatus.active
                  ? `${clickStatus.multiplier}× ${formatTime(clickStatus.boostLeft)}`
                  : clickStatus.cooldownLeft > 0
                    ? formatTime(clickStatus.cooldownLeft)
                    : ui.collect}
              </span>
            </button>
          ` : ''}
          ${state.prestigeLifetime > 0 ? `
            <div class="resource prestige">
              <span class="row-seal">${renderSeal(theme.prestige.currencyIcon)}</span>
              <div class="prestige-resource-meta">
                <span class="resource-value" data-bind="prestige-balance">${state.prestigePoints}</span>
                <span class="resource-label">${ui.prestigeBalance}</span>
                <span class="prestige-lifetime-hint" data-bind="prestige-lifetime">${ui.prestigeLifetime}: ${state.prestigeLifetime}</span>
              </div>
            </div>
          ` : ''}
        </div>
        <div class="header-actions">
          <div class="lang-switcher" aria-label="${ui.langLabel}">
            <button class="lang-btn ${currentLocale === 'tr' ? 'active' : ''}" data-action="set-locale" data-locale="tr" type="button">TR</button>
            <button class="lang-btn ${currentLocale === 'en' ? 'active' : ''}" data-action="set-locale" data-locale="en" type="button">EN</button>
          </div>
          <div class="social-bar">
            ${lootWorkshopAvailable(state, theme) ? `
              <button class="btn btn-sm btn-social btn-loot-workshop" data-action="open-loot-workshop" type="button">${ui.zoneLootWorkshop}</button>
            ` : ''}
            ${(theme.prestigeShop?.length ?? 0) > 0 ? `
              <button class="btn btn-sm btn-social btn-prestige-shop ${state.prestigeLifetime > 0 ? '' : 'is-preview'}" data-action="open-prestige-shop" type="button">${ui.prestigeShop}</button>
            ` : ''}
            <button class="btn btn-sm btn-social" data-action="open-leaderboard" type="button">${ui.leaderboard}</button>
            <button class="btn btn-sm btn-social profile-chip" data-action="open-profile" type="button" data-bind="username">${ctx.displayUsername}</button>
          </div>
        </div>
      </header>

      ${engine.offlineEarnings ? `
        <div class="banner-stack">
          <div class="offline-banner">
            <p>${ui.offlineEarnings}: <strong>+${formatNumber(engine.offlineEarnings.gold)}</strong> (${formatTime(engine.offlineEarnings.seconds)})</p>
            <button class="btn btn-primary" data-action="collect-offline">${ui.collect}</button>
          </div>
        </div>
      ` : ''}

      <main class="main-grid">
        <section class="panel zone-panel">
          <h2>${ui.activeZone}</h2>
          <div class="zone-current">
            <span class="zone-icon">${renderSeal(zone.icon)}</span>
            <div>
              <strong>${zoneLoc?.name ?? zone.name}</strong>
              <p>${zoneLoc?.description ?? zone.description}</p>
            </div>
          </div>
          ${quest ? `
            <div class="quest-progress" data-tutorial-target="start-quest">
              <div class="progress-bar">
                <div class="progress-fill" data-bind="quest-fill" style="width: ${(quest.progress / quest.durationSec) * 100}%"></div>
              </div>
              <p data-bind="quest-time">${ui.questInProgress} ${formatTime(quest.durationSec - quest.progress)}</p>
              <p class="quest-zone-lock">${ui.questZoneLocked}</p>
            </div>
          ` : `
            <button class="btn btn-accent btn-block" data-tutorial-target="start-quest" data-action="start-quest" ${state.parties.every(p => p.level === 0) ? 'disabled' : ''}>
              ${ui.sendQuest}
            </button>
          `}
          <div class="zone-list">
            ${theme.zones.map((z) => {
              const zLoc = locale.zones[z.id];
              const unlocked = state.unlockedZones.includes(z.id);
              const active = displayZoneId === z.id;
              const onQuestHere = quest?.zoneId === z.id;
              const zoneCanUnlock = canUnlockZone(state, z.id, theme);
              return `
                <div class="zone-item ${active ? 'active' : ''} ${onQuestHere ? 'on-quest' : ''} ${unlocked ? '' : 'locked'}" data-zone-item="${z.id}">
                  <span class="row-seal">${renderSeal(z.icon)}</span>
                  <span>${zLoc?.name ?? z.name}</span>
                  ${onQuestHere ? `<span class="badge quest-badge">${ui.onQuestBadge}</span>` : active ? `<span class="badge">${ui.active}</span>` : ''}
                  <span class="zone-actions" data-zone-actions="${z.id}">
                    ${!unlocked
                      ? `<button class="btn btn-sm ${zoneCanUnlock ? 'btn-ready' : 'disabled'}"
                          data-action="unlock-zone" data-zone="${z.id}"
                          ${zoneCanUnlock ? '' : 'disabled'}>
                          ${ui.unlock} (${formatNumber(z.unlockGold)})
                        </button>
                        ${affordHintHtml(state.gold, z.unlockGold, baseGps, ui, onQuest, `zone:${z.id}`)}`
                      : !active && !quest
                        ? `<button class="btn btn-sm" data-action="select-zone" data-zone="${z.id}">${ui.select}</button>`
                        : ''
                    }
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <section class="panel ledger-panel">
          <h2>${ui.ledger}</h2>
          <div class="ledger-log">
            ${engine.eventLog.length === 0
              ? `<p class="ledger-empty">${ui.ledgerEmpty}</p>`
              : engine.eventLog.map((entry) => `
                  <div class="ledger-entry ledger-${entry.tone}">
                    <span class="ledger-dot"></span>
                    <span>${entry.message}</span>
                  </div>
                `).join('')
            }
          </div>
        </section>

        <section class="panel party-panel">
          <div class="panel-title-row">
            <h2>${ui.parties}</h2>
            <span class="scroll-hint">${ui.partiesScrollHint}</span>
          </div>
          <div class="item-list party-list" data-scroll-panel="parties">
            ${theme.partySlots.map((def) => {
              const pLoc = locale.parties[def.id];
              const party = state.parties.find((p) => p.id === def.id)!;
              const unlocked = state.unlockedZones.includes(def.unlockZone);
              const cost = calcPartyCost(def, party.level);
              const canAfford = state.gold >= cost;
              const isNext = nextBuyId === `party:${def.id}`;
              return `
                <div class="item-card ${unlocked ? '' : 'locked'} ${isNext ? 'next-buy' : ''}" data-party-card="${def.id}">
                  <div class="item-header">
                    <span class="item-icon">${renderSeal(def.icon)}</span>
                    <div>
                      <strong>${pLoc?.name ?? def.name}</strong>
                      <span class="item-level">Lv ${party.level}</span>
                    </div>
                    <span class="item-dps">${party.level > 0 ? formatNumber(def.baseDps * party.level) : '—'} DPS</span>
                  </div>
                  <p class="item-desc ${unlocked ? '' : 'is-redacted'}">${unlocked ? (pLoc?.description ?? def.description) : ''}</p>
                  ${unlocked ? `
                    <div class="buy-row">
                      <button class="btn btn-sm ${canAfford ? 'btn-ready' : 'disabled'}"
                        data-tutorial-target="${def.id === 'squire' ? 'hire-squire' : ''}"
                        data-action="hire-party" data-party="${def.id}"
                        ${canAfford ? '' : 'disabled'}>
                        ${ui.hire} (${formatNumber(cost)})
                      </button>
                      ${affordHintHtml(state.gold, cost, baseGps, ui, onQuest, `party:${def.id}`)}
                    </div>
                  ` : `<span class="lock-label">${ui.zoneRequired}</span>`}
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <section class="panel upgrade-panel">
          <div class="panel-title-row">
            <h2>${ui.investments}</h2>
            <span class="scroll-hint">${ui.investmentsScrollHint}</span>
          </div>
          <div class="item-list upgrade-list">
            ${theme.upgrades.map((def) => {
              if (!isUpgradeUnlocked(def, state)) return '';
              const uLoc = locale.upgrades[def.id];
              const up = state.upgrades.find((u) => u.id === def.id)!;
              const maxed = up.level >= def.maxLevel;
              const cost = calcUpgradeCost(def, up.level);
              const canAfford = state.gold >= cost;
              const isNext = nextBuyId === `upgrade:${def.id}`;
              return `
                <div class="item-card ${isNext ? 'next-buy' : ''}" data-upgrade-card="${def.id}">
                  <div class="item-header">
                    <span class="item-icon">${renderSeal(def.icon)}</span>
                    <div>
                      <strong>${uLoc?.name ?? def.name}</strong>
                      <span class="item-level">${up.level}/${def.maxLevel}</span>
                    </div>
                  </div>
                  <p class="item-desc">${uLoc?.description ?? def.description}</p>
                  ${maxed
                    ? '<span class="badge maxed">MAX</span>'
                    : `<div class="buy-row">
                        <button class="btn btn-sm ${canAfford ? 'btn-ready' : 'disabled'}"
                          data-tutorial-target="${def.id === 'rent_hike' ? 'upgrade-rent' : ''}"
                          data-action="buy-upgrade" data-upgrade="${def.id}"
                          ${canAfford ? '' : 'disabled'}>
                          ${ui.upgrade} (${formatNumber(cost)})
                        </button>
                        ${affordHintHtml(state.gold, cost, baseGps, ui, onQuest, `upgrade:${def.id}`)}
                      </div>`
                  }
                </div>
              `;
            }).join('')}
          </div>
        </section>
      </main>

      <footer class="footer">
        <div class="stats">
          <span>${ui.total}: <span data-bind="total-gold">${formatNumber(state.totalGoldEarned)}</span></span>
          <span>${ui.prestige}: ${state.prestigeCount}x</span>
          ${theme.version ? `<span class="version-tag">v${theme.version}</span>` : ''}
        </div>
        <div class="footer-actions" data-bind="footer-actions">
          ${prestigeReady ? `
            <button class="btn btn-prestige" data-action="prestige">
              ${renderSeal(theme.prestige.currencyIcon, 'seal-inline')} ${ui.prestige} (+${prestigePts})
            </button>
          ` : `
            <span class="prestige-hint" data-bind="prestige-hint">${ui.prestige}: ${formatNumber(theme.prestige.minGoldEarned)} ${ui.prestigeNeed}${state.totalGoldEarned < theme.prestige.minGoldEarned ? ` · ${affordHintText(state.totalGoldEarned, theme.prestige.minGoldEarned, baseGps, ui, onQuest, true)}` : ''}</span>
          `}
          <button class="btn btn-sm" data-action="export-save">${ui.exportSave}</button>
          <button class="btn btn-sm" data-action="import-save">${ui.importSave}</button>
          <button class="btn btn-danger btn-sm" data-action="reset">${ui.reset}</button>
        </div>
      </footer>

      ${renderTutorialOverlay(tutorial, ui)}
    </div>
  `;
}

function setText(el: Element | null, text: string): void {
  if (el && el.textContent !== text) el.textContent = text;
}

function patchDynamic(root: HTMLElement, ctx: RenderContext): void {
  const { state, theme, ui, baseGps, gps, clickStatus, onQuest, nextBuyId } = ctx;

  setText(root.querySelector('[data-bind="username"]'), ctx.displayUsername);

  setText(root.querySelector('[data-bind="gold"]'), formatNumber(state.gold));

  const gpsEl = root.querySelector('[data-bind="gps"]');
  if (gpsEl) {
    setText(gpsEl, `+${formatNumber(gps)}/s${clickStatus.active ? ` (${clickStatus.multiplier}×)` : ''}`);
    gpsEl.classList.toggle('boosted', clickStatus.active);
  }

  const clickBtn = root.querySelector('[data-action="click-boost"]') as HTMLButtonElement | null;
  if (clickBtn) {
    clickBtn.classList.toggle('active', clickStatus.active);
    clickBtn.classList.toggle('cooldown', clickStatus.cooldownLeft > 0 && !clickStatus.active);
    setText(
      clickBtn.querySelector('[data-bind="click-boost-label"]'),
      clickStatus.active
        ? `${clickStatus.multiplier}× ${formatTime(clickStatus.boostLeft)}`
        : clickStatus.cooldownLeft > 0
          ? formatTime(clickStatus.cooldownLeft)
          : ui.collect,
    );
  }

  const quest = state.activeQuest;
  if (quest) {
    const fill = root.querySelector('[data-bind="quest-fill"]') as HTMLElement | null;
    if (fill) fill.style.width = `${(quest.progress / quest.durationSec) * 100}%`;
    setText(
      root.querySelector('[data-bind="quest-time"]'),
      `${ui.questInProgress} ${formatTime(quest.durationSec - quest.progress)}`,
    );
  }

  setText(root.querySelector('[data-bind="total-gold"]'), formatNumber(state.totalGoldEarned));

  setText(root.querySelector('[data-bind="prestige-balance"]'), formatNumber(state.prestigePoints));
  const lifetimeEl = root.querySelector('[data-bind="prestige-lifetime"]');
  if (lifetimeEl) {
    setText(lifetimeEl, `${ui.prestigeLifetime}: ${state.prestigeLifetime}`);
  }
  const prestigeHint = root.querySelector('[data-bind="prestige-hint"]');
  if (prestigeHint) {
    const base = `${ui.prestige}: ${formatNumber(theme.prestige.minGoldEarned)} ${ui.prestigeNeed}`;
    const extra = state.totalGoldEarned < theme.prestige.minGoldEarned
      ? ` · ${affordHintText(state.totalGoldEarned, theme.prestige.minGoldEarned, baseGps, ui, onQuest, true)}`
      : '';
    setText(prestigeHint, base + extra);
  }

  root.querySelectorAll('[data-party-card]').forEach((el) => {
    const id = el.getAttribute('data-party-card');
    el.classList.toggle('next-buy', nextBuyId === `party:${id}`);
  });
  root.querySelectorAll('[data-upgrade-card]').forEach((el) => {
    const id = el.getAttribute('data-upgrade-card');
    el.classList.toggle('next-buy', nextBuyId === `upgrade:${id}`);
  });

  for (const def of theme.partySlots) {
    if (!state.unlockedZones.includes(def.unlockZone)) continue;
    const party = state.parties.find((p) => p.id === def.id)!;
    const cost = calcPartyCost(def, party.level);
    const canAfford = state.gold >= cost;
    const btn = root.querySelector(`[data-action="hire-party"][data-party="${def.id}"]`) as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = !canAfford;
      btn.classList.toggle('btn-ready', canAfford);
      btn.classList.toggle('disabled', !canAfford);
    }
    setText(
      root.querySelector(`[data-afford="party:${def.id}"]`),
      canAfford ? '' : affordHintText(state.gold, cost, baseGps, ui, onQuest),
    );
  }

  for (const def of theme.upgrades) {
    if (!isUpgradeUnlocked(def, state)) continue;
    const up = state.upgrades.find((u) => u.id === def.id)!;
    if (up.level >= def.maxLevel) continue;
    const cost = calcUpgradeCost(def, up.level);
    const canAfford = state.gold >= cost;
    const btn = root.querySelector(`[data-action="buy-upgrade"][data-upgrade="${def.id}"]`) as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = !canAfford;
      btn.classList.toggle('btn-ready', canAfford);
      btn.classList.toggle('disabled', !canAfford);
    }
    setText(
      root.querySelector(`[data-afford="upgrade:${def.id}"]`),
      canAfford ? '' : affordHintText(state.gold, cost, baseGps, ui, onQuest),
    );
  }

  for (const z of theme.zones) {
    if (state.unlockedZones.includes(z.id)) continue;
    const zoneCanUnlock = canUnlockZone(state, z.id, theme);
    const btn = root.querySelector(`[data-action="unlock-zone"][data-zone="${z.id}"]`) as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = !zoneCanUnlock;
      btn.classList.toggle('btn-ready', zoneCanUnlock);
      btn.classList.toggle('disabled', !zoneCanUnlock);
    }
    setText(
      root.querySelector(`[data-afford="zone:${z.id}"]`),
      zoneCanUnlock ? '' : affordHintText(state.gold, z.unlockGold, baseGps, ui, onQuest),
    );
  }

}

function scrollPartyListIfNeeded(root: HTMLElement, lastTarget: { id: string }): void {
  const list = root.querySelector<HTMLElement>('[data-scroll-panel="parties"]');
  if (!list) return;

  const target =
    root.querySelector<HTMLElement>('.party-panel [data-party-card].next-buy')
    ?? root.querySelector<HTMLElement>('.party-panel [data-party-card]:not(.locked)');
  if (!target) return;

  const targetId = target.getAttribute('data-party-card') ?? '';
  const listOverflows = list.scrollHeight > list.clientHeight + 4;
  list.classList.toggle('has-overflow', listOverflows);

  if (!listOverflows) return;
  if (targetId === lastTarget.id) return;
  lastTarget.id = targetId;

  const listRect = list.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  if (targetRect.bottom > listRect.bottom - 8 || targetRect.top < listRect.top + 8) {
    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function collectPurchaseOptions(ctx: RenderContext): PurchaseOption[] {
  const { state, theme, baseGps } = ctx;
  const options: PurchaseOption[] = [];

  for (const def of theme.partySlots) {
    const party = state.parties.find((p) => p.id === def.id)!;
    if (!state.unlockedZones.includes(def.unlockZone)) continue;
    const cost = calcPartyCost(def, party.level);
    options.push({
      id: `party:${def.id}`,
      kind: 'party',
      cost,
      affordable: state.gold >= cost,
      timeSec: baseGps > 0 && state.gold < cost ? (cost - state.gold) / baseGps : null,
    });
  }
  for (const def of theme.upgrades) {
    if (!isUpgradeUnlocked(def, state)) continue;
    const up = state.upgrades.find((u) => u.id === def.id)!;
    if (up.level >= def.maxLevel) continue;
    const cost = calcUpgradeCost(def, up.level);
    options.push({
      id: `upgrade:${def.id}`,
      kind: 'upgrade',
      cost,
      affordable: state.gold >= cost,
      timeSec: baseGps > 0 && state.gold < cost ? (cost - state.gold) / baseGps : null,
    });
  }
  return options;
}

function buildContext(
  engine: GameEngine,
  getLocale: () => GameLocale,
  localeManager: LocaleManager,
  tutorial: TutorialManager,
  getDisplayUsername: () => string,
): RenderContext {
  const { state, theme } = engine;
  const locale = getLocale();
  const baseGps = engine.getBaseGoldPerSec();
  const gps = engine.getGoldPerSec();
  const clickStatus = engine.getClickBoostStatus();
  const onQuest = !!state.activeQuest;
  const purchaseOptions = collectPurchaseOptions({
    engine,
    state,
    theme,
    locale,
    ui: locale.ui,
    baseGps,
    gps,
    clickStatus,
    onQuest,
    nextBuyId: null,
    currentLocale: localeManager.locale,
    tutorial,
    displayUsername: '',
    showPatchNotes: false,
  });

  return {
    engine,
    state,
    theme,
    locale,
    ui: locale.ui,
    baseGps,
    gps,
    clickStatus,
    onQuest,
    nextBuyId: pickNextPurchase(purchaseOptions),
    currentLocale: localeManager.locale,
    tutorial,
    displayUsername: getDisplayUsername(),
    showPatchNotes: shouldShowPatchNotes(theme.version),
  };
}

export function mountGameUI(
  engine: GameEngine,
  root: HTMLElement,
  options: GameUIOptions,
): TutorialManager {
  const { localeManager, getLocale, getDisplayUsername } = options;
  ensureSealSprite();
  root.className = 'game-root';
  const tutorial = new TutorialManager(engine.theme.id, getLocale().tutorial);
  let wasOnQuest = false;
  let structureKey = '';
  let renderScheduled = false;
  let prestigeShopOpen = false;
  let lootWorkshopOpen = false;
  let patchNotesOpen = shouldShowPatchNotes(engine.theme.version);
  const shopKeyRef = { key: '' };
  const lootKeyRef = { key: '' };
  const patchNotesKeyRef = { key: '' };
  const lastPartyScrollTarget = { id: '' };

  root.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    if (prestigeShopOpen && el.closest('[data-prestige-shop]') === el) {
      prestigeShopOpen = false;
      scheduleRender();
      return;
    }
    if (lootWorkshopOpen && el.closest('[data-loot-workshop]') === el) {
      lootWorkshopOpen = false;
      scheduleRender();
      return;
    }
    if (patchNotesOpen && el.closest('[data-patch-notes]') === el) {
      patchNotesOpen = false;
      if (engine.theme.version) dismissPatchNotes(engine.theme.version);
      scheduleRender();
      return;
    }

    const target = el.closest('[data-action]') as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.action;
    const ui = getLocale().ui;
    switch (action) {
      case 'set-locale': {
        const locale = target.dataset.locale as LocaleId;
        if (locale === 'tr' || locale === 'en') localeManager.setLocale(locale);
        break;
      }
      case 'tutorial-next':
        tutorial.advance();
        break;
      case 'tutorial-skip':
        tutorial.skip();
        break;
      case 'click-boost':
        engine.clickBoost();
        break;
      case 'collect-offline':
        engine.collectOffline();
        break;
      case 'close-patch-notes':
        patchNotesOpen = false;
        if (engine.theme.version) dismissPatchNotes(engine.theme.version);
        scheduleRender();
        break;
      case 'start-quest':
        if (engine.startQuest()) tutorial.notify('start_quest');
        break;
      case 'hire-party':
        if (engine.hireParty(target.dataset.party!)) tutorial.notify('hire_party');
        break;
      case 'buy-upgrade':
        if (engine.buyUpgrade(target.dataset.upgrade!)) {
          tutorial.notify('buy_upgrade', { upgradeId: target.dataset.upgrade });
        }
        break;
      case 'unlock-zone':
        engine.tryUnlockZone(target.dataset.zone!);
        break;
      case 'select-zone':
        engine.selectZone(target.dataset.zone!);
        break;
      case 'prestige':
        if (confirm(ui.confirmPrestige)) engine.prestige();
        break;
      case 'reset':
        if (confirm(ui.confirmReset)) {
          engine.reset();
          tutorial.reset();
          wasOnQuest = false;
          prestigeShopOpen = false;
          lootWorkshopOpen = false;
          patchNotesOpen = false;
          shopKeyRef.key = '';
          lootKeyRef.key = '';
          patchNotesKeyRef.key = '';
        }
        break;
      case 'export-save': {
        const data = engine.exportSave();
        if (data) prompt(ui.exportSavePrompt, data);
        break;
      }
      case 'import-save': {
        const raw = prompt(ui.importSavePrompt);
        if (!raw) break;
        if (engine.importSave(raw)) {
          tutorial.reset();
          wasOnQuest = false;
          prestigeShopOpen = false;
          lootWorkshopOpen = false;
          patchNotesOpen = false;
          shopKeyRef.key = '';
          lootKeyRef.key = '';
          patchNotesKeyRef.key = '';
          alert(ui.importSaveSuccess);
        } else {
          alert(ui.importSaveError);
        }
        break;
      }
      case 'open-prestige-shop':
        prestigeShopOpen = true;
        lootWorkshopOpen = false;
        scheduleRender();
        break;
      case 'close-prestige-shop':
        prestigeShopOpen = false;
        scheduleRender();
        break;
      case 'buy-prestige-shop':
        engine.buyPrestigeShop(target.dataset.shopItem!);
        break;
      case 'open-loot-workshop':
        lootWorkshopOpen = true;
        prestigeShopOpen = false;
        scheduleRender();
        break;
      case 'close-loot-workshop':
        lootWorkshopOpen = false;
        scheduleRender();
        break;
      case 'craft-zone-loot':
        engine.craftZoneLoot(target.dataset.lootCraft!);
        break;
    }
  });

  const render = () => {
    const ctx = buildContext(engine, getLocale, localeManager, tutorial, getDisplayUsername);
    const { onQuest } = ctx;

    if (wasOnQuest && !onQuest) tutorial.checkQuestDone(false, true);
    wasOnQuest = onQuest;

    const key = computeStructureKey(ctx);
    if (key !== structureKey || !root.querySelector('[data-game-shell]')) {
      if (key !== structureKey) lastPartyScrollTarget.id = '';
      structureKey = key;
      root.innerHTML = buildHTML(ctx);
    } else {
      patchDynamic(root, ctx);
    }
    applyTutorialHighlight(root, tutorial.current?.target);
    scrollPartyListIfNeeded(root, lastPartyScrollTarget);
    syncPrestigeShop(root, ctx, prestigeShopOpen, shopKeyRef);
    syncLootWorkshop(root, ctx, lootWorkshopOpen, lootKeyRef);
    syncPatchNotes(root, ctx, patchNotesOpen, patchNotesKeyRef);
  };

  const scheduleRender = () => {
    if (renderScheduled) return;
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderScheduled = false;
      render();
    });
  };

  localeManager.subscribe(() => {
    tutorial.updateSteps(getLocale().tutorial);
    structureKey = '';
    shopKeyRef.key = '';
    patchNotesKeyRef.key = '';
    scheduleRender();
  });

  engine.subscribe(scheduleRender);
  render();
  return tutorial;
}