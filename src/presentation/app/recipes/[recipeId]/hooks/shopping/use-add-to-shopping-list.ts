import { useCallback, useMemo, useRef, useState } from 'react';
import { type Href, usePathname, useRouter } from 'expo-router';
import { ValueConstants } from '@core/constants';
import { StoreStatus } from '@application/store/store-status';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { IngredientList } from '@domain/recipes/ingredients/ingredient-list';
import type { ShoppingAddResult } from '@domain/shopping/items/shopping-add-result';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { useGuestGate } from '@presentation/base/hooks/auth/use-guest-gate';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { showErrorToast, showSuccessToast } from '@presentation/base/feedback/show-toast';
import type { ShoppingSource } from '@presentation/app/recipes/[recipeId]/model/shopping/shopping-source';
import type { UseAddToShoppingListResult } from '@presentation/app/recipes/[recipeId]/model/shopping/use-add-to-shopping-list-result';
import { t } from '@presentation/i18n';

const summary = (result: ShoppingAddResult): string =>
  t().shopping.addedSummary.replace('{added}', String(result.added)).replace('{merged}', String(result.merged));

/**
 * "Add to shopping list" on a recipe (the detail page and cook mode's
 * ingredients sheet).
 *
 * @remarks
 * - **What is added is what is on screen**: `source.lines` are the lines at
 *   the reader's servings and units; the domain reads each into a name,
 *   amount and unit and skips the headings.
 * - **Guests get the sign-in prompt** and come back to this recipe.
 * - **The toast counts what was new and what merged** into a line already
 *   there, and offers a way to the list.
 * - **The assistant's `addToShoppingList`** does the same, registered on focus.
 */
export const useAddToShoppingList = (source: ShoppingSource): UseAddToShoppingListResult => {
  const router = useRouter();
  const pathname = usePathname();
  const { authStore, shoppingListStore } = useStores();
  const userId = authStore((s) => (s.state.status === StoreStatus.Authenticated ? s.state.session.user.id : null));
  const { promptVisible, promptMessage, requestGate, closePrompt } = useGuestGate(userId);
  const [isAdding, setAdding] = useState(false);
  const { recipeId, recipeName, lines } = source;
  const canAdd = useMemo(() => IngredientList.of(lines).filledCount > ValueConstants.zero, [lines]);

  // A ref, not state: two taps in one frame both read state as idle and the server merge doubled every amount.
  const inFlight = useRef(false);
  const send = useCallback(async (): Promise<ShoppingAddResult | null> => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setAdding(true);
    const result = await shoppingListStore.getState().addFromRecipe(lines, { id: recipeId, name: recipeName });
    inFlight.current = false;
    setAdding(false);
    if (!result.ok) {
      showErrorToast(result.failure);
      return null;
    }
    showSuccessToast(summary(result.value), { label: t().shopping.view, onRetry: () => router.push(RoutePaths.shoppingList) });
    return result.value;
  }, [lines, recipeId, recipeName, router, shoppingListStore]);

  useAssistantAction(
    AssistantAction.AddToShoppingList,
    useCallback(async (): Promise<AssistantActionResultType> => {
      if (userId === null) return { ok: false, error: AssistantActionError.SignedOut };
      if (!canAdd) return { ok: false, error: AssistantActionError.NoIngredients };
      const added = await send();
      return added === null ? { ok: false, error: AssistantActionError.Failed } : { ok: true, title: recipeName, n: { added: added.added, merged: added.merged } };
    }, [canAdd, recipeName, send, userId]),
  );

  const goToSignIn = useCallback(() => {
    closePrompt();
    // Cast: the dynamic redirect param cannot be checked against the typed-routes union — as in useRecipeDetail.
    router.push(RoutePaths.loginWithRedirect(pathname) as Href);
  }, [closePrompt, pathname, router]);

  return {
    canAdd,
    isAdding,
    add: () => {
      if (isAdding) return;
      requestGate(() => void send(), t().shopping.signInToAdd);
    },
    promptVisible,
    promptMessage,
    closePrompt,
    goToSignIn,
  };
};
