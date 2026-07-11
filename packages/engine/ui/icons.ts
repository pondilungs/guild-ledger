const SYMBOLS: Record<string, string> = {
  coin: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/>',
  rank: '<circle cx="12" cy="12" r="7.5"/><path class="fill-part" d="M12,8.3 L12.9,11 L15.7,12 L12.9,13 L12,15.7 L11.1,13 L8.3,12 L11.1,11 Z"/>',

  rat: '<ellipse cx="9" cy="15" rx="6" ry="4"/><circle cx="17" cy="12" r="2.6"/><path d="M18.2,9.6 L19.3,7.6"/><path d="M19.5,12 L21.7,12.6"/><path d="M3.2,16 Q1,18 3,20"/>',
  pickaxe: '<path d="M4,10 Q12,2 20,10"/><path d="M12,6 L17,20"/>',
  tombstone: '<path d="M7,20 L7,11 Q7,5 12,5 Q17,5 17,11 L17,20 Z"/><path d="M12,9 L12,16"/><path d="M9.3,11.7 L14.7,11.7"/>',
  dragon: '<path d="M3,19 Q3,11 9,11 Q15,11 15,5"/><path d="M11,10 L17.5,6.5 L14.5,13 Z"/><circle class="fill-part" cx="15" cy="5.2" r="0.9"/>',
  flame: '<path d="M12,20 C8,20 7,16 9,13 C9,15 11,15 10,12 C10,9 9,7 10,4 C13,7 15,10 13,14 C15,13 16,11 16,9 C18,13 16,20 12,20 Z"/>',
  halo: '<circle cx="12" cy="12" r="5.5"/><path d="M12,4.5 L12,2"/><path d="M12,22 L12,19.5"/><path d="M4.5,12 L2,12"/><path d="M22,12 L19.5,12"/>',

  sword: '<path d="M12,2 L12,16"/><path d="M8,14 L16,14"/><path d="M12,16 L12,20.5"/>',
  cross: '<path d="M12,3 L12,21"/><path d="M5,9 L19,9"/>',
  key: '<circle cx="8" cy="8" r="4.2"/><path d="M11,11 L20,20"/><path d="M17,17 L19.4,14.6"/><path d="M19,19 L21.4,16.6"/>',
  shield: '<path d="M12,3 L19,6 L19,12 Q19,18 12,21 Q5,18 5,12 L5,6 Z"/>',
  orb: '<circle cx="12" cy="12" r="6"/><path d="M12,6 L12,18"/><path d="M6,12 L18,12"/>',
  skull: '<circle cx="12" cy="10" r="6"/><circle class="fill-part" cx="9.5" cy="9.5" r="1"/><circle class="fill-part" cx="14.5" cy="9.5" r="1"/><path d="M9,15 L9,17"/><path d="M12,15.5 L12,18"/><path d="M15,15 L15,17"/>',
  lens: '<circle cx="10" cy="10" r="6"/><path d="M14.3,14.3 L20,20"/>',

  moon: '<path d="M15,4 A8,8 0 1,0 15,20 A6.3,6.3 0 1,1 15,4 Z"/>',
  briefcase: '<path d="M9,9 L9,6.5 Q9,4.5 12,4.5 Q15,4.5 15,6.5 L15,9"/><path d="M4,9 L20,9 L20,19 L4,19 Z"/>',

  wire: '<path d="M3,12 L6.5,6 L10,17 L13.5,6 L17,17 L21,12"/>',
  shard: '<path d="M12,3 L17,9 L14,21 L9,15 L6,9 Z"/>',
  candle: '<path d="M10,10 L14,10 L14,20 L10,20 Z"/><path d="M12,10 C10,10 10,7 12,4 C14,7 14,10 12,10 Z"/>',
  fang: '<path d="M9.5,4 Q8,4 8,7.5 Q8,14 11,21 Q12,17.5 12,7.5 Q12,4 9.5,4 Z"/>',
  quill: '<path d="M19,3 C13,3 5,9 5,17 L9,17 C9,11 15,6 19,3 Z"/><path d="M6.5,15.5 L3,21"/>',
  'wax-drip': '<path d="M12,4 C16,10 18,13 18,16 A6,6 0 1,1 6,16 C6,13 8,10 12,4 Z"/>',
  trap: '<path d="M4,12 L8.5,8 L8.5,16 Z"/><path d="M20,12 L15.5,8 L15.5,16 Z"/><circle class="fill-part" cx="12" cy="12" r="1"/>',
  lantern: '<path d="M10,9 L10,6.3 Q10,5 12,5 Q14,5 14,6.3 L14,9"/><path d="M8,9 L16,9 L16,17 L8,17 Z"/><circle class="fill-part" cx="12" cy="13" r="1.5"/>',

  chevron: '<path d="M5,15 L12,9 L19,15"/><path d="M5,20 L12,14 L19,20"/>',
  banner: '<path d="M6,3 L6,21"/><path d="M6,4 L18,7 L6,11 Z"/>',
  crown: '<path d="M4,17 L4,9 L8,13 L12,7 L16,13 L20,9 L20,17 Z"/><path d="M4,17 L20,17"/>',
};

export const SEAL_ICON_IDS: ReadonlySet<string> = new Set(Object.keys(SYMBOLS));

export const SEAL_SPRITE_ID = 'gl-icon-sprite';

export const SEAL_SPRITE = `<svg id="${SEAL_SPRITE_ID}" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">
  <defs>
    ${Object.entries(SYMBOLS).map(([id, body]) => (
      `<symbol id="icon-${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${body}</symbol>`
    )).join('')}
  </defs>
</svg>`;

export function ensureSealSprite(): void {
  if (typeof document === 'undefined' || document.getElementById(SEAL_SPRITE_ID)) return;
  document.body.insertAdjacentHTML('afterbegin', SEAL_SPRITE);
}

export function renderSeal(icon: string, extraClass = ''): string {
  if (SEAL_ICON_IDS.has(icon)) {
    return `<svg class="seal-glyph ${extraClass}"><use href="#icon-${icon}"></use></svg>`;
  }
  return `<span class="seal-mono ${extraClass}">${icon}</span>`;
}
