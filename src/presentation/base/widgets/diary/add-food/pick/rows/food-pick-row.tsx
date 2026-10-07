import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { FoodThumb } from '@presentation/base/widgets/diary/food-thumb';
import type { FoodThumbIconType } from '@presentation/base/widgets/diary/food-thumb-icon';
import { DraftTag } from '@presentation/base/widgets/diary/add-food/pick/rows/draft-tag';
import { CharConstants, ValueConstants } from '@core/constants';
import { borderWidths, controlSizes, diarySizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';

export interface FoodPickRowProps {
  name: string;
  /** "Draft" after an own unpublished recipe's name; null otherwise. */
  tag: string | null;
  /** "300 kcal · per serving", "3 variants · 38 kcal / 100 ml". */
  meta: string;
  /** "Open Food Facts" under a branded pack; null otherwise. */
  sourceNote: string | null;
  imageUrl: string | null;
  /** A tile icon instead of the photo (products, quick adds). */
  icon: FoodThumbIconType | null;
  onPress: () => void;
}

/** One pickable food in the Add food sheet: thumb, name (+ tag), sub line, source note and a "+" disc; the whole row is the target. */
export const FoodPickRow = ({ name, tag, meta, sourceNote, imageUrl, icon, onPress }: FoodPickRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const label = [name, tag, meta, sourceNote].filter((part) => part !== null).join(CharConstants.commaSpace);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, { borderBottomColor: colors.cardBorder, opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
    >
      <FoodThumb imageUrl={imageUrl} icon={icon} size={diarySizes.foodThumb} />
      <View style={styles.text}>
        <View style={styles.nameLine}>
          <SizedText size={fontSizes.medium} weight={fontWeights.semibold} numberOfLines={ValueConstants.one} style={styles.name}>
            {name}
          </SizedText>
          {tag === null ? null : <DraftTag label={tag} />}
        </View>
        <SizedText size={fontSizes.small} muted numberOfLines={ValueConstants.one}>
          {meta}
        </SizedText>
        {sourceNote === null ? null : (
          <SizedText size={fontSizes.micro} muted numberOfLines={ValueConstants.one}>
            {sourceNote}
          </SizedText>
        )}
      </View>
      <View style={[styles.plus, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name="add" size={iconSizes.lg} color={colors.chipText} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: diarySizes.pickRowMinHeight,
    paddingVertical: spacing.sm,
    borderBottomWidth: borderWidths.hairline,
  },
  text: { flex: ValueConstants.one, gap: spacing.xxs },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs2 },
  name: { flexShrink: ValueConstants.one },
  plus: {
    width: controlSizes.iconBtnSm,
    height: controlSizes.iconBtnSm,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
