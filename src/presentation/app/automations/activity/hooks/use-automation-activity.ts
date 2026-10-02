import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { CharConstants, ValueConstants } from '@core/constants';
import { DmSendStatus } from '@domain/instagram/activity/dm-send-status';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { RoutePaths } from '@presentation/base/constants';
import { useAutomationsGuard } from '@presentation/app/automations/shared/hooks/use-automations-guard';
import { SendFilter, type SendFilterType } from '@presentation/app/automations/activity/model/send-filter';
import type { UseAutomationActivityResult } from '@presentation/app/automations/activity/model/use-automation-activity-result';

/**
 * One automation's Activity (spec §4): the rule, its matched comments paged
 * on scroll, the All / Sent / Failed segment and the rule's own switch.
 *
 * @remarks
 * - **The rule rides the query** (`/automations/activity?ruleId=…`): an
 *   account page has no crawlable URL of its own (rule 23f).
 * - **No rule id, no request**: a link without one, or one opened while no
 *   Instagram account is linked, goes to Automations (`useAutomationsGuard`).
 * - **The segment filters what has loaded.** The API pages sends without a
 *   status filter, so scrolling on loads more of every kind.
 */
export const useAutomationActivity = (): UseAutomationActivityResult => {
  const router = useRouter();
  const { ruleId = CharConstants.empty } = useLocalSearchParams<{ ruleId?: string }>();
  const { automationsStore, instagramStore } = useStores();
  const opened = automationsStore((s) => s.opened);
  const sends = automationsStore((s) => s.sends);
  const isPaused = instagramStore((s) => s.connection.status === StoreStatus.Loaded && s.connection.connection.isExpired);
  const [filter, setFilter] = useState<SendFilterType>(SendFilter.All);
  const hasRule = ruleId.length > ValueConstants.zero;
  useAutomationsGuard(!hasRule);

  useEffect(() => {
    if (!hasRule) return;
    void automationsStore.getState().openRule(ruleId);
    void automationsStore.getState().loadSends(ruleId);
  }, [automationsStore, hasRule, ruleId]);

  const shown = useMemo(() => {
    const items = sends.status === StoreStatus.Loaded ? sends.items : [];
    if (filter === SendFilter.All) return items;
    return items.filter((send) => (filter === SendFilter.Sent ? send.status === DmSendStatus.Sent : send.status === DmSendStatus.Failed));
  }, [filter, sends]);

  return {
    opened,
    sends,
    shown,
    filter,
    isPaused,
    setFilter,
    onBack: () => (router.canGoBack() ? router.back() : router.replace(RoutePaths.automations)),
    onEdit: () => router.push({ pathname: RoutePaths.automationEdit, params: { ruleId } }),
    onToggle: (enabled) => {
      if (opened.status !== StoreStatus.Loaded) return;
      void automationsStore
        .getState()
        .setEnabled(opened.rule, enabled)
        .then((result) => {
          if (!result.ok) showErrorToast(result.failure);
        });
    },
    onEndReached: () => void automationsStore.getState().loadMoreSends(),
    onRetry: () => {
      if (!hasRule) return;
      void automationsStore.getState().openRule(ruleId);
      void automationsStore.getState().loadSends(ruleId);
    },
  };
};
