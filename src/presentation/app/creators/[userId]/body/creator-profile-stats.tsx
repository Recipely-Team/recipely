import { StyleSheet, View } from 'react-native';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, fontSizes, fontWeights, radii, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { t } from '@presentation/i18n';
import { CreatorProfileMetrics } from '@presentation/app/creators/[userId]/model/creator-profile-metrics';

export interface CreatorProfileStatsProps {
  recipeCount: number;
  followerCount: number;
  likeCount: number;
  /** The locale's compact notation, from the view model. */
  formatCount: (value: number) => string;
}

/**
 * Recipes, followers and likes in one card of three columns. Each column is
 * read as one phrase ("12,4 B Takipçi") rather than a number and a word.
 */
export const CreatorProfileStats = ({ recipeCount, followerCount, likeCount, formatCount }: CreatorProfileStatsProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const cells = [
    { key: 'recipes', value: formatCount(recipeCount), label: t().creators.statRecipes },
    { key: 'followers', value: formatCount(followerCount), label: t().creators.statFollowers },
    { key: 'likes', value: formatCount(likeCount), label: t().creators.statLikes },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      {cells.map((cell) => (
        <View key={cell.key} accessible accessibilityLabel={`${cell.value} ${cell.label}`} style={styles.cell}>
          <SizedText size={fontSizes.subtitle} weight={fontWeights.bold} style={styles.centred}>
            {cell.value}
          </SizedText>
          <SizedText size={fontSizes.small} color={colors.textSubtle} style={styles.centred}>
            {cell.label}
          </SizedText>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: CreatorProfileMetrics.gutter,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
  cell: {
    flex: ValueConstants.one,
  },
  centred: {
    textAlign: 'center',
  },
});
