import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import type { IFeedbackRepository } from '@domain/feedback/i-feedback-repository';
import type { FeedbackSubmission } from '@domain/feedback/feedback-submission';
import { toFeedbackRequestDto } from '@infrastructure/feedback/feedback-mapper';
import { ApiRoutes } from '@infrastructure/constants/api-routes';

/**
 * Implements `IFeedbackRepository` against the Recipely backend.
 * Sends a `POST /feedback` request with the AES-encrypted envelope managed
 * by `HttpClient`. The response body is ignored on success.
 */
export class FeedbackRepository implements IFeedbackRepository {
  constructor(private readonly http: HttpClient) {}

  async submitFeedback(input: FeedbackSubmission): Promise<Result<void, Failure>> {
    const result = await this.http.request({
      method: 'POST',
      url: ApiRoutes.feedback,
      data: toFeedbackRequestDto(input),
    });

    if (!result.ok) {
      return fail(result.failure);
    }

    return ok(void 0);
  }
}
