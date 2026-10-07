import { BaseValueObject } from '@core/value-object/base-value-object';
import { CharConstants, RegexConstants, ValueConstants } from '@core/constants';
import { splitIngredientText } from '@domain/recipes/ingredients/quantity/split-ingredient-text';
import type { IngredientTextParts } from '@domain/recipes/ingredients/ingredient-text-parts';
import type { Quantity } from '@domain/recipes/ingredients/quantity/quantity';
import { UnitSystem, type UnitSystemType } from '@domain/recipes/ingredients/unit-system';

interface IngredientLineProps {
  raw: string;
  /** What the line was written as; null for a heading, a blank or a line with no amount. */
  parts: IngredientTextParts | null;
  /** The quantity after scaling and conversion. */
  quantity: Quantity | null;
}

/** The character that turns an ingredient line into a heading. */
const GROUP_MARKER = '#';
/** The colon that closes a written heading is not part of its name. */
const TRAILING_COLON = /\s*:\s*$/;
/**
 * Also a heading written the way people write one — "Trileçenin karameli
 * için:", words ending in a colon with no quantity. Missing it put a cake,
 * its caramel and its syrup into one undivided list.
 */
const COLON_HEADING = /^[^\d¼-¾⅐-⅞]{2,80}:\s*$/u;

const isHeading = (trimmed: string): boolean => trimmed.startsWith(GROUP_MARKER) || COLON_HEADING.test(trimmed);

/**
 * One line of a recipe's ingredient list: an ingredient, a GROUP HEADING, or blank.
 *
 * @remarks
 * - **Headings ride inside the `string[]`.** A recipe made of separate parts —
 *   a syrup, a filling, a marinade — reads as one flat list unless its parts
 *   are named. Rather than add a nested shape to every layer (wire DTO, draft
 *   snapshot, AI response, editor state), a heading is a line marked by a
 *   leading `#`, the way Markdown marks one. Old recipes stay valid, and a
 *   client that does not know about groups still shows every ingredient.
 * - **Any text is a line**, so `of` cannot fail; the line's quantity is
 *   parsed once there (`splitIngredientText`).
 * - **Scaling never invents an amount.** A line with no readable amount
 *   ("tuz") and a heading come back unchanged; an unchanged line renders as
 *   its original text, byte for byte.
 */
export class IngredientLine extends BaseValueObject<IngredientLineProps> {
  private constructor(props: IngredientLineProps) {
    super(props);
  }

  static of(raw: string): IngredientLine {
    const trimmed = raw.trim();
    const parts = isHeading(trimmed) || trimmed.length === ValueConstants.zero ? null : splitIngredientText(trimmed);
    return new IngredientLine({ raw, parts, quantity: parts?.quantity ?? null });
  }

  /** The text the editor writes for a new group: the marker, a space, the label. */
  static heading(label: string = CharConstants.empty): string {
    return `${GROUP_MARKER}${CharConstants.space}${label}`;
  }

  get raw(): string {
    return this._value.raw;
  }

  get quantity(): Quantity | null {
    return this._value.quantity;
  }

  get isBlank(): boolean {
    return this._value.raw.trim().length === ValueConstants.zero;
  }

  get isGroup(): boolean {
    return isHeading(this._value.raw.trim());
  }

  /** A real ingredient: neither blank nor a heading. */
  get isIngredient(): boolean {
    return !this.isBlank && !this.isGroup;
  }

  /** The heading's text without its markers or closing colon; empty when not yet named. */
  get groupLabel(): string {
    return this._value.raw.trimStart().replace(RegexConstants.leadingIngredientGroupMarkers, CharConstants.empty).trim().replace(TRAILING_COLON, CharConstants.empty);
  }

  /** What the line names without its amount — "un" of "2 su bardağı un"; anything else as written, trimmed. */
  get name(): string {
    return this._value.parts?.name ?? this._value.raw.trim();
  }

  /** The unit as it reads ("yk.", "cups"); null for a bare count or a line with no amount. */
  get unitText(): string | null {
    const { parts, quantity } = this._value;
    if (parts === null || quantity === null || quantity.unit === null) return null;
    return quantity.unitLabel(quantity.unit === parts.quantity.unit ? parts.unitToken : CharConstants.empty);
  }

  /** The amount badge and the name; `qty` is empty when the line has no amount. */
  split(fallbackDecimalMark: string = CharConstants.dot): { qty: string; name: string } {
    const { parts, quantity } = this._value;
    if (parts === null || quantity === null) return { qty: CharConstants.empty, name: this._value.raw.trim() };
    if (quantity.equals(parts.quantity)) return { qty: parts.qtyText, name: parts.name };
    const written = quantity.unit === parts.quantity.unit ? parts.unitToken : CharConstants.empty;
    return { qty: quantity.toText(parts.decimalMark ?? fallbackDecimalMark, written), name: parts.name };
  }

  scaled(factor: number): IngredientLine {
    return this.withQuantity(this._value.quantity?.scale(factor) ?? null);
  }

  inSystem(system: UnitSystemType): IngredientLine {
    if (system === UnitSystem.Original) return this;
    return this.withQuantity(this._value.quantity?.inSystem(system) ?? null);
  }

  /** The line as text: the original when nothing changed, else "<qty> <name>". */
  toText(fallbackDecimalMark: string = CharConstants.dot): string {
    const { parts, quantity } = this._value;
    if (parts === null || quantity === null || quantity.equals(parts.quantity)) return this._value.raw;
    const { qty, name } = this.split(fallbackDecimalMark);
    return `${qty}${CharConstants.space}${name}`;
  }

  equals(other: IngredientLine): boolean {
    return this.toText() === other.toText();
  }

  private withQuantity(quantity: Quantity | null): IngredientLine {
    return quantity === null ? this : new IngredientLine({ ...this._value, quantity });
  }
}
