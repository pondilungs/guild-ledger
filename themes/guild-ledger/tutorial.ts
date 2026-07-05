import type { TutorialStep } from '../../packages/engine/core/TutorialManager.ts';

export const guildLedgerTutorial: TutorialStep[] = [
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
    body: 'Temel döngü: kirala → gönder → yükselt → tekrarla. Yeni bölgeler toplam altınla açılır. İyi kârlar.',
    target: 'resources',
    completeOn: 'next',
  },
];