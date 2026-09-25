import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProvenanceMark } from '@domain/recipes/provenance/provenance-mark';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { ProvenanceSeal } from '@presentation/base/widgets/badges/provenance-seal';
import { SealSurface } from '@presentation/base/widgets/badges/seal-surface';
import { provenanceSealMetrics } from '@presentation/base/widgets/badges/provenance-seal-metrics';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontWeights,
  iconSizes,
  controlSizes,
  borderWidths,
} from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface ImportEntryCardProps {
  onPress: () => void;
}

const ACCEPTED_MARKS = [ProvenanceMark.Instagram, ProvenanceMark.TikTok, ProvenanceMark.Web] as const;

/**
 * The way into the link import that does not depend on the OS share sheet.
 *
 * @remarks
 * - **Sharing works on the phone only, and never on the web** — so this card is
 *   how everyone else reaches the feature at all.
 * - **A neutral link tile, not a platform's plate.** The import takes an
 *   Instagram video or a recipe page; the capsule of glyphs says which, and no
 *   one platform's gradient claims the whole card. TikTok's glyph is left out
 *   while TikTok blocks the import worker.
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
    >
      <View style={[styles.tile, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name="link" size={iconSizes.xl} color={colors.chipText} />
      </View>
      <View style={styles.body}>
        <ThemedText variant="body" style={styles.title}>
          {copy.pasteEntry}
        </ThemedText>
        <ThemedText variant="caption" style={{ color: colors.textMuted }}>
          {copy.pasteEntryHint}
        </ThemedText>
      </View>
      <ProvenanceSeal
        marks={ACCEPTED_MARKS}
        surface={SealSurface.Page}
        size={provenanceSealMetrics.importEntrySize}
        label={copy.pasteEntryHint}
      />
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
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: ValueConstants.one,
    gap: spacing.xxs,
  },
  title: {
    fontWeight: fontWeights.bold,
  },
});
