import {
  ConflictFailure,
  ErrorMessageKey,
  NetworkFailure,
  UnauthorizedFailure,
  ValidationFailure,
} from '@core/failure';
import { authFormMessage } from '@presentation/base/errors/auth-form-message';
import { en } from '@presentation/i18n/locales/en';

describe('authFormMessage', () => {
  it('uses the contextual override for the matching failure code', () => {
    expect(
      authFormMessage(new UnauthorizedFailure(), {
        unauthorized: 'Wrong email or password',
      }),
    ).toBe('Wrong email or password');

    expect(
      authFormMessage(new ConflictFailure(), { conflict: 'Email taken' }),
    ).toBe('Email taken');
  });

  it('falls back to the class-based short copy when the code is not overridden', () => {
    expect(
      authFormMessage(new NetworkFailure(), { unauthorized: 'irrelevant' }),
    ).toBe(en.errors.network.short);

    expect(authFormMessage(new ValidationFailure('x'), {})).toBe(
      en.errors.validation.short,
    );
  });

  it('prefers the failure’s own messageKey copy over the screen’s per-code override', () => {
    // The override exists because `code` is coarse. A key is finer still: an
    // expired code and a wrong one are both `validation`, and the verify screen
    // maps that whole bucket to "invalid code" — the key says which it really was.
    const expired = new ValidationFailure(
      'The verification code has expired.',
      undefined,
      ErrorMessageKey.codeExpired,
    );

    expect(authFormMessage(expired, { validation: 'Wrong code' })).toBe(
      en.errors.codeExpired.short,
    );
  });

  it('still honours the override when the key is one we have no copy for', () => {
    const invalidToken = new UnauthorizedFailure(
      'Invalid authentication token',
      'errors.unauthorized.invalid_token',
    );

    expect(authFormMessage(invalidToken, { unauthorized: 'Wrong email or password' })).toBe(
      'Wrong email or password',
    );
  });
});
