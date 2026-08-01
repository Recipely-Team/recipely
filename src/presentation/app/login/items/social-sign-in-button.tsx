import { Pressable, StyleSheet, Text } from 'react-native';
import { SocialProvider } from '@presentation/app/login/model/social-provider';
import { GoogleLogo } from '@presentation/app/login/items/google-logo';
import { AppleLogo } from '@presentation/app/login/items/apple-logo';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, borderWidths, opacities, BrandColors } from '@presentation/base/theme';

const LOGO_SIZE = iconSizes.lg;

export interface SocialSignInButtonProps {
  provider: SocialProvider;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Border color for the Google button (the Apple button is borderless on black). */
  borderColor: string;
}

/**
 * Branded Google / Apple sign-in button. Both providers share dimensions and
 * typography; only the surface, label color, and logo differ so the two stack
 * consistently beneath the divider on the auth screens.
 */
export const SocialSignInButton = ({
  provider,
  label,
  onPress,
  disabled = false,
  borderColor,
}: SocialSignInButtonProps): React.JSX.Element => {
  const isGoogle = provider === SocialProvider.Google;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.button,
        isGoogle
          ? { backgroundColor: BrandColors.white, borderColor, borderWidth: borderWidths.thin }
          : { backgroundColor: BrandColors.black },
        disabled ? styles.disabled : null,
      ]}
    >
      {isGoogle ? <GoogleLogo size={LOGO_SIZE} /> : <AppleLogo size={LOGO_SIZE} color={BrandColors.white} />}
      {/* Bare Text on purpose: brand surfaces are fixed white/black regardless of theme,
          so the label color must not follow ThemedText's theme-derived color. */}
      <Text style={[styles.label, { color: isGoogle ? BrandColors.googleLabel : BrandColors.white }]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controlSizes.input,
    borderRadius: radii.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  label: {
    fontSize: fontSizes.medium,
    fontWeight: fontWeights.semibold,
  },
  disabled: {
    opacity: opacities.disabled,
  },
});
