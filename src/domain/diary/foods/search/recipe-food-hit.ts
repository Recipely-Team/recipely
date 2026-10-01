import { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { Nutrients } from '@domain/diary/nutrition/nutrients';
import type { RecipeFoodHitProps } from '@domain/diary/foods/search/recipe-food-hit-props';

/**
 * A recipe the food search found — already carrying one serving's nutrients,
 * so picking it needs no second request. A read model: `isDraft` is relative
 * to the viewer (their own unpublished recipe), which is why it lives here and
 * not on `RecipeEntity`.
 */
export class RecipeFoodHit {
  private constructor(private readonly props: RecipeFoodHitProps) {}

  static of(props: RecipeFoodHitProps): RecipeFoodHit {
    return new RecipeFoodHit(props);
  }

  get key(): string {
    return this.props.id;
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get imageUrl(): string | null {
    return this.props.imageUrl;
  }

  get perServing(): Nutrients {
    return this.props.perServing;
  }

  get isDraft(): boolean {
    return this.props.isDraft;
  }

  get food(): LoggableFood {
    return LoggableFood.of({
      name: this.props.name,
      perServing: this.props.perServing,
      recipeId: this.props.id,
      imageUrl: this.props.imageUrl,
    });
  }
}
