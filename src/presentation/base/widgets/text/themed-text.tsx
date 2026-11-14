import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { isString } from '@core/guards/type-guards';
import { CharConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useTextLineHeight } from '@presentation/base/theme/tokens/typography/use-text-line-height';
import { themedTextVariants } from '@presentation/base/widgets/text/themed-text-variants';
import { fontSizes, fontWeights, letterSpacings } from '@presentation/base/theme';
import { upperCase } from '@presentation/i18n/upper-case';
import type { ThemedTextVariant } from '@presentation/base/widgets/text/themed-text-variant';
import { ScreenElementKind } from '@domain/assistant/screen/screen-element-kind';
import { useScreenElement } from '@presentation/base/hooks/assistant/screen/use-screen-element';
import { textOfChildren } from '@presentation/base/hooks/assistant/screen/text-of-children';

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
  children,
  ...rest
}: ThemedTextProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { fontSize, ratio } = themedTextVariants[variant];
  const lineHeight = useTextLineHeight(fontSize, ratio);
  const color = muted ? colors.textMuted : colors.text;
  // Upper-cased here with the app locale; textTransform ignores the language (Turkish i).
  const content =
    variant === 'label' && isString(children) ? upperCase(children) : children;
  // The assistant reads what the user reads; hidden-from-a11y text is hidden from it too.
  useScreenElement(ScreenElementKind.Text, () => ({
    label: rest.accessibilityElementsHidden === true || rest.importantForAccessibility === 'no-hide-descendants' ? CharConstants.empty : textOfChildren(content, false),
  }));
  return (
    <Text {...rest} style={[styles[variant], { color, lineHeight }, style]}>
      {content}
    </Text>
  );
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
  },
});
