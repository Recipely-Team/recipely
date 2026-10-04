import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, fontSizes, fontWeights, letterSpacings, radii, spacing } from '@presentation/base/theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';

export interface CreatorProfileStatsProps {
  recipeCount: number;
  followerCount: number;
  likeCount: number;
  /** The locale's compact notation, from the view model. */
  formatCount: (value: number) => string;
}

/**
 * Recipes, followers and likes in one card of three equal columns split by
 * hairlines: value 18/800, label 11/600 upper-case in `textSubtle` (design
 * spec → Creators §6.5). Each column is read as one phrase ("12,4 B Takipçi").
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
      {cells.map((cell, index) => (
        <Fragment key={cell.key}>
          {index > ValueConstants.zero ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
          <View accessible accessibilityLabel={`${cell.value} ${cell.label}`} style={styles.cell}>
            <SizedText size={fontSizes.subtitle} weight={fontWeights.heavy} style={styles.centred}>
              {cell.value}
            </SizedText>
            <SizedText size={fontSizes.micro} weight={fontWeights.semibold} color={colors.textSubtle} style={[styles.centred, styles.label]}>
              {upperCase(cell.label)}
            </SizedText>
          </View>
        </Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
  },
  divider: {
    width: borderWidths.hairline,
    alignSelf: 'stretch',
  },
  cell: {
    flex: ValueConstants.one,
  },
  centred: {
    textAlign: 'center',
  },
  label: {
    letterSpacing: letterSpacings.wide,
  },
});
