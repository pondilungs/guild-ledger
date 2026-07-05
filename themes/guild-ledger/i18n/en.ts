import type { GameLocale } from '../../../packages/engine/i18n/types.ts';

const QUEST_COMPLETE = [
  'Quest report filed. Pockets feel heavier.',
  'Party returned. Deaths have been invoiced.',
  'Books closed. Profit recorded.',
  'Insurance company cried. We smiled.',
];

const QUEST_DEATH = [
  'A tenant died. Must re-hire.',
  'Party member fell. Logged as an expense.',
  'Adventurer billed. Permanently.',
];

const HIRE = [
  'New tenant signed. Deposit collected.',
  'Contract renewed. Level up.',
  'Party expanded. More risk, more rent.',
];

const ZONE_UNLOCK = [
  'New zone unlocked. Rent rates updated.',
  'Portfolio grew. We are tax liable now.',
];

export const en: GameLocale = {
  tagline: 'You are not the hero — you are the guild accountant. Profit when parties die.',
  prestigeCurrency: 'Guild Reputation',
  ui: {
    collect: 'Collect',
    collectBoost: 'Click: instant gold + {mult}× income',
    hire: 'Hire',
    upgrade: 'Upgrade',
    sendQuest: 'Send (Expedition)',
    questInProgress: 'Quest in progress...',
    activeZone: 'Active Zone',
    ledger: 'Ledger Log',
    ledgerEmpty: 'No entries yet.',
    parties: 'Parties (Tenants)',
    investments: 'Guild Investments',
    total: 'Total',
    prestige: 'Prestige',
    prestigeNeed: 'gold required',
    reset: 'Reset',
    unlock: 'Unlock',
    select: 'Select',
    active: 'Active',
    zoneRequired: 'Zone required',
    offlineEarnings: 'Offline earnings',
    needIncome: 'Need income',
    afterQuest: 'After quest ~',
    earnSuffix: 'to earn',
    confirmPrestige: 'Prestige resets progress but grants permanent bonuses. Continue?',
    confirmReset: 'All progress will be deleted. Are you sure?',
    tutorialSkip: 'Skip',
    tutorialGotIt: 'Got it',
    tutorialStart: 'Start!',
    tutorialWait: 'Complete the task...',
    langLabel: 'Language',
    leaderboard: 'Leaderboard',
    profile: 'Profile',
    myProfile: 'Your profile',
    createProfile: 'Create Profile',
    usernamePlaceholder: 'Username (3-16)',
    setUsername: 'Create profile',
    save: 'Save',
    close: 'Close',
    rank: 'Rank',
    player: 'Player',
    statTotalGold: 'Total earned',
    statCurrentGold: 'Wallet',
    statPrestige: 'Prestige',
    statPlayTime: 'Play time',
    statZones: 'Zones unlocked',
    statHighestZone: 'Highest zone',
    statPartyLevels: 'Party levels',
    statUpgradeLevels: 'Upgrade levels',
    leaderboardEmpty: 'No players yet.',
    leaderboardOffline: 'Could not reach server — showing last known rankings.',
    leaderboardLoading: 'Loading...',
    createUsernameHint: 'Pick a username to appear on the leaderboard. Letters, numbers, and underscores only.',
    usernameInvalid: 'Invalid username (3-16 chars, a-z, 0-9, _)',
    profileNotFound: 'Profile not found.',
  },
  zones: {
    rat_cellar: { name: 'Rat Cellar', description: 'Cheap deaths for fresh adventurers.' },
    goblin_mine: { name: 'Goblin Mine', description: 'Goblins bill you as enemies and tenants.' },
    haunted_crypt: { name: 'Haunted Crypt', description: 'Death insurance not valid here.' },
    dragon_vault: { name: 'Dragon Vault', description: 'High risk, high rent.' },
  },
  parties: {
    squire: { name: 'Squire', description: 'Cheap, replaceable, tax-free.' },
    cleric: { name: 'Cleric', description: 'Low death rate, low returns. Accountant-friendly.' },
    rogue: { name: 'Rogue', description: 'Loot bonus. Insurance fraud expert.' },
    knight: { name: 'Knight', description: 'Tank. Pays rent late, but pays.' },
    mage: { name: 'Mage', description: 'AoE billing specialist.' },
  },
  upgrades: {
    rent_hike: { name: 'Rent Hike', description: '+15% gold income' },
    insurance_fraud: { name: 'Insurance Fraud', description: '-8% party death chance' },
    desk_efficiency: { name: 'Desk Efficiency', description: '+10% DPS' },
    night_shift: { name: 'Night Shift', description: '+20% offline earnings' },
    guild_reputation: { name: 'Guild Reputation', description: '+5% prestige points' },
  },
  flavor: {
    questCompleteMsg: (gold, deaths, zoneName) => {
      const base = QUEST_COMPLETE[Math.floor(Math.random() * QUEST_COMPLETE.length)];
      const deathPart = deaths > 0 ? `, ${deaths} deaths` : ', zero losses';
      return `${zoneName}: ${base} (+${Math.floor(gold)} gold${deathPart})`;
    },
    questDeathMsg: (partyName) => {
      const base = QUEST_DEATH[Math.floor(Math.random() * QUEST_DEATH.length)];
      return `${partyName} — ${base}`;
    },
    hireMsg: (partyName, level) => {
      const base = HIRE[Math.floor(Math.random() * HIRE.length)];
      return `${partyName} Lv${level}. ${base}`;
    },
    zoneUnlockMsg: (zoneName) => {
      const base = ZONE_UNLOCK[Math.floor(Math.random() * ZONE_UNLOCK.length)];
      return `${zoneName} — ${base}`;
    },
    questStartMsg: (zoneName, partyCount) =>
      `${partyCount} parties sent to ${zoneName}. Awaiting report...`,
    upgradeMsg: (name, level) => `${name} → Level ${level}. Investment will pay off.`,
    offlineMsg: (gold, hours) =>
      `Night shift report: +${Math.floor(gold)} gold (${hours.toFixed(1)}h offline).`,
    prestigeMsg: (points) => `Guild restructured. +${points} Reputation recorded.`,
    clickBoostMsg: (mult, dur) => `Emergency collection! ${mult}× income for ${dur}s.`,
  },
  tutorial: [
    {
      id: 'welcome',
      title: 'Welcome, accountant',
      body: 'You are not the hero — you are the guild accountant. Gold ticks passively up top. Their deaths are your profit.',
      target: 'resources',
      completeOn: 'next',
    },
    {
      id: 'hire',
      title: '1. Hire a tenant',
      body: 'Upgrade your Squire. Each level adds DPS and passive income. Click the glowing button when you can afford it.',
      target: 'hire-squire',
      completeOn: 'hire_party',
    },
    {
      id: 'quest',
      title: '2. Send expedition',
      body: 'Send parties on quests for burst profit. Risk: some may die and need re-hiring.',
      target: 'start-quest',
      completeOn: 'start_quest',
    },
    {
      id: 'quest_wait',
      title: 'Quest running',
      body: 'Wait for the report. When done, profit and losses hit the ledger.',
      target: 'start-quest',
      completeOn: 'quest_done',
    },
    {
      id: 'upgrade',
      title: '3. Guild investment',
      body: 'Rent Hike boosts all income by 15%. The heart of idle games: small upgrade, big impact.',
      target: 'upgrade-rent',
      completeOn: 'buy_upgrade',
      upgradeId: 'rent_hike',
    },
    {
      id: 'done',
      title: 'The ledger is yours',
      body: 'Core loop: hire → send → upgrade → repeat. New zones cost gold from your wallet. Good profits.',
      target: 'resources',
      completeOn: 'next',
    },
  ],
  logs: {
    welcomeNew: 'Ledger open. First tenant at the desk — income flowing.',
    welcomeBack: 'Ledger open. Another day, another profit target.',
    reset: 'Ledger reset. New fiscal year.',
  },
};