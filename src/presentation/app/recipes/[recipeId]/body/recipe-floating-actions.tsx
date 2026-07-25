import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { spacing, radii, iconSizes, controlSizes, opacities } from '@presentation/base/theme';

export interface RecipeFloatingActionsProps {
  insetsTop: number;
  isOwner: boolean;
  likedByMe: boolean;
  isSaved: boolean;
  saveDisabled: boolean;
  onEdit: () => void;
  onShare: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
}

/**
 * Floating overlay cluster (edit / share / like / save) pinned to the top-right
 * of the native recipe-detail hero image. Rendered only on the mobile shell.
 */
export const RecipeFloatingActions = ({
  insetsTop,
  isOwner,
  likedByMe,
  isSaved,
  saveDisabled,
  onEdit,
  onShare,
  onToggleLike,
  onToggleSave,
}: RecipeFloatingActionsProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={[styles.floatingActions, { top: insetsTop + spacing.sm }]}>
      {isOwner ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t().myRecipes.editRecipe}
          onPress={onEdit}
          style={[styles.floatingBtn, { backgroundColor: colors.overlayLight }]}
        >
          <Ionicons name="pencil" size={iconSizes.xl} color={colors.onOverlay} />
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
        onPress={onToggleLike}
        accessibilityRole="button"
        accessibilityLabel={likedByMe ? t().recipes.unlike : t().recipes.like}
        style={[styles.floatingBtn, { backgroundColor: colors.overlayLight }]}
      >
        <MaterialCommunityIcons
          name={likedByMe ? 'heart' : 'heart-outline'}
          size={iconSizes.xl}
          color={likedByMe ? colors.likeActive : colors.onOverlay}
        />
      </Pressable>
      <Pressable
        onPress={onToggleSave}
        accessibilityRole="button"
        accessibilityLabel={isSaved ? 'Remove from favorites' : 'Add to favorites'}
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
