import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  iconSizes,
  decorSizes,
  borderWidths,
  opacities,
  BrandColors,
} from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface ImportStageListProps {
  /** Stages below this index are done; this one is in progress. */
  activeStage: number;
}

const STAGE_KEYS = ['stage0', 'stage1', 'stage2', 'stage3'] as const;
const DOT = 7;

/** The queue made legible: the four things the worker does, in order. */
export const ImportStageList = ({ activeStage }: ImportStageListProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().importRecipe;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      {STAGE_KEYS.map((key, index) => {
        const isDone = index < activeStage;
        const isActive = index === activeStage;
        return (
          <View
            key={key}
            style={[styles.row, { opacity: isDone || isActive ? opacities.full : opacities.inactive }]}
          >
            <View
              style={[
                styles.marker,
                {
                  // The active step wears Instagram's pink, matching the ring
                  // above it — the whole screen says where this came from
                  // without a badge repeating it.
                  backgroundColor: isDone
                    ? colors.success
                    : isActive
                      ? BrandColors.instagramGradientMid
                      : colors.skeleton,
                },
              ]}
            >
              {isDone ? (
                <Ionicons name="checkmark" size={iconSizes.xs} color={colors.primaryText} />
              ) : (
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: isActive ? colors.primaryText : colors.textMuted },
                  ]}
                />
              )}
            </View>
            <ThemedText
              style={[
                styles.label,
                {
                  color: isDone || isActive ? colors.text : colors.textMuted,
                  fontWeight: isActive ? fontWeights.bold : fontWeights.medium,
                },
              ]}
            >
              {copy[key]}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  marker: {
    width: decorSizes.badgeSm,
    height: decorSizes.badgeSm,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radii.round,
  },
  label: {
    flex: ValueConstants.one,
    fontSize: fontSizes.medium,
  },
});
