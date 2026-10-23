import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react';
import { useStore } from 'zustand';
import { isString } from '@core/guards/type-guards';
import { StoreStatus } from '@application/store/store-status';
import type { ScrollView } from 'react-native';
import { type Href, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useGoBackOrHome } from '@presentation/base/hooks/navigation/use-go-back-or-home';
import { useGuestGate } from '@presentation/base/hooks/auth/use-guest-gate';
import { useScrollToEndOnKeyboard } from '@presentation/app/recipes/[recipeId]/hooks/use-scroll-to-end-on-keyboard';
import { useCommentRemoval } from '@presentation/app/recipes/[recipeId]/hooks/comments/use-comment-removal';
import { useRecipeAuthor } from '@presentation/app/recipes/[recipeId]/hooks/use-recipe-author';
import { useDmArrival } from '@presentation/app/recipes/[recipeId]/hooks/use-dm-arrival';
import { useNutritionRecheck } from '@presentation/app/recipes/[recipeId]/hooks/use-nutrition-recheck';
import type { ResolvedAuthor } from '@presentation/app/recipes/[recipeId]/model/author/resolved-author';
import { StateViewStatus } from '@presentation/app/recipes/[recipeId]/model/state-view-status';
import type { UseRecipeDetailResult } from '@presentation/app/recipes/[recipeId]/model/use-recipe-detail-result';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { useTranslations } from '@presentation/i18n';
import type { Failure } from '@presentation/base/types';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { failureToastMessage } from '@presentation/base/errors/failure-lookups';
import type { MediaItem } from '@domain/recipes/media/media-item';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';
import { durations } from '@presentation/base/theme';
import { useSignedInUser } from '@presentation/base/hooks/auth/use-signed-in-user';

/** No step ticked yet: one shared empty list, so the selector result stays stable. */
const NO_STEPS_DONE: readonly boolean[] = [];
const NO_MEDIA: readonly MediaItem[] = [];
const NO_INGREDIENT_TICKS: { forCount: number; checked: readonly boolean[] } = { forCount: ValueConstants.zero, checked: NO_STEPS_DONE };

/**
 * Orchestrates the recipe-detail screen: resolves the recipe (local or network),
 * author, likes, comments, and save/delete flows, and exposes guest-gated
 * handlers plus derived display values for the presentational body components.
 *
 * @remarks
 * - **One source of truth for the like.** A second `likedByMe` without the
 *   `recipe?.likedByMe` fallback left the floating heart empty until the likes
 *   store synced, and empty for good whenever the sync was skipped.
 * - **Failures come from the store's `error` field**, which it records instead
 *   of throwing, so a dropped connection or an expired session doesn't read as
 *   a generic "try again". The static copy is only a defensive fallback.
 * - **A delete failure shows inline in the still-open confirm sheet**; a global
 *   toast would be occluded by the sheet. Flows on the screen below use toasts.
 * - **The network sync re-runs on every entry**, not just the first: a cached
 *   copy's like, comment and view counts have moved on. The store keeps the
 *   cached recipe on screen meanwhile, so re-entry shows content immediately
 *   and corrects itself.
 * - **That effect depends on primitives, not the state object** — the
 *   local-recipe path builds a fresh wrapper every render, and an object
 *   dependency re-fired the sync into an infinite update loop.
 * - **An owned recipe takes its author from the session** plus the shared
 *   profile store; resolving it through the shared store would clobber the
 *   signed-in user's cached profile, so other authors load in `useRecipeAuthor`.
 */
