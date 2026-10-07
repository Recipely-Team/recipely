import type { Container } from '@core/di/container';
import type { ApplicationStores } from '@application/di/application-stores';
import { registerRecipes } from '@application/di/features/register-recipes';
import { registerLikes } from '@application/di/features/register-likes';
import { registerDrafts } from '@application/di/features/register-drafts';
import { registerDiary } from '@application/di/features/register-diary';
import { registerInstagram } from '@application/di/features/register-instagram';
import { registerComments } from '@application/di/features/register-comments';
import { registerMisc } from '@application/di/features/register-misc';
import { registerCreators } from '@application/di/features/register-creators';
import { registerAssistant } from '@application/di/features/register-assistant';
import { registerAuth } from '@application/di/features/register-auth';

/**
 * **Application composition** — builds every feature's stores (`di/features/register-*.ts`)
 * and assembles the `ApplicationStores` bundle the presentation layer reads.
 *
 * @remarks
 * - **Order:** `clearSessionCaches` is built after every session-scoped store and the auth
 *   store last, so sign-out / delete / expiry wipe them all in one place.
 */
export const registerApplication = (container: Container): ApplicationStores => {
  const recipes = registerRecipes(container);
  const likes = registerLikes(container);
  const drafts = registerDrafts(container);
  const diary = registerDiary(container);
  const instagram = registerInstagram(container);
  const comments = registerComments(container);
  const misc = registerMisc(container);
  const creators = registerCreators(container);
  const assistant = registerAssistant(container);
  const { savedRecipesStore, recipeDetailStore, createdRecipesStore, importJobStore, fileImportStore, stepProgressStore } = recipes;
  const { likedRecipesStore, likesStore } = likes;
  const { draftsStore } = drafts;
  const { diaryStore, foodSearchStore, foodCatalogStore } = diary;
  const { instagramStore, automationsStore } = instagram;
  const { commentsStore } = comments;
  const { notificationsStore, userProfileStore } = misc;
  const { creatorProfileStore } = creators;
  const { assistantSessionStore } = assistant;
  // Built after every session store so sign-out/delete/expiry wipe them in one place.
  const clearSessionCaches = (): void => {
    savedRecipesStore.getState().clear();
    likedRecipesStore.getState().clear();
    commentsStore.getState().clear();
    likesStore.getState().clear();
    recipeDetailStore.getState().clear();
    stepProgressStore.getState().clear();
    notificationsStore.getState().clear();
    createdRecipesStore.getState().clear();
    draftsStore.getState().clear();
    diaryStore.getState().clear();
    foodSearchStore.getState().clear();
    foodCatalogStore.getState().clear();
    instagramStore.getState().clear();
    automationsStore.getState().clear();
    importJobStore.getState().clear();
    fileImportStore.getState().clear();
    userProfileStore.getState().reset();
    creatorProfileStore.getState().clear();
    assistantSessionStore.getState().reset();
  };
  const authStore = registerAuth(container, {
    savedRecipesStore,
    loadFavoritesUseCase: recipes.loadFavoritesUseCase,
    clearSessionCaches,
  });
  return {
    ...assistant,
    authStore,
    ...recipes,
    ...likes,
    ...drafts,
    ...comments,
    ...misc,
    ...creators,
    ...diary,
    ...instagram,
  };
};
