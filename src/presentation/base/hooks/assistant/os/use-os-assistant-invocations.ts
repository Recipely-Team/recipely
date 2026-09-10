import { useCallback, useEffect } from 'react';
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
 * - **A request is acknowledged whatever the outcome.** A word that fails, or
 *   that this build no longer recognises, must still leave the queue — an
 *   unacknowledged entry is re-read and re-run on every launch, so a single
 *   bad request would become permanent.
 * - **Draining on foreground, not only on mount.** An intent can fire while the
 *   app is backgrounded and suspended, where no event of ours is delivered.
 * - **Headless entries never arrive here.** `askRecipely` is answered natively
 *   with no screen; if it reaches JavaScript at all, something went wrong on
 *   the native side and the registry will say so.
 */
export const useOsAssistantInvocations = (): void => {
  const { assistantActionRegistry: registry, osAssistant } = useStores();

  const dispatch = useCallback(
    async (invocation: OsIntentInvocation): Promise<void> => {
      try {
        if (invocation.action !== null) {
          await registry.run(invocation.action, invocation.arg ?? undefined);
        }
      } finally {
        await osAssistant.acknowledge(invocation.invocationId);
      }
    },
    [registry, osAssistant],
  );

  const drain = useCallback(async (): Promise<void> => {
    const link = PendingOsIntent.take();
    if (link !== null) {
      await registry.run(link.action, link.arg ?? undefined);
    }

    const queued = await osAssistant.pendingInvocations();
    for (const invocation of queued) {
      await dispatch(invocation);
    }
  }, [registry, osAssistant, dispatch]);

  useEffect(() => {
    void drain();

    const subscription = osAssistant.subscribe((invocation) => {
      void dispatch(invocation);
    });

    const onAppState = (next: AppStateStatus): void => {
      if (next === AppStateStatusValue.active) void drain();
    };
    const appStateSubscription = AppState.addEventListener('change', onAppState);

    return () => {
      subscription();
      appStateSubscription.remove();
    };
  }, [drain, dispatch, osAssistant]);
};
