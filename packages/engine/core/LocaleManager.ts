export type LocaleId = 'tr' | 'en';

const STORAGE_KEY = 'game-lab-locale';

export function detectLocale(): LocaleId {
  const saved = localStorage.getItem(STORAGE_KEY) as LocaleId | null;
  if (saved === 'tr' || saved === 'en') return saved;
  const lang = navigator.language.toLowerCase();
  return lang.startsWith('tr') ? 'tr' : 'en';
}

export type LocaleListener = () => void;

export class LocaleManager {
  private _locale: LocaleId;
  private listeners = new Set<LocaleListener>();

  constructor(initial?: LocaleId) {
    this._locale = initial ?? detectLocale();
  }

  get locale(): LocaleId {
    return this._locale;
  }

  setLocale(locale: LocaleId): void {
    if (this._locale === locale) return;
    this._locale = locale;
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    for (const fn of this.listeners) fn();
  }

  subscribe(fn: LocaleListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}