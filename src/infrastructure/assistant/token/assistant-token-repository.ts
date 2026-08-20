import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import type { AssistantHeartbeatResponseDto } from '@infrastructure/assistant/token/dtos/assistant-heartbeat-response-dto';
import type { AssistantSessionGrantType } from '@domain/assistant/session/assistant-session-grant';
import type { AssistantSessionResponseDto } from '@infrastructure/assistant/token/dtos/assistant-session-response-dto';
import type { AssistantTokenRepositoryInterface } from '@domain/assistant/session/assistant-token-repository-interface';
import type { Failure } from '@core/failure/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { Result } from '@core/result/result';
import { toAssistantSessionGrant } from '@infrastructure/assistant/token/assistant-session-mapper';
import { ValueConstants } from '@core/constants';

/**
 * Talks to our own backend about voice sessions — never to Google.
 *
 * The device holds no API key: it asks here, gets a single-use credential
 * already constrained to one model and one configuration, and opens the socket
 * to Google with that. The heartbeat is the other half — the server cannot see
 * how long a WebSocket it is not part of has been open, so the budget is only
 * real while the client keeps reporting.
 */
export class AssistantTokenRepository implements AssistantTokenRepositoryInterface {
  constructor(private readonly http: HttpClient) {}

  async mintSession(
    languageCode: string,
    resumptionHandle?: string,
  ): Promise<Result<AssistantSessionGrantType, Failure>> {
    const result = await this.http.post<AssistantSessionResponseDto>(ApiRoutes.assistant.session, {
      languageCode,
      ...(resumptionHandle === undefined ? {} : { resumptionHandle }),
    });
    if (!result.ok) return fail(result.failure);

    return ok(toAssistantSessionGrant(result.value));
  }

  async reportUsage(seconds: number): Promise<Result<number, Failure>> {
    const result = await this.http.post<AssistantHeartbeatResponseDto>(
      ApiRoutes.assistant.heartbeat,
      { seconds },
    );
    if (!result.ok) return fail(result.failure);

    return ok(result.value.budgetRemainingSec ?? ValueConstants.zero);
  }
}
