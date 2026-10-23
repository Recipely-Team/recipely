import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, iconSizes, controlSizes, borderWidths } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface GroupDeleteConfirmProps {
  /** `true` keeps the group's ingredients as ungrouped lines; `false` deletes them with it. */
  onDelete: (keepItems: boolean) => void;
  onCancel: () => void;
}

/** The question an ingredient group asks before it goes: keep its lines, delete them too, or cancel. */
export const GroupDeleteConfirm = ({ onDelete, onCancel }: GroupDeleteConfirmProps): React.JSX.Element => {
  const t = useTranslations();
  const colors = useTheme().colors;
  const copy = t.createRecipe;
  return (
    <View style={[styles.confirm, { borderBottomColor: colors.border }]}>
      <ThemedText variant="caption" style={styles.confirmTitle}>
        {copy.deleteQuestion}
      </ThemedText>
      <Pressable
        onPress={() => onDelete(true)}
        style={[styles.choice, { borderColor: colors.cardBorder, backgroundColor: colors.background }]}
        accessibilityRole="button"
        accessibilityLabel={copy.keepItems}
      >
        <Ionicons name="list-outline" size={iconSizes.md} color={colors.primary} />
        <View style={styles.choiceBody}>
          <ThemedText variant="caption" style={styles.choiceLabel}>
            {copy.keepItems}
          </ThemedText>
          <ThemedText variant="caption" style={{ color: colors.textMuted }}>
            {copy.keepItemsHint}
          </ThemedText>
        </View>
      </Pressable>
      <Pressable
        onPress={() => onDelete(false)}
        style={[styles.choice, { borderColor: colors.cardBorder, backgroundColor: colors.background }]}
        accessibilityRole="button"
        accessibilityLabel={copy.deleteAll}
      >
        <Ionicons name="trash-outline" size={iconSizes.md} color={colors.danger} />
        <ThemedText variant="caption" style={[styles.choiceBody, styles.choiceLabel, { color: colors.danger }]}>
          {copy.deleteAll}
        </ThemedText>
      </Pressable>
      <Pressable onPress={onCancel} style={styles.cancel} accessibilityRole="button" accessibilityLabel={t.common.cancel}>
        <ThemedText variant="caption" style={{ color: colors.textMuted }}>
          {t.common.cancel}
        </ThemedText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  confirm: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: borderWidths.hairline,
  },
  confirmTitle: {
    fontWeight: fontWeights.bold,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: controlSizes.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  choiceBody: {
    flex: ValueConstants.one,
  },
  choiceLabel: {
    fontWeight: fontWeights.semibold,
  },
  cancel: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controlSizes.chip,
  },
});
