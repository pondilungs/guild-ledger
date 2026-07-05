#!/usr/bin/env node
/**
 * Paste in browser console on live game, or run output from localStorage:
 * copy(localStorage.getItem('game-lab-analytics'))
 * Then: node scripts/export-analytics.mjs '<json>'
 */
const raw = process.argv[2] ?? '';
if (!raw) {
  console.log(`Usage:
  Browser console: copy(localStorage.getItem('game-lab-analytics'))
  Terminal: node scripts/export-analytics.mjs '<pasted-json>'

Retention quick view:
  - session_start count = unique sessions (approx)
  - day_return events = D1+ returns
  - tutorial_complete vs tutorial_skip`);
  process.exit(0);
}

try {
  const events = JSON.parse(raw);
  const counts = {};
  for (const e of events) {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
  }
  console.log('Event counts:', counts);
  console.log('Total events:', events.length);
  const sessions = events.filter((e) => e.type === 'session_start').length;
  const dayReturns = events.filter((e) => e.type === 'day_return').length;
  console.log(`Sessions: ${sessions}, Day returns: ${dayReturns}`);
  if (sessions > 0) {
    console.log(`D1 proxy: ${((dayReturns / sessions) * 100).toFixed(1)}%`);
  }
} catch (err) {
  console.error('Invalid JSON', err);
  process.exit(1);
}