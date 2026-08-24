import { AI_REQUEST_TIMEOUT_MS } from '@infrastructure/constants/api/api-timeouts';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import type { AssistantMessageResponseDto } from '@infrastructure/assistant/message/dtos/assistant-message-response-dto';
import type { AssistantMessengerInterface } from '@domain/assistant/session/assistant-messenger-interface';
import type { AssistantTextReply } from '@domain/assistant/session/assistant-text-reply';
import { CharConstants } from '@core/constants';
import type { Failure } from '@core/failure/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { isNonEmptyString } from '@core/guards/type-guards';
import type { Result } from '@core/result/result';

/**
 * The typed turn, over our own backend.
 *
 * One request, no socket. That is what makes it the mode the app can offer
 * when the voice budget is gone — and why it is a different class from the
 * session rather than a method on it.
 */
export class AssistantMessenger implements AssistantMessengerInterface {
  constructor(private readonly http: HttpClient) {}

  async ask(
    message: string,
    languageCode: string,
    screenContext?: string,
  ): Promise<Result<AssistantTextReply, Failure>> {
    const result = await this.http.post<AssistantMessageResponseDto>(
      ApiRoutes.assistant.message,
      {
        message,
        languageCode,
        ...(screenContext === undefined ? {} : { screenContext }),
      },
      // This is a model call, not a lookup. On the default ten seconds the
      // request was cancelled mid-answer and the screen said "that did not go
      // through" — for a question the assistant was still working on. The
      // repository already keeps the number that AI calls are allowed.
      { timeout: AI_REQUEST_TIMEOUT_MS },
    );
    if (!result.ok) return fail(result.failure);

    const name = result.value.action?.name;
    const arg = result.value.action?.arg;
    return ok({
      reply: result.value.reply ?? CharConstants.empty,
      ...(isNonEmptyString(name)
        ? { action: isNonEmptyString(arg) ? { name, arg } : { name } }
        : {}),
    });
  }
}
