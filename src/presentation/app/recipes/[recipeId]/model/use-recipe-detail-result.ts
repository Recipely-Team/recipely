import type { RefObject } from 'react';
import type { ScrollView } from 'react-native';
import { StateViewStatus } from '@presentation/app/recipes/[recipeId]/model/state-view-status';
import type { RecipeAuthorState } from '@presentation/app/recipes/[recipeId]/model/author/recipe-author-state';
import type { Failure } from '@presentation/base/types';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { MediaItem } from '@domain/recipes/media/media-item';
import type { RecipeCommentsState } from '@application/comments/list/recipe-comments-state';

/** View model returned by {@link useRecipeDetail} for the recipe-detail screen. */
export interface UseRecipeDetailResult {
  recipeId: string;
  status: StateViewStatus;
  failure: Failure | undefined;
  onRetry: () => void;

  recipe: RecipeEntity | null;
  media: readonly MediaItem[];
  firstImageUrl: string;
  cuisineName: string;
  /**
   * Whether the screen is still waiting on the backend's nutrition
   * calculator. Distinguishes "not computed yet" from "this recipe has none",
   * which the copy used to state as the same thing.
   */
  isNutritionCalculating: boolean;
  /**
   * Whether the viewer has liked this recipe. The single source of truth for
   * every heart on the screen — the optimistic likes-store overlay when it has
   * an entry, otherwise the value the detail endpoint returned.
   */
  liked: boolean;
  likeCount: number;

  isOwner: boolean;
  isSaved: boolean;
  saveDisabled: boolean;
  userId: string | null;
  authorState: RecipeAuthorState;

  commentState: RecipeCommentsState | undefined;
  commentInput: string;
  submitError: string | null;
  onChangeCommentInput: (value: string) => void;
  onFocusCommentInput: () => void;
  scrollViewRef: RefObject<ScrollView | null>;

  checkedIngredients: boolean[];
  completedSteps: boolean[];
  onToggleIngredient: (index: number) => void;
  onToggleStep: (index: number) => void;

  onToggleLike: () => void;
  onToggleSave: () => void;
  onAddComment: () => void;
  /** Posts text the caller already has — the assistant does not type into the field. */
  onPostComment: (text: string) => void;
  /** Opens the create screen seeded from this recipe; gated for guests. */
  onCopyToDraft: () => void;
  onLoadMoreComments: () => void;
  onToggleCommentLike: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;

  shareOpen: boolean;
  onOpenShare: () => void;
  onCloseShare: () => void;

  showDeleteSheet: boolean;
  deleteError: string | null;
  isDeleting: boolean;
  onOpenDelete: () => void;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;

  promptVisible: boolean;
  promptMessage: string | undefined;
  onClosePrompt: () => void;
  onGoToSignIn: () => void;
}
