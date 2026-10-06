import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StatTileText } from '@presentation/app/recipes/[recipeId]/items/meta/stat-tile-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, iconSizes, decorSizes } from '@presentation/base/theme';

export interface InfoStatProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}

/** A stat tile that only states a fact: servings, difficulty, prep time. */
export const InfoStat = ({ icon, value, label }: InfoStatProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.stat}>
      <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={icon} size={iconSizes.lg} color={colors.primary} />
      </View>
      <StatTileText value={value} label={label} />
    </View>
  );
};

const styles = StyleSheet.create({
  stat: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs2,
  },
  badge: {
    width: decorSizes.statBadge,
    height: decorSizes.statBadge,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
