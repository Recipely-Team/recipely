import { useCallback, useMemo, useState } from 'react';
import { type Href, usePathname, useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { AddFoodRequestKind } from '@presentation/base/widgets/diary/add-food/request/add-food-request-kind';
import type { AddFoodRequest } from '@presentation/base/widgets/diary/add-food/request/add-food-request';
import { useAssistantLogFood } from '@presentation/base/hooks/diary/use-assistant-log-food';
import { useGuestGate } from '@presentation/app/recipes/shared/hooks/use-guest-gate';
import type { UseAddToDiaryResult } from '@presentation/app/recipes/[recipeId]/model/use-add-to-diary-result';
import { t } from '@presentation/i18n';

/** Recipe Detail does not move anywhere when the assistant logs from it. */
const noop = (): void => undefined;
/** Logged from a recipe without a day named, a food goes to today — as the button does. */
const today = (): CalendarDate => CalendarDate.today();

/**
 * "Add to diary" on a recipe (design spec → Food Diary §1).
 *
 * @remarks
 * - **Whether it can be logged is the use case's call**: a recipe without
 *   calories builds no food, and the button is not drawn.
 * - **Guests get the same sign-in prompt** as like, save and comment, and come
 *   back to this recipe after signing in.
 * - Logged to today; the sheet's toast offers a way to the Diary tab.
 */
export const useAddToDiary = (recipe: RecipeEntity): UseAddToDiaryResult => {
  const router = useRouter();
  const pathname = usePathname();
  const { authStore, buildLoggableFoodFromRecipe } = useStores();
  const authState = authStore((s) => s.state);
  const userId = authState.status === StoreStatus.Authenticated ? authState.session.user.id : null;
  const { promptVisible, promptMessage, requestGate, closePrompt } = useGuestGate(userId);
  const [request, setRequest] = useState<AddFoodRequest | null>(null);

  const food = useMemo(() => {
    const built = buildLoggableFoodFromRecipe.execute(recipe);
    return built.ok ? built.value : null;
  }, [buildLoggableFoodFromRecipe, recipe]);

  // "Log this" on a recipe means this recipe; a named food is resolved like on the diary.
  useAssistantLogFood({ openRecipeFood: food, defaultDate: today, onLogged: noop, signedIn: userId !== null });

  const open = useCallback(() => {
    if (food === null) return;
    requestGate(
      () => setRequest({ kind: AddFoodRequestKind.Food, date: CalendarDate.today(), meal: null, food }),
      t().diary.signInToLog,
    );
  }, [food, requestGate]);

  const goToSignIn = useCallback(() => {
    closePrompt();
    // Cast: the dynamic redirect param cannot be checked against the typed-routes union — as in useRecipeDetail.
    router.push(RoutePaths.loginWithRedirect(pathname) as Href);
  }, [closePrompt, pathname, router]);

  return {
    food,
    request,
    open,
    close: useCallback(() => setRequest(null), []),
    openDiary: useCallback(() => router.push(RoutePaths.diary), [router]),
    promptVisible,
    promptMessage,
    closePrompt,
    goToSignIn,
  };
};
