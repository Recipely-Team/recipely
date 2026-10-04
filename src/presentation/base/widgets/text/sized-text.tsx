import type { TextStyle } from 'react-native';
import { ThemedText, type ThemedTextProps } from '@presentation/base/widgets/text/themed-text';
import { useTextLineHeight } from '@presentation/base/theme/tokens/typography/use-text-line-height';
import { lineHeights } from '@presentation/base/theme';

export interface SizedTextProps extends Omit<ThemedTextProps, 'variant'> {
  /** A `fontSizes` (or feature token) value. */
  size: number;
  weight?: TextStyle['fontWeight'];
  /** Line-box ratio from `lineHeights`; defaults to `snug`, which suits one-line labels and figures. */
  ratio?: number;
  color?: string;
}

/**
 * `ThemedText` at a size no variant names, with a line box that grows with
 * the OS font scale.
 *
 * @remarks
 * - **Why not a style override on `ThemedText`.** A variant's line height is
 *   derived from the variant's own size; overriding `fontSize` to 28 under a
 *   `body` line box clips the glyphs. This derives the box from `size`.
 */
export const SizedText = ({ size, weight, ratio = lineHeights.snug, color, style, ...rest }: SizedTextProps): React.JSX.Element => {
  const lineHeight = useTextLineHeight(size, ratio);
  return (
    <ThemedText
      {...rest}
      style={[{ fontSize: size, lineHeight, fontWeight: weight }, color === undefined ? null : { color }, style]}
    />
  );
};
