import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { AvatarImage } from '@presentation/base/widgets/media/avatar-image';
import { KitchenAvatar } from '@presentation/app/recipes/[recipeId]/items/meta/kitchen-avatar';
import type { ResolvedAuthor } from '@presentation/app/recipes/[recipeId]/model/author/resolved-author';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { avatarSizes, fontWeights, iconSizes, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface WebAuthorBylineProps {
  author: ResolvedAuthor;
}

/**
 * The web header's author: avatar and name in the stats row. A Recipely
 * Kitchen recipe shows the logo, "Recipely Kitchen" and a verified check.
 */
export const WebAuthorByline = ({ author }: WebAuthorBylineProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const kitchen = author.isKitchen === true;
  return (
    <View style={styles.row}>
      {kitchen ? (
        <KitchenAvatar size={avatarSizes.xs} />
      ) : (
        <AvatarImage uri={author.authorPhotoUrl} name={author.authorName} size={avatarSizes.xs} />
      )}
      <ThemedText variant="body" style={styles.name}>
        {kitchen ? t().recipes.originCuratedDetailLabel : author.authorName}
      </ThemedText>
      {kitchen ? (
        <Ionicons
          name="checkmark-circle"
          size={iconSizes.md}
          color={colors.primary}
          accessibilityLabel={t().creators.verified}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontWeight: fontWeights.semibold },
});
