import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { ProvenanceSeal } from '@presentation/base/widgets/badges/provenance-seal';
import { SealSurface } from '@presentation/base/widgets/badges/seal-surface';
import { provenanceSealMetrics } from '@presentation/base/widgets/badges/provenance-seal-metrics';
import { ACCEPTED_IMPORT_MARKS } from '@presentation/base/widgets/badges/accepted-import-marks';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontWeights,
  iconSizes,
  decorSizes,
  fontSizes,
  opacities,
  borderWidths,
} from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface ImportEntryCardProps {
  onPress: () => void;
}

/**
 * The way into the link import that does not depend on the OS share sheet.
 *
 * @remarks
 * - **Sharing works on the phone only, and never on the web** — so this card is
 *   how everyone else reaches the feature at all.
 * - **A neutral link tile, not a platform's plate.** The import takes a video
 *   from four platforms or a recipe page; the capsule under the hint says
 *   which, and no one platform's gradient claims the whole card.
 * - **The capsule is decorative**: the hint above it names every source, and
 *   the card's accessible name is its title.
 */
export const ImportEntryCard = ({ onPress }: ImportEntryCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().importRecipe;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      accessibilityRole="button"
      accessibilityLabel={copy.pasteEntry}
      accessibilityHint={copy.pasteEntryHint}
    >
      <View style={[styles.tile, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name="link" size={iconSizes.xl} color={colors.chipText} />
      </View>
      <View style={styles.body}>
        <ThemedText variant="body" style={[styles.title, { color: colors.text }]}>
          {copy.pasteEntry}
        </ThemedText>
        <ThemedText variant="caption" style={[styles.hint, { color: colors.text }]}>
          {copy.pasteEntryHint}
        </ThemedText>
        <View style={styles.marks}>
          <ProvenanceSeal
            marks={ACCEPTED_IMPORT_MARKS}
            surface={SealSurface.Page}
            size={provenanceSealMetrics.importEntrySize}
            decorative
          />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={iconSizes.lg} color={colors.textMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm2,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  tile: {
    width: decorSizes.statBadge,
    height: decorSizes.statBadge,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
    gap: spacing.xxs,
  },
  title: {
    fontSize: fontSizes.medium,
    fontWeight: fontWeights.bold,
  },
  hint: {
    opacity: opacities.secondaryInk,
  },
  marks: {
    marginTop: spacing.xs,
  },
});
