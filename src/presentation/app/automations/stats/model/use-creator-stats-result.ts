import type { Failure } from '@core/failure';
import type { CreatorStats } from '@domain/instagram/stats/creator-stats';
import type { StatsRangeType } from '@domain/instagram/stats/stats-range';
import type { StatsViewKindType } from '@presentation/app/automations/stats/model/stats-view-kind';
import type { InstagramConnectPhaseType } from '@presentation/base/widgets/instagram/instagram-connect-phase';

/** View model returned by {@link useCreatorStats}. */
export interface UseCreatorStatsResult {
  view: StatsViewKindType;
  /** The range's answer once loaded (also behind NoAutomations / NoSends). */
  stats: CreatorStats | null;
  /** Why the link or the stats could not be read; null unless `view` is Error. */
  failure: Failure | null;
  range: StatsRangeType;
  /** The next longer range for the no-sends state; null on 90 days. */
  nextRange: StatsRangeType | null;
  /** `@handle` under the title. */
  handle: string | null;
  /** The usable content width, for the 600 / 720 layout steps. */
  contentWidth: number;
  phase: InstagramConnectPhaseType;
  connect: () => void;
  setRange: (days: StatsRangeType) => void;
  onBack: () => void;
  onOpenPost: (ruleId: string) => void;
  onCreate: () => void;
  onViewAutomations: () => void;
  onRetry: () => void;
}
