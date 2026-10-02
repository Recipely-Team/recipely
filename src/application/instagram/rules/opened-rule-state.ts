import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';
import type { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';

/** The rule the editor or the Activity screen has open; `id` tells a late answer for another rule apart. */
export type OpenedRuleState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading; id: string }
  | { status: typeof StoreStatus.Loaded; rule: DmRuleEntity }
  | { status: typeof StoreStatus.Error; id: string; failure: Failure };
