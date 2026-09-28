import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { ProvenanceSeal } from '@presentation/base/widgets/badges/provenance-seal';
import { SealSurface } from '@presentation/base/widgets/badges/seal-surface';
import { provenanceSealMetrics } from '@presentation/base/widgets/badges/provenance-seal-metrics';
import { ACCEPTED_IMPORT_MARKS } from '@presentation/base/widgets/badges/accepted-import-marks';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

/**
 * The card that opens the paste screen: the five sources as one capsule, and
 * the sentence that names them.
 *
 * @remarks
 * - **The capsule is decorative.** The sentence under it names every source,
 *   so a screen reader that also read the marks would say each one twice.
 * - **A column, not a row.** Five marks are ~160pt wide; beside the sentence
 *   they squeezed it into a narrow ragged column on a phone.
 */
export const ImportPasteLead = (): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={[styles.lead, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <ProvenanceSeal
        marks={ACCEPTED_IMPORT_MARKS}
        surface={SealSurface.Page}
        size={provenanceSealMetrics.importLeadSize}
        decorative
      />
      <ThemedText variant="body" style={{ color: colors.text }}>
        {t().importRecipe.pasteLead}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  lead: {
    alignItems: 'flex-start',
    gap: spacing.sm2,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    marginBottom: spacing.lg,
  },
});
