import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { CharConstants } from '@core/constants';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import { PremiumProductIds } from '@application/subscriptions/premium-product-ids';
import type { SubscriptionProduct } from '@domain/subscriptions/subscription-product';
import { PaywallPhase } from '@presentation/app/premium/model/paywall-phase';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';

const PLAN_BY_WORD: Readonly<Record<string, string>> = {
  monthly: PremiumProductIds.Monthly,
  month: PremiumProductIds.Monthly,
  yearly: PremiumProductIds.Yearly,
  year: PremiumProductIds.Yearly,
  annual: PremiumProductIds.Yearly,
};

interface PaywallAssistantInput {
  phase: PaywallPhase;
  plans: readonly SubscriptionProduct[];
  selected: string;
  select: (productId: string) => void;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
}

/**
 * The paywall, reachable by voice: what is on it, picking a plan, buying, restoring.
 *
 * @remarks
 * - **Only while the plans are ready.** In any other phase the actions are not
 *   offered, so the assistant says they are unavailable instead of pretending.
 * - **Prices are read from the store**, so the assistant can say them; it is told
 *   never to invent one.
 * - **Leaving is the global `goBack`**, the same as "maybe later".
 */
export const usePaywallAssistant = ({ phase, plans, selected, select, purchase, restore }: PaywallAssistantInput): void => {
  const isReady = phase === PaywallPhase.Ready;

  useAssistantScreenReading(() => {
    const prices = plans.map((plan) => `${plan.id}=${plan.displayPrice}`).join(CharConstants.comma);
    return `screen=premium phase=${phase} selected=${selected} plans=${prices}`;
  });

  useAssistantAction(
    AssistantAction.ChoosePlan,
    async (arg) => {
      const productId = PLAN_BY_WORD[(arg ?? CharConstants.empty).trim().toLowerCase()];
      if (productId === undefined) return { ok: false, error: AssistantActionError.UnknownPlan };
      select(productId);
      return { ok: true, summary: `Selected ${productId}.` };
    },
    isReady,
  );

  useAssistantAction(
    AssistantAction.Subscribe,
    async () => {
      void purchase();
      return { ok: true, summary: `Opened the store sheet for ${selected}; the user confirms the payment there.` };
    },
    isReady,
  );

  useAssistantAction(
    AssistantAction.RestorePurchases,
    async () => {
      await restore();
      return { ok: true, summary: 'Restore finished; the screen shows the outcome.' };
    },
    isReady,
  );
};
