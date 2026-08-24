import { useCallback, useEffect, useRef, useState } from 'react';
import { isString } from '@core/guards/type-guards';
import { StoreStatus } from '@application/store/store-status';
import { ScrollView } from 'react-native';
import { type Href, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useGuestGate } from '@presentation/app/recipes/shared/hooks/use-guest-gate';
import { useScrollToEndOnKeyboard } from '@presentation/app/recipes/[recipeId]/hooks/use-scroll-to-end-on-keyboard';
import { useRecipeAuthor } from '@presentation/app/recipes/[recipeId]/hooks/use-recipe-author';
import type { ResolvedAuthor } from '@presentation/app/recipes/[recipeId]/model/author/resolved-author';
import { StateViewStatus } from '@presentation/app/recipes/[recipeId]/model/state-view-status';
import type { UseRecipeDetailResult } from '@presentation/app/recipes/[recipeId]/model/use-recipe-detail-result';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { t } from '@presentation/i18n';
import type { Failure } from '@presentation/base/types';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { failureToastMessage } from '@presentation/base/errors/failure-lookups';
import type { MediaItem } from '@domain/recipes/media/media-item';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';
import { MediaType } from '@domain/recipes/media/media-type';

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
export const useRecipeDetail = (): UseRecipeDetailResult => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ recipeId: string }>();
  const recipeId = isString(params.recipeId) ? params.recipeId : CharConstants.empty;

  const { recipeDetailStore, savedRecipesStore, createdRecipesStore, authStore, favoritesStore, commentsStore, likesStore, userProfileStore } = useStores();
  const { cuisineLabel } = useTaxonomyLabel();
  const networkState = recipeDetailStore((s) => s.byId[recipeId]);
  const load = recipeDetailStore((s) => s.load);
  const localRecipe = createdRecipesStore((s) => s.findById(recipeId));
  const isSaved = savedRecipesStore((s) => s.savedIds.has(recipeId));
  const isLoading = favoritesStore((s) => s.isLoading);
  const authState = authStore((s) => s.state);
  const userId = authState.status === StoreStatus.Authenticated ? authState.session.user.id : null;
  const { promptVisible, promptMessage, requestGate, closePrompt } = useGuestGate(userId);
  const onGoToSignIn = useCallback(() => {
    closePrompt();
    // Cast: the dynamic redirect param can't be statically verified against
    // expo-router's typed-routes union — same pattern as useAuthGuard.
    router.push(RoutePaths.loginWithRedirect(pathname) as Href);
  }, [closePrompt, pathname, router]);
  const recipeOwnerId = localRecipe?.ownerId ?? (networkState?.status === StoreStatus.Loaded ? networkState.recipe.ownerId : null);
  const isOwner = userId !== null && recipeOwnerId !== null && recipeOwnerId === userId;
  const ownProfileState = userProfileStore((s) => s.state);
  const loadOwnProfile = userProfileStore((s) => s.load);
  const owner: ResolvedAuthor | null =
    isOwner && authState.status === StoreStatus.Authenticated && ownProfileState.status === StoreStatus.Loaded
      ? {
          authorName: authState.session.user.displayName,
          authorPhotoUrl: authState.session.user.photoUrl,
          recipeCount: ownProfileState.profile.recipeCount,
          isOwner: true,
        }
      : null;
  const authorState = useRecipeAuthor({ ownerId: recipeOwnerId, owner, isOwner });

  useEffect(() => {
    if (isOwner && userId !== null && ownProfileState.status === StoreStatus.Idle) {
      void loadOwnProfile(userId);
    }
  }, [isOwner, userId, ownProfileState.status, loadOwnProfile]);

  const likeState = likesStore((s) => s.byRecipe[recipeId]);
  const commentState = commentsStore((s) => s.byRecipe[recipeId]);
  const deleteState = createdRecipesStore((s) => s.deleteState);
  const isDeleting = deleteState.status === StoreStatus.Deleting;
  const [shareOpen, setShareOpen] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState(CharConstants.empty);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const revealCommentInput = useScrollToEndOnKeyboard(scrollViewRef);

  const onConfirmDelete = useCallback(async () => {
    setDeleteError(null);
    await createdRecipesStore.getState().deleteRecipe(recipeId);
    const { deleteState: s } = createdRecipesStore.getState();
    if (s.status === StoreStatus.Success) {
      createdRecipesStore.getState().resetDeleteState();
      setShowDeleteSheet(false);
      // Wait for the modal dismiss animation to complete before navigating.
      setTimeout(() => router.back(), 300);
    } else if (s.status === StoreStatus.Error) {
      createdRecipesStore.getState().resetDeleteState();
      setDeleteError(t().myRecipes.deleteError);
    }
  }, [recipeId, router, createdRecipesStore]);

  const handleDeleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      const removed = await commentsStore.getState().deleteComment(recipeId, commentId);
      if (!removed) {
        const failure = commentsStore.getState().byRecipe[recipeId]?.error;
        if (failure != null) showErrorToast(failure);
      }
    },
    [commentsStore, recipeId],
  );

  /**
   * Posts `text`, or the field's contents when called without one.
   *
   * The parameter exists for the assistant: writing the field and posting in
   * the same tick meant the post read the PREVIOUS render's value — normally
   * empty, which this drops — while still reporting success, so the model
   * announced a comment that was never made. Same class as the append-then-
   * write bug in the draft editor.
   */
  const handleAddComment = useCallback(async (text?: string) => {
    const trimmed = (text ?? commentInput).trim();
    if (trimmed.length === ValueConstants.zero) return;
    const ok = await commentsStore.getState().addComment(recipeId, trimmed);
    if (ok) {
      setCommentInput(CharConstants.empty);
      setSubmitError(null);
    } else {
      const failure = commentsStore.getState().byRecipe[recipeId]?.error;
      setSubmitError(failure != null ? failureToastMessage(failure) : t().comments.error);
    }
  }, [commentInput, commentsStore, recipeId]);

  const handleToggleSave = useCallback(async () => {
    if (isLoading || !userId) return;
    if (isSaved) {
      await favoritesStore.getState().removeFavorite(userId, recipeId);
    } else {
      await favoritesStore.getState().addFavorite(userId, recipeId);
    }
    const failure = favoritesStore.getState().error;
    if (failure !== null) {
      showErrorToast(failure);
      favoritesStore.getState().clearError();
    }
  }, [isSaved, isLoading, recipeId, userId, favoritesStore]);

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

  const [checkedIngredients, setCheckedIngredients] = useState<boolean[]>([]);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);

  // Local (user-created) recipes short-circuit the network store entirely.
  const isLocal = localRecipe !== undefined;
  const recipeState =
    localRecipe !== undefined
      ? ({ status: StoreStatus.Loaded, recipe: localRecipe, fetchedAt: ValueConstants.zero })
      : networkState;

  useEffect(() => {
    if (!isLocal && recipeId.length > ValueConstants.zero) void load(recipeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocal, recipeId]);

  useEffect(() => {
    if (recipeState?.status === StoreStatus.Loaded && commentState === undefined) {
      void commentsStore.getState().load(recipeId);
    }
  }, [recipeState?.status, commentState, commentsStore, recipeId]);

  const syncLikeCount = recipeState?.status === StoreStatus.Loaded ? recipeState.recipe.likeCount : null;
  const syncLikedByMe = recipeState?.status === StoreStatus.Loaded ? recipeState.recipe.likedByMe : null;
  const syncFetchedAt = recipeState?.status === StoreStatus.Loaded ? recipeState.fetchedAt : null;

  useEffect(() => {
    if (syncLikeCount !== null && syncLikedByMe !== null && syncFetchedAt !== null) {
      likesStore.getState().syncFromApi(recipeId, syncLikeCount, syncLikedByMe, syncFetchedAt);
    }
  }, [syncLikeCount, syncLikedByMe, syncFetchedAt, recipeId, likesStore]);

  const ingredientCount = recipeState?.status === StoreStatus.Loaded ? recipeState.recipe.ingredients.length : ValueConstants.zero;
  const instructionCount = recipeState?.status === StoreStatus.Loaded ? recipeState.recipe.instructions.length : ValueConstants.zero;

  useEffect(() => {
    if (ingredientCount > ValueConstants.zero) {
      setCheckedIngredients(new Array(ingredientCount).fill(false) as boolean[]);
    }
  }, [ingredientCount]);

  useEffect(() => {
    if (instructionCount > ValueConstants.zero) {
      setCompletedSteps(new Array(instructionCount).fill(false) as boolean[]);
    }
  }, [instructionCount]);

  const onRetry = useCallback(() => {
    if (recipeId.length > ValueConstants.zero) {
      void load(recipeId);
    }
  }, [recipeId, load]);

  const onToggleIngredient = useCallback((index: number) => {
    setCheckedIngredients((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const onToggleStep = useCallback((index: number) => {
    setCompletedSteps((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const current = recipeState ?? { status: StoreStatus.Loading };
  const status: StateViewStatus =
    current.status === StoreStatus.Loading || current.status === StoreStatus.Idle
      ? 'loading'
      : current.status === StoreStatus.Error
        ? 'error'
        : StateViewStatus.Content;
  const failure: Failure | undefined = current.status === StoreStatus.Error ? current.failure : undefined;

  const recipe = current.status === StoreStatus.Loaded ? current.recipe : null;
  const images = recipe !== null ? recipe.media.filter((m) => m.type === MediaType.Image) : [];
  const media: readonly MediaItem[] =
    recipe === null ? [] : images.length > ValueConstants.zero ? images : [{ type: MediaType.Image, url: recipe.image }];
  const firstImageUrl = recipe === null ? CharConstants.empty : images[ValueConstants.zero]?.url ?? recipe.image;
  const cuisineName = recipe !== null ? cuisineLabel(recipe.cuisine).name : CharConstants.empty;
  const liked = likeState?.likedByMe ?? recipe?.likedByMe ?? false;
  const likeCount = likeState?.likeCount ?? recipe?.likeCount ?? ValueConstants.zero;

  return {
    recipeId,
    status,
    failure,
    onRetry,
    recipe,
    media,
    firstImageUrl,
    cuisineName,
    liked,
    likeCount,
    isOwner,
    isSaved,
    saveDisabled: isLoading,
    userId,
    authorState,
    commentState,
    commentInput,
    submitError,
    onChangeCommentInput: setCommentInput,
    onFocusCommentInput: revealCommentInput,
    scrollViewRef,
    checkedIngredients,
    completedSteps,
    onToggleIngredient,
    onToggleStep,
    onToggleLike: () => requestGate(() => void handleToggleLike(), t().recipes.signInToLike),
    onToggleSave: () => requestGate(() => void handleToggleSave(), t().recipes.signInToSave),
    onAddComment: () => requestGate(() => void handleAddComment(), t().comments.signInToComment),
    /** Posts text the caller already has — the assistant's path. */
    onPostComment: (text: string) =>
      requestGate(() => void handleAddComment(text), t().comments.signInToComment),
    onLoadMoreComments: () => void commentsStore.getState().loadMore(recipeId),
    onToggleCommentLike: (id: string) =>
      requestGate(() => void handleToggleCommentLike(id), t().comments.signInToLikeComment),
    onDeleteComment: (id: string) => void handleDeleteComment(id),
    shareOpen,
    onOpenShare: () => setShareOpen(true),
    onCloseShare: () => setShareOpen(false),
    showDeleteSheet,
    deleteError,
    isDeleting,
    onOpenDelete: () => setShowDeleteSheet(true),
    onCloseDelete: () => { setShowDeleteSheet(false); setDeleteError(null); },
    onConfirmDelete: () => void onConfirmDelete(),
    promptVisible,
    promptMessage,
    onClosePrompt: closePrompt,
    onGoToSignIn,
  };
};
