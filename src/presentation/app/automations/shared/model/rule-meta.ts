import type { TranslationsType } from '@presentation/i18n';
import { CharConstants } from '@core/constants';
import type { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';

/** "124 sent · Off" / "124 sent · Paused" — a rule card's meta line (spec §2). */
export const ruleMeta = (t: TranslationsType, rule: DmRuleEntity, isPaused: boolean, formatCount: (n: number) => string): string => {
  const copy = t.instagram;
  const state = isPaused ? copy.paused : rule.enabled ? null : copy.off;
  return [copy.sentCount.replace('{n}', formatCount(rule.sentCount)), state].filter((part) => part !== null).join(CharConstants.middotSpaced);
};
