import { FakeAuthRepository } from '@application/__fixtures__/fake-auth-repository';
import { RequestRegistrationUseCase } from '@application/auth/registration/request-registration-use-case';
import { ResendRegistrationCodeUseCase } from '@application/auth/registration/resend-registration-code-use-case';
import { VerifyRegistrationUseCase } from '@application/auth/registration/verify-registration-use-case';
import { FailureCode, UnknownFailure } from '@core/failure';
import { fail } from '@core/result/result-helpers';

/** Records the address each registration call hands the repository. */
class RecordingRepository extends FakeAuthRepository {
  readonly emails: string[] = [];

  override requestRegistration(email: string, _password: string, _displayName: string) {
    this.emails.push(email);
    return Promise.resolve(fail(new UnknownFailure('recorded')));
  }

  override verifyRegistration(email: string, _code: string) {
    this.emails.push(email);
    return Promise.resolve(fail(new UnknownFailure('recorded')));
  }

  override resendRegistrationCode(email: string) {
    this.emails.push(email);
    return Promise.resolve(fail(new UnknownFailure('recorded')));
  }
}

const calls = [
  ['RequestRegistrationUseCase', (repo: RecordingRepository, email: string) => new RequestRegistrationUseCase(repo).execute(email, 'password1', 'U')],
  ['VerifyRegistrationUseCase', (repo: RecordingRepository, email: string) => new VerifyRegistrationUseCase(repo).execute(email, '123456')],
  ['ResendRegistrationCodeUseCase', (repo: RecordingRepository, email: string) => new ResendRegistrationCodeUseCase(repo).execute(email)],
] as const;

describe.each(calls)('%s e-mail handling', (_name, run) => {
  it('trims the address before it reaches the repository', async () => {
    const repo = new RecordingRepository();

    await run(repo, ' u@example.com ');

    expect(repo.emails).toEqual(['u@example.com']);
  });

  it('fails a malformed address client-side without a request', async () => {
    const repo = new RecordingRepository();

    const result = await run(repo, 'not-an-email');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.code).toBe(FailureCode.Validation);
    expect(repo.emails).toEqual([]);
  });
});
