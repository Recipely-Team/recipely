import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure/failure';
import { CharConstants } from '@core/constants';
import type { AssistantMessengerInterface } from '@domain/assistant/session/assistant-messenger-interface';
import type { AssistantTextReply } from '@domain/assistant/session/assistant-text-reply';

/**
 * **Ask the assistant in text** — a typed turn with no live session, over HTTP.
 *
 * @remarks
 * - **The screen line is the caller's snapshot**, read when the user sent the
 *   turn: a queued turn must not describe a screen reached since.
 * - **An empty screen line is omitted**: the backend appends it to the prompt.
 * - **The action is not run here**: the caller decides whether the answer
 *   still belongs to anything on screen first (`RunAssistantActionUseCase`).
 */
export class AskAssistantUseCase {
  constructor(private readonly messenger: AssistantMessengerInterface) {}

  execute(text: string, locale: string, screenContext: string): Promise<Result<AssistantTextReply, Failure>> {
    const context = screenContext === CharConstants.empty ? undefined : screenContext;
    return this.messenger.ask(text, locale, context);
  }
}
