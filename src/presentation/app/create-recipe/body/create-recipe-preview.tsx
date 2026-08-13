import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RecipePreviewEditor } from '@presentation/app/create-recipe/body/recipe-preview-editor';
import { RefineDock } from '@presentation/app/create-recipe/body/refine-dock';
import { CreateRecipeHeader } from '@presentation/app/create-recipe/body/create-recipe-header';
import type { UseCreateRecipeResult } from '@presentation/app/create-recipe/model/use-create-recipe-result';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { controlSizes } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface CreateRecipePreviewProps {
  vm: UseCreateRecipeResult;
}

/**
 * Preview-phase view: sticky header, the refine-progress bar, the scrollable
 * recipe editor, and the assistant refine dock (with a dimming backdrop when the
 * transcript is expanded). All state and handlers come from the parent screen.
 */
export const CreateRecipePreview = ({ vm }: CreateRecipePreviewProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <>
      <CreateRecipeHeader
        title={vm.headerTitle}
        showAiBadge
        saveLabel={vm.saveLabel}
        isSaving={vm.isSaving}
        isWebShell={vm.isWebShell}
        topInset={vm.insets.top}
        onClose={vm.onClose}
        onSave={vm.onSave}
      />

      {vm.refining ? (
        <View style={[styles.refiningTrack, { backgroundColor: colors.border }]}>
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
            end={{ x: ValueConstants.one, y: ValueConstants.zero }}
            style={styles.refiningFill}
          />
        </View>
      ) : null}

      <View style={styles.content}>
        <RecipePreviewEditor
          recipe={vm.recipe}
          fieldErrors={vm.fieldErrors}
          onChangeName={(v) => vm.onUpdateField('name', v)}
          onChangeCuisine={(v) => vm.onUpdateField('cuisine', v)}
          onChangeCategory={(v) => vm.onUpdateField('category', v)}
          onChangeServings={(v) => vm.onUpdateField('servings', v)}
          onChangeDifficulty={(v) => vm.onUpdateField('difficulty', v)}
          onChangePrep={(v) => vm.onUpdateField('prepTimeMinutes', v)}
          onChangeCook={(v) => vm.onUpdateField('cookTimeMinutes', v)}
          onChangeIngredient={vm.onChangeIngredient}
          onRemoveIngredient={vm.onRemoveIngredient}
          onAddIngredient={vm.onAddIngredient}
          onAddIngredientAt={vm.onAddIngredientAt}
          onMoveIngredient={vm.onMoveIngredient}
          onRemoveIngredientGroup={vm.onRemoveIngredientGroup}
          onAddIngredientGroup={vm.onAddIngredientGroup}
          onChangeStep={vm.onChangeStep}
          onRemoveStep={vm.onRemoveStep}
          onAddStep={vm.onAddStep}
          onOpenPhotos={vm.onOpenPhotos}
        />
      </View>

      {vm.chatExpanded ? (
        // Dim the editor behind the expanded assistant transcript so the
        // conversation reads against a solid backdrop; tapping it collapses it.
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
          onPress={vm.onCollapseChat}
        />
      ) : null}
      <RefineDock
        chatHistory={vm.chatHistory}
        chatInput={vm.chatInput}
        onChangeChatInput={vm.onChangeChatInput}
        expanded={vm.chatExpanded}
        onExpand={vm.onExpandChat}
        onCollapse={vm.onCollapseChat}
        refining={vm.refining}
        canRegenerate={vm.canRegenerate}
        onRegenerate={vm.onRegenerate}
        onSubmit={vm.onSubmitRefine}
        proposal={vm.proposal}
        onAcceptProposal={vm.onAcceptProposal}
        onRejectProposal={vm.onRejectProposal}
        bottomInset={vm.isWebShell ? ValueConstants.zero : vm.insets.bottom}
      />
    </>
  );
};

const styles = StyleSheet.create({
  refiningTrack: {
    height: controlSizes.progressBarThin,
    overflow: 'hidden',
  },
  refiningFill: {
    height: controlSizes.progressBarThin,
    width: '40%',
  },
  content: {
    flex: ValueConstants.one,
  },
});
