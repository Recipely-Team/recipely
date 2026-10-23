import { forwardRef, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { fontWeights } from '@presentation/base/theme';
import { SiteMetadata } from '@presentation/base/constants/site-metadata';
import { useTranslations, useLocale } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';
import { PROD_WEB_APP_DOMAIN } from '@infrastructure/constants/api/api-hosts';
import { isWeb } from '@infrastructure/constants/platform';
import { ShareCardLayout as L } from '@presentation/app/recipes/[recipeId]/model/share/share-card-layout';
import { shareCardIngredients } from '@presentation/app/recipes/[recipeId]/model/share/share-card-ingredients';
import { shareCardMeta } from '@presentation/app/recipes/[recipeId]/model/share/share-card-meta';
import { shareCardNameTier } from '@presentation/app/recipes/[recipeId]/model/share/share-card-name-tier';

export interface RecipeShareCardProps {
  recipeName: string;
  cuisine?: string;
  totalMinutes: number;
  servings: number;
  ingredients: readonly string[];
  imageUrl?: string;
  /** Called once the photo has loaded or failed — the card is ready to capture. */
  onReady: () => void;
}

const DOMAIN_PLACEHOLDER = '{domain}';
/** The card's text is part of an image, so it ignores the device font scale. */
const FIXED_TEXT = { allowFontScaling: false, maxFontSizeMultiplier: L.fontScale } as const;

/**
 * The 9:16 recipe card shared to Instagram Stories / Reels and WhatsApp Status,
 * as drawn in the Claude Design prototype (`share-card-rn-spec.md`).
 *
 * @remarks
 * - **Photo into paper**: the photo fills the top 460 dp and fades into the
 *   theme's background, where the name, the accent meta line, the ingredient
 *   names and the footer sit — all inside Instagram's text-safe band.
 * - **No photo, or a photo that fails**: the theme's gradient with a faint
 *   white logo takes its place and fades the same way.
 * - **Drawn off-screen, captured as an image** by `useShareCard`; it is never
 *   seen inside the app, so it is hidden from accessibility.
 */
export const RecipeShareCard = forwardRef<View, RecipeShareCardProps>(
  ({ recipeName, cuisine, totalMinutes, servings, ingredients, imageUrl, onReady }, ref) => {
    const t = useTranslations();
  const locale = useLocale();
    const colors = useTheme().colors;
    const [photoFailed, setPhotoFailed] = useState(false);
    const hasPhoto = imageUrl !== undefined && !photoFailed;
    useEffect(() => {
      if (!hasPhoto) onReady();
    }, [hasPhoto, onReady]);

    const paper = colors.background;
    const rule = colors.text + L.rule.alpha;
    const [clear, quarter, most, almost] = L.fadeAlphas;
    const fade = [paper + clear, paper + quarter, paper + most, paper + almost, paper] as const;
    const accent = { color: colors.primary };
    const tier = shareCardNameTier(recipeName);
    const meta = shareCardMeta(t, cuisine, totalMinutes, servings);
    const { shown, hidden } = shareCardIngredients(ingredients);
    const [footerBefore, footerAfter = CharConstants.empty] = t.recipes.shareCardFooter.split(DOMAIN_PLACEHOLDER);

    return (
      <View
        ref={ref}
        // Native only: keeps the view un-flattened so it can be captured; on the web React writes it to the DOM and warns.
        collapsable={isWeb() ? undefined : false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.card, { backgroundColor: paper }]}
      >
        {hasPhoto ? (
          <Image source={{ uri: imageUrl }} style={styles.photo} resizeMode="cover" onLoad={onReady} onError={() => setPhotoFailed(true)} />
        ) : (
          <LinearGradient
            colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
            start={L.emptyPhoto.start}
            end={L.emptyPhoto.end}
            style={styles.photo}
          >
            <View style={styles.emptyLogo}>
              <RecipelyLogo size={L.emptyPhoto.logoSize} monochrome mono={colors.onOverlay} />
            </View>
          </LinearGradient>
        )}
        <LinearGradient colors={[colors.overlayLight, colors.backgroundClear]} style={styles.topScrim} />

        <View style={styles.bottom}>
          <LinearGradient colors={fade} locations={[...L.fadeLocations]} style={styles.fade} />
          <View style={[styles.content, { backgroundColor: paper }]}>
            <Text
              {...FIXED_TEXT}
              numberOfLines={tier.lines}
              style={[styles.name, { color: colors.text, fontSize: tier.size, lineHeight: tier.lineHeight, letterSpacing: tier.tracking }]}
            >
              {recipeName}
            </Text>
            {meta.length > ValueConstants.zero ? (
              <Text {...FIXED_TEXT} numberOfLines={ValueConstants.one} style={[styles.meta, accent]}>
                {meta}
              </Text>
            ) : null}
            {shown.length > ValueConstants.zero ? (
              <>
                <View style={[styles.rule, { backgroundColor: rule }]} />
                <Text {...FIXED_TEXT} style={[styles.label, { color: colors.textSubtle }]}>
                  {t.recipes.shareCardNeed.toLocaleUpperCase(locale)}
                </Text>
                <Text {...FIXED_TEXT} numberOfLines={L.ingredients.lines} style={[styles.ingredients, { color: colors.text }]}>
                  {shown.map((name, index) => (
                    <Text key={`${String(index)}-${name}`}>
                      {index > ValueConstants.zero ? <Text style={[styles.strong, accent]}>{L.separator}</Text> : null}
                      {name}
                    </Text>
                  ))}
                  {hidden > ValueConstants.zero ? (
                    <Text style={[styles.strong, accent]}>
                      {CharConstants.space + CharConstants.space + t.recipes.shareCardMore.replace('{n}', String(hidden))}
                    </Text>
                  ) : null}
                </Text>
              </>
            ) : null}
            <View style={[styles.footer, { borderTopColor: rule }]}>
              <View style={styles.brand}>
                <RecipelyLogo size={L.footer.logoSize} />
                <Text {...FIXED_TEXT} style={[styles.wordmark, { color: colors.text }]}>
                  {SiteMetadata.appName}
                </Text>
              </View>
              <Text {...FIXED_TEXT} numberOfLines={ValueConstants.one} style={[styles.footerText, { color: colors.textSubtle }]}>
                {footerBefore}
                <Text style={[styles.strong, { color: colors.text }]}>{PROD_WEB_APP_DOMAIN + footerAfter}</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  },
);

RecipeShareCard.displayName = 'RecipeShareCard';

const styles = StyleSheet.create({
  card: { width: L.width, height: L.height, overflow: 'hidden' },
  photo: { position: 'absolute', top: ValueConstants.zero, left: ValueConstants.zero, width: L.width, height: L.photoHeight },
  emptyLogo: {
    position: 'absolute',
    top: L.emptyPhoto.logoTop,
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    alignItems: 'center',
    opacity: L.emptyPhoto.logoOpacity,
  },
  topScrim: { position: 'absolute', top: ValueConstants.zero, left: ValueConstants.zero, right: ValueConstants.zero, height: L.topScrimHeight },
  bottom: { position: 'absolute', left: ValueConstants.zero, right: ValueConstants.zero, bottom: ValueConstants.zero },
  fade: { height: L.fadeHeight, marginBottom: -L.fadeSeamOverlap, zIndex: ValueConstants.one },
  content: { paddingHorizontal: L.contentPaddingHorizontal, paddingBottom: L.contentPaddingBottom },
  name: { fontWeight: fontWeights.heavy, includeFontPadding: false },
  meta: {
    marginTop: L.meta.marginTop,
    fontSize: L.meta.size,
    lineHeight: L.meta.lineHeight,
    letterSpacing: L.meta.tracking,
    fontWeight: fontWeights.bold,
    includeFontPadding: false,
  },
  rule: { marginTop: L.rule.marginTop, height: L.rule.height },
  label: {
    marginTop: L.label.marginTop,
    fontSize: L.label.size,
    lineHeight: L.label.lineHeight,
    letterSpacing: L.label.tracking,
    fontWeight: fontWeights.bold,
    includeFontPadding: false,
  },
  ingredients: {
    marginTop: L.ingredients.marginTop,
    fontSize: L.ingredients.size,
    lineHeight: L.ingredients.lineHeight,
    fontWeight: fontWeights.medium,
    includeFontPadding: false,
  },
  strong: { fontWeight: fontWeights.bold },
  footer: {
    marginTop: L.footer.marginTop,
    paddingTop: L.footer.paddingTop,
    borderTopWidth: L.rule.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: L.footer.gap,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: L.footer.logoGap },
  wordmark: {
    fontSize: L.wordmark.size,
    lineHeight: L.wordmark.lineHeight,
    letterSpacing: L.wordmark.tracking,
    fontWeight: fontWeights.heavy,
    includeFontPadding: false,
  },
  footerText: {
    flex: ValueConstants.one,
    textAlign: 'right',
    fontSize: L.footerText.size,
    lineHeight: L.footerText.lineHeight,
    fontWeight: fontWeights.medium,
    includeFontPadding: false,
  },
});
