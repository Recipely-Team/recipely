import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProvenanceMark } from '@domain/recipes/provenance/provenance-mark';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { ProvenanceSeal } from '@presentation/base/widgets/badges/provenance-seal';
import { SealSurface } from '@presentation/base/widgets/badges/seal-surface';
import { provenanceSealMetrics } from '@presentation/base/widgets/badges/provenance-seal-metrics';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, iconSizes, controlSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface FileImportEntryCardProps {
  onPress: () => void;
}

const AI_MARK = [ProvenanceMark.Ai] as const;

/**
 * The way into reading a recipe from photos or a PDF, under the link import.
 *
 * @remarks
 * - **The same row as the link card**, so the two read as siblings: a camera
 *   where the link glyph sits, and the AI seal, because what comes back is
 *   the model's reading of the pages rather than something fetched.
 */
export const FileImportEntryCard = ({ onPress }: FileImportEntryCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().fileImport;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      accessibilityRole="button"
      accessibilityLabel={copy.entry}
    >
      <View style={[styles.tile, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name="camera-outline" size={iconSizes.xl} color={colors.chipText} />
      </View>
      <View style={styles.body}>
        <ThemedText variant="body" style={styles.title}>
          {copy.entry}
        </ThemedText>
        <ThemedText variant="caption" style={{ color: colors.textMuted }}>
          {copy.entryHint}
        </ThemedText>
      </View>
      <ProvenanceSeal marks={AI_MARK} surface={SealSurface.Page} size={provenanceSealMetrics.importEntrySize} />
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
