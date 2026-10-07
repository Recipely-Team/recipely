import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { AssistantMessengerInterface } from '@domain/assistant/session/assistant-messenger-interface';
import type { OsAssistantInterface } from '@domain/assistant/os/os-assistant-interface';
import type { AssistantMicrophone, AssistantPlayer, AssistantSession } from '@live-assistant/core';
import type { LiveSessionCredentials } from '@domain/assistant/session/live-session-credentials';
import type { AssistantTokenRepositoryInterface } from '@domain/assistant/session/assistant-token-repository-interface';
import { configureAssistantSessionStore } from '@application/assistant/session/assistant-session-store';
import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';

/** **Assistant composition** — the live voice session, its action registry and the OS assistant bridge. */
export const registerAssistant = (
  container: Container,
): Pick<
  ApplicationStores,
  'assistantSessionStore' | 'assistantActionRegistry' | 'osAssistant' | 'assistantTokens'
> => {
  // Created here, filled by screens: only a screen can navigate or focus a field.
  const assistantActionRegistry = new AssistantActionRegistry();
  const assistantSessionStore = configureAssistantSessionStore({
    session: container.resolve<AssistantSession<LiveSessionCredentials>>(TOKENS.AssistantSession),
    microphone: container.resolve<AssistantMicrophone>(TOKENS.AssistantMicrophone),
    player: container.resolve<AssistantPlayer>(TOKENS.AssistantPlayer),
    tokens: container.resolve<AssistantTokenRepositoryInterface>(TOKENS.AssistantTokenRepository),
    messenger: container.resolve<AssistantMessengerInterface>(TOKENS.AssistantMessenger),
    registry: assistantActionRegistry,
  });
  return {
    assistantSessionStore,
    assistantActionRegistry,
    osAssistant: container.resolve<OsAssistantInterface>(TOKENS.OsAssistant),
    assistantTokens: container.resolve<AssistantTokenRepositoryInterface>(
      TOKENS.AssistantTokenRepository,
    ),
  };
};
