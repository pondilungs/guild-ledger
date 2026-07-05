import type { GameEngine } from '../GameEngine.ts';
import { formatNumber, formatTime } from '../core/format.ts';
import { formatAffordHint, pickNextPurchase, type PurchaseOption } from '../core/affordability.ts';
import { TutorialManager, type TutorialStep } from '../core/TutorialManager.ts';
import { renderTutorialOverlay, applyTutorialHighlight } from './TutorialOverlay.ts';
import { calcPartyCost, calcUpgradeCost } from '../systems/CombatSystem.ts';
import { canUnlockZone } from '../systems/ZoneSystem.ts';
import { canPrestige, calcPrestigePoints } from '../systems/PrestigeSystem.ts';

function affordHint(
  current: number,
  cost: number,
  gps: number,
  onQuest: boolean,
  earnBased = false,
): string {
  const hint = formatAffordHint(current, cost, gps, { onQuest, earnBased });
  return hint ? `<span class="afford-hint">${hint}</span>` : '';
}

export function mountGameUI(
  engine: GameEngine,
  root: HTMLElement,
  tutorialSteps: TutorialStep[] = [],
): TutorialManager {
  root.className = 'game-root';
  const tutorial = new TutorialManager(engine.theme.id, tutorialSteps);
  let wasOnQuest = false;

  root.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.action;
    switch (action) {
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
        if (confirm('Prestige yapmak ilerlemeni sıfırlar ama kalıcı bonus verir. Emin misin?')) {
          engine.prestige();
        }
        break;
      case 'reset':
        if (confirm('Tüm ilerleme silinecek. Emin misin?')) {
          engine.reset();
          tutorial.reset();
          wasOnQuest = false;
        }
        break;
    }
  });

  const render = () => {
    const { state, theme } = engine;
    const baseGps = engine.getBaseGoldPerSec();
    const gps = engine.getGoldPerSec();
    const clickStatus = engine.getClickBoostStatus();
    const onQuest = !!state.activeQuest;
    if (wasOnQuest && !onQuest) tutorial.checkQuestDone(false, true);
    wasOnQuest = onQuest;
    const prestigePts = calcPrestigePoints(state, theme);
    const quest = state.activeQuest;
    const zone = theme.zones.find((z) => z.id === state.currentZoneId)!;

    const purchaseOptions: PurchaseOption[] = [];

    for (const def of theme.partySlots) {
      const party = state.parties.find((p) => p.id === def.id)!;
      if (!state.unlockedZones.includes(def.unlockZone)) continue;
      const cost = calcPartyCost(def, party.level);
      purchaseOptions.push({
        id: `party:${def.id}`,
        kind: 'party',
        cost,
        affordable: state.gold >= cost,
        timeSec: baseGps > 0 && state.gold < cost ? (cost - state.gold) / baseGps : null,
      });
    }
    for (const def of theme.upgrades) {
      const up = state.upgrades.find((u) => u.id === def.id)!;
      if (up.level >= def.maxLevel) continue;
      const cost = calcUpgradeCost(def, up.level);
      purchaseOptions.push({
        id: `upgrade:${def.id}`,
        kind: 'upgrade',
        cost,
        affordable: state.gold >= cost,
        timeSec: baseGps > 0 && state.gold < cost ? (cost - state.gold) / baseGps : null,
      });
    }
    const nextBuyId = pickNextPurchase(purchaseOptions);
    const clickConfig = theme.clickBoost ?? { multiplier: 2, durationSec: 30, cooldownSec: 30, tapGoldFactor: 0.08 };

    root.innerHTML = `
      <header class="header">
        <div class="brand">
          <span class="brand-icon">📒</span>
          <div>
            <h1>${theme.title}</h1>
            <p class="tagline">${theme.tagline}</p>
          </div>
        </div>
        <div class="resources" data-tutorial-target="resources">
          <div class="resource gold">
            <span>🪙</span>
            <span class="resource-value">${formatNumber(state.gold)}</span>
            <span class="resource-rate ${clickStatus.active ? 'boosted' : ''}">+${formatNumber(gps)}/s${clickStatus.active ? ` (${clickStatus.multiplier}×)` : ''}</span>
          </div>
          ${baseGps > 0 ? `
            <button
              class="click-boost-btn ${clickStatus.active ? 'active' : ''} ${clickStatus.cooldownLeft > 0 && !clickStatus.active ? 'cooldown' : ''}"
              data-action="click-boost"
              type="button"
              title="Tıkla: anlık altın + ${clickConfig.multiplier}× gelir"
            >
              <span class="click-boost-icon">💰</span>
              <span class="click-boost-label">
                ${clickStatus.active
                  ? `${clickStatus.multiplier}× ${formatTime(clickStatus.boostLeft)}`
                  : clickStatus.cooldownLeft > 0
                    ? formatTime(clickStatus.cooldownLeft)
                    : 'Tahsil Et'}
              </span>
            </button>
          ` : ''}
          ${state.prestigePoints > 0 ? `
            <div class="resource prestige">
              <span>${theme.prestige.currencyIcon}</span>
              <span class="resource-value">${state.prestigePoints}</span>
              <span class="resource-label">${theme.prestige.currencyName}</span>
            </div>
          ` : ''}
        </div>
      </header>

      ${engine.offlineEarnings ? `
        <div class="offline-banner">
          <p>Offline kazanç: <strong>+${formatNumber(engine.offlineEarnings.gold)}</strong> (${formatTime(engine.offlineEarnings.seconds)})</p>
          <button class="btn btn-primary" data-action="collect-offline">Topla</button>
        </div>
      ` : ''}

      <main class="main-grid">
        <section class="panel zone-panel">
          <h2>📍 Aktif Bölge</h2>
          <div class="zone-current">
            <span class="zone-icon">${zone.icon}</span>
            <div>
              <strong>${zone.name}</strong>
              <p>${zone.description}</p>
            </div>
          </div>
          ${quest ? `
            <div class="quest-progress" data-tutorial-target="start-quest">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${(quest.progress / quest.durationSec) * 100}%"></div>
              </div>
              <p>Görev devam ediyor... ${formatTime(quest.durationSec - quest.progress)}</p>
            </div>
          ` : `
            <button class="btn btn-accent btn-block" data-tutorial-target="start-quest" data-action="start-quest" ${state.parties.every(p => p.level === 0) ? 'disabled' : ''}>
              ⚔️ Gönder (Expedition)
            </button>
          `}
          <div class="zone-list">
            ${theme.zones.map((z) => {
              const unlocked = state.unlockedZones.includes(z.id);
              const active = state.currentZoneId === z.id;
              const canUnlock = canUnlockZone(state, z.id, theme);
              return `
                <div class="zone-item ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}">
                  <span>${z.icon}</span>
                  <span>${z.name}</span>
                  ${active ? '<span class="badge">Aktif</span>' : ''}
                  ${!unlocked && canUnlock
                    ? `<button class="btn btn-sm btn-ready" data-action="unlock-zone" data-zone="${z.id}">Aç (${formatNumber(z.unlockGold)})</button>`
                    : !unlocked
                      ? `<span class="lock-label">${formatNumber(z.unlockGold)}${z.unlockGold > state.totalGoldEarned ? affordHint(state.totalGoldEarned, z.unlockGold, baseGps, onQuest, true) : ''}</span>`
                      : !active
                        ? `<button class="btn btn-sm" data-action="select-zone" data-zone="${z.id}">Seç</button>`
                        : ''
                  }
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <section class="panel ledger-panel">
          <h2>📒 Muhasebe Defteri</h2>
          <div class="ledger-log">
            ${engine.eventLog.length === 0
              ? '<p class="ledger-empty">Henüz kayıt yok.</p>'
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
          <h2>👥 Partiler (Kiracılar)</h2>
          <div class="item-list">
            ${theme.partySlots.map((def) => {
              const party = state.parties.find((p) => p.id === def.id)!;
              const unlocked = state.unlockedZones.includes(def.unlockZone);
              const cost = calcPartyCost(def, party.level);
              const canAfford = state.gold >= cost;
              const isNext = nextBuyId === `party:${def.id}`;
              return `
                <div class="item-card ${unlocked ? '' : 'locked'} ${isNext ? 'next-buy' : ''}">
                  <div class="item-header">
                    <span class="item-icon">${def.icon}</span>
                    <div>
                      <strong>${def.name}</strong>
                      <span class="item-level">Lv ${party.level}</span>
                    </div>
                    <span class="item-dps">${party.level > 0 ? formatNumber(def.baseDps * party.level) : '—'} DPS</span>
                  </div>
                  <p class="item-desc">${def.description}</p>
                  ${unlocked ? `
                    <div class="buy-row">
                      <button class="btn btn-sm ${canAfford ? 'btn-ready' : 'disabled'}"
                        data-tutorial-target="${def.id === 'squire' ? 'hire-squire' : ''}"
                        data-action="hire-party" data-party="${def.id}"
                        ${canAfford ? '' : 'disabled'}>
                        Kirala (${formatNumber(cost)})
                      </button>
                      ${!canAfford ? affordHint(state.gold, cost, baseGps, onQuest) : ''}
                    </div>
                  ` : '<span class="lock-label">Bölge gerekli</span>'}
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <section class="panel upgrade-panel">
          <h2>📈 Lonca Yatırımları</h2>
          <div class="item-list">
            ${theme.upgrades.map((def) => {
              const up = state.upgrades.find((u) => u.id === def.id)!;
              const maxed = up.level >= def.maxLevel;
              const cost = calcUpgradeCost(def, up.level);
              const canAfford = state.gold >= cost;
              const isNext = nextBuyId === `upgrade:${def.id}`;
              return `
                <div class="item-card ${isNext ? 'next-buy' : ''}">
                  <div class="item-header">
                    <span class="item-icon">${def.icon}</span>
                    <div>
                      <strong>${def.name}</strong>
                      <span class="item-level">${up.level}/${def.maxLevel}</span>
                    </div>
                  </div>
                  <p class="item-desc">${def.description}</p>
                  ${maxed
                    ? '<span class="badge maxed">MAX</span>'
                    : `<div class="buy-row">
                        <button class="btn btn-sm ${canAfford ? 'btn-ready' : 'disabled'}"
                          data-tutorial-target="${def.id === 'rent_hike' ? 'upgrade-rent' : ''}"
                          data-action="buy-upgrade" data-upgrade="${def.id}"
                          ${canAfford ? '' : 'disabled'}>
                          Yükselt (${formatNumber(cost)})
                        </button>
                        ${!canAfford ? affordHint(state.gold, cost, baseGps, onQuest) : ''}
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
          <span>Toplam: ${formatNumber(state.totalGoldEarned)}</span>
          <span>Prestige: ${state.prestigeCount}x</span>
          ${theme.version ? `<span class="version-tag">v${theme.version}</span>` : ''}
        </div>
        <div class="footer-actions">
          ${canPrestige(state, theme) ? `
            <button class="btn btn-prestige" data-action="prestige">
              ${theme.prestige.currencyIcon} Prestige (+${prestigePts})
            </button>
          ` : `
            <span class="prestige-hint">Prestige: ${formatNumber(theme.prestige.minGoldEarned)} altın${state.totalGoldEarned < theme.prestige.minGoldEarned ? ` · ${affordHint(state.totalGoldEarned, theme.prestige.minGoldEarned, baseGps, onQuest, true)}` : ''}</span>
          `}
          <button class="btn btn-danger btn-sm" data-action="reset">Sıfırla</button>
        </div>
      </footer>

      ${renderTutorialOverlay(tutorial)}
    `;

    applyTutorialHighlight(root, tutorial.current?.target);
  };

  engine.subscribe(render);
  render();
  return tutorial;
}