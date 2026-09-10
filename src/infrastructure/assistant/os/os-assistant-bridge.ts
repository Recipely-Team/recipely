import * as Kit from '@/modules/recipely-assistant-kit';
import { isAssistantAction } from '@domain/assistant/actions/is-assistant-action';
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
 *   compiled into a build that may be older or newer than this JavaScript, so
 *   the native side hands over bare strings. A word `isAssistantAction` does not
 *   know, or an id this catalogue has never heard of, is discarded rather than
 *   dispatched — the registry would only answer `unknown_action`, and the user
 *   would hear the app deny something Siri had just offered them.
 * - **A dropped invocation is still acknowledged by the caller**, or it would
 *   sit in the queue being re-read and re-dropped on every launch.
 */
export class OsAssistantBridge implements OsAssistantInterface {
  readonly isAvailable = Kit.isAvailable;

  async pendingInvocations(): Promise<OsIntentInvocation[]> {
    const raw = await Kit.getPendingInvocationsAsync();
    return raw.map(toInvocation).filter((entry): entry is OsIntentInvocation => entry !== null);
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

const toInvocation = (raw: Kit.OsIntentInvocation): OsIntentInvocation | null => {
  if (!isOsIntentId(raw.id)) return null;
  const action = raw.action;
  if (action !== null && !isAssistantAction(action)) return null;
  return {
    id: raw.id,
    invocationId: raw.invocationId,
    action,
    arg: raw.arg,
    at: raw.at,
  };
};
