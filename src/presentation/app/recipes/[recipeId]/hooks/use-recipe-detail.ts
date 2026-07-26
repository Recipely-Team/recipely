import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { type Href, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useGuestGate } from '@presentation/app/recipes/shared/hooks/use-guest-gate';
import { useScrollToEndOnKeyboard } from '@presentation/app/recipes/[recipeId]/hooks/use-scroll-to-end-on-keyboard';
import { useRecipeAuthor } from '@presentation/app/recipes/[recipeId]/hooks/use-recipe-author';
import type { ResolvedAuthor } from '@presentation/app/recipes/[recipeId]/model/author/resolved-author';
import type { StateViewStatus } from '@presentation/app/recipes/[recipeId]/model/state-view-status';
import type { UseRecipeDetailResult } from '@presentation/app/recipes/[recipeId]/model/use-recipe-detail-result';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { t } from '@presentation/i18n';
import type { Failure } from '@presentation/base/types';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { failureToastMessage } from '@presentation/base/errors/failure-lookups';
import type { MediaItem } from '@domain/recipes/media/media-item';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Orchestrates the recipe-detail screen: resolves the recipe (local or network),
 * author, likes, comments, and save/delete flows, and exposes guest-gated
 * handlers plus derived display values for the presentational body components.
 */
