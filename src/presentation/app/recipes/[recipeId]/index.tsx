import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyboardAvoider } from '@presentation/base/widgets/layout/keyboard-avoider';
import { DetailBackButton } from '@presentation/app/recipes/[recipeId]/items/detail-back-button';
import { RecipeDetailSheets } from '@presentation/app/recipes/[recipeId]/sheets/recipe-detail-sheets';
import { useRecipePhotoUpload } from '@presentation/app/recipes/[recipeId]/hooks/photos/use-recipe-photo-upload';
import { usePhotoRemoval } from '@presentation/app/recipes/[recipeId]/hooks/photos/use-photo-removal';
import { StateView } from '@presentation/app/recipes/[recipeId]/items/state-view';
import { useReportFailure } from '@presentation/base/errors/use-report-failure';
import { RecipeDetailContent } from '@presentation/app/recipes/[recipeId]/body/recipe-detail-content';
import { RecipeFloatingActions } from '@presentation/app/recipes/[recipeId]/body/recipe-floating-actions';
import { RecipeShareSheet } from '@presentation/app/recipes/[recipeId]/sheets/recipe-share-sheet';
import { SCROLL_EVENT_THROTTLE_MS } from '@presentation/base/hooks/assistant/args/scrolling/scroll-tuning';
import { useRecipeDetail } from '@presentation/app/recipes/[recipeId]/hooks/use-recipe-detail';
import { useRecipeDetailAssistant } from '@presentation/app/recipes/[recipeId]/hooks/use-recipe-detail-assistant';
import { useBackLabel } from '@presentation/app/recipes/[recipeId]/hooks/use-back-label';
import { useCommentHighlight } from '@presentation/app/recipes/[recipeId]/hooks/use-comment-highlight';
import { PageTitle } from '@presentation/base/widgets/head/page-title';
import { recipeWebUrl } from '@infrastructure/constants/api/api-hosts';
import { ResponsiveContainer } from '@presentation/base/widgets/layout/responsive-container';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export const RecipeDetailScreen = (): React.JSX.Element => {
  const router = useRouter();
  const colors = useTheme().colors;
  const backLabel = useBackLabel();
  const { isExpanded } = useLayout();
  const insets = useSafeAreaInsets();
  const vm = useRecipeDetail();
  useReportFailure(vm.failure ?? null, 'RecipeDetailScreen');
  const assistant = useRecipeDetailAssistant(vm);
  // Removing a photo asks first (it may be the only one).
  const photos = useRecipePhotoUpload(vm.recipeId);
  const photoRemoval = usePhotoRemoval(photos.remove);
  const ownerPhotoControls = vm.isOwner
    ? { onAdd: () => void photos.pickAndAdd(), onRemove: photoRemoval.request, isBusy: photos.isBusy }
    : undefined;
  const commentHighlight = useCommentHighlight({
    recipeId: vm.recipeId,
    commentState: vm.commentState,
    scrollViewRef: vm.scrollViewRef,
  });

  return (
    <KeyboardAvoider style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Every recipe is its own URL; a crawler that finds them all called
          "Recipely" has found one page repeated, not a catalogue. */}
      <PageTitle subject={vm.recipe?.name} />
      <ResponsiveContainer route="recipeDetail" gutter={false} fill>
        <ScrollView
          ref={vm.scrollViewRef}
          scrollEventThrottle={SCROLL_EVENT_THROTTLE_MS}
          onScroll={assistant.onScroll}
          contentContainerStyle={styles.scroll}
          {...commentHighlight.scrollViewProps}
          // After the spread so scrollViewProps cannot override it; handled lets the first tap reach the send button.
          keyboardShouldPersistTaps="handled"
        >
          <StateView status={vm.status} failure={vm.failure} onRetry={vm.onRetry}>
            <RecipeDetailContent
              vm={vm}
              isExpanded={isExpanded}
              ownerPhotoControls={ownerPhotoControls}
              commentHighlight={commentHighlight}
              onBack={() => router.back()}
            />
          </StateView>
        </ScrollView>
      </ResponsiveContainer>

      {!isExpanded ? <DetailBackButton label={backLabel} top={insets.top + spacing.sm} /> : null}

      <RecipeDetailSheets
        unsavePending={assistant.unsavePending}
        onConfirmUnsave={assistant.confirmUnsave}
        onCancelUnsave={assistant.cancelUnsave}
        photoPendingRemoval={photoRemoval.pending}
        onConfirmRemovePhoto={photoRemoval.confirm}
        onCancelRemovePhoto={photoRemoval.cancel}
        photoError={photos.error}
        onDismissPhotoError={photos.onDismissError}
        showDeleteSheet={vm.showDeleteSheet}
        deleteError={vm.deleteError}
        isDeleting={vm.isDeleting}
        onCloseDelete={vm.onCloseDelete}
        onConfirmDelete={vm.onConfirmDelete}
        promptVisible={vm.promptVisible}
        promptMessage={vm.promptMessage}
        onClosePrompt={vm.onClosePrompt}
        onGoToSignIn={vm.onGoToSignIn}
      />

      {vm.recipe !== null ? (
        <>
          {!isExpanded ? (
            <RecipeFloatingActions
              insetsTop={insets.top}
              recipeId={vm.recipeId}
              canCook={vm.recipe.instructions.length > ValueConstants.zero}
              liked={vm.liked}
              isSaved={vm.isSaved}
              saveDisabled={vm.saveDisabled}
              onShare={vm.onOpenShare}
              onCopyToDraft={vm.onCopyToDraft}
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
});

export default RecipeDetailScreen;
