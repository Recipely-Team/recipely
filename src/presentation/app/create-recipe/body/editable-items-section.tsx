import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { FieldErrorText } from '@presentation/app/create-recipe/items/field-error-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, borderWidths } from '@presentation/base/theme';

export interface EditableItemsSectionProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  count: number;
  error?: string;
  /** Vertical gap between rows — ingredients render tighter than steps. */
  listGap: number;
  onAdd: () => void;
  addLabel: string;
  /**
   * Optional second action beside "add", for a row that is not another item of
   * the same kind — the ingredients section uses it to start a group.
   */
  secondaryAction?: { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void };
  children: React.ReactNode;
}

/**
 * Titled editor section (ingredients / instructions): header with an icon + item
 * count, an optional field-error message and error-highlighted list wrapper, the
 * editable rows (as children), and a dashed "add" button.
 */
export const EditableItemsSection = ({
  icon,
  title,
  count,
  error,
  listGap,
  onAdd,
  addLabel,
  secondaryAction,
  children,
}: EditableItemsSectionProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitle}>
          <Ionicons name={icon} size={iconSizes.lg} color={colors.primary} />
          <ThemedText variant="subtitle">{title}</ThemedText>
        </View>
        <ThemedText variant="caption" muted>{count}</ThemedText>
      </View>
      {error !== undefined ? <FieldErrorText message={error} /> : null}
      <View
        style={[
          { gap: listGap },
          error !== undefined
            ? { borderWidth: borderWidths.hairline, borderColor: colors.danger, borderRadius: radii.lg, padding: spacing.xs }
            : null,
        ]}
      >
        {children}
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onAdd}
          style={[styles.addBtn, styles.actionGrow, { borderColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel={addLabel}
        >
          <Ionicons name="add" size={iconSizes.md} color={colors.primary} />
          <ThemedText variant="body" style={[styles.addLabel, { color: colors.primary }]}>
            {addLabel}
          </ThemedText>
        </Pressable>
        {secondaryAction !== undefined ? (
          <Pressable
            onPress={secondaryAction.onPress}
            style={[styles.addBtn, styles.actionGrow, { borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel={secondaryAction.label}
          >
            <Ionicons name={secondaryAction.icon} size={iconSizes.md} color={colors.textMuted} />
            <ThemedText variant="body" style={[styles.addLabel, { color: colors.textMuted }]}>
              {secondaryAction.label}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionGrow: {
    flex: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs2,
    minHeight: controlSizes.searchBar,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    borderStyle: 'dashed',
    marginTop: spacing.sm,
  },
  addLabel: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.medium,
  },
});
