import { useCallback } from 'react';
import { CharConstants, ValueConstants } from '@core/constants';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import { shoppingAmountText } from '@domain/shopping/items/shopping-amount-text';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import { listReading } from '@presentation/base/hooks/assistant/args/describing/list-reading';
import { recipeRoster } from '@presentation/base/hooks/assistant/args/describing/recipe-roster';
import type { ListStateType } from '@presentation/base/hooks/assistant/args/describing/list-state';
import { SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';
import { rowAt } from '@presentation/base/hooks/assistant/args/resolving/row-at';

/** What the shopping list screen lends the assistant. */
interface AssistantShoppingActionsDeps {
  /** Every loaded line, unchecked first — the order the user reads them in. */
  items: readonly ShoppingItemEntity[];
  listState: ListStateType;
  onToggle: (item: ShoppingItemEntity) => void;
  onReload: () => void;
}

/** What the screen line calls the list. */
const ROSTER_LABEL = 'shopping list';
/** Marks a ticked line when the list is read out. */
const DONE_MARK = ' (done)';
/** The decimal mark the model reads amounts in. */
const MODEL_DECIMAL_MARK = CharConstants.dot;

/**
 * The shopping list, by voice — registered on focus like every screen.
 *
 * @remarks
 * - **"Read my shopping list" is `readScreen`**: every line, its amount and
 *   whether it is ticked, in the order on screen.
 * - **"Check the milk" is `toggleIngredient`** — the word the model already
 *   uses for ticking an ingredient off — resolved by position or by name the
 *   way every list resolves a row. A line already ticked is success, not a
 *   second toggle that would undo it.
 */
export const useAssistantShoppingActions = ({ items, listState, onToggle, onReload }: AssistantShoppingActionsDeps): void => {
  const names = items.map(lineName);

  useAssistantScreenContent(() =>
    [recipeRoster(ROSTER_LABEL, names, listState), `toBuy=${String(items.filter((item) => !item.checked).length)}`].join(SCREEN_PART_SEPARATOR),
  );
  useAssistantScreenReading(() => listReading(ROSTER_LABEL, items.map((item) => `${lineName(item)}${item.checked ? DONE_MARK : CharConstants.empty}`), listState));

  useAssistantAction(
    AssistantAction.ToggleIngredient,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        if (items.length === ValueConstants.zero) return { ok: false, error: AssistantActionError.NotReady };
        const at = rowAt(items.map((item) => item.label), arg);
        const item = at === null ? undefined : items[at];
        if (item === undefined) return { ok: false, error: AssistantActionError.NotFound };
        if (!item.checked) onToggle(item);
        return { ok: true, title: item.label };
      },
      [items, onToggle],
    ),
  );

  useAssistantAction(
    AssistantAction.Refresh,
    useCallback(async (): Promise<AssistantActionResultType> => {
      onReload();
      return { ok: true };
    }, [onReload]),
  );
};

/** A line as it is said: "2 kg potatoes", or just "salt". */
function lineName(item: ShoppingItemEntity): string {
  const amount = shoppingAmountText(item.quantity, item.unit, MODEL_DECIMAL_MARK);
  return amount.length > ValueConstants.zero ? `${amount}${CharConstants.space}${item.label}` : item.label;
}
