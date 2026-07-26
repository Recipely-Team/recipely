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
      <Pressable
        onPress={onAdd}
        style={[styles.addBtn, { borderColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel={addLabel}
      >
        <Ionicons name="add" size={iconSizes.md} color={colors.primary} />
        <ThemedText variant="body" style={[styles.addLabel, { color: colors.primary }]}>
          {addLabel}
        </ThemedText>
      </Pressable>
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
