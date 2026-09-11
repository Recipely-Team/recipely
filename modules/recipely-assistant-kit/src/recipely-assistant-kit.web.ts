import type { OsAssistantCredentials } from './os-assistant-credentials';
import type { OsEntityEntry } from './os-entity-entry';
import type { OsIntentInvocation } from './os-intent-invocation';
import type { OsInvocationListenerType } from './os-invocation-listener-type';

/**
 * The web half: every call is a no-op and `isAvailable` is false.
 *
 * @remarks
 * - **This file is why the web build does not crash.** A native module imported
 *   from a web bundle resolves to `undefined` and throws at the first call —
 *   the voice assistant learned that the expensive way. The pair exists so the
 *   web shell can hold the same port without a platform check at every call
 *   site.
 * - **The unsubscribe is a real function.** A caller that subscribes in an
 *   effect will unsubscribe on unmount whatever the platform, so returning
 *   nothing here would crash only on web and only on navigation.
 */
export const isAvailable = false;

export async function getPendingInvocationsAsync(): Promise<OsIntentInvocation[]> {
  return [];
}

export async function removePendingInvocationAsync(_invocationId: string): Promise<void> {
  return undefined;
}

export async function clearPendingInvocationsAsync(): Promise<void> {
  return undefined;
}

export function addInvocationListener(_listener: OsInvocationListenerType): () => void {
  return () => undefined;
}

export async function setEntityCatalogAsync(
  _kind: string,
  _entries: OsEntityEntry[],
): Promise<void> {
  return undefined;
}

export async function refreshShortcutsAsync(): Promise<void> {
  return undefined;
}

export async function setCredentialsAsync(_credentials: OsAssistantCredentials): Promise<void> {
  return undefined;
}
