import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, lineHeightFor, iconSizes, controlSizes, avatarSizes, layoutSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface ExitSheetProps {
  visible: boolean;
  onSaveDraft: () => void;
  onDiscard: () => void;
  onKeepEditing: () => void;
}

/** Confirmation dialog shown when leaving an unpublished, unsaved recipe. */
export const ExitSheet = ({
  visible,
  onSaveDraft,
  onDiscard,
  onKeepEditing,
}: ExitSheetProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepEditing}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onKeepEditing}>
        <Pressable style={[styles.card, { backgroundColor: colors.background }]} onPress={() => {}}>
          <View style={[styles.icon, { backgroundColor: colors.chipBackground }]}>
            <Ionicons name="bookmark" size={iconSizes.xxl} color={colors.primary} />
          </View>
          <ThemedText variant="title">{t().createRecipe.exitTitle}</ThemedText>
          <ThemedText variant="body" style={[styles.body, { color: colors.textMuted }]}>
            {t().createRecipe.exitBody}
          </ThemedText>

          <Pressable
            onPress={onSaveDraft}
            style={[styles.primaryBtn, { overflow: 'hidden' }]}
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
            <ThemedText variant="caption" style={{ color: colors.textMuted, fontWeight: fontWeights.semibold }}>
              {t().createRecipe.keepEditing}
            </ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: layoutSizes.maxContentMd,
    borderRadius: radii.xxl,
    padding: spacing.xl,
  },
  icon: {
    width: avatarSizes.md,
    height: avatarSizes.md,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  body: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: lineHeightFor(fontSizes.body),
  },
  primaryBtn: {
    minHeight: controlSizes.buttonSm,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
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
});
