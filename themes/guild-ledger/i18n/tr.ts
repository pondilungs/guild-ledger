import type { GameLocale } from '../../../packages/engine/i18n/types.ts';

const QUEST_COMPLETE = [
  'Görev raporu geldi. Cebimiz rahatladı.',
  'Parti döndü. Ölümler fatura edildi.',
  'Muhasebe kapandı. Kâr yazıldı.',
  'Sigorta şirketi ağladı. Biz güldük.',
];

const QUEST_DEATH = [
  'Bir kiracı öldü. Yeniden kiralanması gerekiyor.',
  'Parti üyesi düştü. Deftere "gider" olarak işlendi.',
  'Maceracı faturalandı. Kalıcı olarak.',
];

const HIRE = [
  'Yeni kiracı imzaladı. Depozito alındı.',
  'Sözleşme yenilendi. Seviye arttı.',
  'Parti genişledi. Daha fazla risk, daha fazla kira.',
];

const ZONE_UNLOCK = [
  'Yeni bölge açıldı. Kira oranları güncellendi.',
  'Emlak portföyü büyüdü. Vergi mükellefi olduk.',
];

export const tr: GameLocale = {
  tagline: 'Sen kahraman değilsin — lonca muhasebecisisin. Partiler ölürken sen kâr yazarsın.',
  prestigeCurrency: 'Lonca İtibarı',
  ui: {
    collect: 'Tahsil Et',
    collectBoost: 'Tıkla: anlık altın + {mult}× gelir',
    hire: 'Kirala',
    upgrade: 'Yükselt',
    sendQuest: 'Gönder (Expedition)',
    questInProgress: 'Görev devam ediyor...',
    activeZone: 'Aktif Bölge',
    ledger: 'Muhasebe Defteri',
    ledgerEmpty: 'Henüz kayıt yok.',
    parties: 'Partiler (Kiracılar)',
    investments: 'Lonca Yatırımları',
    total: 'Toplam',
    prestige: 'Prestige',
    prestigeNeed: 'altın gerekli',
    reset: 'Sıfırla',
    unlock: 'Aç',
    select: 'Seç',
    active: 'Aktif',
    zoneRequired: 'Bölge gerekli',
    offlineEarnings: 'Offline kazanç',
    needIncome: 'Gelir gerekli',
    afterQuest: 'Görev sonrası ~',
    earnSuffix: 'kazanım',
    confirmPrestige: 'Prestige yapmak ilerlemeni sıfırlar ama kalıcı bonus verir. Emin misin?',
    confirmReset: 'Tüm ilerleme silinecek. Emin misin?',
    tutorialSkip: 'Atla',
    tutorialGotIt: 'Anladım',
    tutorialStart: 'Başla!',
    tutorialWait: 'Görevi tamamla...',
    langLabel: 'Dil',
    leaderboard: 'Sıralama',
    profile: 'Profil',
    myProfile: 'Senin profilin',
    createProfile: 'Profil Oluştur',
    usernamePlaceholder: 'Kullanıcı adı (3-16)',
    setUsername: 'Profil oluştur',
    save: 'Kaydet',
    close: 'Kapat',
    rank: 'Sıra',
    player: 'Oyuncu',
    statTotalGold: 'Toplam kazanç',
    statCurrentGold: 'Cüzdan',
    statPrestige: 'Prestige',
    statPlayTime: 'Oyun süresi',
    statZones: 'Açık bölge',
    statHighestZone: 'En yüksek bölge',
    statPartyLevels: 'Parti seviyeleri',
    statUpgradeLevels: 'Yatırım seviyeleri',
    leaderboardEmpty: 'Henüz oyuncu yok.',
    leaderboardOffline: 'Sunucuya bağlanılamadı — son bilinen sıralama gösteriliyor.',
    leaderboardLoading: 'Yükleniyor...',
    createUsernameHint: 'Sıralamada görünmek için bir kullanıcı adı seç. Harf, rakam ve alt çizgi kullanabilirsin.',
    usernameInvalid: 'Geçersiz kullanıcı adı (3-16 karakter, a-z, 0-9, _)',
    profileNotFound: 'Profil bulunamadı.',
  },
  zones: {
    rat_cellar: { name: 'Sıçan Bodrumu', description: 'Yeni maceracılar için ucuz ölüm.' },
    goblin_mine: { name: 'Goblin Madeni', description: 'Goblinler hem düşman hem fatura kesiyor.' },
    haunted_crypt: { name: 'Lanetli Mahzen', description: 'Ölüm sigortası burada geçersiz.' },
    dragon_vault: { name: 'Ejderha Kasası', description: 'Yüksek risk, yüksek kira.' },
  },
  parties: {
    squire: { name: 'Çırak', description: 'Ucuz, değiştirilebilir, vergi kesintisiz.' },
    cleric: { name: 'Rahip', description: 'Az ölür, az kazanır. Muhasebe dostu.' },
    rogue: { name: 'Hırsız', description: 'Ganimet bonusu. Sigorta dolandırıcısı.' },
    knight: { name: 'Şövalye', description: 'Tank. Kirayı geç öder ama öder.' },
    mage: { name: 'Büyücü', description: 'AoE faturalandırma uzmanı.' },
  },
  upgrades: {
    rent_hike: { name: 'Kira Artışı', description: '+15% altın geliri' },
    insurance_fraud: { name: 'Sigorta Dolandırıcılığı', description: '-8% parti ölüm şansı' },
    desk_efficiency: { name: 'Masa Başı Verimlilik', description: '+10% DPS' },
    night_shift: { name: 'Gece Vardiyası', description: '+20% offline kazanç' },
    guild_reputation: { name: 'Lonca İtibarı', description: '+5% prestige puanı' },
  },
  flavor: {
    questCompleteMsg: (gold, deaths, zoneName) => {
      const base = QUEST_COMPLETE[Math.floor(Math.random() * QUEST_COMPLETE.length)];
      const deathPart = deaths > 0 ? `, ${deaths} ölüm` : ', sıfır kayıp';
      return `${zoneName}: ${base} (+${Math.floor(gold)} altın${deathPart})`;
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
      `${partyCount} parti ${zoneName}'a gönderildi. Rapor bekleniyor...`,
    upgradeMsg: (name, level) => `${name} → Seviye ${level}. Yatırım geri dönecek.`,
    offlineMsg: (gold, hours) =>
      `Gece vardiyası raporu: +${Math.floor(gold)} altın (${hours.toFixed(1)}s offline).`,
    prestigeMsg: (points) => `Lonca yeniden yapılandırıldı. +${points} İtibar kaydedildi.`,
    clickBoostMsg: (mult, dur) => `Acil tahsilat! ${mult}× gelir ${dur} saniye aktif.`,
  },
  tutorial: [
    {
      id: 'welcome',
      title: 'Hoş geldin, muhasebeci',
      body: 'Sen kahraman değilsin — lonca muhasebecisisin. Üstteki altın her saniye pasif akar. Partilerin ölümü senin kârın.',
      target: 'resources',
      completeOn: 'next',
    },
    {
      id: 'hire',
      title: '1. Kiracı kirala',
      body: 'Çırağını yükselt. Her seviye daha fazla DPS ve pasif gelir demek. Altın yetince parlayan butona bas.',
      target: 'hire-squire',
      completeOn: 'hire_party',
    },
    {
      id: 'quest',
      title: '2. Gönder (Expedition)',
      body: 'Partileri göreve yolla — pasif gelirden daha hızlı kâr. Risk var: bazıları ölebilir, yeniden kiralarsın.',
      target: 'start-quest',
      completeOn: 'start_quest',
    },
    {
      id: 'quest_wait',
      title: 'Görev devam ediyor',
      body: 'Rapor gelene kadar bekle. Bittiğinde deftere kâr ve olası kayıplar yazılır.',
      target: 'start-quest',
      completeOn: 'quest_done',
    },
    {
      id: 'upgrade',
      title: '3. Lonca yatırımı',
      body: 'Kira Artışı ile tüm gelirini %15 artır. Idle oyunların kalbi: küçük upgrade, büyük etki.',
      target: 'upgrade-rent',
      completeOn: 'buy_upgrade',
      upgradeId: 'rent_hike',
    },
    {
      id: 'done',
      title: 'Defter senin',
      body: 'Temel döngü: kirala → gönder → yükselt → tekrarla. Yeni bölgeler cüzdandan altın ödeyerek açılır. İyi kârlar.',
      target: 'resources',
      completeOn: 'next',
    },
  ],
  logs: {
    welcomeNew: 'Defter açıldı. İlk kiracın masada — gelir akıyor.',
    welcomeBack: 'Defter açıldı. Bugün de kâr hedefliyoruz.',
    reset: 'Defter sıfırlandı. Yeni mali yıl başladı.',
  },
};