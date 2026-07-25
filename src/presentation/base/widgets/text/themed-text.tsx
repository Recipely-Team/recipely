import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useTextLineHeight } from '@presentation/base/theme/tokens/typography/use-text-line-height';
import { themedTextVariants } from '@presentation/base/widgets/text/themed-text-variants';
import { fontSizes, fontWeights, letterSpacings } from '@presentation/base/theme';
import type { ThemedTextVariant } from '@presentation/base/widgets/text/themed-text-variant';

export interface ThemedTextProps extends TextProps {
  variant?: ThemedTextVariant;
  muted?: boolean;
}

/**
 * Theme-aware text primitive that applies variant typography and adaptive color.
 *
 * The line box is computed per render rather than baked into the stylesheet so
 * it tracks the OS font-scale setting — see `useTextLineHeight`.
 */
export const ThemedText = ({
  variant = 'body',
  muted = false,
  style,
  ...rest
}: ThemedTextProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { fontSize, ratio } = themedTextVariants[variant];
  const lineHeight = useTextLineHeight(fontSize, ratio);
  const color = muted ? colors.textMuted : colors.text;
  return <Text {...rest} style={[styles[variant], { color, lineHeight }, style]} />;
};

const styles = StyleSheet.create<Record<ThemedTextVariant, TextStyle>>({
  headline: {
    fontSize: fontSizes.headline,
    fontWeight: fontWeights.heavy,
    letterSpacing: letterSpacings.tighter,
  },
  title: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.tight,
  },
  subtitle: {
    fontSize: fontSizes.subtitle,
    fontWeight: fontWeights.semibold,
  },
  body: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.regular,
  },
  caption: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.regular,
  },
  label: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
  },
});
