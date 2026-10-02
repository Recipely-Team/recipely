import { CharConstants } from '@core/constants';
import type { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';
import { t } from '@presentation/i18n';

/** "124 sent · Off" / "124 sent · Paused" — a rule card's meta line (spec §2). */
export const ruleMeta = (rule: DmRuleEntity, isPaused: boolean, formatCount: (n: number) => string): string => {
  const copy = t().instagram;
  const state = isPaused ? copy.paused : rule.enabled ? null : copy.off;
  return [copy.sentCount.replace('{n}', formatCount(rule.sentCount)), state].filter((part) => part !== null).join(CharConstants.middotSpaced);
};
