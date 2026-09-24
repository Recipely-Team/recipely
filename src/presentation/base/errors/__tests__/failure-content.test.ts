import {
  ErrorMessageKey,
  type Failure,
  NetworkFailure,
  NotFoundFailure,
  RateLimitFailure,
  ServerFailure,
  UnauthorizedFailure,
  ValidationFailure,
} from '@core/failure';
import {
  failureContent,
  failureIcon,
  failureKeyMessage,
  failureSeverity,
  failureToastMessage,
} from '@presentation/base/errors/failure-lookups';
import { en } from '@presentation/i18n/locales/en';

// The reason the key channel exists: both of these are `unprocessable` → 422 →
// ValidationFailure, and their fixes are opposite (reword vs. just retry).
const refusedPrompt = new ValidationFailure(
  'Your prompt was flagged as inappropriate.',
  undefined,
  ErrorMessageKey.aiPromptRejected,
);
const unusableResponse = new ValidationFailure(
  'The AI returned an unexpected response.',
  undefined,
  ErrorMessageKey.aiInvalidResponse,
);

describe('failure-content resolver — messageKey tier', () => {
  it('gives two failures sharing one code different copy when their keys differ', () => {
    expect(failureToastMessage(refusedPrompt)).toBe(en.errors.aiPromptRejected.short);
    expect(failureToastMessage(unusableResponse)).toBe(en.errors.aiInvalidResponse.short);
    expect(failureContent(refusedPrompt)).toEqual({
      title: en.errors.aiPromptRejected.title,
      body: en.errors.aiPromptRejected.body,
    });
    expect(failureContent(unusableResponse)).not.toEqual(failureContent(refusedPrompt));
  });

  it('derives severity and icon from the same key, not from the code', () => {
    const cooldown = new RateLimitFailure('slow down', undefined, ErrorMessageKey.aiCooldown);
    const noRecipe = new ValidationFailure(
      'No cooking recipe was found in this video.',
      undefined,
      ErrorMessageKey.importNoRecipeFound,
    );

    expect(failureSeverity(cooldown)).toBe('warning');
    expect(failureIcon(cooldown)).toBe('hourglass-outline');
    // A plain `validation` code would be danger + alert-circle; the key says the
    // truth — nothing is broken, we just found no recipe.
    expect(failureSeverity(noRecipe)).toBe('neutral');
    expect(failureIcon(noRecipe)).toBe('search-outline');
  });

  it('falls back to the code copy for a key it has no dedicated copy for', () => {
    // Purely internal keys stay generic on purpose — never scary technical copy.
    const internal = new ServerFailure('boom', 500, 'errors.internal.unexpected');
    expect(failureToastMessage(internal)).toBe(en.errors.server.short);
    expect(failureKeyMessage(internal)).toBeUndefined();

    const missingToken = new UnauthorizedFailure('Missing bearer token', 'errors.unauthorized.missing_token');
    expect(failureToastMessage(missingToken)).toBe(en.errors.unauthorized.short);
  });

  it('reports whether a failure carries copy of its own (older backend sends none)', () => {
    expect(failureKeyMessage(refusedPrompt)).toBe(en.errors.aiPromptRejected.short);
    expect(failureKeyMessage(new ValidationFailure('HTTP 400'))).toBeUndefined();
    expect(failureKeyMessage(new NetworkFailure())).toBeUndefined();
  });
});

describe('failure-content resolver — a recipe web page', () => {
  // The backend sends these two once it reads web pages. Without them in the
  // catalogue they fell back to the generic code copy, which told a user whose
  // link was simply dead that "something went wrong".
  it('says a page had no recipe on it, as the backend key asks', () => {
    const failure = new ValidationFailure('no recipe', undefined, 'errors.import.no_recipe_on_page');

    expect(failureContent(failure)).toEqual({
      title: en.errors.importNoRecipeOnPage.title,
      body: en.errors.importNoRecipeOnPage.body,
    });
    expect(failureSeverity(failure)).toBe('neutral');
  });

  it('says a page could not be opened, as the backend key asks', () => {
    const failure = new ServerFailure('unreachable', 502, 'errors.import.page_unreachable');

    expect(failureContent(failure)).toEqual({
      title: en.errors.importPageUnreachable.title,
      body: en.errors.importPageUnreachable.body,
    });
    expect(failureKeyMessage(failure)).toBe(en.errors.importPageUnreachable.short);
  });

  it('keys the wire strings through ErrorMessageKey', () => {
    expect(ErrorMessageKey.importNoRecipeOnPage).toBe('errors.import.no_recipe_on_page');
    expect(ErrorMessageKey.importPageUnreachable).toBe('errors.import.page_unreachable');
  });
});

describe('failure-content resolver', () => {
  it('selects localized title/body from the failure class (not its raw message)', () => {
    const failure = new NetworkFailure('axios ECONNREFUSED 127.0.0.1');
    expect(failureContent(failure)).toEqual({
      title: en.errors.network.title,
      body: en.errors.network.body,
    });
    expect(failureToastMessage(failure)).toBe(en.errors.network.short);
  });

  it('selects severity from the failure class', () => {
    expect(failureSeverity(new NotFoundFailure())).toBe('neutral');
    expect(failureSeverity(new RateLimitFailure())).toBe('warning');
    expect(failureSeverity(new ServerFailure())).toBe('danger');
    expect(failureSeverity(new ValidationFailure('x'))).toBe('danger');
  });

  it('falls back to the unknown copy for an unrecognized code', () => {
    const weird = { code: 'totally_new', message: 'boom' } as unknown as Failure;
    expect(failureContent(weird)).toEqual({
      title: en.errors.unknown.title,
      body: en.errors.unknown.body,
    });
    expect(failureToastMessage(weird)).toBe(en.errors.unknown.short);
  });

  it('always resolves an icon name', () => {
    expect(failureIcon(new ValidationFailure('x')).length).toBeGreaterThan(0);
    expect(failureIcon({ code: 'totally_new', message: 'x' } as unknown as Failure).length).toBeGreaterThan(0);
  });
});