export const useRecipeDetail = (): UseRecipeDetailResult => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ recipeId: string }>();
  const recipeId = typeof params.recipeId === 'string' ? params.recipeId : CharConstants.empty;

  const { recipeDetailStore, savedRecipesStore, createdRecipesStore, authStore, favoritesStore, commentsStore, likesStore, userProfileStore } = useStores();
  const { cuisineLabel } = useTaxonomyLabel();
  const networkState = recipeDetailStore((s) => s.byId[recipeId]);
  const load = recipeDetailStore((s) => s.load);
  const localRecipe = createdRecipesStore((s) => s.findById(recipeId));
  const isSaved = savedRecipesStore((s) => s.savedIds.has(recipeId));
  const isLoading = favoritesStore((s) => s.isLoading);
  const authState = authStore((s) => s.state);
  const userId = authState.status === 'authenticated' ? authState.session.user.id : null;
  const { promptVisible, promptMessage, requestGate, closePrompt } = useGuestGate(userId);
  const onGoToSignIn = useCallback(() => {
    closePrompt();
    // Cast: the dynamic redirect param can't be statically verified against
    // expo-router's typed-routes union — same pattern as useAuthGuard.
    router.push(RoutePaths.loginWithRedirect(pathname) as Href);
  }, [closePrompt, pathname, router]);
  const recipeOwnerId = localRecipe?.ownerId ?? (networkState?.status === 'loaded' ? networkState.recipe.ownerId : null);
  const isOwner = userId !== null && recipeOwnerId !== null && recipeOwnerId === userId;
  const ownProfileState = userProfileStore((s) => s.state);
  const loadOwnProfile = userProfileStore((s) => s.load);
  // For an owned recipe the author is the signed-in user: take name/photo from
  // the session and the recipe count from the shared profile store (the same
  // source the Profile tab populates). Resolving the author through the shared
  // store would clobber the signed-in user's cached profile, so other authors
  // are fetched separately inside useRecipeAuthor.
  const owner: ResolvedAuthor | null =
    isOwner && authState.status === 'authenticated' && ownProfileState.status === 'loaded'
      ? {
          authorName: authState.session.user.displayName,
          authorPhotoUrl: authState.session.user.photoUrl,
          recipeCount: ownProfileState.profile.recipeCount,
          isOwner: true,
        }
      : null;
  const authorState = useRecipeAuthor({ ownerId: recipeOwnerId, owner, isOwner });

  useEffect(() => {
    if (isOwner && userId !== null && ownProfileState.status === 'idle') {
      void loadOwnProfile(userId);
    }
  }, [isOwner, userId, ownProfileState.status, loadOwnProfile]);

  const likeState = likesStore((s) => s.byRecipe[recipeId]);
  const commentState = commentsStore((s) => s.byRecipe[recipeId]);
  const deleteState = createdRecipesStore((s) => s.deleteState);
  const isDeleting = deleteState.status === 'deleting';
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
    if (s.status === 'success') {
      createdRecipesStore.getState().resetDeleteState();
      setShowDeleteSheet(false);
      // Wait for the modal dismiss animation to complete before navigating.
      setTimeout(() => router.back(), 300);
    } else if (s.status === 'error') {
      // WHY: the failure is shown inline inside the (still-open) confirm sheet
      // rather than as a toast — a global toast would be occluded by the modal
      // sheet. Other flows on the full screen below use toasts.
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

  const handleAddComment = useCallback(async () => {
    const trimmed = commentInput.trim();
    if (trimmed.length === ValueConstants.zero) return;
    const ok = await commentsStore.getState().addComment(recipeId, trimmed);
    if (ok) {
      setCommentInput(CharConstants.empty);
      setSubmitError(null);
    } else {
      // WHY: the store records the real failure on its `error` field rather than
      // throwing — resolve the copy from it so a dropped connection or an expired
      // session doesn't read as a generic "try again" prompt. The static string is
      // only a defensive fallback: the store always sets a failure on `false`.
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
    // WHY: the store records the failure on its `error` field rather than
    // throwing — surface it as a toast so a rejected save never passes silently.
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
    localRecipe !== undefined ? ({ status: 'loaded' as const, recipe: localRecipe }) : networkState;

  useEffect(() => {
    if (!isLocal && recipeId.length > ValueConstants.zero && (networkState === undefined || networkState.status === 'idle')) {
      void load(recipeId);
    }
  }, [isLocal, recipeId, networkState, load]);

  useEffect(() => {
    if (recipeState?.status === 'loaded' && commentState === undefined) {
      void commentsStore.getState().load(recipeId);
    }
  }, [recipeState?.status, commentState, commentsStore, recipeId]);

  // WHY: use primitives instead of recipeState object — the local-recipe path
  // creates a fresh wrapper object every render, so an object dependency would
  // re-fire syncFromApi on every render and trigger an infinite update loop.
  const syncLikeCount = recipeState?.status === 'loaded' ? recipeState.recipe.likeCount : null;
  const syncLikedByMe = recipeState?.status === 'loaded' ? recipeState.recipe.likedByMe : null;

  useEffect(() => {
    if (syncLikeCount !== null && syncLikedByMe !== null) {
      likesStore.getState().syncFromApi(recipeId, syncLikeCount, syncLikedByMe);
    }
  }, [syncLikeCount, syncLikedByMe, recipeId, likesStore]);

  // WHY: when the user reaches this screen from the main list (not My Recipes),
  // createdRecipesStore is empty, so isLocal is false and the edit form won't
  // pre-fill. Loading my recipes here ensures the store is populated before
  // the user taps Edit.
  useEffect(() => {
    if (isOwner && !isLocal) {
      void createdRecipesStore.getState().loadMyRecipes();
    }
  }, [isOwner, isLocal, createdRecipesStore]);

  const ingredientCount = recipeState?.status === 'loaded' ? recipeState.recipe.ingredients.length : ValueConstants.zero;
  const instructionCount = recipeState?.status === 'loaded' ? recipeState.recipe.instructions.length : ValueConstants.zero;

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

  const current = recipeState ?? { status: 'loading' as const };
  const status: StateViewStatus =
    current.status === 'loading' || current.status === 'idle'
      ? 'loading'
      : current.status === 'error'
        ? 'error'
        : 'content';
  const failure: Failure | undefined = current.status === 'error' ? current.failure : undefined;

  const recipe = current.status === 'loaded' ? current.recipe : null;
  const images = recipe !== null ? recipe.media.filter((m) => m.type === 'image') : [];
  const media: readonly MediaItem[] =
    recipe === null ? [] : images.length > ValueConstants.zero ? images : [{ type: 'image', url: recipe.image }];
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
    likedByMe: likeState?.likedByMe ?? false,
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
    onLoadMoreComments: () => void commentsStore.getState().loadMore(recipeId),
    onToggleCommentLike: (id: string) =>
      requestGate(() => void handleToggleCommentLike(id), t().comments.signInToLikeComment),
    onDeleteComment: (id: string) => void handleDeleteComment(id),
    onEdit: () => router.push(RoutePaths.createRecipeWithDraft(recipeId) as Href),
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
