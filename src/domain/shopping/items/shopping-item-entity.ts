import { BaseEntity } from '@core/entity/base-entity';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { isBlank } from '@core/guards/type-guards';
import type { ShoppingItemDraft } from '@domain/shopping/items/shopping-item-draft';
import type { ShoppingItemEntityProps } from '@domain/shopping/items/shopping-item-entity-props';

/**
 * One line of the viewer's shopping list — the shopping aggregate root.
 * References the recipe it came from by id only.
 *
 * @remarks
 * - **`withChecked` is how a tick flips optimistically**; the server's answer
 *   replaces it, or the old item comes back.
 * - **The server merges** a line with the same label and unit into an
 *   unchecked one, so two items here never mean "add these together".
 */
export class ShoppingItemEntity extends BaseEntity<ShoppingItemEntityProps> {
  private constructor(props: ShoppingItemEntityProps) {
    super(props);
  }

  static create(props: ShoppingItemEntityProps): Result<ShoppingItemEntity, ValidationFailure> {
    if (isBlank(props.id)) return fail(new ValidationFailure(DiagnosticMessage.shopping.idRequired, 'id'));
    if (isBlank(props.label)) return fail(new ValidationFailure(DiagnosticMessage.shopping.labelRequired, 'label'));
    return ok(new ShoppingItemEntity({ ...props, label: props.label.trim() }));
  }

  /** This line as a new one — what an Undo after removing it sends back (unticked). */
  toDraft(): ShoppingItemDraft {
    return { label: this.props.label, quantity: this.props.quantity, unit: this.props.unit, recipeId: this.props.recipeId, recipeName: this.props.recipeName };
  }

  get label(): string {
    return this.props.label;
  }

  get quantity(): number | null {
    return this.props.quantity;
  }

  get unit(): string | null {
    return this.props.unit;
  }

  get recipeId(): string | null {
    return this.props.recipeId;
  }

  get recipeName(): string | null {
    return this.props.recipeName;
  }

  get checked(): boolean {
    return this.props.checked;
  }

  get position(): number {
    return this.props.position;
  }

  withChecked(checked: boolean): ShoppingItemEntity {
    return new ShoppingItemEntity({ ...this.props, checked });
  }
}
