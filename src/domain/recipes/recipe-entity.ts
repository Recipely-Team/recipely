import { BaseEntity } from '@core/entity/base-entity';
import type { RecipeEntityProps } from '@domain/recipes/recipe-entity-props';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import type { MediaItem } from '@domain/recipes/media/media-item';
import type { Difficulty } from '@domain/recipes/difficulty';
import type { RecipeNutrition } from '@domain/recipes/recipe-nutrition';
import { ValueConstants } from '@core/constants';


/**
 * Domain entity representing a recipe. Validates that `id` and `name` are
 * non-empty before construction; use `RecipeEntity.create` to obtain an instance.
 */
export class RecipeEntity extends BaseEntity<RecipeEntityProps> {
  private constructor(props: RecipeEntityProps) {
    super(props);
  }

  static create(props: RecipeEntityProps): Result<RecipeEntity, ValidationFailure> {
    if (props.id.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.recipe.idRequired, 'id'));
    }
    if (props.name.trim().length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.recipe.nameRequired, 'name'));
    }
    if (props.caloriesPerServing < ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.recipe.caloriesNegative, 'caloriesPerServing'));
    }
    if (props.servings < 1) {
      return fail(new ValidationFailure(DiagnosticMessage.entity.recipe.servingsTooLow, 'servings'));
    }
    return ok(new RecipeEntity(props));
  }

  get name(): string {
    return this.props.name;
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
  get ingredients(): string[] {
    return this.props.ingredients;
  }
  get instructions(): string[] {
    return this.props.instructions;
  }
  get prepTimeMinutes(): number {
    return this.props.prepTimeMinutes;
  }
  get cookTimeMinutes(): number {
    return this.props.cookTimeMinutes;
  }
  get servings(): number {
    return this.props.servings;
  }
  get caloriesPerServing(): number {
    return this.props.caloriesPerServing;
  }
  get nutrition(): RecipeNutrition | undefined {
    return this.props.nutrition;
  }
  get image(): string {
    return this.props.image;
  }
  get media(): MediaItem[] {
    return this.props.media;
  }
  get rating(): number {
    return this.props.rating;
  }
  get tags(): string[] {
    return this.props.tags;
  }
  get mealType(): string[] {
    return this.props.mealType;
  }
  get ownerId(): string {
    return this.props.ownerId;
  }
  get likeCount(): number {
    return this.props.likeCount;
  }
  get likedByMe(): boolean {
    return this.props.likedByMe;
  }

  get viewCount(): number {
    return this.props.viewCount;
  }
  get moderationStatus(): string {
    return this.props.moderationStatus;
  }
  get commentCount(): number {
    return this.props.commentCount;
  }
}
