import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { KitchenAvatar } from '@presentation/app/recipes/[recipeId]/items/meta/kitchen-avatar';
import { AvatarImage } from '@presentation/base/widgets/media/avatar-image';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, avatarSizes, borderWidths, iconSizes } from '@presentation/base/theme';
import { CharConstants, ValueConstants } from '@core/constants';

export interface RecipeAuthorCardProps {
  authorName: string;
  authorPhotoUrl?: string;
  recipeCount: number;
  isOwner: boolean;
  /** A Recipely Kitchen recipe: the logo, "Recipely Kitchen" and a verified check, with no count. */
  isKitchen?: boolean;
}

/**
 * Info-only "who created this recipe" block on the recipe detail screen. Not
 * pressable — it identifies the author and nothing more. For a recipe the
 * signed-in user owns it self-identifies them with a "You" pill instead.
 * A Recipely Kitchen recipe reads "Recipely Kitchen", verified, rather than a
 * user (design spec → Recipely Kitchen §9.1). The caption is `textSubtle`,
 * which holds 4.5:1 where `textMuted` does not.
 */
export const RecipeAuthorCard = ({
  authorName,
  authorPhotoUrl,
  recipeCount,
  isOwner,
  isKitchen = false,
}: RecipeAuthorCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const eyebrow = isOwner ? t().recipes.yourRecipe : t().recipes.recipeBy;
  const name = isKitchen ? t().recipes.originCuratedDetailLabel : authorName;
  const caption = isKitchen ? t().creators.verified : t().recipes.recipeCount.replace('{count}', String(recipeCount));
  const groupLabel = [eyebrow, name, caption].join(CharConstants.commaSpace);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.cardBorder },
      ]}
    >
      {isKitchen ? (
        <KitchenAvatar size={avatarSizes.md} />
      ) : (
        <AvatarImage uri={authorPhotoUrl} name={authorName} size={avatarSizes.md} />
      )}
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
        <View style={styles.nameRow}>
          <ThemedText variant="body" style={styles.name} numberOfLines={ValueConstants.one}>
            {name}
          </ThemedText>
          {isKitchen ? <Ionicons name="checkmark-circle" size={iconSizes.sm} color={colors.primary} /> : null}
        </View>
        {isKitchen ? null : (
          <ThemedText variant="caption" numberOfLines={ValueConstants.one} style={{ color: colors.textSubtle }}>
            {caption}
          </ThemedText>
        )}
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    flexShrink: ValueConstants.one,
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
