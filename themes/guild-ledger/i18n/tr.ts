import type { GameLocale } from '../../../packages/engine/i18n/types.ts';

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const QUEST_COMPLETE = [
  'Görev raporu geldi. Cebimiz rahatladı.',
  'Parti döndü. Ölümler fatura edildi.',
  'Muhasebe kapandı. Kâr yazıldı.',
  'Sigorta şirketi ağladı. Biz güldük.',
  'Dönüş raporu onaylandı. Bonus kesintisi yok.',
  'Ganimet sayıldı. Vergi beyanı sonraya kaldı.',
  'Görev başarılı. Ölüm masrafları zaten düşüldü.',
  'Macera bitti, makbuz kesildi.',
  'Parti hayatta kaldı. Şaşırtıcı ama kârlı.',
  'Rapor dosyalandı. CFO onayı alındı.',
  'Hasar tazminatı reddedildi. Standart işlem.',
  'Düşmanlar öldü, faturalar ödendi. Dengeli tablo.',
  'Kâr marjı kabul edilebilir. Şampanya yok.',
  'Gelir tahsil edildi. Moral gider kalemi değil.',
  'Görev kapanışı yapıldı. Komisyon içeride kaldı.',
];

const QUEST_DEATH = [
  'Bir kiracı öldü. Yeniden kiralanması gerekiyor.',
  'Parti üyesi düştü. Deftere "gider" olarak işlendi.',
  'Maceracı faturalandı. Kalıcı olarak.',
  'Son maaşı defterden düşüldü.',
  'Sigorta reddi geldi. Beklenen gider.',
  'Kiracı sözleşmesi feshedildi. Kalıcı olarak.',
  'Yedek personel listesine alındı.',
  'Ölüm tazminatı ödenmedi. Biz de ödemedik.',
  'Cenaze masrafı kiradan mahsup edildi.',
  'İş güvenliği raporu: ihmal edilebilir.',
  'Vefat duyurusu müşteriye gönderilmedi.',
  'Yeniden işe alım bütçesi ayrıldı. Teşekkür ederiz.',
  'Personel çıkışı işlendi. İK dosyası kapatıldı.',
  'Kayıp zimmet deftere yazıldı. Telafi yok.',
];

const HIRE = [
  'Yeni kiracı imzaladı. Depozito alındı.',
  'Sözleşme yenilendi. Seviye arttı.',
  'Parti genişledi. Daha fazla risk, daha fazla kira.',
  'Kira artışı bildirimi gönderildi. İtiraz yok.',
  'Personel tablosuna eklendi. Maliyet yükseldi.',
  'Deneme süresi yok. Direkt savaş alanına.',
  'İşe giriş formu imzalandı. Peşinat alındı.',
  'Birim güçlendirildi. Sigorta primi de arttı.',
  'Yeni sözleşme: düşük maaş, yüksek risk.',
  'Kiracı listesine yazıldı. Kapora cebimize girdi.',
  'Seviye yükseltmesi onaylandı. Amortisman devam ediyor.',
  'Ek kadro alındı. Verimlilik raporu sonra gelecek.',
];

const ZONE_UNLOCK = [
  'Yeni bölge açıldı. Kira oranları güncellendi.',
  'Emlak portföyü büyüdü. Vergi mükellefi olduk.',
  'Tapu devri tamamlandı. Ölüm kapasitesi arttı.',
  'Yeni sektör, yeni vergi dilimi.',
  'Bölge mülkiyeti transfer edildi. Noter ücreti ödendi.',
  'Pazar analizi: daha fazla ölüm, daha fazla gelir.',
  'Harita genişledi. Kira endeksi yeniden hesaplandı.',
  'Yatırım onaylandı. Maceracı talebi artacak.',
  'Franchise anlaşması imzalandı. Komisyon içeride.',
  'Bölge lisansı yenilendi. Faaliyet alanı genişledi.',
];

const QUEST_START = [
  (zone: string, n: number) => `${n} parti ${zone}'a gönderildi. Rapor bekleniyor...`,
  (zone: string, n: number) => `${n} kiracı ${zone}'da görevde. Tahsilat gecikmeli.`,
  (zone: string, n: number) => `${zone}: ${n} parti sahaya çıktı. Makbuz hazırlanıyor.`,
  (zone: string, n: number) => `Sevkiyat tamam. ${n} parti ${zone}'a yollandı.`,
  (zone: string, n: number) => `${n} sözleşmeli maceracı ${zone}'da. Geri dönüş belirsiz.`,
  (zone: string, n: number) => `${zone} operasyonu başladı. ${n} kiracı sahada.`,
  (zone: string, n: number) => `Görev emri kesildi: ${n} parti → ${zone}.`,
  (zone: string, n: number) => `${n} birim ${zone}'a konuşlandı. Hasar tahmini: düşük.`,
];

