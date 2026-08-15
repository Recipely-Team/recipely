import { BaseEntity } from '@core/entity/base-entity';
import type { RecipeSummaryEntityProps } from '@domain/recipes/recipe-summary-entity-props';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import type { Difficulty } from '@domain/recipes/difficulty';
import { ValueConstants } from '@core/constants';


/**
 * Lightweight domain entity for list contexts (discover feed, my-recipes,
 * trending). Mirrors the backend's `RecipeListItemDto` split from the full
 * `RecipeDto`. Validates that `id` and `name` are non-empty before
 * construction; use `RecipeSummaryEntity.create` to obtain an instance. The full
 * `Recipe` entity remains the detail-only shape and is unaffected by this type.
 */
export class RecipeSummaryEntity extends BaseEntity<RecipeSummaryEntityProps> {
  private constructor(props: RecipeSummaryEntityProps) {
    super(props);
  }

  static create(props: RecipeSummaryEntityProps): Result<RecipeSummaryEntity, ValidationFailure> {
    if (props.id.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.recipe.idRequired, 'id'));
    }
    if (props.name.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.recipe.nameRequired, 'name'));
    }
    return ok(new RecipeSummaryEntity(props));
  }

  get name(): string {
    return this.props.name;
  }
  get image(): string {
    return this.props.image;
  }
  get cuisine(): string {
    return this.props.cuisine;
  }
  get category(): string {
    return this.props.category;
  }
  get difficulty(): Difficulty {
    return this.props.difficulty;
  }
  get totalTimeMinutes(): number | null {
    return this.props.totalTimeMinutes;
  }
  get rating(): number {
    return this.props.rating;
  }
  get moderationStatus(): string {
    return this.props.moderationStatus;
  }
  get likeCount(): number {
    return this.props.likeCount;
  }
  get likedByMe(): boolean {
    return this.props.likedByMe;
  }
  get commentCount(): number {
    return this.props.commentCount;
  }
  get viewCount(): number {
    return this.props.viewCount;
  }
}
