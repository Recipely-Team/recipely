import { useCallback, useEffect, useState } from 'react';
import { type Href, usePathname, useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { defaultMealForCategory } from '@domain/meal-plan/week/default-meal-for-category';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { useGuestGate } from '@presentation/base/hooks/auth/use-guest-gate';
import type { AddToPlanRequest } from '@presentation/base/widgets/meal-plan/model/add-to-plan-request';
import { CharConstants, ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';

interface AddToPlanModel {
  /** The `mealPlanner` flag; off (or not yet known), the button is not drawn. */
  enabled: boolean;
  request: AddToPlanRequest | null;
  open: () => void;
  close: () => void;
  /** After adding, the toast's "View" opens the Plan. */
  openPlan: () => void;
  promptVisible: boolean;
  promptMessage: string | undefined;
  closePrompt: () => void;
  goToSignIn: () => void;
}

/**
 * "Add to plan" on a recipe (design spec → Meal planner, Recipe detail): the
 * add sheet opens locked on this recipe at the day/meal/servings step, the
 * meal its category suggests, today first. Guests get the shared sign-in
 * prompt and come back to the recipe.
 */
export const useAddToPlan = (recipe: RecipeEntity): AddToPlanModel => {
  const router = useRouter();
  const pathname = usePathname();
  const { authStore, mealPlanStore } = useStores();
  const authState = authStore((s) => s.state);
  const userId = authState.status === StoreStatus.Authenticated ? authState.session.user.id : null;
  const enabled = mealPlanStore((s) => s.enabled === true);
  const { promptVisible, promptMessage, requestGate, closePrompt } = useGuestGate(userId);
  const [request, setRequest] = useState<AddToPlanRequest | null>(null);

  useEffect(() => {
    void mealPlanStore.getState().checkEnabled();
  }, [mealPlanStore]);

  const open = useCallback(() => {
    requestGate(
      () =>
        setRequest({
          recipe: {
            id: recipe.id,
            name: recipe.name,
            imageUrl: recipe.image === CharConstants.empty ? null : recipe.image,
            caloriesPerServing: recipe.caloriesPerServing > ValueConstants.zero ? recipe.caloriesPerServing : null,
            meal: defaultMealForCategory(recipe.category),
          },
          date: CalendarDate.today(),
          meal: null,
        }),
      t().mealPlan.signInToPlan,
    );
  }, [recipe, requestGate]);

  return {
    enabled,
    request,
    open,
    close: useCallback(() => setRequest(null), []),
    openPlan: useCallback(() => router.push(`${RoutePaths.diary}?mode=plan` as Href), [router]),
    promptVisible,
    promptMessage,
    closePrompt,
    goToSignIn: useCallback(() => {
      closePrompt();
      // Cast: the dynamic redirect param cannot be checked against the typed-routes union — as in useAddToDiary.
      router.push(RoutePaths.loginWithRedirect(pathname) as Href);
    }, [closePrompt, pathname, router]),
  };
};
