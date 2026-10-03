import type { Failure } from '@core/failure';
import type { PagedList } from '@application/store/paging/paged-list';
import type { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';
import type { AutomationsViewKindType } from '@presentation/app/automations/model/automations-view-kind';
import type { InstagramConnectPhaseType } from '@presentation/base/widgets/instagram/instagram-connect-phase';

/** View model returned by {@link useAutomations}. */
export interface UseAutomationsResult {
  view: AutomationsViewKindType;
  /** Why the link could not be read; null unless `view` is Error. */
  connectionFailure: Failure | null;
  /** Reads the link again. */
  onRetryConnection: () => void;
  rules: PagedList<DmRuleEntity>;
  /** The link expired: switches and New are disabled, a banner offers Reconnect. */
  isPaused: boolean;
  handle: string;
  phase: InstagramConnectPhaseType;
  connect: () => void;
  onBack: () => void;
  onNew: () => void;
  onOpen: (rule: DmRuleEntity) => void;
  onToggle: (rule: DmRuleEntity, enabled: boolean) => void;
  /** The rule whose delete is being confirmed; null when the sheet is shut. */
  pendingDelete: DmRuleEntity | null;
  isDeleting: boolean;
  onAskDelete: (rule: DmRuleEntity) => void;
  onConfirmDelete: () => void;
  onCloseDelete: () => void;
  onEndReached: () => void;
  onRetry: () => void;
}
