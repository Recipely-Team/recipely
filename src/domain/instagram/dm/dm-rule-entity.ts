import { BaseEntity } from '@core/entity/base-entity';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import type { DmRuleMedia } from '@domain/instagram/dm/dm-rule-media';
import type { DmRuleRecipe } from '@domain/instagram/dm/dm-rule-recipe';
import type { DmRuleEntityProps } from '@domain/instagram/dm/dm-rule-entity-props';

/**
 * One comment-to-DM rule: when a comment on `mediaId` contains a keyword,
 * Recipely privately replies with `dmText` and the recipe — the Instagram
 * automations aggregate root. References its recipe and media by id.
 *
 * @remarks
 * - **`withEnabled` is how a switch flips optimistically**; the server's
 *   answer replaces it, or the old one comes back.
 */
export class DmRuleEntity extends BaseEntity<DmRuleEntityProps> {
  private constructor(props: DmRuleEntityProps) {
    super(props);
  }

  static create(props: DmRuleEntityProps): Result<DmRuleEntity, ValidationFailure> {
    if (props.id.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.instagram.sourceInvalid('rule id', props.id), 'id'));
    }
    return ok(new DmRuleEntity(props));
  }

  get mediaId(): string {
    return this.props.mediaId;
  }

  get media(): DmRuleMedia {
    return this.props.media;
  }

  get keywords(): readonly string[] {
    return this.props.keywords;
  }

  get recipeId(): string {
    return this.props.recipeId;
  }

  get recipe(): DmRuleRecipe | null {
    return this.props.recipe;
  }

  get dmText(): string {
    return this.props.dmText;
  }

  get publicReplyText(): string | null {
    return this.props.publicReplyText;
  }

  get enabled(): boolean {
    return this.props.enabled;
  }

  get sentCount(): number {
    return this.props.sentCount;
  }

  withEnabled(enabled: boolean): DmRuleEntity {
    return new DmRuleEntity({ ...this.props, enabled });
  }
}
