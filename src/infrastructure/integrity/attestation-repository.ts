import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import type { AxiosHttpClient } from '@infrastructure/network/http/axios-http-client';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { AttestationChallengeDto } from '@infrastructure/integrity/dtos/attestation-challenge-dto';
import type { AppleKeyRegistrationDto } from '@infrastructure/integrity/dtos/apple-key-registration-dto';

/** The backend half of App Attest key registration: a challenge, then the attested key. */
export class AttestationRepository {
  constructor(private readonly http: AxiosHttpClient) {}

  async fetchChallenge(): Promise<Result<string, Failure>> {
    const result = await this.http.get<AttestationChallengeDto>(ApiRoutes.attestation.challenge);
    if (!result.ok) return fail(result.failure);
    return ok(result.value.challenge);
  }

  async registerAppleKey(registration: AppleKeyRegistrationDto): Promise<Result<unknown, Failure>> {
    return this.http.post<unknown>(ApiRoutes.attestation.appleKey, registration);
  }
}
