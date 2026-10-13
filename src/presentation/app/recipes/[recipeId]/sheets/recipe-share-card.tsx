import { forwardRef, useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';
import { ShareCardLayout } from '@presentation/app/recipes/[recipeId]/model/share/share-card-layout';
import { shareCardIngredients } from '@presentation/app/recipes/[recipeId]/model/share/share-card-ingredients';

export interface RecipeShareCardProps {
  recipeName: string;
  cuisine?: string;
  totalMinutes: number;
  ingredients: readonly string[];
  imageUrl?: string;
  /** Called once the photo has loaded or failed — the card is ready to capture. */
  onReady: () => void;
}

const BULLET = '•';

/**
 * The 9:16 recipe card shared to Instagram Stories / Reels and WhatsApp.
 *
 * @remarks
 * - **Drawn off-screen, captured as an image** by `useShareCard`; it is never
 *   seen inside the app, so it is hidden from accessibility.
 * - **Themed like the app**: the viewer's theme colours, the brand logo and
 *   the recipely.net footer that brings people back to the full recipe.
 * - TODO(design): draw the card in the Claude Design prototype and compare
 *   (rule 28) — built from the share sheet's existing preview card for now.
 */
export const RecipeShareCard = forwardRef<View, RecipeShareCardProps>(
  ({ recipeName, cuisine, totalMinutes, ingredients, imageUrl, onReady }, ref) => {
    const colors = useTheme().colors;
    useEffect(() => {
      if (imageUrl === undefined) onReady();
    }, [imageUrl, onReady]);
    const { shown, hidden } = shareCardIngredients(ingredients);
    const meta = [cuisine, totalMinutes > ValueConstants.zero ? t().recipes.heroTotalMin.replace('{n}', String(totalMinutes)) : undefined]
      .filter((part): part is string => part !== undefined && part.length > ValueConstants.zero)
      .join(CharConstants.middotSpaced);

    return (
      <View
        ref={ref}
        collapsable={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.card, { backgroundColor: colors.background }]}
      >
        {imageUrl !== undefined ? (
          <Image source={{ uri: imageUrl }} style={styles.photo} onLoadEnd={onReady} resizeMode="cover" />
        ) : (
          <View style={[styles.photo, { backgroundColor: colors.chipBackground }]} />
        )}
        <View style={styles.body}>
          <ThemedText variant="title" numberOfLines={ValueConstants.two} maxFontSizeMultiplier={ShareCardLayout.fontScale} style={styles.name}>
            {recipeName}
          </ThemedText>
          {meta.length > ValueConstants.zero ? (
            <ThemedText variant="caption" muted maxFontSizeMultiplier={ShareCardLayout.fontScale}>
              {meta}
            </ThemedText>
          ) : null}
          {shown.length > ValueConstants.zero ? (
            <View style={[styles.ingredients, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <ThemedText variant="label" muted maxFontSizeMultiplier={ShareCardLayout.fontScale}>
                {t().recipes.ingredients}
              </ThemedText>
              {shown.map((line, index) => (
                <ThemedText key={`${String(index)}-${line}`} variant="body" numberOfLines={ValueConstants.one} maxFontSizeMultiplier={ShareCardLayout.fontScale}>
                  {`${BULLET}${CharConstants.space}${line}`}
                </ThemedText>
              ))}
              {hidden > ValueConstants.zero ? (
                <ThemedText variant="caption" muted maxFontSizeMultiplier={ShareCardLayout.fontScale}>
                  {t().recipes.shareCardMore.replace('{n}', String(hidden))}
                </ThemedText>
              ) : null}
            </View>
          ) : null}
        </View>
        <View style={styles.footer}>
          <RecipelyLogo size={ShareCardLayout.logoSize} />
          <ThemedText variant="body" maxFontSizeMultiplier={ShareCardLayout.fontScale} style={[styles.footerText, { color: colors.primary }]}>
            {t().recipes.shareCardFooter}
          </ThemedText>
        </View>
      </View>
    );
  },
);

RecipeShareCard.displayName = 'RecipeShareCard';

const styles = StyleSheet.create({
  card: {
    width: ShareCardLayout.width,
    aspectRatio: ShareCardLayout.aspectRatio,
    padding: spacing.lg,
    gap: spacing.md,
  },
  photo: {
    width: '100%',
    aspectRatio: ValueConstants.one,
    borderRadius: radii.lg,
  },
  body: {
    flex: ValueConstants.one,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  name: {
    fontWeight: fontWeights.bold,
  },
  ingredients: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerText: {
    fontWeight: fontWeights.semibold,
  },
});
