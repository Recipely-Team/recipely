import { StyleSheet, TextInput, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, iconSizes, controlSizes } from '@presentation/base/theme';
import { CharConstants, ValueConstants } from '@core/constants';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

/** Rounded search input with a leading icon and a clear button that appears when text is present. */
export const SearchBar = ({ value, onChangeText, placeholder }: SearchBarProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={[styles.container, { backgroundColor: colors.inputBackground }]}>
      <Ionicons name="search" size={iconSizes.lg} color={colors.textMuted} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > ValueConstants.zero ? (
        <Pressable onPress={() => onChangeText(CharConstants.empty)} hitSlop={spacing.sm}>
          <Ionicons name="close-circle" size={iconSizes.lg} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: controlSizes.searchBar,
    borderRadius: radii.round,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: ValueConstants.one,
    fontSize: fontSizes.body,
    backgroundColor: 'transparent',
  },
});
