import {
  ConflictFailure,
  ForbiddenFailure,
  NetworkFailure,
  NotFoundFailure,
  RateLimitFailure,
  ServerFailure,
  TimeoutFailure,
  UnauthorizedFailure,
  UnknownFailure,
  ValidationFailure,
} from '@core/failure';

describe('Failure hierarchy — stable codes', () => {
  it('each subtype exposes its stable machine code', () => {
    expect(new NetworkFailure().code).toBe('network');
    expect(new TimeoutFailure().code).toBe('timeout');
    expect(new UnauthorizedFailure().code).toBe('unauthorized');
    expect(new ForbiddenFailure().code).toBe('forbidden');
    expect(new NotFoundFailure().code).toBe('not_found');
    expect(new ValidationFailure('x').code).toBe('validation');
    expect(new ConflictFailure().code).toBe('conflict');
    expect(new RateLimitFailure().code).toBe('rate_limit');
    expect(new ServerFailure().code).toBe('server');
    expect(new UnknownFailure().code).toBe('unknown');
  });

  it('carries optional structured detail', () => {
    expect(new ConflictFailure('Taken', 'email').field).toBe('email');
    expect(new RateLimitFailure('Slow', 30).retryAfterSeconds).toBe(30);
    expect(new ServerFailure('Down', 503).status).toBe(503);
    expect(new ValidationFailure('Bad', 'servings').field).toBe('servings');
  });

  it('provides sensible default messages', () => {
    expect(new TimeoutFailure().message.length).toBeGreaterThan(0);
    expect(new ForbiddenFailure().message.length).toBeGreaterThan(0);
  });
});

describe('Failure.messageKey — stable server-side error key', () => {
  it('is undefined for a client-raised failure that was given no key', () => {
    // Domain validation, storage and transport failures never have a server
    // envelope to read a key from — every consumer must tolerate undefined.
    expect(new ValidationFailure('Recipe name must be non-empty', 'name').messageKey).toBeUndefined();
    expect(new NetworkFailure().messageKey).toBeUndefined();
    expect(new TimeoutFailure().messageKey).toBeUndefined();
    expect(new UnknownFailure().messageKey).toBeUndefined();
  });

  it('is carried by every subtype the backend error envelope can produce', () => {
    expect(new ValidationFailure('Bad', 'prompt', 'errors.validation.prompt_required').messageKey)
      .toBe('errors.validation.prompt_required');
    expect(new UnauthorizedFailure('Nope', 'errors.unauthorized.invalid_token').messageKey)
      .toBe('errors.unauthorized.invalid_token');
    expect(new ForbiddenFailure('Nope', 'errors.forbidden.not_owner').messageKey)
      .toBe('errors.forbidden.not_owner');
    expect(new NotFoundFailure('Gone', 'errors.not_found.recipe').messageKey)
      .toBe('errors.not_found.recipe');
    expect(new ConflictFailure('Taken', 'email', 'errors.conflict.email_exists').messageKey)
      .toBe('errors.conflict.email_exists');
    expect(new RateLimitFailure('Slow', 30, 'errors.too_many_requests.ai_cooldown').messageKey)
      .toBe('errors.too_many_requests.ai_cooldown');
    expect(new ServerFailure('Down', 500, 'errors.internal.unexpected').messageKey)
      .toBe('errors.internal.unexpected');
    expect(new UnknownFailure('Huh', undefined, 'errors.internal.unexpected').messageKey)
      .toBe('errors.internal.unexpected');
  });

  it('keeps the pre-existing structured detail intact alongside the key', () => {
    // The key is a trailing addition: no argument moved, so `field` /
    // `retryAfterSeconds` / `status` / `cause` still land where they always did.
    const conflict = new ConflictFailure('Taken', 'email', 'errors.conflict.email_exists');
    expect(conflict.field).toBe('email');
    expect(conflict.message).toBe('Taken');

    const rateLimit = new RateLimitFailure('Slow', 30, 'errors.too_many_requests.ai_cooldown');
    expect(rateLimit.retryAfterSeconds).toBe(30);

    const cause = new Error('root');
    const unknown = new UnknownFailure('Huh', cause, 'errors.internal.unexpected');
    expect(unknown.cause).toBe(cause);
  });

  it('distinguishes two failures that share a code but not a meaning', () => {
    // The bug this field exists to fix: both are 422 -> ValidationFailure.
    const rejected = new ValidationFailure('Prompt rejected', undefined, 'errors.ai.prompt_rejected');
    const invalid = new ValidationFailure('Bad AI response', undefined, 'errors.ai.invalid_response');

    expect(rejected.code).toBe(invalid.code);
    expect(rejected.messageKey).not.toBe(invalid.messageKey);
  });
});

describe('ValidationFailure.fieldErrors', () => {
  it('treats a single-field message with no separators as one fieldless entry', () => {
    // WHY: fieldErrors parses only `message`, not the constructor's `field`
    // argument — a message with no `': '` in it never recovers a field, even
    // though the failure itself carries one via `.field`.
    const f = new ValidationFailure('Recipe id must be non-empty', 'id');

    expect(f.fieldErrors()).toEqual([{ message: 'Recipe id must be non-empty' }]);
    expect(f.field).toBe('id');
  });

  it('splits a multi-field message into per-field entries', () => {
    const f = new ValidationFailure('name: too short; category: invalid');

    expect(f.fieldErrors()).toEqual([
      { field: 'name', message: 'too short' },
      { field: 'category', message: 'invalid' },
    ]);
  });

  it('treats a segment with no field prefix as fieldless, even alongside fielded segments', () => {
    const f = new ValidationFailure('name: too short; a general problem');

    expect(f.fieldErrors()).toEqual([
      { field: 'name', message: 'too short' },
      { message: 'a general problem' },
    ]);
  });
});
