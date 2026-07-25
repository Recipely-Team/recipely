import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface CreateRecipeHeaderProps {
  title: string;
  showAiBadge: boolean;
  saveLabel: string;
  isSaving: boolean;
  isWebShell: boolean;
  topInset: number;
  onClose: () => void;
  onSave: () => void;
}

/**
 * Top bar for the recipe preview/editor phase: close button, centered title with
 * an optional AI badge, and the gradient save button. The save label reflects the
 * publish/update state and is resolved by the parent screen.
 */
export const CreateRecipeHeader = ({
  title,
  showAiBadge,
  saveLabel,
  isSaving,
  isWebShell,
  topInset,
  onClose,
  onSave,
}: CreateRecipeHeaderProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          paddingTop: isWebShell ? spacing.md : topInset + spacing.sm,
        },
      ]}
    >
      <Pressable
        onPress={onClose}
        hitSlop={spacing.sm}
        style={styles.iconBtn}
        accessibilityRole="button"
        accessibilityLabel={t().createRecipe.cancel}
      >
        <Ionicons name="close" size={iconSizes.lg} color={colors.text} />
      </Pressable>
      <View style={styles.headerCenter}>
        <ThemedText variant="subtitle" style={styles.headerTitle}>
          {title}
        </ThemedText>
        {showAiBadge ? (
          <View style={[styles.aiBadge, { backgroundColor: colors.chipBackground }]}>
            <Ionicons name="sparkles" size={fontSizes.micro} color={colors.primary} />
            <ThemedText variant="caption" style={[styles.aiBadgeLabel, { color: colors.primary }]}>
              {t().createRecipe.aiBadge}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <Pressable
        onPress={onSave}
        disabled={isSaving}
        style={[styles.saveBtn, shadows.sm, { opacity: isSaving ? opacities.disabledFaint : opacities.full }]}
        accessibilityRole="button"
        accessibilityLabel={t().createRecipe.save}
      >
        <LinearGradient
          colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
          start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
          end={{ x: ValueConstants.one, y: ValueConstants.one }}
          style={styles.saveInner}
        >
          <ThemedText variant="caption" style={[styles.saveLabel, { color: colors.primaryText }]}>
            {saveLabel}
          </ThemedText>
        </LinearGradient>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
  },
  headerTitle: {
    fontSize: fontSizes.heading,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.round,
  },
  aiBadgeLabel: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.micro,
  },
  saveBtn: {
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    overflow: 'hidden',
  },
  saveInner: {
    flex: ValueConstants.one,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.caption,
  },
});
