import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { AppStateStatusValue } from '@infrastructure/constants/app-state-status';
import type { OsIntentInvocation } from '@domain/assistant/os/os-intent-invocation';
import { PendingOsIntent } from '@presentation/navigation/pending-os-intent';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * Runs what Siri or a launcher shortcut asked for, once the app can answer.
 *
 * @remarks
 * - **Two roads, one destination.** An iOS App Intent runs code, so it leaves
 *   the request in the shared container and this drains a queue. An Android
 *   shortcut carries only an `Intent`, so its request arrives in the launch URL
 *   and waits in `PendingOsIntent`. Both end at the same registry, which is the
 *   one thing that knows how to run a word.
 * - **Mounted from the pill, after the global and reach hooks.** Effects inside
 *   a component run in order, so registering this last is what guarantees the
 *   fallback tier exists before the first invocation is dispatched. Called from
 *   somewhere else it would race the very handlers it needs.
 * - **Draining is single-flight, and that is a correctness rule.** Reading the
 *   queue deliberately does not empty it, and an entry is only acknowledged
 *   once its action has finished — so a second drain entering while the first
 *   awaits a handler would find the same entry and run it twice. Returning to
 *   the app from the Siri overlay, Control Centre or a permission sheet raises
 *   `active` every time, so this is the ordinary case rather than the edge.
 * - **A request is acknowledged whatever the outcome, and one failure does not
 *   strand the rest.** An unacknowledged entry is re-read and re-run on every
 *   launch, so a single bad request would otherwise become permanent; and an
 *   acknowledge that rejects at the native bridge must not abort the loop over
 *   the entries behind it.
 * - **Headless entries never arrive here.** `askRecipely` is answered natively
 *   with no screen; if it reaches JavaScript at all, something went wrong on
 *   the native side and the registry will say so.
 * - **The live subscription is groundwork.** Neither native module sends the
 *   event yet, so today every request arrives through the queue — on launch,
 *   or on the next foreground. The wiring is here so the running-app path costs
 *   nothing to switch on.
 */
export const useOsAssistantInvocations = (): void => {
  const { assistantActionRegistry: registry, osAssistant } = useStores();
  const isDraining = useRef(false);

  const dispatch = useCallback(
    async (invocation: OsIntentInvocation): Promise<void> => {
      try {
        if (invocation.action !== null) {
          await registry.run(invocation.action, invocation.arg ?? undefined);
        }
      } finally {
        // Swallowed deliberately: the bridge failing to forget a request is not
        // something a screen can act on, and letting it escape would strand
        // every entry behind this one.
        await osAssistant.acknowledge(invocation.invocationId).catch(() => undefined);
      }
    },
    [registry, osAssistant],
  );

  const drain = useCallback(async (): Promise<void> => {
    if (isDraining.current) return;
    isDraining.current = true;
    try {
      const link = PendingOsIntent.take();
      if (link !== null) {
        await registry.run(link.action, link.arg ?? undefined);
      }

      for (const invocation of await osAssistant.pendingInvocations()) {
        await dispatch(invocation);
      }
    } catch {
      // The queue could not be read. The next foreground tries again, and the
      // entries are still there because nothing acknowledged them.
    } finally {
      isDraining.current = false;
    }
  }, [registry, osAssistant, dispatch]);

  useEffect(() => {
    void drain();

    const unsubscribe = osAssistant.subscribe((invocation) => {
      void dispatch(invocation);
    });

    const onAppState = (next: AppStateStatus): void => {
      if (next === AppStateStatusValue.active) void drain();
    };
    const appStateSubscription = AppState.addEventListener('change', onAppState);

    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [drain, dispatch, osAssistant]);
};
