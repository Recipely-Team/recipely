import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes } from '@presentation/base/theme';
import { FieldErrorText } from '@presentation/app/create-recipe/items/field-error-text';
import { ValueConstants } from '@core/constants';

export interface SpecRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  last?: boolean;
  /** Backend validation message for this field, if any — tints the row and adds an inline warning. */
  error?: string;
  children: React.ReactNode;
}

/** A full-width row inside the spec card: icon badge + label, control at right. */
export const SpecRow = ({ icon, label, last, error, children }: SpecRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const hasError = error !== undefined;
  return (
    <View
      style={[
        styles.root,
        {
          borderBottomColor: colors.border,
          borderBottomWidth: last ? ValueConstants.zero : StyleSheet.hairlineWidth,
          backgroundColor: hasError ? colors.dangerLight : undefined,
        },
      ]}
    >
      <View style={styles.mainRow}>
        <View style={[styles.iconBadge, { backgroundColor: colors.chipBackground }]}>
          <Ionicons name={icon} size={iconSizes.md} color={colors.primary} />
        </View>
        <ThemedText style={[styles.label, { color: colors.text }]}>{label}</ThemedText>
        <View style={styles.control}>{children}</View>
      </View>
      {hasError ? (
        <View style={styles.errorRow}>
          <FieldErrorText message={error} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm2,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorRow: {
    marginLeft: controlSizes.iconBtn + spacing.md,
  },
  iconBadge: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSizes.medium,
    fontWeight: fontWeights.semibold,
  },
  control: {
    marginLeft: 'auto',
  },
});
