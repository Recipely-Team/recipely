import { useEffect, useState } from 'react';
import { Animated, BackHandler, Easing, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LaunchCampaign } from '@domain/campaigns/launch-campaign';
import { CAMPAIGN_GRADIENT as GRADIENT, CampaignArtFrame, DIALOG_BODY_LINES as BODY_LINES, RISE_BEZIER } from '@presentation/base/widgets/launch-campaign/launch-campaign-geometry';
import { CampaignArtLayer } from '@presentation/base/widgets/launch-campaign/campaign-art';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useReduceMotion } from '@presentation/base/hooks/accessibility/use-reduce-motion';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { BrandColors, controlSizes, durations, fontWeights, radii, spacing, zIndices } from '@presentation/base/theme';
import { campaignSizes } from '@presentation/base/widgets/launch-campaign/launch-campaign-sizes';
import { useTranslations } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { isWeb } from '@infrastructure/constants/platform';

const SHEET_EASING = Easing.bezier(...RISE_BEZIER);

export interface CampaignDialogProps {
  campaign: LaunchCampaign;
  onClose: () => void;
  onCta: () => void;
}

/**
 * The card variant: a sheet over the dimmed feed (a centred card on an expanded viewport) with the
 * campaign's gradient hero, the app mark on its edge, the title, two lines of body and the CTA.
 *
 * @remarks
 * - **Every way out is a dismissal** — the X, Not now, the dim, Android back — and is remembered.
 * - **The hero never waits for its image**: gradient and art draw at once, a prefetched image
 *   fades in over them.
 */
export const CampaignDialog = ({ campaign, onClose, onCta }: CampaignDialogProps): React.JSX.Element => {
  const t = useTranslations();
  const colors = useTheme().colors;
  const insets = useSafeAreaInsets();
  const { isExpanded } = useLayout();
  const shouldReduceMotion = useReduceMotion();
  const [progress] = useState(() => new Animated.Value(shouldReduceMotion ? ValueConstants.one : ValueConstants.zero));

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: ValueConstants.one,
      duration: durations.campaignSheetRise,
      easing: SHEET_EASING,
      useNativeDriver: !isWeb(),
    });
    animation.start();
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => {
      animation.stop();
      subscription.remove();
    };
  }, [onClose, progress]);

  const rise = progress.interpolate({ inputRange: [ValueConstants.zero, ValueConstants.one], outputRange: [campaignSizes.sheetRiseOffset, ValueConstants.zero] });

  return (
    <View style={[StyleSheet.absoluteFill, styles.root, isExpanded ? styles.centred : styles.bottom]} accessibilityViewIsModal>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={t.common.close} />
      </Animated.View>
      <Animated.View
        style={[
          styles.card,
          shadows.lg,
          isExpanded ? styles.cardCentred : styles.cardBottom,
          { backgroundColor: colors.background, opacity: progress, transform: [{ translateY: rise }] },
        ]}
      >
        <View style={styles.hero}>
          <LinearGradient colors={[campaign.colorStart, campaign.colorEnd]} start={GRADIENT.start} end={GRADIENT.end} style={StyleSheet.absoluteFill} />
          <CampaignArtLayer art={campaign.art} frame={CampaignArtFrame.Hero} />
          {campaign.imageUrl !== null ? (
            <Image source={campaign.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={durations.imageFade} accessible={false} />
          ) : null}
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t.common.close} style={styles.close}>
            <View style={[styles.closeDisc, { backgroundColor: colors.scrim }]}>
              <Ionicons name="close" size={campaignSizes.closeGlyph} color={BrandColors.white} />
            </View>
          </Pressable>
        </View>
        <View style={[styles.markWrap, { backgroundColor: colors.background, borderColor: colors.background }]} accessible={false}>
          <View style={styles.markTile}>
            <RecipelyLogo size={campaignSizes.dialogLogo} />
          </View>
        </View>
        <View style={[styles.content, { paddingBottom: isExpanded ? spacing.xl : insets.bottom + spacing.lg2 }]}>
          <ThemedText variant="title" accessibilityRole="header" style={styles.centredText}>
            {campaign.title}
          </ThemedText>
          {campaign.body.length > ValueConstants.zero ? (
            <ThemedText variant="body" numberOfLines={BODY_LINES} style={[styles.body, styles.centredText, { color: colors.textSubtle }]}>
              {campaign.body}
            </ThemedText>
          ) : null}
          <View style={styles.actions}>
            {campaign.ctaLabel !== null ? <PrimaryButton label={campaign.ctaLabel} onPress={onCta} /> : null}
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t.launchCampaign.notNow} style={styles.notNow}>
              <ThemedText variant="body" style={styles.notNowLabel}>
                {t.launchCampaign.notNow}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { zIndex: zIndices.launchCampaign },
  bottom: { justifyContent: 'flex-end' },
  centred: { justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card: { overflow: 'hidden', width: '100%' },
  cardBottom: { borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl },
  cardCentred: { borderRadius: radii.xl, maxWidth: campaignSizes.dialogMaxWidth },
  hero: { height: campaignSizes.heroHeight, overflow: 'hidden' },
  close: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: controlSizes.touchTarget,
    height: controlSizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDisc: {
    width: campaignSizes.closeDisc,
    height: campaignSizes.closeDisc,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markWrap: {
    position: 'absolute',
    top: campaignSizes.heroHeight - campaignSizes.dialogMarkWrap / ValueConstants.two,
    alignSelf: 'center',
    width: campaignSizes.dialogMarkWrap,
    height: campaignSizes.dialogMarkWrap,
    borderRadius: radii.xxl,
    borderWidth: campaignSizes.dialogMarkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markTile: {
    width: campaignSizes.dialogMarkTile,
    height: campaignSizes.dialogMarkTile,
    borderRadius: radii.xl,
    backgroundColor: BrandColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingTop: campaignSizes.dialogContentTop, paddingHorizontal: spacing.lg2, alignItems: 'center' },
  centredText: { textAlign: 'center' },
  body: { marginTop: spacing.sm, marginBottom: spacing.lg2 },
  actions: { alignSelf: 'stretch', gap: spacing.xs },
  notNow: { minHeight: controlSizes.touchTarget, alignItems: 'center', justifyContent: 'center' },
  notNowLabel: { fontWeight: fontWeights.semibold, textAlign: 'center' },
});
