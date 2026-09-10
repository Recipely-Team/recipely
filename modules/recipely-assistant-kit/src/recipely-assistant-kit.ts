import { requireNativeModule } from 'expo';
import type { OsAssistantCredentials } from './os-assistant-credentials';
import type { OsEntityEntry } from './os-entity-entry';
import type { OsIntentInvocation } from './os-intent-invocation';
import type { OsInvocationListenerType } from './os-invocation-listener-type';

const INVOCATION_EVENT = 'onInvocation';

interface NativeModuleShape {
  readonly isAvailable: boolean;
  getPendingInvocationsAsync(): Promise<OsIntentInvocation[]>;
  removePendingInvocationAsync(invocationId: string): Promise<void>;
  clearPendingInvocationsAsync(): Promise<void>;
  setEntityCatalogAsync(kind: string, entries: OsEntityEntry[]): Promise<void>;
  refreshShortcutsAsync(): Promise<void>;
  setCredentialsAsync(credentials: OsAssistantCredentials): Promise<void>;
  addListener(
    event: string,
    listener: OsInvocationListenerType,
  ): { remove(): void };
}

/**
 * The native half: talks to `RecipelyAssistantKitModule` on iOS and Android.
 *
 * @remarks
 * - **Why a queue and not only an event.** An intent usually fires while the
 *   app is not running, so by the time JavaScript exists the invocation has
 *   already happened. The native side writes it to the shared container and
 *   this half drains it on launch; the event is only for the case where the
 *   app was already open.
 * - **The queue is drained explicitly, not on read.** `getPendingInvocationsAsync`
 *   leaves entries in place and the caller removes each one once it has
 *   actually been dispatched, because a read that consumed the queue would lose
 *   the request whenever the app was killed between the read and the dispatch.
 * - **Not everything here has a caller yet.** `clearPendingInvocationsAsync`
 *   and `setCredentialsAsync` are groundwork for the headless entry, which
 *   waits on a backend endpoint; they are on the module because the module is
 *   the thing that has to ship in a build, and a native surface added later is
 *   a release rather than a deploy.
 * - **This surface deliberately mirrors `expo-app-intents`.** That module is
 *   iOS-only and still canary-published, so it cannot be depended on today; the
 *   names match so its iOS half can replace this one later without touching a
 *   call site.
 */
const native = requireNativeModule<NativeModuleShape>('RecipelyAssistantKit');

export const isAvailable = native.isAvailable;

export async function getPendingInvocationsAsync(): Promise<OsIntentInvocation[]> {
  return native.getPendingInvocationsAsync();
}

export async function removePendingInvocationAsync(invocationId: string): Promise<void> {
  return native.removePendingInvocationAsync(invocationId);
}

export async function clearPendingInvocationsAsync(): Promise<void> {
  return native.clearPendingInvocationsAsync();
}

export function addInvocationListener(listener: OsInvocationListenerType): () => void {
  const subscription = native.addListener(INVOCATION_EVENT, listener);
  return () => subscription.remove();
}

export async function setEntityCatalogAsync(
  kind: string,
  entries: OsEntityEntry[],
): Promise<void> {
  return native.setEntityCatalogAsync(kind, entries);
}

export async function refreshShortcutsAsync(): Promise<void> {
  return native.refreshShortcutsAsync();
}

export async function setCredentialsAsync(credentials: OsAssistantCredentials): Promise<void> {
  return native.setCredentialsAsync(credentials);
}
