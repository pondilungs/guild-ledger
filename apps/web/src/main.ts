import './style.css';
import {
  GameEngine,
  mountGameUI,
  LocaleManager,
  ProfileManager,
  AutoSaveManager,
  LeaderboardClient,
  resolveLeaderboardUrl,
  mountSocialLayer,
} from '@game-lab/engine';
import { guildLedgerTheme } from '../../../themes/guild-ledger/config.ts';
import { getGuildLedgerLocale } from '../../../themes/guild-ledger/i18n/index.ts';

const localeManager = new LocaleManager();
document.documentElement.lang = localeManager.locale;

const getLocale = () => getGuildLedgerLocale(localeManager.locale);
const profileManager = new ProfileManager();
const leaderboardClient = new LeaderboardClient(resolveLeaderboardUrl());

const modalsRoot = document.createElement('div');
modalsRoot.id = 'game-modals';
document.body.appendChild(modalsRoot);

const app = document.querySelector<HTMLDivElement>('#app')!;
const engine = new GameEngine(guildLedgerTheme, getLocale);
const autoSave = new AutoSaveManager(engine, profileManager, leaderboardClient);

const social = mountSocialLayer(modalsRoot, {
  profileManager,
  leaderboardClient,
  getLocale,
  localeManager,
  getSelfProfile: () => {
    profileManager.updateFromState(engine.state, engine.theme);
    return profileManager.current;
  },
  onUsernameSet: () => engine.notify(),
});

mountGameUI(engine, app, {
  localeManager,
  getLocale,
  getDisplayUsername: social.refreshHeaderHint,
});

engine.start();
autoSave.start();
social.openSetupIfNeeded();

window.addEventListener('beforeunload', () => {
  autoSave.flush();
  autoSave.stop();
  engine.stop();
});

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
});