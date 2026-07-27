import { StyleSheet, View } from 'react-native';
import { AvatarImage } from '@presentation/base/widgets/media/avatar-image';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, avatarSizes, borderWidths } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface RecipeAuthorCardProps {
  authorName: string;
  authorPhotoUrl?: string;
  recipeCount: number;
  isOwner: boolean;
}

/**
 * Info-only "who created this recipe" block on the recipe detail screen. Not
 * pressable — it identifies the author and nothing more. For a recipe the
 * signed-in user owns it self-identifies them with a "You" pill instead.
 */
export const RecipeAuthorCard = ({
  authorName,
  authorPhotoUrl,
  recipeCount,
  isOwner,
}: RecipeAuthorCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const eyebrow = isOwner ? t().recipes.yourRecipe : t().recipes.recipeBy;
  const caption = t().recipes.recipeCount.replace('{count}', String(recipeCount));
  const groupLabel = `${eyebrow}, ${authorName}, ${caption}`;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.cardBorder },
      ]}
    >
      <AvatarImage uri={authorPhotoUrl} name={authorName} size={avatarSizes.md} />
      <View
        style={styles.textColumn}
        accessible
        accessibilityLabel={groupLabel}
      >
        <ThemedText
          variant="caption"
          muted
          style={[styles.eyebrow, { color: colors.textMuted }]}
        >
          {upperCase(eyebrow)}
        </ThemedText>
        <ThemedText variant="body" style={styles.name} numberOfLines={1}>
          {authorName}
        </ThemedText>
        <ThemedText variant="caption" muted numberOfLines={1}>
          {caption}
        </ThemedText>
      </View>
      {isOwner ? (
        <View
          style={[styles.pill, { backgroundColor: colors.chipBackground }]}
        >
          <ThemedText
            variant="caption"
            style={[styles.pillLabel, { color: colors.chipText }]}
          >
            {t().recipes.youPill}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    marginTop: spacing.lg,
  },
  textColumn: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
  },
  eyebrow: {
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.wide,
  },
  name: {
    fontWeight: fontWeights.bold,
  },
  pill: {
    flexShrink: ValueConstants.zero,
    borderRadius: radii.round,
    paddingVertical: spacing.xs2,
    paddingHorizontal: spacing.md,
  },
  pillLabel: {
    fontWeight: fontWeights.bold,
  },
});
