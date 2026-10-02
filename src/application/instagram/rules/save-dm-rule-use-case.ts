import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';
import type { DmRuleDraft } from '@domain/instagram/dm/dm-rule-draft';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';

/**
 * Creates a rule, or — given the id of one — rewrites its keywords, recipe
 * and texts. The post of an existing rule never changes (the API refuses it).
 */
export class SaveDmRuleUseCase {
  constructor(private readonly repo: InstagramRepositoryInterface) {}

  execute(draft: DmRuleDraft, ruleId: string | null): Promise<Result<DmRuleEntity, Failure>> {
    if (ruleId === null) return this.repo.createRule(draft);
    return this.repo.updateRule(ruleId, {
      keywords: draft.keywords,
      recipeId: draft.recipeId,
      dmText: draft.dmText,
      publicReplyText: draft.publicReplyText,
    });
  }
}
