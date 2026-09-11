import * as Kit from '@/modules/recipely-assistant-kit';
import { isOsReachableAction } from '@domain/assistant/os/is-os-reachable-action';
import { OsIntentId } from '@domain/assistant/os/os-intent-id';
import type { OsAssistantInterface } from '@domain/assistant/os/os-assistant-interface';
import type { OsIntentInvocation } from '@domain/assistant/os/os-intent-invocation';
import type { OsIntentIdType } from '@domain/assistant/os/os-intent-id';
import type { OsRecipeHandle } from '@domain/assistant/os/os-recipe-handle';

const ENTITY_KIND_RECIPE = 'recipe';

const OS_INTENT_IDS = new Set<string>(Object.values(OsIntentId));

const isOsIntentId = (value: string): value is OsIntentIdType => OS_INTENT_IDS.has(value);

/**
 * Adapts `recipely-assistant-kit` to the domain's port.
 *
 * @remarks
 * - **Everything unrecognised is dropped here, at the boundary.** An intent was
 *   compiled into a build that may be older or newer than this JavaScript, and
 *   "Ask Recipely" now carries whatever word the BACKEND chose, so the native
 *   side hands over bare strings. A word `isOsReachableAction` refuses, or an id
 *   this catalogue has never heard of, is discarded rather than dispatched — the
 *   registry would only answer `unknown_action`, and the user would hear the app
 *   deny something Siri had just offered them.
 * - **A dropped invocation is removed from the queue here, too.** The caller
 *   never sees it and so can never acknowledge it; left behind it would be
 *   re-read and re-dropped on every launch until sixteen newer requests pushed
 *   it out.
 */
export class OsAssistantBridge implements OsAssistantInterface {
  readonly isAvailable = Kit.isAvailable;

  async pendingInvocations(): Promise<OsIntentInvocation[]> {
    const accepted: OsIntentInvocation[] = [];
    for (const raw of await Kit.getPendingInvocationsAsync()) {
      const invocation = toInvocation(raw);
      if (invocation !== null) accepted.push(invocation);
      else await Kit.removePendingInvocationAsync(raw.invocationId).catch(() => undefined);
    }
    return accepted;
  }

  async acknowledge(invocationId: string): Promise<void> {
    await Kit.removePendingInvocationAsync(invocationId);
  }

  subscribe(listener: (invocation: OsIntentInvocation) => void): () => void {
    return Kit.addInvocationListener((raw) => {
      const invocation = toInvocation(raw);
      if (invocation !== null) listener(invocation);
    });
  }

  async publishRecipes(recipes: readonly OsRecipeHandle[]): Promise<void> {
    await Kit.setEntityCatalogAsync(ENTITY_KIND_RECIPE, [...recipes]);
    await Kit.refreshShortcutsAsync();
  }

  async publishCredentials(token: string | null, languageCode: string): Promise<void> {
    await Kit.setCredentialsAsync({ token, languageCode });
  }
}

/**
 * An ABSENT key and a null one mean the same thing here, and only one of them
 * can cross the bridge.
 *
 * The native side omits a key rather than storing a null, because `UserDefaults`
 * takes property lists and `NSNull` is not one — so an open-ended request
 * arrives with no `action` at all, and reads back as `undefined`. Compared
 * against `null` it would have been treated as an unknown word and dropped,
 * which is the flagship phrase silently doing nothing.
 */
const toInvocation = (raw: Kit.OsIntentInvocation): OsIntentInvocation | null => {
  if (!isOsIntentId(raw.id)) return null;
  const action = raw.action ?? null;
  if (action !== null && !isOsReachableAction(action)) return null;
  return {
    id: raw.id,
    invocationId: raw.invocationId,
    action,
    arg: raw.arg ?? null,
    at: raw.at,
  };
};
