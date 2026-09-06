import { StyleSheet, View } from 'react-native';
import { MediaGallery, type MediaGalleryProps } from '@presentation/app/recipes/[recipeId]/items/media/media-gallery';
import { RecipeOverview } from '@presentation/app/recipes/[recipeId]/body/recipe-overview';
import { RecipeSteps } from '@presentation/app/recipes/[recipeId]/body/recipe-steps';
import { RecipeCommentsSection } from '@presentation/app/recipes/[recipeId]/body/recipe-comments-section';
import type { RecipeAuthorState } from '@presentation/app/recipes/[recipeId]/model/author/recipe-author-state';
import type { UseCommentHighlightResult } from '@presentation/app/recipes/[recipeId]/model/comments/use-comment-highlight-result';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii } from '@presentation/base/theme';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { MediaItem } from '@domain/recipes/media/media-item';
import type { RecipeCommentsState } from '@application/comments/list/recipe-comments-state';
import { ValueConstants } from '@core/constants';

export interface MobileRecipeDetailProps {
  recipe: RecipeEntity;
  recipeId: string;
  media: readonly MediaItem[];
  isOwner: boolean;
  isExpanded: boolean;
  authorState: RecipeAuthorState;
  liked: boolean;
  likeCount: number;
  /** The backend is still computing nutrition; the empty state says so. */
  isNutritionCalculating: boolean;
  userId: string | null;
  checkedIngredients: boolean[];
  onToggleIngredient: (index: number) => void;
  completedSteps: boolean[];
  onToggleStep: (index: number) => void;
  commentState: RecipeCommentsState | undefined;
  commentInput: string;
  submitError: string | null;
  onChangeCommentInput: (value: string) => void;
  onFocusCommentInput: () => void;
  onToggleLike: () => void;
  onDelete: () => void;
  onAddComment: () => void;
  onLoadMoreComments: () => void;
  onToggleCommentLike: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  commentHighlight: UseCommentHighlightResult;
  /**
   * The gallery's owner controls, or undefined for everyone else.
   *
   * Passed down rather than derived from `isOwner` here: the screen owns the
   * picker, the confirmation and the busy flag, and this component composes.
   */
  photos: MediaGalleryProps['owner'];
}

/**
 * Single-column recipe-detail layout for the native/mobile shell. Mounted by the
 * screen only when `useLayout().isExpanded` is false; the web shell renders
 * `WebRecipeDetail` instead. Store loading and handlers are owned by the parent
 * screen and passed in — this component composes the presentational sections.
 */
export const MobileRecipeDetail = (props: MobileRecipeDetailProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { recipe, recipeId, media, commentState } = props;

  return (
    <View>
      <MediaGallery media={media} owner={props.photos} />

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        <RecipeOverview
          recipe={recipe}
          recipeId={recipeId}
          liked={props.liked}
          likeCount={props.likeCount}
          commentTotal={commentState?.total ?? ValueConstants.zero}
          authorState={props.authorState}
          onToggleLike={props.onToggleLike}
          isNutritionCalculating={props.isNutritionCalculating}
        />

        <RecipeSteps
          recipe={recipe}
          recipeId={recipeId}
          isOwner={props.isOwner}
          isExpanded={props.isExpanded}
          checkedIngredients={props.checkedIngredients}
          onToggleIngredient={props.onToggleIngredient}
          completedSteps={props.completedSteps}
          onToggleStep={props.onToggleStep}
          onDelete={props.onDelete}
        />

        <RecipeCommentsSection
          commentState={commentState}
          userId={props.userId}
          commentInput={props.commentInput}
          submitError={props.submitError}
          onChangeCommentInput={props.onChangeCommentInput}
          onFocusCommentInput={props.onFocusCommentInput}
          onAddComment={props.onAddComment}
          onLoadMoreComments={props.onLoadMoreComments}
          onToggleCommentLike={props.onToggleCommentLike}
          onDeleteComment={props.onDeleteComment}
          commentHighlight={props.commentHighlight}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    marginTop: -spacing.xxl,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
});