export const useRecipeDetail = (scrollViewRef: RefObject<ScrollView | null>): UseRecipeDetailResult => {
  const t = useTranslations();
  const router = useRouter();
  const goBackOrHome = useGoBackOrHome();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ recipeId: string }>();
  const recipeId = isString(params.recipeId) ? params.recipeId : CharConstants.empty;

  const { recipeDetailStore, savedRecipesStore, recipeAuthoringStore, favoritesStore, commentsStore, likesStore, userProfileStore, stepProgressStore, dmArrivalStore } = useStores();
  useDmArrival(recipeId);
  const { cuisineLabel } = useTaxonomyLabel();
  const networkState = useStore(recipeDetailStore, (s) => s.byId[recipeId]);
  const load = useStore(recipeDetailStore, (s) => s.load);
  const localRecipe = useStore(recipeAuthoringStore, (s) => s.findById(recipeId));
  const isSaved = useStore(savedRecipesStore, (s) => s.savedIds.has(recipeId));
  const isLoading = useStore(favoritesStore, (s) => s.pending.has(recipeId));
  const signedInUser = useSignedInUser();
  const userId = signedInUser?.id ?? null;
  const { promptVisible, promptMessage, requestGate, closePrompt } = useGuestGate(userId);
  const onGoToSignIn = useCallback(() => {
    closePrompt();
    // Cast: a runtime path is not in the typed-routes union.
    router.push(RoutePaths.loginWithRedirect(pathname) as Href);
  }, [closePrompt, pathname, router]);
  const shownRecipe = localRecipe ?? (networkState?.status === StoreStatus.Loaded ? networkState.recipe : null);
  const recipeOwnerId = shownRecipe?.ownerId ?? null;
  const isOwner = shownRecipe?.isOwnedBy(userId) ?? false;
  const ownProfileState = useStore(userProfileStore, (s) => s.state);
  const loadOwnProfile = useStore(userProfileStore, (s) => s.load);
  const owner: ResolvedAuthor | null =
    isOwner && signedInUser !== null && ownProfileState.status === StoreStatus.Loaded
      ? {
          authorName: signedInUser.displayName,
          authorPhotoUrl: signedInUser.photoUrl,
          recipeCount: ownProfileState.profile.recipeCount,
          isOwner: true,
        }
      : null;
  const isCurated = localRecipe?.isCurated ?? (networkState?.status === StoreStatus.Loaded && networkState.recipe.isCurated);
  const authorState = useRecipeAuthor({
    ownerId: recipeOwnerId,
    owner,
    isOwner,
    isKitchen: isCurated,
  });

  useEffect(() => {
    if (isOwner && userId !== null && ownProfileState.status === StoreStatus.Idle) {
      void loadOwnProfile(userId);
    }
  }, [isOwner, userId, ownProfileState.status, loadOwnProfile]);

  const likeState = useStore(likesStore, (s) => s.byRecipe[recipeId]);
  const commentState = useStore(commentsStore, (s) => s.byRecipe[recipeId]);
  const deleteState = useStore(recipeAuthoringStore, (s) => s.deleteState);
  const isDeleting = deleteState.status === StoreStatus.Deleting;
  const [isShareOpen, setShareOpen] = useState(false);
  const [shouldShowDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const revealCommentInput = useScrollToEndOnKeyboard(scrollViewRef);

  const onConfirmDelete = useCallback(async () => {
    setDeleteError(null);
    await recipeAuthoringStore.getState().deleteRecipe(recipeId);
    const { deleteState: s } = recipeAuthoringStore.getState();
    if (s.status === StoreStatus.Success) {
      recipeAuthoringStore.getState().resetDeleteState();
      setShowDeleteSheet(false);
      // Wait for the modal dismiss animation to complete before navigating.
      setTimeout(goBackOrHome, durations.sheetDismiss);
    } else if (s.status === StoreStatus.Error) {
      recipeAuthoringStore.getState().resetDeleteState();
      setDeleteError(t.myRecipes.deleteError);
    }
  }, [recipeId, goBackOrHome, recipeAuthoringStore, t]);

  const handleDeleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      const wasRemoved = await commentsStore.getState().deleteComment(recipeId, commentId);
      if (!wasRemoved) {
        const failure = commentsStore.getState().byRecipe[recipeId]?.error;
        if (failure != null) showErrorToast(failure);
      }
    },
    [commentsStore, recipeId],
  );
  const commentRemoval = useCommentRemoval(handleDeleteComment);

  /**
   * Posts `text`; resolves true once the post lands.
   *
   * The text always comes from the caller — the composer (which owns its
   * draft, so typing does not re-render this screen) or the assistant. Writing
   * the field and posting in the same tick used to read the PREVIOUS render's
   * value — normally empty, which this drops — while still reporting success.
   */
  const handleAddComment = useCallback(async (text: string): Promise<boolean> => {
    const trimmed = text.trim();
    if (trimmed.length === ValueConstants.zero) return false;
    const isOk = await commentsStore.getState().addComment(recipeId, trimmed);
    if (isOk) {
      setSubmitError(null);
    } else {
      const failure = commentsStore.getState().byRecipe[recipeId]?.error;
      setSubmitError(failure != null ? failureToastMessage(t, failure) : t.comments.error);
    }
    return isOk;
  }, [commentsStore, recipeId, t]);

  const handleToggleSave = useCallback(async () => {
    if (isLoading || !userId) return;
    const failure = isSaved
      ? await favoritesStore.getState().removeFavorite(recipeId)
      : await favoritesStore.getState().addFavorite(recipeId);
    if (failure !== null) {
      showErrorToast(failure);
    } else if (!isSaved) {
      dmArrivalStore.getState().saved(recipeId);
    }
  }, [isSaved, isLoading, recipeId, userId, favoritesStore, dmArrivalStore]);

  const handleToggleLike = useCallback(async (): Promise<void> => {
    if (!userId) return;
    const result = await likesStore.getState().toggle(recipeId);
    if (!result.ok) showErrorToast(result.failure);
  }, [userId, recipeId, likesStore]);

  const handleToggleCommentLike = useCallback(async (commentId: string): Promise<void> => {
    if (userId === null) return;
    const result = await commentsStore.getState().toggleLike(recipeId, commentId);
    if (!result.ok) showErrorToast(result.failure);
  }, [userId, recipeId, commentsStore]);

  // Stable, so the memoised sections they are handed skip a page re-render.
  const onToggleLike = useCallback(
    () => requestGate(() => void handleToggleLike(), t.recipes.signInToLike),
    [requestGate, handleToggleLike, t],
  );
  const onAddComment = useCallback(
    (text: string, onPosted: () => void) =>
      requestGate(() => void handleAddComment(text).then((isOk) => isOk && onPosted()), t.comments.signInToComment),
    [requestGate, handleAddComment, t],
  );
  const onLoadMoreComments = useCallback(
    () => void commentsStore.getState().loadMore(recipeId),
    [commentsStore, recipeId],
  );
  const onToggleCommentLike = useCallback(
    (id: string) => requestGate(() => void handleToggleCommentLike(id), t.comments.signInToLikeComment),
    [requestGate, handleToggleCommentLike, t],
  );
  const onOpenDelete = useCallback(() => setShowDeleteSheet(true), []);

  // Tagged with the ingredient count it was ticked against: a different list starts unticked.
  const [ingredientTicks, setIngredientTicks] = useState(NO_INGREDIENT_TICKS);
  // Shared with cook mode, so a step ticked there reads as done here.
  const completedSteps = useStore(stepProgressStore, (s) => s.byRecipe[recipeId]) ?? NO_STEPS_DONE;
  const toggleStoredStep = useStore(stepProgressStore, (s) => s.toggleStep);

  // Local (user-created) recipes short-circuit the network store entirely.
  const isLocal = localRecipe !== undefined;
  const recipeState =
    localRecipe !== undefined
      ? ({ status: StoreStatus.Loaded, recipe: localRecipe, likedByMe: false, fetchedAt: ValueConstants.zero })
      : networkState;

  useEffect(() => {
    if (!isLocal && recipeId.length > ValueConstants.zero) void load(recipeId);
  }, [isLocal, recipeId, load]);

  useEffect(() => {
    if (recipeState?.status === StoreStatus.Loaded && commentState === undefined) {
      void commentsStore.getState().load(recipeId);
    }
  }, [recipeState?.status, commentState, commentsStore, recipeId]);

  const syncLikeCount = recipeState?.status === StoreStatus.Loaded ? recipeState.recipe.likeCount : null;
  const isSyncLikedByMe = recipeState?.status === StoreStatus.Loaded ? recipeState.likedByMe : null;
  const syncFetchedAt = recipeState?.status === StoreStatus.Loaded ? recipeState.fetchedAt : null;

  useEffect(() => {
    if (syncLikeCount !== null && isSyncLikedByMe !== null && syncFetchedAt !== null) {
      likesStore.getState().syncFromApi(recipeId, syncLikeCount, isSyncLikedByMe, syncFetchedAt);
    }
  }, [syncLikeCount, isSyncLikedByMe, syncFetchedAt, recipeId, likesStore]);

  const ingredientCount = recipeState?.status === StoreStatus.Loaded ? recipeState.recipe.ingredients.length : ValueConstants.zero;

  const checkedIngredients = ingredientTicks.forCount === ingredientCount ? ingredientTicks.checked : NO_STEPS_DONE;

  const onRetry = useCallback(() => {
    if (recipeId.length > ValueConstants.zero) {
      void load(recipeId);
    }
  }, [recipeId, load]);

  const onToggleIngredient = useCallback(
    (index: number) => {
      setIngredientTicks((prev) => {
        const next = prev.forCount === ingredientCount ? [...prev.checked] : [];
        next[index] = !(next[index] ?? false);
        return { forCount: ingredientCount, checked: next };
      });
    },
    [ingredientCount],
  );

  const onToggleStep = useCallback(
    (index: number) => toggleStoredStep(recipeId, index),
    [toggleStoredStep, recipeId],
  );

  const current = recipeState ?? { status: StoreStatus.Loading };
  const status: StateViewStatus =
    current.status === StoreStatus.Loading || current.status === StoreStatus.Idle
      ? 'loading'
      : current.status === StoreStatus.Error
        ? 'error'
        : StateViewStatus.Content;
  const failure: Failure | undefined = current.status === StoreStatus.Error ? current.failure : undefined;

  const recipe = current.status === StoreStatus.Loaded ? current.recipe : null;
  // heroPhotos() builds a new array on every call; one per recipe keeps the photo viewer memoised.
  const media: readonly MediaItem[] = useMemo(() => recipe?.heroPhotos() ?? NO_MEDIA, [recipe]);
  const firstImageUrl = media[ValueConstants.zero]?.url ?? CharConstants.empty;
  const cuisineName = recipe !== null ? cuisineLabel(recipe.cuisine).name : CharConstants.empty;
  const isLiked = likeState?.likedByMe ?? (current.status === StoreStatus.Loaded && current.likedByMe);
  const likeCount = likeState?.likeCount ?? recipe?.likeCount ?? ValueConstants.zero;

  // Ask the calculator once more before calling nutrition absent.
  const isNutritionCalculating = useNutritionRecheck(
    recipeId,
    recipe === null || recipe.nutritionFacts().hasAny,
    load,
  );

  return {
    recipeId,
    status,
    failure,
    onRetry,
    recipe,
    media,
    firstImageUrl,
    cuisineName,
    isNutritionCalculating,
    liked: isLiked,
    likeCount,
    isOwner,
    isSaved,
    saveDisabled: isLoading,
    userId,
    authorState,
    commentState,
    submitError,
    onFocusCommentInput: revealCommentInput,
    checkedIngredients,
    completedSteps,
    onToggleIngredient,
    onToggleStep,
    onToggleLike,
    onToggleSave: () => requestGate(() => void handleToggleSave(), t.recipes.signInToSave),
    onAddComment,
    /** Posts text the caller already has — the assistant's path. */
    onPostComment: (text: string) =>
      requestGate(() => void handleAddComment(text), t.comments.signInToComment),
    /**
     * Opens the create screen seeded from this recipe.
     *
     * Behind the guest gate because a copy becomes a DRAFT, which is server
     * state a signed-out visitor has nowhere to put — they would have reached
     * the editor, filled it in and lost the lot on save. Same route the
     * assistant's `duplicateRecipe` uses, so both paths land the user in the
     * editor looking at the copy rather than being told one was made
     * somewhere they cannot see.
     */
    onCopyToDraft: () =>
      requestGate(
        // Cast: same as onGoToSignIn.
        () => router.push(RoutePaths.createRecipeFromRecipe(recipeId) as Href),
        t.recipes.signInToCopy,
      ),
    onLoadMoreComments,
    onToggleCommentLike,
    onDeleteComment: commentRemoval.request,
    commentDeletePending: commentRemoval.pendingId !== null,
    onConfirmDeleteComment: commentRemoval.confirm,
    onCancelDeleteComment: commentRemoval.cancel,
    shareOpen: isShareOpen,
    onOpenShare: () => setShareOpen(true),
    onCloseShare: () => setShareOpen(false),
    showDeleteSheet: shouldShowDeleteSheet,
    deleteError,
    isDeleting,
    onOpenDelete,
    onCloseDelete: () => { setShowDeleteSheet(false); setDeleteError(null); },
    onConfirmDelete: () => void onConfirmDelete(),
    promptVisible,
    promptMessage,
    onClosePrompt: closePrompt,
    onGoToSignIn,
  };
};
