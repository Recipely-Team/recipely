import type { PagedList } from '@application/store/paging/paged-list';
import type { OpenedRuleState } from '@application/instagram/rules/opened-rule-state';
import type { DmSend } from '@domain/instagram/activity/dm-send';
import type { SendFilterType } from '@presentation/app/automations/activity/model/send-filter';

/** View model returned by {@link useAutomationActivity}. */
export interface UseAutomationActivityResult {
  opened: OpenedRuleState;
  sends: PagedList<DmSend>;
  /** The loaded sends the segment shows. */
  shown: readonly DmSend[];
  filter: SendFilterType;
  isPaused: boolean;
  setFilter: (filter: SendFilterType) => void;
  onBack: () => void;
  onEdit: () => void;
  onToggle: (enabled: boolean) => void;
  onEndReached: () => void;
  onRetry: () => void;
}
