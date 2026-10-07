import { StyleSheet, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, controlSizes, fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface SuffixFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  /** The spoken name of the field; the visible label, when there is one, sits outside it. */
  accessibilityLabel: string;
  /** "kcal", "g" — drawn inside the box after the text. */
  suffix?: string;
  placeholder?: string;
  numeric?: boolean;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

/** A one-line input box with an optional unit after the text, for the diary's numbers and names. */
export const SuffixField = ({
  value,
  onChangeText,
  accessibilityLabel,
  suffix,
  placeholder,
  numeric = false,
  style,
  inputStyle,
}: SuffixFieldProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={[styles.box, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={accessibilityLabel}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        style={[styles.input, { color: colors.text }, inputStyle]}
      />
      {suffix === undefined ? null : (
        <SizedText size={fontSizes.caption} weight={fontWeights.semibold} muted>
          {suffix}
        </SizedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: controlSizes.searchBar,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  input: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
    fontSize: fontSizes.body,
    paddingVertical: spacing.sm,
  },
});
