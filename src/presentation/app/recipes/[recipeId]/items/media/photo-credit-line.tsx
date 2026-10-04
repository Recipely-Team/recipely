import { Linking, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import type { ImageCredit } from '@domain/recipes/media/image-credit';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useTextLineHeight } from '@presentation/base/theme/tokens/typography/use-text-line-height';
import { controlSizes, fontSizes, lineHeights, opacities } from '@presentation/base/theme';
import { photoViewerSizes } from '@presentation/app/recipes/[recipeId]/model/photos/photo-viewer-sizes';
import { t } from '@presentation/i18n';

const AUTHOR_SLOT = '{author}';
const LICENSE_SLOT = '{license}';

export interface PhotoCreditLineProps {
  /** The cover's credit; the line renders nothing without one. */
  credit: ImageCredit | null;
  /** The web layout's shorter line under the framed viewer. */
  framed?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * "Photo: {author} · {license}" under the recipe's cover — the attribution an
 * open-licence photo asks for (design spec → Recipely Kitchen §9.2).
 *
 * @remarks
 * - **One link, the whole line.** The author is underlined to say so, but the
 *   target is the line: 44 high on a phone, 28 under the web viewer.
 * - **`textSubtle`, not `textMuted`**, which misses 4.5:1 in most palettes.
 */
export const PhotoCreditLine = ({ credit, framed = false, style }: PhotoCreditLineProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const lineHeight = useTextLineHeight(fontSizes.small, lineHeights.snug);
  if (credit === null) return null;

  const [before = '', after = ''] = t().recipes.photoCredit.replace(LICENSE_SLOT, credit.license).split(AUTHOR_SLOT);
  const label = t().recipes.photoCreditA11y.replace(AUTHOR_SLOT, credit.author).replace(LICENSE_SLOT, credit.license);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => void Linking.openURL(credit.url).catch(() => undefined)}
      style={({ pressed }) => [
        styles.line,
        { minHeight: framed ? photoViewerSizes.creditLineFramed : controlSizes.touchTarget },
        pressed ? styles.pressed : null,
        style,
      ]}
    >
      <ThemedText style={[styles.text, { color: colors.textSubtle, lineHeight }]}>
        {before}
        <Text style={styles.author}>{credit.author}</Text>
        {after}
      </ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  line: { justifyContent: 'center', alignSelf: 'flex-start' },
  pressed: { opacity: opacities.pressed },
  text: { fontSize: fontSizes.small },
  author: { textDecorationLine: 'underline' },
});
