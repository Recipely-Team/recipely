import { BaseEntity } from '@core/entity/base-entity';
import type { RecipeEntityProps } from '@domain/recipes/recipe-entity-props';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import type { MediaItem } from '@domain/recipes/media/media-item';
import type { FocalPoint } from '@domain/recipes/media/focal-point';
import type { ImageCredit } from '@domain/recipes/media/image-credit';
import type { NutritionSourceType } from '@domain/recipes/nutrition/nutrition-source';
import type { Difficulty } from '@domain/recipes/difficulty';
import type { RecipeNutrition } from '@domain/recipes/recipe-nutrition';
import { ValueConstants } from '@core/constants';
import { NutritionFacts } from '@domain/recipes/nutrition/nutrition-facts';
import type { RecipeOriginType } from '@domain/recipes/provenance/recipe-origin';
import type { ProvenanceMarkType } from '@domain/recipes/provenance/provenance-mark';
import { toProvenanceMarks } from '@domain/recipes/provenance/to-provenance-marks';
import type { SourcePlatformType } from '@domain/recipes/provenance/source-platform';
import type { PublishBlockerType } from '@domain/recipes/publishing/publish-blocker';
import { OwnerStatus, type OwnerStatusType } from '@domain/recipes/publishing/owner-status';
import { toOwnerStatus } from '@domain/recipes/publishing/to-owner-status';
import type { PublishOutcome } from '@domain/recipes/publishing/publish-outcome';
import type { CoverRemoval } from '@domain/recipes/publishing/cover-removal';
import { MediaType } from '@domain/recipes/media/media-type';


/**
 * Domain entity representing a recipe. Validates that `id` and `name` are
 * non-empty before construction; use `RecipeEntity.create` to obtain an instance.
 *
 * @remarks
 * - **Publishing state is derived, not stored.** `ownerStatus` and `canPublish`
 *   read `isPublished`, the moderation status and the owner-only blockers; a
 *   publish or cover removal returns a NEW entity carrying the server's answer.
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
  /** The nutrition figures with their basis conversion and daily-value rules. */
  get nutritionFacts(): NutritionFacts {
    return NutritionFacts.of({
      caloriesPerServing: this.props.caloriesPerServing,
      servings: this.props.servings,
      nutrition: this.props.nutrition,
    });
  }
  get image(): string {
    return this.props.image;
  }
  get imageFocus(): FocalPoint | undefined {
    return this.props.imageFocus;
  }
  /** The cover photo's credit line; `null` when the photo needs none. */
  get imageCredit(): ImageCredit | null {
    return this.props.imageCredit ?? null;
  }
  /** Where the nutrition figures were looked up; `null` when they were estimated. */
  get nutritionSource(): NutritionSourceType | null {
    return this.props.nutritionSource ?? null;
  }
  get media(): MediaItem[] {
    return this.props.media;
  }
  /**
   * The photos the detail hero pages through: the gallery's images, or the cover
   * alone (with its focus) when the gallery has none. A blank cover is no photo,
   * so a recipe without one yields an empty list — the "add first photo" state.
   */
  get heroPhotos(): readonly MediaItem[] {
    const images = this.props.media.filter((m) => m.type === MediaType.Image);
    if (images.length > ValueConstants.zero) return images;
    if (this.props.image.trim().length === ValueConstants.zero) return [];
    const focus = this.props.imageFocus;
    return [{ type: MediaType.Image, url: this.props.image, ...(focus !== undefined ? { focus } : {}) }];
  }
  /** How many photos the hero pages through; trims the cover like the backend's `Recipe.photoCount()`. */
  get photoCount(): number {
    return this.heroPhotos.length;
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

  /** Where the text came from; see `RecipeOrigin`. */
  get origin(): RecipeOriginType {
    return this.props.origin;
  }

  /** The post an import came from, when there is one. */
  get sourceUrl(): string | undefined {
    return this.props.sourceUrl;
  }

  /** The account that posted it, without the '@'. */
  get sourceHandle(): string | undefined {
    return this.props.sourceHandle;
  }
  get sourcePlatform(): SourcePlatformType | null {
    return this.props.sourcePlatform;
  }
  get aiWritten(): boolean {
    return this.props.aiWritten;
  }
  /** What the provenance seal carries; empty when a person wrote the recipe. */
  get provenanceMarks(): readonly ProvenanceMarkType[] {
    return toProvenanceMarks(this.props.origin, this.props.sourcePlatform, this.props.aiWritten);
  }
  get moderationStatus(): string {
    return this.props.moderationStatus;
  }
  get isPublished(): boolean {
    return this.props.isPublished;
  }
  /** What still keeps a website import private; empty when nothing does or nobody said. */
  get publishBlockers(): readonly PublishBlockerType[] {
    return this.props.publishBlockers ?? [];
  }
  /** How the recipe reads to its owner. */
  get ownerStatus(): OwnerStatusType {
    return toOwnerStatus(this.props.isPublished, this.props.moderationStatus);
  }
  /** A private recipe with nothing left on its checklist. Rejected is never publishable. */
  get canPublish(): boolean {
    return this.ownerStatus === OwnerStatus.Private && this.publishBlockers.length === ValueConstants.zero;
  }
  /** Whether a gallery item is the cover — removed with its own request, everywhere it appears. */
  isCover(item: MediaItem): boolean {
    return this.props.image.length > ValueConstants.zero && item.url === this.props.image;
  }
  withPublishOutcome(outcome: PublishOutcome): RecipeEntity {
    return new RecipeEntity({
      ...this.props,
      isPublished: outcome.isPublished,
      moderationStatus: outcome.moderationStatus,
    });
  }
  /** The recipe as the server left it after its cover was taken off. */
  withCoverRemoved(removal: CoverRemoval): RecipeEntity {
    const removed = new Set(removal.removedMediaIds);
    const kept = this.props.media.filter(
      (m) => !(m.id !== undefined && removed.has(m.id)) && m.url !== this.props.image,
    );
    const media =
      kept.length === ValueConstants.zero && removal.image.length > ValueConstants.zero
        ? [{ type: MediaType.Image, url: removal.image }]
        : kept;
    // The old cover's focus describes a photo that is gone; the new cover keeps its own, if it has one.
    const { imageFocus: _dropped, ...rest } = this.props;
    const focus = kept.find((m) => m.url === removal.image)?.focus;
    return new RecipeEntity({ ...rest, image: removal.image, media, ...(focus !== undefined ? { imageFocus: focus } : {}) });
  }
  get commentCount(): number {
    return this.props.commentCount;
  }
}