const UPGRADE = [
  (name: string, level: number) => `${name} → Seviye ${level}. Yatırım geri dönecek.`,
  (name: string, level: number) => `${name} Lv${level}. Amortisman süresi uzadı, kâr da.`,
  (name: string, level: number) => `${name} yükseltildi (Sv.${level}). Muhasebe onayladı.`,
  (name: string, level: number) => `${name} kapasitesi arttı. Seviye ${level} faturalandı.`,
  (name: string, level: number) => `${name} → ${level}. ROI hesap tablosuna işlendi.`,
  (name: string, level: number) => `${name} yatırımı Sv.${level}. Vergi danışmanı memnun.`,
  (name: string, level: number) => `${name} genişletildi. Seviye ${level}, gider değil varlık.`,
];

const OFFLINE = [
  (gold: number, hours: number) =>
    `Gece vardiyası raporu: +${Math.floor(gold)} altın (${hours.toFixed(1)}s offline).`,
  (gold: number, hours: number) =>
    `Sabah kasa sayımı: +${Math.floor(gold)} altın (${hours.toFixed(1)}s offline). Gece boyunca işlendi.`,
  (gold: number, hours: number) =>
    `Masa başı nöbet özeti: +${Math.floor(gold)} altın / ${hours.toFixed(1)}s.`,
  (gold: number, hours: number) =>
    `Otomatik tahsilat tamam: +${Math.floor(gold)} altın (${hours.toFixed(1)}s). Sen uyurken defter çalıştı.`,
  (gold: number, hours: number) =>
    `Pasif gelir raporu: +${Math.floor(gold)} altın (${hours.toFixed(1)}s). Müdür izindeydi.`,
  (gold: number, hours: number) =>
    `Gece muhasebesi kapandı: +${Math.floor(gold)} altın (${hours.toFixed(1)}s). Fazla mesai ücreti yok.`,
];

const PRESTIGE = [
  (points: number) => `Lonca yeniden yapılandırıldı. +${points} İtibar kaydedildi.`,
  (points: number) => `Kurumsal reset tamam. +${points} İtibar amortismanından düşüldü.`,
  (points: number) => `Yeniden markalaşma bitti. +${points} İtibar deftere işlendi.`,
  (points: number) => `Stratejik sıfırlama onaylandı. +${points} İtibar kalıcı bonus.`,
  (points: number) => `Franchise yenilendi. +${points} İtibar, eski kayıtlar silindi.`,
  (points: number) => `Bilanço yenilendi. +${points} İtibar. Yeni mali dönem açıldı.`,
];

