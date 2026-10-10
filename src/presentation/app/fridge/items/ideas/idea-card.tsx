import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, fontWeights, fridgeSizes, iconSizes, lineHeights, opacities, radii, spacing } from '@presentation/base/theme';
import { difficultyLabel } from '@presentation/base/taxonomy/difficulty-label';
import { t } from '@presentation/i18n';
import { IdeaMeter } from '@presentation/app/fridge/items/ideas/idea-meter';
import { MissingChips } from '@presentation/app/fridge/items/ideas/missing-chips';
import { CharConstants, ValueConstants } from '@core/constants';

export interface IdeaCardProps {
  idea: FridgeIdea;
  /** The missing items are already on the shopping list. */
  added: boolean;
  onCook: (idea: FridgeIdea) => void;
  onAddMissing: (idea: FridgeIdea) => void;
}

/**
 * One idea: tile, title, time and difficulty, how many of the user's
 * ingredients it uses (with a meter), and what is missing.
 *
 * @remarks
 * - **The idea itself is one button** (it opens generation); "Add missing to
 *   shopping list" sits below it as its own link rather than nested inside —
 *   a button in a button is announced as one and cannot be reached alone.
 * - **Once added, the link turns into a disabled "✓ Added to your list"**.
 */
export const IdeaCard = ({ idea, added, onCook, onAddMissing }: IdeaCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().fridge;
  const meta = [copy.minutes.replace('{n}', String(idea.totalMinutes)), difficultyLabel(idea.difficulty)];

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <Pressable
        onPress={() => onCook(idea)}
        accessibilityRole="button"
        accessibilityLabel={[idea.title, ...meta].join(CharConstants.commaSpace)}
        style={({ pressed }) => [styles.main, pressed ? styles.pressed : null]}
      >
        <View style={styles.top}>
          <View style={[styles.tile, { backgroundColor: colors.chipBackground }]}>
            <Ionicons name="restaurant" size={iconSizes.xl} color={colors.primary} />
          </View>
          <View style={styles.titleBlock}>
            <SizedText size={fontSizes.heading} weight={fontWeights.heavy} ratio={lineHeights.tight}>
              {idea.title}
            </SizedText>
            <View style={styles.meta}>
              <Ionicons name="time-outline" size={iconSizes.sm} color={colors.textMuted} />
              <SizedText size={fontSizes.caption} muted>
                {meta[ValueConstants.zero]}
              </SizedText>
              <Ionicons name="speedometer-outline" size={iconSizes.sm} color={colors.textMuted} />
              <SizedText size={fontSizes.caption} muted>
                {meta[ValueConstants.one]}
              </SizedText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={iconSizes.lg} color={colors.textMuted} />
        </View>
        <SizedText size={fontSizes.caption} weight={fontWeights.bold}>
          {copy.usesCount.replace('{a}', String(idea.uses.length))}
        </SizedText>
        <IdeaMeter used={idea.uses.length} missing={idea.missing.length} />
        <MissingChips missing={idea.missing} />
      </Pressable>
      {idea.missing.length === ValueConstants.zero ? null : (
        <Pressable
          onPress={() => onAddMissing(idea)}
          disabled={added}
          accessibilityRole="button"
          accessibilityLabel={added ? copy.addedToList : copy.addMissing}
          accessibilityState={{ disabled: added }}
          style={styles.link}
        >
          <Ionicons name={added ? 'checkmark' : 'cart-outline'} size={iconSizes.md} color={added ? colors.textMuted : colors.primary} />
          <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={added ? colors.textMuted : colors.primary}>
            {added ? copy.addedToList : copy.addMissing}
          </SizedText>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  main: {
    gap: spacing.md,
  },
  pressed: {
    opacity: opacities.pressedSubtle,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tile: {
    width: fridgeSizes.ideaTile,
    height: fridgeSizes.ideaTile,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: ValueConstants.one,
    gap: spacing.xxs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  link: {
    minHeight: controlSizes.iconBtnSm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
    alignSelf: 'flex-start',
  },
});
