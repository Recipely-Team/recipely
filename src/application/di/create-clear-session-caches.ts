import type { ApplicationStores } from '@application/di/application-stores';

/**
 * **Session reset** — the one list of user-scoped stores that sign-out, account deletion and
 * session expiry wipe.
 *
 * @remarks
 * - **Guarded:** `register-application.test.ts` fails when a store exposing `clear` / `reset`
 *   is neither listed here nor named public in that test.
 * - **Public stores stay:** the feed, trending, taxonomy, creators strip, the feedback form and
 *   other viewer-independent stores survive sign-out.
 */
export const createClearSessionCaches = (stores: Omit<ApplicationStores, 'authStore'>): (() => void) => () => {
  stores.savedRecipesStore.getState().clear();
  stores.likedRecipesStore.getState().clear();
  stores.commentsStore.getState().clear();
  stores.likesStore.getState().clear();
  stores.shoppingListStore.getState().clear();
  stores.mealPlanStore.getState().clear();
  stores.recipeDetailStore.getState().clear();
  stores.stepProgressStore.getState().clear();
  stores.portionChoiceStore.getState().clear();
  stores.notificationsStore.getState().clear();
  stores.createdRecipesStore.getState().clear();
  stores.draftsStore.getState().clear();
  stores.diaryStore.getState().clear();
  stores.foodSearchStore.getState().clear();
  stores.foodCatalogStore.getState().clear();
  stores.instagramStore.getState().clear();
  stores.automationsStore.getState().clear();
  stores.creatorStatsStore.getState().clear();
  stores.importJobStore.getState().clear();
  stores.fileImportStore.getState().clear();
  stores.userProfileStore.getState().reset();
  stores.creatorProfileStore.getState().clear();
  stores.assistantSessionStore.getState().reset();
};
