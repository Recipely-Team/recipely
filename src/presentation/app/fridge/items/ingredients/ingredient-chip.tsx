import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { LinearTransition, useReducedMotion } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, durations, fontSizes, fontWeights, fridgeSizes, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { FridgeChip } from '@presentation/app/fridge/model/flow/fridge-chip';
import { CharConstants, ValueConstants } from '@core/constants';

export interface IngredientChipProps {
  chip: FridgeChip;
  /** 36 high on an expanded layout, 40 on a phone. */
  dense: boolean;
  onRemove: (chip: FridgeChip) => void;
}

/** Names longer than this are cut with an ellipsis on the chip; the full name is still spoken. */
const NAME_MAX = 24;
const ELLIPSIS = '…';

const shown = (name: string): string => (name.length > NAME_MAX ? name.slice(ValueConstants.zero, NAME_MAX - ValueConstants.one) + ELLIPSIS : name);

/**
 * One ingredient. Tapping removes it (the screen offers Undo). One the scan
 * was not sure of is dashed, unfilled, at 60% and marked "?" — and says
 * "not sure" to a screen reader. Neighbours slide into the gap it leaves.
 */
export const IngredientChip = ({ chip, dense, onRemove }: IngredientChipProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const reduceMotion = useReducedMotion();
  const copy = t().fridge;
  const label = chip.sure ? copy.removeIngredient.replace('{name}', chip.name) : `${copy.notSure.replace('{name}', chip.name)}, ${copy.removeIngredient.replace('{name}', chip.name)}`;

  return (
    <Animated.View layout={reduceMotion ? undefined : LinearTransition.duration(durations.controlReveal)}>
      <Pressable
        onPress={() => onRemove(chip)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.chip,
          { minHeight: dense ? fridgeSizes.chipExpanded : fridgeSizes.chip },
          chip.sure
            ? { backgroundColor: colors.surface, borderColor: colors.cardBorder, borderWidth: borderWidths.hairline }
            : [styles.unsure, { borderColor: colors.border }],
        ]}
      >
        {chip.sure ? null : (
          <View style={[styles.marker, { borderColor: colors.textMuted }]}>
            <SizedText size={fontSizes.tiny} weight={fontWeights.heavy} color={colors.textMuted}>
              {CharConstants.questionMark}
            </SizedText>
          </View>
        )}
        <SizedText size={fontSizes.medium} weight={fontWeights.semibold} numberOfLines={ValueConstants.one}>
          {shown(chip.name)}
        </SizedText>
        <Ionicons name="close" size={iconSizes.sm} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
    borderRadius: radii.round,
    paddingLeft: spacing.md + spacing.xxs,
    paddingRight: spacing.sm2,
  },
  unsure: {
    borderWidth: borderWidths.thin,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    opacity: opacities.disabledFaint,
  },
  marker: {
    minWidth: iconSizes.sm,
    minHeight: iconSizes.sm,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
