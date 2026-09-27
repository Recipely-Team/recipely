import { StyleSheet } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useTextLineHeight } from '@presentation/base/theme/tokens/typography/use-text-line-height';
import { fontSizes, fontWeights, lineHeights } from '@presentation/base/theme';

export interface StatTileTextProps {
  value: string;
  label: string;
  /** Overrides the value's ink, for a finished timer. */
  valueColor?: string;
}

/**
 * The value and label under a stat tile's badge.
 *
 * @remarks
 * - **Neither line truncates.** A label that did not fit a quarter of a phone
 *   was cut to "PREPARAT…"; it now wraps onto a second line, and the grid
 *   drops to two columns before a third would be needed.
 * - **Tabular digits on the value**, kept static: React Native sends `null` to
 *   the native side when `fontVariant` is cleared, and that crashes.
 */
export const StatTileText = ({ value, label, valueColor }: StatTileTextProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const valueLineHeight = useTextLineHeight(fontSizes.body, lineHeights.solid);
  const labelLineHeight = useTextLineHeight(fontSizes.micro, lineHeights.tight);
  return (
    <>
      <ThemedText style={[styles.value, { color: valueColor ?? colors.text, lineHeight: valueLineHeight }]}>
        {value}
      </ThemedText>
      <ThemedText variant="label" muted style={[styles.label, { lineHeight: labelLineHeight }]}>
        {label}
      </ThemedText>
    </>
  );
};

const styles = StyleSheet.create({
  value: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  label: {
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
});
