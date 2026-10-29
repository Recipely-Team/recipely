import { useEffect, useEffectEvent } from 'react';
import { Animated, BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LaunchCampaign } from '@domain/campaigns/launch-campaign';
import { CAMPAIGN_GRADIENT as GRADIENT, CampaignArtFrame, RISE_DELAYS } from '@presentation/base/widgets/launch-campaign/launch-campaign-geometry';
import { CampaignArtLayer } from '@presentation/base/widgets/launch-campaign/campaign-art';
import { CountdownRing } from '@presentation/base/widgets/launch-campaign/countdown-ring';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useReduceMotion } from '@presentation/base/hooks/accessibility/use-reduce-motion';
import { useRiseIn } from '@presentation/base/hooks/lifecycle/use-rise-in';
import { campaignInk } from '@presentation/base/utils/campaign-ink';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { BrandColors, controlSizes, durations, fontWeights, letterSpacings, radii, spacing, zIndices } from '@presentation/base/theme';
import { campaignSizes } from '@presentation/base/widgets/launch-campaign/launch-campaign-sizes';
import { useTranslations } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';


export interface CampaignSplashProps {
  campaign: LaunchCampaign;
  /** `true` while the brand splash still covers this one: the countdown waits for it to go. */
  isCovered: boolean;
  /** Once, on mount: from here on it stays up through the brand splash's fade. */
  onShown: () => void;
  onClose: () => void;
  onCta: () => void;
}

/**
 * The branded campaign moment: the same app tile as the brand splash, on the campaign's
 * gradient and art, with its title, an optional CTA and a Skip that counts down.
 *
 * @remarks
 * - **It sits under the brand splash**, which fades to reveal it — no extra screen, no jump.
 * - **Auto-closes after `durations.campaignCountdown`**, counted from when it is uncovered;
 *   with reduced motion nothing rises, the ring stays full and only Skip or the CTA close it.
 * - **Android back skips it.**
 */
export const CampaignSplash = ({ campaign, isCovered, onShown, onClose, onCta }: CampaignSplashProps): React.JSX.Element => {
  const t = useTranslations();
  const insets = useSafeAreaInsets();
  const shouldReduceMotion = useReduceMotion();
  const tile = useRiseIn(RISE_DELAYS.tile, durations.campaignRise, campaignSizes.riseOffset, shouldReduceMotion);
  const title = useRiseIn(RISE_DELAYS.title, durations.campaignRise, campaignSizes.riseOffset, shouldReduceMotion);
  const subtitle = useRiseIn(RISE_DELAYS.subtitle, durations.campaignRise, campaignSizes.riseOffset, shouldReduceMotion);
  const ink = campaignInk(campaign.colorStart, campaign.colorEnd);

  const announceShown = useEffectEvent(onShown);
  useEffect(() => {
    announceShown();
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose]);

  return (
    <View accessibilityViewIsModal accessibilityLabel={campaign.title} style={[StyleSheet.absoluteFill, styles.root]}>
      <LinearGradient colors={[campaign.colorStart, campaign.colorEnd]} start={GRADIENT.start} end={GRADIENT.end} style={StyleSheet.absoluteFill} />
      <CampaignArtLayer art={campaign.art} frame={CampaignArtFrame.Splash} />
      <View style={[styles.skipRow, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t.launchCampaign.skip} style={styles.skip}>
          <ThemedText variant="body" style={styles.skipLabel}>
            {t.launchCampaign.skip}
          </ThemedText>
          <CountdownRing durationMs={isCovered || shouldReduceMotion ? null : durations.campaignCountdown} onDone={onClose} />
        </Pressable>
      </View>
      <View style={styles.centre}>
        <Animated.View style={[styles.tile, shadows.lg, tile]}>
          <RecipelyLogo size={campaignSizes.splashLogo} />
        </Animated.View>
        <Animated.View style={title}>
          <ThemedText variant="headline" accessibilityRole="header" style={styles.title}>
            {campaign.title}
          </ThemedText>
        </Animated.View>
        {campaign.body.length > ValueConstants.zero ? (
          <Animated.View style={subtitle}>
            <ThemedText variant="body" style={styles.subtitle}>
              {campaign.body}
            </ThemedText>
          </Animated.View>
        ) : null}
      </View>
      {campaign.ctaLabel !== null ? (
        <View style={[styles.ctaRow, { paddingBottom: insets.bottom + spacing.xl }]}>
          <Pressable onPress={onCta} accessibilityRole="button" accessibilityLabel={campaign.ctaLabel} style={[styles.cta, shadows.md]}>
            <ThemedText variant="body" style={[styles.ctaLabel, { color: ink }]}>
              {campaign.ctaLabel}
            </ThemedText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { zIndex: zIndices.launchCampaign, overflow: 'hidden' },
  skipRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.md },
  skip: {
    minHeight: controlSizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
  },
  skipLabel: { color: BrandColors.white, fontWeight: fontWeights.semibold },
  centre: { flex: ValueConstants.one, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  tile: {
    width: campaignSizes.splashTile,
    height: campaignSizes.splashTile,
    borderRadius: radii.xxxl,
    backgroundColor: BrandColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.xl,
    fontSize: campaignSizes.splashTitleSize,
    fontWeight: fontWeights.heavy,
    letterSpacing: letterSpacings.tighter,
    color: BrandColors.white,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    maxWidth: campaignSizes.splashSubtitleMaxWidth,
    fontWeight: fontWeights.medium,
    color: BrandColors.white,
    textAlign: 'center',
  },
  ctaRow: { paddingHorizontal: spacing.xl, alignItems: 'center' },
  cta: {
    width: '100%',
    maxWidth: campaignSizes.ctaMaxWidth,
    minHeight: campaignSizes.ctaMinHeight,
    borderRadius: radii.round,
    backgroundColor: BrandColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  ctaLabel: { fontWeight: fontWeights.bold, textAlign: 'center' },
});
