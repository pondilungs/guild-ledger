import type { LocaleId } from '../../../packages/engine/core/LocaleManager.ts';
import type { GameLocale } from '../../../packages/engine/i18n/types.ts';
import { tr } from './tr.ts';
import { en } from './en.ts';

const locales: Record<LocaleId, GameLocale> = { tr, en };

export function getGuildLedgerLocale(locale: LocaleId): GameLocale {
  return locales[locale];
}