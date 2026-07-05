export type AnalyticsEvent =
  | { type: 'session_start'; themeId: string; ref: string }
  | { type: 'session_end'; durationSec: number }
  | { type: 'day_return'; dayNumber: number }
  | { type: 'prestige'; points: number; total: number }
  | { type: 'quest_complete'; zoneId: string; gold: number; deaths: number }
  | { type: 'zone_unlock'; zoneId: string }
  | { type: 'upgrade_buy'; upgradeId: string; level: number }
  | { type: 'party_hire'; partyId: string; level: number }
  | { type: 'tutorial_complete' }
  | { type: 'tutorial_skip'; step: number }
  | { type: 'click_boost_start'; multiplier: number };

const ANALYTICS_KEY = 'game-lab-analytics';

export function trackEvent(event: AnalyticsEvent): void {
  const events = getEvents();
  events.push({ ...event, timestamp: Date.now() });
  if (events.length > 500) events.splice(0, events.length - 500);
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));
}

export function getEvents(): Array<AnalyticsEvent & { timestamp: number }> {
  const raw = localStorage.getItem(ANALYTICS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function checkDayReturn(firstPlayTime: number): void {
  const dayNumber = Math.floor((Date.now() - firstPlayTime) / 86400000);
  const key = `game-lab-day-${dayNumber}`;
  if (dayNumber > 0 && !localStorage.getItem(key)) {
    localStorage.setItem(key, '1');
    trackEvent({ type: 'day_return', dayNumber });
  }
}