const CLICK_BOOST = [
  (mult: number, dur: number) => `Acil tahsilat! ${mult}× gelir ${dur} saniye aktif.`,
  (mult: number, dur: number) => `Kriz modu: ${mult}× gelir ${dur} sn. Defter kapatılmadı.`,
  (mult: number, dur: number) => `Hızlı tahsilat devrede: ${mult}× / ${dur}s.`,
  (mult: number, dur: number) => `Vergi dairesi gelmeden önce: ${mult}× gelir, ${dur} sn.`,
  (mult: number, dur: number) => `Kasa hızlandırıldı. ${mult}× gelir ${dur} saniye.`,
  (mult: number, dur: number) => `Bonus dönem açıldı: ${mult}× gelir (${dur}s).`,
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
    partiesScrollHint: '↓ Kaydır — yeni kiracılar altta',
    investmentsScrollHint: '↓ Kaydır — tüm yatırımlar',
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
    updateBanner: 'v0.4.0 — İtibar Pazarı açıldı! Prestige puanlarını harca; sıralama toplam itibarını gösterir.',
    prestigeShop: 'İtibar Pazarı',
    prestigeShopDesc: 'Prestige puanlarınla kalıcı bonuslar al. Harcadığın puanlar sıralamayı düşürmez.',
    prestigeBalance: 'Harcayabilir',
    prestigeLifetime: 'Toplam itibar',
    buyWithPrestige: 'Satın al',
    leaderboardTabOverall: 'Genel',
    leaderboardTabPrestige100: '100 İtibar',
    prestige100Race: '100 İtibara İlk Ulaşanlar',
    prestige100RaceDesc: 'Lifetime itibarı 100\'e ilk ulaşan oyuncular. Kim önce ulaştıysa üstte.',
    prestige100ReachedAt: 'Ulaşma',
    prestige100Empty: 'Henüz kimse 100 itibara ulaşmadı. İlk sen ol!',
  },
  zones: {
    rat_cellar: { name: 'Sıçan Bodrumu', description: 'Yeni maceracılar için ucuz ölüm.' },
    goblin_mine: { name: 'Goblin Madeni', description: 'Goblinler hem düşman hem fatura kesiyor.' },
    haunted_crypt: { name: 'Lanetli Mahzen', description: 'Ölüm sigortası burada geçersiz.' },
    dragon_vault: { name: 'Ejderha Kasası', description: 'Yüksek risk, yüksek kira.' },
    infernal_ledger: { name: 'Cehennem Defteri', description: 'Şeytani faiz oranları. Ölümler vergi indirimi sayılır.' },
    celestial_audit: { name: 'Göksel Denetim', description: 'Tanrılar bile makbuz ister. Son büyük kâr kapısı.' },
  },
  parties: {
    squire: { name: 'Çırak', description: 'Ucuz, değiştirilebilir, vergi kesintisiz.' },
    cleric: { name: 'Rahip', description: 'Az ölür, az kazanır. Muhasebe dostu.' },
    rogue: { name: 'Hırsız', description: 'Ganimet bonusu. Sigorta dolandırıcısı.' },
    knight: { name: 'Şövalye', description: 'Tank. Kirayı geç öder ama öder.' },
    mage: { name: 'Büyücü', description: 'AoE faturalandırma uzmanı.' },
    warlock: { name: 'Warlock', description: 'Karanlık sözleşmeler. Yüksek DPS, yüksek dava riski.' },
    auditor: { name: 'Baş Denetçi', description: 'Her vuruşu fatura eder. Geç oyunun son kalemi.' },
  },
  upgrades: {
    rent_hike: { name: 'Kira Artışı', description: '+15% altın geliri' },
    insurance_fraud: { name: 'Sigorta Dolandırıcılığı', description: '-8% parti ölüm şansı' },
    desk_efficiency: { name: 'Masa Başı Verimlilik', description: '+10% DPS' },
    night_shift: { name: 'Gece Vardiyası', description: '+20% offline kazanç' },
    guild_reputation: { name: 'Lonca İtibarı', description: '+5% prestige puanı' },
    tax_evasion: { name: 'Vergi Kaçırma', description: '+12% altın geliri (geç oyun)' },
  },
  prestigeShop: {
    golden_seal: { name: 'Altın Mühür', description: 'Kalıcı +%4 altın geliri' },
    night_audit: { name: 'Gece Denetimi', description: 'Kalıcı +%6 offline kazanç' },
    tenant_insurance: { name: 'Kiracı Sigortası', description: 'Kalıcı -%2 ölüm şansı' },
    opening_balance: { name: 'Açılış Bakiyesi', description: 'Prestige sonrası +30 başlangıç altını' },
  },
  flavor: {
    questCompleteMsg: (gold, deaths, zoneName) => {
      const base = pick(QUEST_COMPLETE);
      const deathPart = deaths > 0 ? `, ${deaths} ölüm` : ', sıfır kayıp';
      return `${zoneName}: ${base} (+${Math.floor(gold)} altın${deathPart})`;
    },
    questDeathMsg: (partyName) => `${partyName} — ${pick(QUEST_DEATH)}`,
    hireMsg: (partyName, level) => `${partyName} Lv${level}. ${pick(HIRE)}`,
    zoneUnlockMsg: (zoneName) => `${zoneName} — ${pick(ZONE_UNLOCK)}`,
    questStartMsg: (zoneName, partyCount) => pick(QUEST_START)(zoneName, partyCount),
    upgradeMsg: (name, level) => pick(UPGRADE)(name, level),
    offlineMsg: (gold, hours) => pick(OFFLINE)(gold, hours),
    prestigeMsg: (points) => pick(PRESTIGE)(points),
    shopBuyMsg: (name, level) => `${name} → Sv.${level}. Kalıcı yatırım deftere işlendi.`,
    clickBoostMsg: (mult, dur) => pick(CLICK_BOOST)(mult, dur),
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