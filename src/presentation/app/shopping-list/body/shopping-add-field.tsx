import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { isBlank } from '@core/guards/type-guards';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface ShoppingAddFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isAdding: boolean;
}

/** The manual add field at the top of the list: type "2 kg potatoes", press return or +. */
export const ShoppingAddField = ({ value, onChangeText, onSubmit, isAdding }: ShoppingAddFieldProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().shopping;
  const disabled = isAdding || isBlank(value);
  return (
    <View style={[styles.field, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={copy.addPlaceholder}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={copy.addPlaceholder}
        returnKeyType="done"
      />
      <Pressable
        onPress={onSubmit}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={copy.add}
        accessibilityState={{ disabled, busy: isAdding }}
        style={({ pressed }) => [
          styles.add,
          { backgroundColor: colors.primary, opacity: disabled ? opacities.disabled : pressed ? opacities.pressed : opacities.full },
        ]}
      >
        {isAdding ? <ActivityIndicator color={colors.primaryText} /> : <Ionicons name="add" size={iconSizes.lg} color={colors.primaryText} />}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: controlSizes.searchBar,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  input: { flex: ValueConstants.one, fontSize: fontSizes.body, paddingVertical: spacing.sm },
  add: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
