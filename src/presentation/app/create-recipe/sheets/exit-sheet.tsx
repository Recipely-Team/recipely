import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, lineHeightFor, iconSizes, controlSizes, avatarSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface ExitSheetProps {
  visible: boolean;
  onSaveDraft: () => void;
  onDiscard: () => void;
  onKeepEditing: () => void;
}

/**
 * Confirmation shown when leaving a recipe that is not in the drafts list yet.
 *
 * Built on {@link BottomSheet} rather than its own `Modal` (CLAUDE.md §23), for
 * two reasons beyond consistency. The shared component sets
 * `statusBarTranslucent`, without which an Android window in edge-to-edge mode
 * re-lays-out around the status bar as the modal opens — the whole screen
 * visibly jumped as this dialog appeared. And it is the single place that knows
 * a sheet is a centred dialog on the web shell instead of a panel stuck to the
 * bottom of a desktop window.
 *
 * The three actions live in the pinned `footer` so none of them can be scrolled
 * out of reach: this is a question the user has to answer to leave the screen.
 */
export const ExitSheet = ({
  visible,
  onSaveDraft,
  onDiscard,
  onKeepEditing,
}: ExitSheetProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <BottomSheet
      visible={visible}
      title={t().createRecipe.exitTitle}
      onClose={onKeepEditing}
      footer={
        <View style={styles.actions}>
          <Pressable
            onPress={onSaveDraft}
            style={styles.primaryBtn}
            accessibilityRole="button"
            accessibilityLabel={t().createRecipe.exitSave}
          >
            <LinearGradient
              colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
              start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
              end={{ x: ValueConstants.one, y: ValueConstants.one }}
              style={styles.primaryInner}
            >
              <ThemedText variant="body" style={[styles.primaryLabel, { color: colors.primaryText }]}>
                {t().createRecipe.exitSave}
              </ThemedText>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={onDiscard}
            style={styles.textBtn}
            accessibilityRole="button"
            accessibilityLabel={t().createRecipe.exitDiscard}
          >
            <ThemedText variant="body" style={[styles.discardLabel, { color: colors.danger }]}>
              {t().createRecipe.exitDiscard}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={onKeepEditing}
            style={styles.textBtn}
            accessibilityRole="button"
            accessibilityLabel={t().createRecipe.keepEditing}
          >
            <ThemedText variant="caption" style={[styles.keepLabel, { color: colors.textMuted }]}>
              {t().createRecipe.keepEditing}
            </ThemedText>
          </Pressable>
        </View>
      }
    >
      <View style={styles.body}>
        <View style={[styles.icon, { backgroundColor: colors.chipBackground }]}>
          <Ionicons name="bookmark" size={iconSizes.xxl} color={colors.primary} />
        </View>
        <ThemedText variant="body" style={[styles.bodyText, { color: colors.textMuted }]}>
          {t().createRecipe.exitBody}
        </ThemedText>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  icon: {
    width: avatarSizes.md,
    height: avatarSizes.md,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  bodyText: {
    textAlign: 'center',
    lineHeight: lineHeightFor(fontSizes.body),
  },
  actions: {
    paddingTop: spacing.sm,
  },
  primaryBtn: {
    minHeight: controlSizes.buttonSm,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  primaryInner: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.body,
  },
  textBtn: {
    minHeight: controlSizes.buttonSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardLabel: {
    fontWeight: fontWeights.semibold,
  },
  keepLabel: {
    fontWeight: fontWeights.semibold,
  },
});
