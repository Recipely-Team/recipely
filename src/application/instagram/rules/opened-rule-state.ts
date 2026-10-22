import type { OpenedRuleIdle } from '@application/instagram/rules/states/opened-rule-idle';
import type { OpenedRuleLoading } from '@application/instagram/rules/states/opened-rule-loading';
import type { OpenedRuleLoaded } from '@application/instagram/rules/states/opened-rule-loaded';
import type { OpenedRuleError } from '@application/instagram/rules/states/opened-rule-error';

/** The rule the editor or the Activity screen has open; `id` tells a late answer for another rule apart. */
export type OpenedRuleState =
  | OpenedRuleIdle
  | OpenedRuleLoading
  | OpenedRuleLoaded
  | OpenedRuleError;
