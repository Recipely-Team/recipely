import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import type { AssistantHeartbeatResponseDto } from '@infrastructure/assistant/token/dtos/assistant-heartbeat-response-dto';
import type { AssistantSessionGrantType } from '@domain/assistant/session/assistant-session-grant';
import type { AssistantSessionResponseDto } from '@infrastructure/assistant/token/dtos/assistant-session-response-dto';
import type { AssistantUsageReportType } from '@domain/assistant/session/assistant-usage-report';
import type { AssistantTokenRepositoryInterface } from '@domain/assistant/session/assistant-token-repository-interface';
import type { Failure } from '@core/failure/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { Result } from '@core/result/result';
import type { AssistantIntentTokenResponseDto } from '@infrastructure/assistant/token/dtos/assistant-intent-token-response-dto';
import type { OsAssistantCredential } from '@domain/assistant/os/os-assistant-credential';
import { toOsAssistantCredential } from '@infrastructure/assistant/token/assistant-intent-token-mapper';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { UnknownFailure } from '@core/failure/kinds/unknown-failure';
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

  async reportUsage(seconds: number): Promise<Result<AssistantUsageReportType, Failure>> {
    const result = await this.http.post<AssistantHeartbeatResponseDto>(
      ApiRoutes.assistant.heartbeat,
      { seconds },
    );
    if (!result.ok) return fail(result.failure);

    return ok({
      remainingSeconds: result.value.budgetRemainingSec ?? ValueConstants.zero,
      isUnlimited: result.value.unlimited === true,
    });
  }

  async mintIntentToken(): Promise<Result<OsAssistantCredential, Failure>> {
    const result = await this.http.post<AssistantIntentTokenResponseDto>(
      ApiRoutes.assistant.intentToken,
      {},
    );
    if (!result.ok) return fail(result.failure);

    const credential = toOsAssistantCredential(result.value);
    if (credential === null) {
      return fail(new UnknownFailure(DiagnosticMessage.assistant.intentTokenUndated));
    }
    return ok(credential);
  }
}
