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
import Ionicons from '@expo/vector-icons/Ionicons';
import { PasswordEyeToggle } from '@presentation/base/widgets/inputs/password-eye-toggle';
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
  password?: boolean;
  valid?: boolean;
  maxLength?: number;
  onSubmitEditing?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * The one icon-prefixed text field of the auth forms (login, register, forgot and
 * reset password), with a focus-aware border.
 *
 * @remarks
 * - **Password:** `password` hides the text and adds the show/hide toggle; the
 *   field owns that visibility state.
 * - **Validity:** `valid` shows a check or a cross on the right; leave it
 *   `undefined` while there is nothing to judge.
 * - **Ref:** forwarded to the `TextInput` so forms can chain focus.
 */
export const AuthTextField = forwardRef<TextInput, AuthTextFieldProps>(
  function AuthTextField(
    {
      iconName,
      placeholder,
      value,
      onChangeText,
      autoCapitalize = 'none',
      keyboardType,
      returnKeyType,
      password = false,
      valid,
      maxLength,
      onSubmitEditing,
      containerStyle,
    },
    ref,
  ): React.JSX.Element {
    const colors = useTheme().colors;
    const [focused, setFocused] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const hasStatus = valid !== undefined;
    const slotCount = Number(password) + Number(hasStatus);
    const paddingRight = spacing.lg + slotCount * controlSizes.iconBtn;

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
          secureTextEntry={password && !revealed}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
        />
        <View style={styles.rightSlot}>
          {hasStatus ? (
            <Ionicons
              name={valid ? 'checkmark-circle' : 'close-circle'}
              size={iconSizes.lg}
              color={valid ? colors.success : colors.danger}
            />
          ) : null}
          {password ? <PasswordEyeToggle visible={revealed} onToggle={() => setRevealed((v) => !v)} /> : null}
        </View>
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
  rightSlot: {
    position: 'absolute',
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
