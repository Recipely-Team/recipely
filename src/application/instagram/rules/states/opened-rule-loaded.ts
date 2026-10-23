import type { StoreStatus } from '@application/store/store-status';
import type { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';

export interface OpenedRuleLoaded {
  status: typeof StoreStatus.Loaded;
  rule: DmRuleEntity;
}
