import { useCallback, useEffect } from 'react';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { CharConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useInstagramConnect } from '@presentation/base/hooks/instagram/use-instagram-connect';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { RoutePaths } from '@presentation/base/constants';
import { AutomationsViewKind } from '@presentation/app/automations/model/automations-view-kind';
import type { UseAutomationsResult } from '@presentation/app/automations/model/use-automations-result';

/**
 * The Automations screen (spec §2): which face to show from the Instagram
 * link, the rules paged on scroll, and the optimistic on/off switch.
 *
 * @remarks
 * - **The link and the first page reload on every focus**, so a rule saved
 *   in the editor or an expiry is there when the user comes back.
 * - **A refused switch flips back** (the store) and says why (a toast).
 */
export const useAutomations = (): UseAutomationsResult => {
  const router = useRouter();
  const { instagramStore, automationsStore } = useStores();
  const connection = instagramStore((s) => s.connection);
  const rules = automationsStore((s) => s.rules);
  const { phase, connect } = useInstagramConnect();
  const linked = connection.status === StoreStatus.Loaded ? connection.connection : null;
  const isConnected = linked?.isConnected ?? false;

  useFocusEffect(
    useCallback(() => {
      void instagramStore.getState().load();
    }, [instagramStore]),
  );
  useEffect(() => {
    if (isConnected) void automationsStore.getState().loadRules();
  }, [automationsStore, isConnected]);

  const view =
    linked === null
      ? AutomationsViewKind.Loading
      : !linked.isAvailable
        ? AutomationsViewKind.Unavailable
        : linked.isConnected
          ? AutomationsViewKind.Rules
          : AutomationsViewKind.Locked;

  return {
    view,
    rules,
    isPaused: linked?.isExpired ?? false,
    handle: linked?.displayHandle ?? CharConstants.empty,
    phase,
    connect,
    onBack: () => (router.canGoBack() ? router.back() : router.replace(RoutePaths.profile)),
    onNew: () => router.push(RoutePaths.automationEdit),
    onOpen: (rule) => router.push(RoutePaths.automationActivity(rule.id) as Href),
    onToggle: (rule, enabled) => {
      void automationsStore
        .getState()
        .setEnabled(rule, enabled)
        .then((result) => {
          if (!result.ok) showErrorToast(result.failure);
        });
    },
    onEndReached: () => void automationsStore.getState().loadMoreRules(),
    onRetry: () => void automationsStore.getState().loadRules(),
  };
};
