import { BaseValueObject } from '@core/value-object/base-value-object';
import { CharConstants, ValueConstants } from '@core/constants';
import { IngredientLine } from '@domain/recipes/ingredients/ingredient-line';
import type { IngredientGroup } from '@domain/recipes/ingredients/ingredient-group';
import type { UnitSystemType } from '@domain/recipes/ingredients/unit-system';

const NO_HEADER = ValueConstants.minusOne;

/**
 * A recipe's ingredient list — the flat `string[]` the wire, the drafts and
 * the editor all carry — with the rules that read it.
 *
 * @remarks
 * - **`groups()` is the only place the flat list and the editor's cards
 *   meet.** The index carried on every item is load-bearing: an edit, a delete
 *   and a reorder are written straight back to the flat array by it. The empty
 *   ungrouped run is dropped when the list opens with a heading, or the editor
 *   renders a stray empty block above the first card.
 * - **`cleaned()` is what gets saved**: trimmed, blanks gone, and an unnamed
 *   heading dropped rather than published as a blank one.
 * - **`filledCount` counts ingredients, not lines**: a recipe with three
 *   headings does not have three more things to buy.
 * - **`present()` scales and converts** every ingredient; headings, blanks and
 *   lines with no amount come back exactly as written.
 */
export class IngredientList extends BaseValueObject<readonly IngredientLine[]> {
  private constructor(lines: readonly IngredientLine[]) {
    super(lines);
  }

  static of(lines: readonly string[]): IngredientList {
    return new IngredientList(lines.map((line) => IngredientLine.of(line)));
  }

  get lines(): readonly IngredientLine[] {
    return this._value;
  }

  get filledCount(): number {
    return this._value.filter((line) => line.isIngredient).length;
  }

  /** Anything typed at all — a heading counts, whitespace does not. */
  get hasContent(): boolean {
    return this._value.some((line) => !line.isBlank);
  }

  groups(): IngredientGroup[] {
    const groups: IngredientGroup[] = [{ label: null, headerIndex: NO_HEADER, items: [] }];
    this._value.forEach((line, index) => {
      if (line.isGroup) {
        groups.push({ label: line.groupLabel, headerIndex: index, items: [] });
        return;
      }
      groups.at(ValueConstants.minusOne)?.items.push({ value: line.raw, index });
    });
    const [first] = groups;
    if (groups.length > ValueConstants.one && first?.items.length === ValueConstants.zero) groups.shift();
    return groups;
  }

  cleaned(): string[] {
    return this._value
      .filter((line) => !line.isBlank && (!line.isGroup || line.groupLabel.length > ValueConstants.zero))
      .map((line) => line.raw.trim());
  }

  present(factor: number, system: UnitSystemType, fallbackDecimalMark: string = CharConstants.dot): string[] {
    return this._value.map((line) => line.scaled(factor).inSystem(system).toText(fallbackDecimalMark));
  }
}
