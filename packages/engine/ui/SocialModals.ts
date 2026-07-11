import { formatNumber } from '../core/format.ts';
import type { PlayerProfile, ProfileManager } from '../core/ProfileManager.ts';
import type { LeaderboardClient, LeaderboardEntry } from '../services/LeaderboardClient.ts';
import type { GameLocale } from '../i18n/types.ts';
import type { LocaleManager } from '../core/LocaleManager.ts';

export type ModalView = 'none' | 'setup' | 'leaderboard' | 'profile';

export interface ModalState {
  view: ModalView;
  profileId: string | null;
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  viewedProfile: PlayerProfile | null;
}

export function createModalState(): ModalState {
  return {
    view: 'none',
    profileId: null,
    entries: [],
    loading: false,
    error: null,
    viewedProfile: null,
  };
}

function formatPlayTime(sec: number): string {
  if (sec < 60) return `${Math.floor(sec)}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  return `${(sec / 3600).toFixed(1)}h`;
}

function zoneName(locale: GameLocale, zoneId: string): string {
  return locale.zones[zoneId]?.name ?? zoneId;
}

function statRow(label: string, value: string): string {
  return `
    <div class="profile-stat">
      <span class="profile-stat-label">${label}</span>
      <span class="profile-stat-value">${value}</span>
    </div>
  `;
}

export function renderProfileContent(
  profile: PlayerProfile,
  locale: GameLocale,
  ui: GameLocale['ui'],
  isSelf: boolean,
): string {
  const s = profile.stats;
  const initial = (profile.username[0] ?? '?').toUpperCase();
  return `
    <div class="profile-header">
      <span class="profile-avatar">${initial}</span>
      <div>
        <h3 class="profile-name">${profile.username}</h3>
        ${isSelf ? `<span class="profile-badge">${ui.myProfile}</span>` : ''}
      </div>
    </div>
    <div class="profile-stats">
      ${statRow(ui.statTotalGold, formatNumber(s.totalGoldEarned))}
      ${statRow(ui.statCurrentGold, formatNumber(s.gold))}
      ${statRow(ui.statPrestige, `${s.prestigePoints} (${s.prestigeCount}×)`)}
      ${statRow(ui.statPlayTime, formatPlayTime(s.totalPlayTime))}
      ${statRow(ui.statZones, String(s.zonesUnlocked))}
      ${statRow(ui.statHighestZone, zoneName(locale, s.highestZoneId))}
      ${statRow(ui.statPartyLevels, String(s.partyLevelsTotal))}
      ${statRow(ui.statUpgradeLevels, String(s.upgradeLevelsTotal))}
    </div>
  `;
}

export function renderModals(
  state: ModalState,
  locale: GameLocale,
  selfProfile: PlayerProfile,
  leaderboardOnline: boolean,
): string {
  if (state.view === 'none') return '';

  const ui = locale.ui;

  if (state.view === 'setup') {
    return `
      <div class="modal-backdrop" data-modal-backdrop>
        <div class="modal-card modal-setup" role="dialog">
          <h2 class="modal-title">${ui.createProfile}</h2>
          <p class="modal-desc">${ui.createUsernameHint}</p>
          <input class="modal-input" type="text" maxlength="16" data-profile-username
            placeholder="${ui.usernamePlaceholder}" autocomplete="username" />
          <p class="modal-error" data-setup-error hidden></p>
          <button class="btn btn-primary btn-block" data-action="save-username" type="button">${ui.save}</button>
        </div>
      </div>
    `;
  }

  if (state.view === 'leaderboard') {
    const offlineNote = !leaderboardOnline && !state.loading
      ? `<p class="modal-note">${ui.leaderboardOffline}</p>`
      : '';

    const overallRows = state.entries.length > 0
      ? state.entries.map((entry) => {
          const isSelf = entry.profile.id === selfProfile.id;
          return `
            <button class="leaderboard-row ${isSelf ? 'is-self' : ''}" type="button"
              data-action="view-profile" data-profile-id="${entry.profile.id}">
              <span class="lb-rank">#${entry.rank}</span>
              <span class="lb-name">${entry.profile.username}</span>
              <span class="lb-prestige">${entry.profile.stats.prestigePoints}</span>
              <span class="lb-gold">${formatNumber(entry.profile.stats.totalGoldEarned)}</span>
            </button>
          `;
        }).join('')
      : `<p class="modal-empty">${state.loading ? ui.leaderboardLoading : ui.leaderboardEmpty}</p>`;

    return `
      <div class="modal-backdrop" data-modal-backdrop>
        <div class="modal-card modal-leaderboard" role="dialog">
          <div class="modal-header">
            <h2 class="modal-title">${ui.leaderboard}</h2>
            <button class="modal-close" data-action="close-modal" type="button" aria-label="${ui.close}">×</button>
          </div>
          ${offlineNote}
          ${state.error ? `<p class="modal-error">${state.error}</p>` : ''}
          <div class="leaderboard-head">
            <span>${ui.rank}</span>
            <span>${ui.player}</span>
            <span>${ui.prestige}</span>
            <span>${ui.statTotalGold}</span>
          </div>
          <div class="leaderboard-list">${overallRows}</div>
        </div>
      </div>
    `;
  }

  if (state.view === 'profile' && state.viewedProfile) {
    return `
      <div class="modal-backdrop" data-modal-backdrop>
        <div class="modal-card modal-profile" role="dialog">
          <div class="modal-header">
            <h2 class="modal-title">${ui.profile}</h2>
            <button class="modal-close" data-action="close-modal" type="button" aria-label="${ui.close}">×</button>
          </div>
          ${renderProfileContent(
            state.viewedProfile,
            locale,
            ui,
            state.viewedProfile.id === selfProfile.id,
          )}
        </div>
      </div>
    `;
  }

  return '';
}

export interface SocialLayerOptions {
  profileManager: ProfileManager;
  leaderboardClient: LeaderboardClient;
  getLocale: () => GameLocale;
  localeManager: LocaleManager;
  getSelfProfile: () => PlayerProfile;
  onUsernameSet?: () => void;
}

export function mountSocialLayer(
  container: HTMLElement,
  options: SocialLayerOptions,
): { openSetupIfNeeded: () => void; refreshHeaderHint: () => string } {
  const { profileManager, leaderboardClient, getLocale, localeManager, getSelfProfile, onUsernameSet } = options;
  let modalState = createModalState();

  const render = () => {
    container.innerHTML = renderModals(
      modalState,
      getLocale(),
      profileManager.current,
      leaderboardClient.isOnline(),
    );
  };

  const loadLeaderboardData = async () => {
    let entries = await leaderboardClient.fetchLeaderboard(50);
    if (entries.length === 0 && profileManager.hasUsername()) {
      entries = [{ rank: 1, profile: getSelfProfile() }];
    }
    modalState = { ...modalState, entries, loading: false };
  };

  const openLeaderboard = async () => {
    modalState = {
      ...modalState,
      view: 'leaderboard',
      loading: true,
      error: null,
    };
    render();
    await loadLeaderboardData();
    render();
  };

  const openProfile = async (profileId: string) => {
    modalState = { ...modalState, view: 'profile', profileId, loading: true, viewedProfile: null };
    render();
    let profile = profileId === profileManager.current.id
      ? getSelfProfile()
      : await leaderboardClient.fetchProfile(profileId);
    if (!profile) {
      const cached = modalState.entries.find((e) => e.profile.id === profileId);
      profile = cached?.profile ?? null;
    }
    modalState = {
      ...modalState,
      viewedProfile: profile,
      loading: false,
      error: profile ? null : getLocale().ui.profileNotFound,
    };
    if (!profile) {
      modalState.view = 'leaderboard';
    }
    render();
  };

  const handleClick = (e: Event) => {
    const el = e.target as HTMLElement;
    const target = el.closest('[data-action]') as HTMLElement | null;

    if (!target) {
      if (el.closest('[data-modal-backdrop]') === el && modalState.view !== 'setup') {
        modalState = createModalState();
        render();
      }
      return;
    }

    const action = target.dataset.action;
    const ui = getLocale().ui;

    switch (action) {
      case 'close-modal':
        modalState = createModalState();
        render();
        break;
      case 'open-leaderboard':
        void openLeaderboard();
        break;
      case 'open-profile':
        void openProfile(profileManager.current.id);
        break;
      case 'view-profile':
        void openProfile(target.dataset.profileId!);
        break;
      case 'save-username': {
        const input = container.querySelector<HTMLInputElement>('[data-profile-username]');
        const errEl = container.querySelector<HTMLElement>('[data-setup-error]');
        const value = input?.value ?? '';
        if (!profileManager.setUsername(value)) {
          if (errEl) {
            errEl.textContent = ui.usernameInvalid;
            errEl.hidden = false;
          }
          return;
        }
        modalState = createModalState();
        render();
        onUsernameSet?.();
        void leaderboardClient.upsertProfile(profileManager.current);
        break;
      }
    }
  };

  document.addEventListener('click', handleClick);

  localeManager.subscribe(render);

  const openSetupIfNeeded = () => {
    if (!profileManager.hasUsername()) {
      modalState = { ...createModalState(), view: 'setup' };
      render();
    }
  };

  const refreshHeaderHint = () => {
    const name = profileManager.current.username;
    return name || getLocale().ui.setUsername;
  };

  render();
  return { openSetupIfNeeded, refreshHeaderHint };
}