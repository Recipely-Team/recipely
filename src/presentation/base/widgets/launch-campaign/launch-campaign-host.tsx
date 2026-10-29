import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useRouter, usePathname, type Href } from 'expo-router';
import { useStore } from 'zustand';
import { LaunchCampaignStatus } from '@application/campaigns/launch-campaign-status';
import { AppVersionStatus } from '@application/app-version/app-version-status';
import { CampaignVariant } from '@domain/campaigns/campaign-variant';
import { UrlConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants/route-paths';
import { resolveRedirect } from '@presentation/navigation/resolve-redirect';
import { BrandSplashPhase, useBrandSplashPhase } from '@presentation/base/hooks/lifecycle/use-brand-splash-phase';
import { CampaignSplash } from '@presentation/base/widgets/launch-campaign/campaign-splash';
import { CampaignDialog } from '@presentation/base/widgets/launch-campaign/campaign-dialog';

/**
 * Root-layout chrome for the launch campaign: decides whether this launch shows one, and when.
 *
 * @remarks
 * - **Only over the recipes feed.** Never over onboarding, sign-in or any other screen, and never
 *   while the update gate or the update sheet is up — one prompt at a time, the update first.
 * - **The splash variant only at launch.** It must be in place under the brand splash before that
 *   one starts to fade; a campaign picked too late waits for the next launch, still unseen.
 * - **The dialog variant waits for the brand splash to be gone**, then shows on the feed.
 * - **A hidden campaign is not a seen one.** Only a dismissal (any way out, the CTA included) is remembered.
 */
export const LaunchCampaignHost = (): React.JSX.Element | null => {
  const router = useRouter();
  const pathname = usePathname();
  const phase = useBrandSplashPhase();
  const { launchCampaignStore, appVersionStore } = useStores();
  const state = useStore(launchCampaignStore, (s) => s.state);
  const versionStatus = useStore(appVersionStore, (s) => s.state.status);
  const [hasSplashStarted, setSplashStarted] = useState(false);

  useEffect(() => {
    void launchCampaignStore.getState().prepare();
  }, [launchCampaignStore]);

  const isOnFeed = pathname === RoutePaths.recipes;
  const isUpdatePending = versionStatus === AppVersionStatus.UpdateRequired || versionStatus === AppVersionStatus.UpdateAvailable;
  const campaign = state.status === LaunchCampaignStatus.Ready ? state.campaign : null;
  const canShowSplash =
    campaign?.variant === CampaignVariant.Splash && isOnFeed && !isUpdatePending && (hasSplashStarted || phase === BrandSplashPhase.Covering);

  if (campaign === null || !isOnFeed || isUpdatePending) return null;

  const dismiss = (): void => {
    void launchCampaignStore.getState().dismiss();
  };
  const followCta = (): void => {
    dismiss();
    const link = campaign.ctaLink;
    if (link === null) return;
    if (link.startsWith(UrlConstants.httpsScheme)) void Linking.openURL(link).catch(() => undefined);
    else router.push(resolveRedirect(link) as Href);
  };

  if (canShowSplash) {
    return (
      <CampaignSplash
        campaign={campaign}
        isCovered={phase !== BrandSplashPhase.Gone}
        onShown={() => setSplashStarted(true)}
        onClose={dismiss}
        onCta={followCta}
      />
    );
  }
  if (campaign.variant === CampaignVariant.Dialog && phase === BrandSplashPhase.Gone) {
    return <CampaignDialog campaign={campaign} onClose={dismiss} onCta={followCta} />;
  }
  return null;
};
