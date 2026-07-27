import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { spacing, radii, iconSizes, controlSizes, opacities } from '@presentation/base/theme';

export interface RecipeFloatingActionsProps {
  insetsTop: number;
  /** Server-confirmed like state, overlaid by any in-flight optimistic toggle. */
  liked: boolean;
  isSaved: boolean;
  saveDisabled: boolean;
  onShare: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
}

/**
 * Floating overlay cluster (share / like / save) pinned to the top-right
 * of the native recipe-detail hero image. Rendered only on the mobile shell.
 */
export const RecipeFloatingActions = ({
  insetsTop,
  liked,
  isSaved,
  saveDisabled,
  onShare,
  onToggleLike,
  onToggleSave,
}: RecipeFloatingActionsProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={[styles.floatingActions, { top: insetsTop + spacing.sm }]}>
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
        accessibilityLabel={liked ? t().recipes.unlike : t().recipes.like}
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
