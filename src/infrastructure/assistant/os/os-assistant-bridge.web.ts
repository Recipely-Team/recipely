import type { OsAssistantInterface } from '@domain/assistant/os/os-assistant-interface';
import type { OsIntentInvocation } from '@domain/assistant/os/os-intent-invocation';
import type { OsRecipeHandle } from '@domain/assistant/os/os-recipe-handle';

/**
 * The web half: there is no operating-system assistant to answer to.
 *
 * This exists so the web bundle never reaches the native module at all — not
 * even through a platform-resolved re-export — and so no call site has to ask
 * which platform it is on. `isAvailable` is the one question callers need.
 */
export class OsAssistantBridge implements OsAssistantInterface {
  readonly isAvailable = false;

  async pendingInvocations(): Promise<OsIntentInvocation[]> {
    return [];
  }

  async acknowledge(_invocationId: string): Promise<void> {
    return undefined;
  }

  subscribe(_listener: (invocation: OsIntentInvocation) => void): () => void {
    return () => undefined;
  }

  async publishRecipes(_recipes: readonly OsRecipeHandle[]): Promise<void> {
    return undefined;
  }

  async publishCredentials(_token: string | null, _languageCode: string): Promise<void> {
    return undefined;
  }
}
