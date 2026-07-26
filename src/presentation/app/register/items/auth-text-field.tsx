import { forwardRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type ReturnKeyTypeOptions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, iconSizes, controlSizes, borderWidths, zIndices } from '@presentation/base/theme';

export interface AuthTextFieldProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  secureTextEntry?: boolean;
  maxLength?: number;
  onSubmitEditing?: () => void;
  rightSlot?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Icon-prefixed auth input with a focus-aware border and an optional right slot
 * (status icon / password-visibility toggle). Forwards its ref to the underlying
 * `TextInput` so callers can chain focus across fields.
 */
export const AuthTextField = forwardRef<TextInput, AuthTextFieldProps>(
  function AuthTextField(
    {
      iconName,
      placeholder,
      value,
      onChangeText,
      autoCapitalize,
      keyboardType,
      returnKeyType,
      secureTextEntry,
      maxLength,
      onSubmitEditing,
      rightSlot,
      containerStyle,
    },
    ref,
  ): React.JSX.Element {
    const colors = useTheme().colors;
    const [focused, setFocused] = useState(false);
    const paddingRight = rightSlot !== undefined ? controlSizes.iconBtn + spacing.sm : spacing.lg;

    return (
      <View style={[styles.inputWrapper, containerStyle]}>
        <Ionicons name={iconName} size={iconSizes.xl} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              paddingRight,
              backgroundColor: colors.inputBackground,
              color: colors.text,
              borderColor: focused ? colors.inputBorderFocused : colors.inputBorder,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
        />
        {rightSlot}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: spacing.lg,
    zIndex: zIndices.raised,
  },
  input: {
    minHeight: controlSizes.input,
    borderWidth: borderWidths.thin,
    borderRadius: radii.lg,
    paddingLeft: spacing.xxxl,
    fontSize: fontSizes.body,
  },
});
