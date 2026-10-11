import type { Container } from '@core/di/container';
import type { ApplicationStores } from '@application/di/application-stores';
import { registerRecipes } from '@application/di/features/register-recipes';
import { registerLikes } from '@application/di/features/register-likes';
import { registerDrafts } from '@application/di/features/register-drafts';
import { registerDiary } from '@application/di/features/register-diary';
import { registerInstagram } from '@application/di/features/register-instagram';
import { registerComments } from '@application/di/features/register-comments';
import { registerMisc } from '@application/di/features/register-misc';
import { registerShopping } from '@application/di/features/register-shopping';
import { registerMealPlan } from '@application/di/features/register-meal-plan';
import { registerFridge } from '@application/di/features/register-fridge';
import { registerCreators } from '@application/di/features/register-creators';
import { registerAssistant } from '@application/di/features/register-assistant';
import { registerAuth } from '@application/di/features/register-auth';
import { createClearSessionCaches } from '@application/di/create-clear-session-caches';

/**
 * **Application composition** — builds every feature's stores (`di/features/register-*.ts`)
 * and assembles the `ApplicationStores` bundle the presentation layer reads.
 *
 * @remarks
 * - **Order:** the auth store is built last, over `createClearSessionCaches(features)`, so
 *   sign-out / delete / expiry wipe every user-scoped store in one place.
 */
export const registerApplication = (container: Container): ApplicationStores => {
  const recipes = registerRecipes(container);
  const likes = registerLikes(container);
  const drafts = registerDrafts(container);
  const diary = registerDiary(container);
  const instagram = registerInstagram(container);
  const comments = registerComments(container);
  const misc = registerMisc(container);
  const shopping = registerShopping(container);
  const mealPlan = registerMealPlan(container);
  const fridge = registerFridge(container);
  const creators = registerCreators(container);
  const assistant = registerAssistant(container);
  const features = {
    ...assistant,
    ...recipes,
    ...likes,
    ...drafts,
    ...comments,
    ...misc,
    ...shopping,
    ...mealPlan,
    ...fridge,
    ...creators,
    ...diary,
    ...instagram,
  };
  const authStore = registerAuth(container, {
    savedRecipesStore: recipes.savedRecipesStore,
    loadFavoritesUseCase: recipes.loadFavoritesUseCase,
    clearSessionCaches: createClearSessionCaches(features),
  });
  return { ...features, authStore };
};
