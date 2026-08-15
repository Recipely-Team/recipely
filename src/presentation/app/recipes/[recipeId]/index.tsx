import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StateView } from '@presentation/app/recipes/[recipeId]/items/state-view';
import { useReportFailure } from '@presentation/base/errors/use-report-failure';
import { SignInPromptSheet } from '@presentation/app/recipes/shared/sheets/sign-in-prompt-sheet';
import { WebRecipeDetail } from '@presentation/app/recipes/[recipeId]/body/web-recipe-detail';
import { MobileRecipeDetail } from '@presentation/app/recipes/[recipeId]/body/mobile-recipe-detail';
import { RecipeFloatingActions } from '@presentation/app/recipes/[recipeId]/body/recipe-floating-actions';
import { DeleteRecipeSheet } from '@presentation/app/recipes/[recipeId]/sheets/delete-recipe-sheet';
import { RecipeShareSheet } from '@presentation/app/recipes/[recipeId]/sheets/recipe-share-sheet';
import { useRecipeDetail } from '@presentation/app/recipes/[recipeId]/hooks/use-recipe-detail';
import { useBackLabel } from '@presentation/app/recipes/[recipeId]/hooks/use-back-label';
import { useCommentHighlight } from '@presentation/app/recipes/[recipeId]/hooks/use-comment-highlight';
import { recipeWebUrl } from '@infrastructure/constants/api/api-hosts';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, iconSizes, controlSizes } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export const RecipeDetailScreen = (): React.JSX.Element => {
  const router = useRouter();
  const colors = useTheme().colors;
  const backLabel = useBackLabel();
  const { isExpanded } = useLayout();
  const insets = useSafeAreaInsets();
  const vm = useRecipeDetail();
  useReportFailure(vm.failure ?? null, 'RecipeDetailScreen');
  // Composed here rather than inside useRecipeDetail: the deep-link concern is
  // self-contained (it only needs the comment state + scroll ref the vm already
  // exposes), and useRecipeDetail is at its size budget already.
  const commentHighlight = useCommentHighlight({
    recipeId: vm.recipeId,
    commentState: vm.commentState,
    scrollViewRef: vm.scrollViewRef,
  });

  return (
    <KeyboardAvoider style={[styles.root, { backgroundColor: colors.background }]}>
      <ResponsiveContainer route="recipeDetail" gutter={false} fill>
        <ScrollView
          ref={vm.scrollViewRef}
          contentContainerStyle={styles.scroll}
          {...commentHighlight.scrollViewProps}
          // After the spread on purpose, so a later addition to
          // `scrollViewProps` cannot silently take this over.
          //
          // RN defaults this to 'never': with the keyboard up, the first tap
          // anywhere inside the scroll view is swallowed to dismiss the
          // keyboard and never reaches the child. Sending a comment therefore
          // took two taps — the first only closed the keyboard. 'handled' lets
          // a child that handles the touch (the send button) win, while a tap
          // on empty space still dismisses.
          keyboardShouldPersistTaps="handled"
        >
          <StateView status={vm.status} failure={vm.failure} onRetry={vm.onRetry}>
            {vm.recipe !== null ? (
              isExpanded ? (
                <WebRecipeDetail
                  recipe={vm.recipe}
                  media={vm.media}
                  isOwner={vm.isOwner}
                  authorState={vm.authorState}
                  liked={vm.liked}
                  likeCount={vm.likeCount}
                  userId={vm.userId}
                  isSaved={vm.isSaved}
                  saveDisabled={vm.saveDisabled}
                  onBack={() => router.back()}
                  onToggleLike={vm.onToggleLike}
                  onToggleSave={vm.onToggleSave}
                  onDelete={vm.onOpenDelete}
                  checkedIngredients={vm.checkedIngredients}
                  onToggleIngredient={vm.onToggleIngredient}
                  completedSteps={vm.completedSteps}
                  onToggleStep={vm.onToggleStep}
                  commentState={vm.commentState}
                  commentInput={vm.commentInput}
                  submitError={vm.submitError}
                  onChangeCommentInput={vm.onChangeCommentInput}
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
                  userId={vm.userId}
                  checkedIngredients={vm.checkedIngredients}
                  onToggleIngredient={vm.onToggleIngredient}
                  completedSteps={vm.completedSteps}
                  onToggleStep={vm.onToggleStep}
                  commentState={vm.commentState}
                  commentInput={vm.commentInput}
                  submitError={vm.submitError}
                  onChangeCommentInput={vm.onChangeCommentInput}
                  onFocusCommentInput={vm.onFocusCommentInput}
                  onToggleLike={vm.onToggleLike}
                  onDelete={vm.onOpenDelete}
                  onAddComment={vm.onAddComment}
                  onLoadMoreComments={vm.onLoadMoreComments}
                  onToggleCommentLike={vm.onToggleCommentLike}
                  onDeleteComment={vm.onDeleteComment}
                  commentHighlight={commentHighlight}
                />
              )
            ) : null}
          </StateView>
        </ScrollView>
      </ResponsiveContainer>

      {!isExpanded ? (
        <Pressable
          accessibilityRole="button"
          // Named after where back actually goes — the glyph alone announced
          // nothing at all to a screen reader.
          accessibilityLabel={backLabel}
          onPress={() => router.back()}
          style={[styles.backButton, { top: insets.top + spacing.sm, backgroundColor: colors.overlayLight }]}
        >
          <Ionicons name="chevron-back" size={iconSizes.xxl} color={colors.onOverlay} />
        </Pressable>
      ) : null}

      <DeleteRecipeSheet
        visible={vm.showDeleteSheet}
        deleteError={vm.deleteError}
        isDeleting={vm.isDeleting}
        onClose={vm.onCloseDelete}
        onConfirm={vm.onConfirmDelete}
      />

      <SignInPromptSheet
        visible={vm.promptVisible}
        onClose={vm.onClosePrompt}
        onSignIn={vm.onGoToSignIn}
        message={vm.promptMessage}
      />

      {vm.recipe !== null ? (
        <>
          {!isExpanded ? (
            <RecipeFloatingActions
              insetsTop={insets.top}
              liked={vm.liked}
              isSaved={vm.isSaved}
              saveDisabled={vm.saveDisabled}
              onShare={vm.onOpenShare}
              onToggleLike={vm.onToggleLike}
              onToggleSave={vm.onToggleSave}
            />
          ) : null}
          <RecipeShareSheet
            visible={vm.shareOpen}
            onClose={vm.onCloseShare}
            recipeName={vm.recipe.name}
            cuisine={vm.cuisineName}
            imageUrl={vm.firstImageUrl}
            url={recipeWebUrl(vm.recipeId)}
          />
        </>
      ) : null}
    </KeyboardAvoider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
  },
  scroll: {
    flexGrow: ValueConstants.one,
  },
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    width: controlSizes.floatingBtn,
    height: controlSizes.floatingBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RecipeDetailScreen;
