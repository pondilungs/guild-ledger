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

export function questCompleteMsg(gold: number, deaths: number, zoneName: string): string {
  const base = QUEST_COMPLETE[Math.floor(Math.random() * QUEST_COMPLETE.length)];
  const goldPart = `+${Math.floor(gold)} altın`;
  const deathPart = deaths > 0 ? `, ${deaths} ölüm` : ', sıfır kayıp';
  return `${zoneName}: ${base} (${goldPart}${deathPart})`;
}

export function questDeathMsg(partyName: string): string {
  const base = QUEST_DEATH[Math.floor(Math.random() * QUEST_DEATH.length)];
  return `${partyName} — ${base}`;
}

export function hireMsg(partyName: string, level: number): string {
  const base = HIRE[Math.floor(Math.random() * HIRE.length)];
  return `${partyName} Lv${level}. ${base}`;
}

export function zoneUnlockMsg(zoneName: string): string {
  const base = ZONE_UNLOCK[Math.floor(Math.random() * ZONE_UNLOCK.length)];
  return `${zoneName} — ${base}`;
}

export function questStartMsg(zoneName: string, partyCount: number): string {
  return `${partyCount} parti ${zoneName}'a gönderildi. Rapor bekleniyor...`;
}

export function upgradeMsg(name: string, level: number): string {
  return `${name} → Seviye ${level}. Yatırım geri dönecek.`;
}

export function offlineMsg(gold: number, hours: number): string {
  return `Gece vardiyası raporu: +${Math.floor(gold)} altın (${hours.toFixed(1)}s offline).`;
}

export function prestigeMsg(points: number): string {
  return `Lonca yeniden yapılandırıldı. +${points} İtibar kaydedildi.`;
}

export function clickBoostMsg(multiplier: number, durationSec: number): string {
  return `Acil tahsilat! ${multiplier}× gelir ${durationSec} saniye aktif.`;
}