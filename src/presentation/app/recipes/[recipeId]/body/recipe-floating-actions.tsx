import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { useOpenCookMode } from '@presentation/app/recipes/[recipeId]/hooks/use-open-cook-mode';
import { spacing, radii, iconSizes, controlSizes, opacities } from '@presentation/base/theme';

export interface RecipeFloatingActionsProps {
  insetsTop: number;
  recipeId: string;
  /** False for a recipe with no steps: there is nothing to cook through. */
  canCook: boolean;
  /** Server-confirmed like state, overlaid by any in-flight optimistic toggle. */
  liked: boolean;
  isSaved: boolean;
  saveDisabled: boolean;
  onShare: () => void;
  onCopyToDraft: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
}

/**
 * Floating overlay cluster (cook / share / copy / like / save) pinned to the top-right
 * of the native recipe-detail hero image. Rendered only on the mobile shell.
 */
export const RecipeFloatingActions = ({
  insetsTop,
  recipeId,
  canCook,
  liked,
  isSaved,
  saveDisabled,
  onShare,
  onCopyToDraft,
  onToggleLike,
  onToggleSave,
}: RecipeFloatingActionsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const openCookMode = useOpenCookMode(recipeId);

  return (
    <View style={[styles.floatingActions, { top: insetsTop + spacing.sm }]}>
      {canCook ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t().cookMode.start}
          onPress={openCookMode}
          style={[styles.floatingBtn, { backgroundColor: colors.overlayLight }]}
        >
          <Ionicons name="restaurant-outline" size={iconSizes.xl} color={colors.onOverlay} />
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t().recipes.share}
        onPress={onShare}
        style={[styles.floatingBtn, { backgroundColor: colors.overlayLight }]}
      >
        <Ionicons name="share-social-outline" size={iconSizes.xl} color={colors.onOverlay} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t().recipes.copyToDrafts}
        onPress={onCopyToDraft}
        style={[styles.floatingBtn, { backgroundColor: colors.overlayLight }]}
      >
        <Ionicons name="copy-outline" size={iconSizes.xl} color={colors.onOverlay} />
      </Pressable>
      <Pressable
        onPress={onToggleLike}
        accessibilityRole="button"
        accessibilityLabel={liked ? t().recipes.unlike : t().recipes.like}
        accessibilityState={{ selected: liked }}
        style={[styles.floatingBtn, { backgroundColor: colors.overlayLight }]}
      >
        <MaterialCommunityIcons
          name={liked ? 'heart' : 'heart-outline'}
          size={iconSizes.xl}
          color={liked ? colors.likeActive : colors.onOverlay}
        />
      </Pressable>
      <Pressable
        onPress={onToggleSave}
        accessibilityRole="button"
        accessibilityLabel={isSaved ? t().recipes.saved : t().recipes.save}
        accessibilityState={{ selected: isSaved, disabled: saveDisabled }}
        disabled={saveDisabled}
        style={[styles.floatingBtn, { opacity: saveDisabled ? opacities.disabled : opacities.full, backgroundColor: colors.overlayLight }]}
      >
        <Ionicons
          name={isSaved ? 'bookmark' : 'bookmark-outline'}
          size={iconSizes.xl}
          color={saveDisabled ? colors.textMuted : colors.onOverlay}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingActions: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  floatingBtn: {
    width: controlSizes.floatingBtn,
    height: controlSizes.floatingBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
