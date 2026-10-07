import type { UseRecipeDetailResult } from '@presentation/app/recipes/[recipeId]/model/use-recipe-detail-result';
import type { UseCommentHighlightResult } from '@presentation/app/recipes/[recipeId]/model/comments/use-comment-highlight-result';
import type { GalleryOwnerControls } from '@presentation/app/recipes/[recipeId]/model/gallery-owner-controls';
import { WebRecipeDetail } from '@presentation/app/recipes/[recipeId]/body/web-recipe-detail';
import { MobileRecipeDetail } from '@presentation/app/recipes/[recipeId]/body/mobile-recipe-detail';
import { usePortionScaling } from '@presentation/app/recipes/[recipeId]/hooks/use-portion-scaling';

export interface RecipeDetailContentProps {
  vm: UseRecipeDetailResult;
  isExpanded: boolean;
  ownerPhotoControls: GalleryOwnerControls | undefined;
  commentHighlight: UseCommentHighlightResult;
  onBack: () => void;
}

/** The loaded recipe in whichever layout the width calls for: the wide two-column page or the phone page. */
export const RecipeDetailContent = ({
  vm,
  isExpanded,
  ownerPhotoControls,
  commentHighlight,
  onBack,
}: RecipeDetailContentProps): React.JSX.Element | null => {
  const portions = usePortionScaling(vm.recipe);
  return (
    vm.recipe !== null ? (
      isExpanded ? (
        <WebRecipeDetail
          recipe={vm.recipe}
          media={vm.media}
          isOwner={vm.isOwner}
          authorState={vm.authorState}
          liked={vm.liked}
          likeCount={vm.likeCount}
          isNutritionCalculating={vm.isNutritionCalculating}
          userId={vm.userId}
          isSaved={vm.isSaved}
          saveDisabled={vm.saveDisabled}
          onBack={onBack}
          onToggleLike={vm.onToggleLike}
          onToggleSave={vm.onToggleSave}
          onCopyToDraft={vm.onCopyToDraft}
          onDelete={vm.onOpenDelete}
          photos={ownerPhotoControls}
          checkedIngredients={vm.checkedIngredients}
          portions={portions}
          onToggleIngredient={vm.onToggleIngredient}
          completedSteps={vm.completedSteps}
          onToggleStep={vm.onToggleStep}
          commentState={vm.commentState}
          submitError={vm.submitError}
          onAddComment={vm.onAddComment}
          onLoadMoreComments={vm.onLoadMoreComments}
          onToggleCommentLike={vm.onToggleCommentLike}
          onDeleteComment={vm.onDeleteComment}
          commentHighlight={commentHighlight}
        />
      ) : (
        <MobileRecipeDetail
          recipeId={vm.recipeId}
          recipe={vm.recipe}
          media={vm.media}
          isOwner={vm.isOwner}
          isExpanded={isExpanded}
          authorState={vm.authorState}
          liked={vm.liked}
          likeCount={vm.likeCount}
          isNutritionCalculating={vm.isNutritionCalculating}
          userId={vm.userId}
          checkedIngredients={vm.checkedIngredients}
          portions={portions}
          onToggleIngredient={vm.onToggleIngredient}
          completedSteps={vm.completedSteps}
          onToggleStep={vm.onToggleStep}
          commentState={vm.commentState}
          submitError={vm.submitError}
          onFocusCommentInput={vm.onFocusCommentInput}
          onToggleLike={vm.onToggleLike}
          onDelete={vm.onOpenDelete}
          onAddComment={vm.onAddComment}
          onLoadMoreComments={vm.onLoadMoreComments}
          onToggleCommentLike={vm.onToggleCommentLike}
          onDeleteComment={vm.onDeleteComment}
          photos={ownerPhotoControls}
          commentHighlight={commentHighlight}
        />
      )
    ) : null
  );
};
