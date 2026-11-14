import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FailureCode } from '@core/failure';
import { ValueConstants } from '@core/constants';
import { PremiumProductIds } from '@application/subscriptions/premium-product-ids';
import type { SubscriptionProduct } from '@domain/subscriptions/subscription-product';
import { PaywallPhase } from '@presentation/app/premium/model/paywall-phase';
import { RoutePaths } from '@presentation/base/constants';
import { showSuccessToast } from '@presentation/base/feedback/show-toast';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useTranslations } from '@presentation/i18n';

/**
 * The paywall's flow: the plans, the chosen one, buying, restoring, and leaving.
 *
 * @remarks
 * - **Yearly is chosen by default**, as the design says.
 * - **No plans means no store.** On the web, or when the store does not answer,
 *   the screen says where to subscribe instead of showing a dead button.
 * - **A cancelled store sheet is silent.** The user closed it on purpose; only a
 *   real failure shows a message.
 */
export const usePaywall = () => {
  const { premiumStore } = useStores();
  const router = useRouter();
  const t = useTranslations();
  const [phase, setPhase] = useState<PaywallPhase>(PaywallPhase.Loading);
  const [plans, setPlans] = useState<readonly SubscriptionProduct[]>([]);
  const [selected, setSelected] = useState<string>(PremiumProductIds.Yearly);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void premiumStore
      .getState()
      .loadPlans()
      .then((result) => {
        if (!isCurrent) return;
        if (result.ok && result.value.length > ValueConstants.zero) {
          setPlans(result.value);
          setPhase(PaywallPhase.Ready);
        } else {
          setPhase(PaywallPhase.Unavailable);
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [premiumStore]);

  const close = (): void => {
    if (router.canGoBack()) router.back();
    else router.replace(RoutePaths.profile);
  };

  const welcome = (): void => {
    showSuccessToast(t.premium.welcome);
    close();
  };

  const purchase = async (): Promise<void> => {
    setMessage(null);
    setPhase(PaywallPhase.Purchasing);
    const result = await premiumStore.getState().purchase(selected);
    if (result.ok) {
      welcome();
      return;
    }
    setPhase(PaywallPhase.Ready);
    if (result.failure.code !== FailureCode.Cancelled) setMessage(t.premium.purchaseFailed);
  };

  const restore = async (): Promise<void> => {
    setMessage(null);
    setPhase(PaywallPhase.Restoring);
    const result = await premiumStore.getState().restore();
    setPhase(PaywallPhase.Ready);
    if (!result.ok) setMessage(t.premium.purchaseFailed);
    else if (result.value === null) setMessage(t.premium.nothingToRestore);
    else welcome();
  };

  return { phase, plans, selected, select: setSelected, purchase, restore, close, message };
};
