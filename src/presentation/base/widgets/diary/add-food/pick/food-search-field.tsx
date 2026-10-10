import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { borderWidths, controlSizes, fontSizes, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';

export interface FoodSearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  /** The hint and spoken name; the Add food sheet's own when omitted. */
  placeholder?: string;
}

/**
 * The pick step's search box: an icon, the text, and a clear button once
 * there is text (Add food v2 spec §2). Focused on open only in the web
 * shell — on a phone the keyboard would cover the tabs.
 */
export const FoodSearchField = ({ value, onChangeText, placeholder }: FoodSearchFieldProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { isWebShell } = useLayout();
  const strings = t().diary;
  return (
    <View style={[styles.box, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
      <Ionicons name="search" size={iconSizes.lg} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={placeholder ?? strings.searchPlaceholder}
        placeholder={placeholder ?? strings.searchPlaceholder}
        placeholderTextColor={colors.textMuted}
        autoFocus={isWebShell}
        autoCorrect={false}
        returnKeyType="search"
        style={[styles.input, { color: colors.text }]}
      />
      {value.length === ValueConstants.zero ? null : (
        <Pressable
          onPress={() => onChangeText(CharConstants.empty)}
          accessibilityRole="button"
          accessibilityLabel={t().common.clear}
          style={styles.clear}
          hitSlop={spacing.xs}
        >
          <Ionicons name="close-circle" size={iconSizes.xl} color={colors.textMuted} />
        </Pressable>
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
    paddingLeft: spacing.md,
    gap: spacing.sm,
  },
  input: { flex: ValueConstants.one, fontSize: fontSizes.body, paddingVertical: spacing.sm },
  clear: { width: controlSizes.iconBtn, height: controlSizes.iconBtn, alignItems: 'center', justifyContent: 'center' },
});
