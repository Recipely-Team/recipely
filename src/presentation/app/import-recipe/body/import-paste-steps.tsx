import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontWeights,
  decorSizes,
  borderWidths,
} from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

const STEP_KEYS = ['pasteStep0', 'pasteStep1', 'pasteStep2'] as const;

/**
 * The three taps that get a link out of Instagram.
 *
 * Not decoration: "Copy link" lives behind Instagram's ⋯ menu, and a user who
 * cannot find it cannot use the feature at all.
 */
export const ImportPasteSteps = (): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().importRecipe;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <ThemedText variant="caption" style={[styles.label, { color: colors.textMuted }]}>
        {copy.pasteHowTo}
      </ThemedText>
      {STEP_KEYS.map((key, index) => (
        <View key={key} style={styles.step}>
          <View style={[styles.number, { backgroundColor: colors.chipBackground }]}>
            <ThemedText variant="caption" style={[styles.numberText, { color: colors.chipText }]}>
              {index + ValueConstants.one}
            </ThemedText>
          </View>
          <ThemedText variant="caption" style={styles.text}>
            {copy[key]}
          </ThemedText>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    gap: spacing.sm,
  },
  label: {
    fontWeight: fontWeights.semibold,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  number: {
    width: decorSizes.notifBadge,
    height: decorSizes.notifBadge,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontWeight: fontWeights.bold,
  },
  text: {
    flex: ValueConstants.one,
  },
});
