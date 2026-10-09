import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { Page } from '@domain/common/page';
import type { InstagramConnection } from '@domain/instagram/connect/instagram-connection';
import type { InstagramLinkResult } from '@domain/instagram/connect/instagram-link-result';
import type { InstagramMedia } from '@domain/instagram/instagram-media';
import type { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';
import type { DmRuleDraft } from '@domain/instagram/dm/dm-rule-draft';
import type { DmRuleChanges } from '@domain/instagram/dm/dm-rule-changes';
import type { DmSend } from '@domain/instagram/activity/dm-send';
import type { CreatorStats } from '@domain/instagram/stats/creator-stats';
import type { StatsRangeType } from '@domain/instagram/stats/stats-range';

/**
 * The viewer's Instagram link and comment-to-DM rules (backend #374). Every
 * call is the session user's; lists are paged (`page` is 1-based).
 */
export interface InstagramRepositoryInterface {
  getConnection(): Promise<Result<InstagramConnection, Failure>>;
  /** The instagram.com login URL; Instagram sends the user back to `returnTo`. */
  startLogin(returnTo: string): Promise<Result<string, Failure>>;
  /** Links the account with the return link's one-time code. */
  finalize(code: string): Promise<Result<InstagramLinkResult, Failure>>;
  disconnect(): Promise<Result<void, Failure>>;
  listMedia(page: number, pageSize: number): Promise<Result<Page<InstagramMedia>, Failure>>;
  listRules(page: number, pageSize: number): Promise<Result<Page<DmRuleEntity>, Failure>>;
  getRule(id: string): Promise<Result<DmRuleEntity, Failure>>;
  createRule(draft: DmRuleDraft): Promise<Result<DmRuleEntity, Failure>>;
  updateRule(id: string, changes: DmRuleChanges): Promise<Result<DmRuleEntity, Failure>>;
  deleteRule(id: string): Promise<Result<void, Failure>>;
  listSends(ruleId: string, page: number, pageSize: number): Promise<Result<Page<DmSend>, Failure>>;
  /** The creator stats panel for the last `days` days, today included. */
  getStats(days: StatsRangeType): Promise<Result<CreatorStats, Failure>>;
  /** Reports that a DM's recipe link was opened (`?dm=<sendId>`); works without a session. */
  recordDmOpen(sendId: string): Promise<Result<void, Failure>>;
  /** Reports that the recipe a DM carried was saved by the signed-in viewer who arrived through it. */
  recordDmSave(sendId: string, recipeId: string): Promise<Result<void, Failure>>;
}
