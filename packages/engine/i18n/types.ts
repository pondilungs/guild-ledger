import type { FlavorText } from '../GameEngine.ts';
import type { TutorialStep } from '../core/TutorialManager.ts';

export interface LocalizedEntity {
  name: string;
  description: string;
}

export interface GameLocale {
  tagline: string;
  prestigeCurrency: string;
  ui: {
    collect: string;
    collectBoost: string;
    hire: string;
    upgrade: string;
    sendQuest: string;
    questInProgress: string;
    activeZone: string;
    ledger: string;
    ledgerEmpty: string;
    parties: string;
    partiesScrollHint: string;
    investmentsScrollHint: string;
    investments: string;
    total: string;
    prestige: string;
    prestigeNeed: string;
    reset: string;
    unlock: string;
    select: string;
    active: string;
    zoneRequired: string;
    offlineEarnings: string;
    needIncome: string;
    afterQuest: string;
    earnSuffix: string;
    confirmPrestige: string;
    confirmReset: string;
    tutorialSkip: string;
    tutorialGotIt: string;
    tutorialStart: string;
    tutorialWait: string;
    langLabel: string;
    leaderboard: string;
    profile: string;
    myProfile: string;
    createProfile: string;
    usernamePlaceholder: string;
    setUsername: string;
    save: string;
    close: string;
    rank: string;
    player: string;
    statTotalGold: string;
    statCurrentGold: string;
    statPrestige: string;
    statPlayTime: string;
    statZones: string;
    statHighestZone: string;
    statPartyLevels: string;
    statUpgradeLevels: string;
    leaderboardEmpty: string;
    leaderboardOffline: string;
    leaderboardLoading: string;
    createUsernameHint: string;
    usernameInvalid: string;
    profileNotFound: string;
    updateBanner: string;
  };
  zones: Record<string, LocalizedEntity>;
  parties: Record<string, LocalizedEntity>;
  upgrades: Record<string, LocalizedEntity>;
  flavor: FlavorText;
  tutorial: TutorialStep[];
  logs: {
    welcomeNew: string;
    welcomeBack: string;
    reset: string;
  };
}