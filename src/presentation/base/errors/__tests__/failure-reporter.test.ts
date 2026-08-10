/**
 * Two sinks, two questions.
 *
 * Crashlytics answers "what broke that nobody foresaw" — so it must NOT fill
 * with the failures the product handles by design, or the ones worth reading
 * are buried. Analytics answers "how often, and to whom", which is exactly
 * where a handled-but-frequent failure belongs. Every failure shown to a user
 * reaches Firebase; only the unforeseen ones reach it as a crash.
 */

import { FailureReporter } from '@presentation/base/errors/failure-reporter';
import { NetworkFailure, ServerFailure, UnknownFailure, ValidationFailure } from '@core/failure';

describe('FailureReporter', () => {
  let crashes: { error: unknown; context: string }[] = [];
  let events: { code: string; context: string }[] = [];

  beforeEach(() => {
    crashes = [];
    events = [];
    FailureReporter.setSink((error, context) => crashes.push({ error, context }));
    FailureReporter.setEventSink((code, context) => events.push({ code, context }));
  });

  afterEach(() => {
    FailureReporter.setSink(null);
    FailureReporter.setEventSink(null);
  });

  it('counts every failure it is given, whatever the code', () => {
    FailureReporter.report(new NetworkFailure('offline'), 'FeedScreen');
    FailureReporter.report(new ValidationFailure('bad email'), 'RegisterScreen');
    FailureReporter.report(new UnknownFailure('boom'), 'FeedScreen');

    expect(events.map((e) => e.code)).toEqual(['network', 'validation', 'unknown']);
    expect(events[0].context).toBe('FeedScreen');
  });

  it('reports only the unforeseen ones as crashes', () => {
    FailureReporter.report(new UnknownFailure('boom'), 'FeedScreen');
    FailureReporter.report(new ServerFailure('500'), 'FeedScreen');
    FailureReporter.report(new NetworkFailure('offline'), 'FeedScreen');
    FailureReporter.report(new ValidationFailure('bad email'), 'RegisterScreen');

    // A user on a train produces network failures by the dozen and there is
    // nothing to fix; a validation message is the product working.
    expect(crashes).toHaveLength(2);
  });

  it('strips URLs and emails out of the developer message before it leaves the device', () => {
    FailureReporter.report(
      new UnknownFailure('import failed for https://instagram.com/reel/abc by a@b.com'),
      'ImportRecipeScreen',
    );

    const message = String((crashes[0].error as Error).message);
    expect(message).not.toContain('instagram.com');
    expect(message).not.toContain('a@b.com');
    expect(message).toContain('[redacted]');
  });

  it('still counts a failure when no crash sink is set', () => {
    // Before bootstrap, and in tests. Counting must not depend on the other sink.
    FailureReporter.setSink(null);

    FailureReporter.report(new UnknownFailure('boom'), 'AppBootstrap');

    expect(events).toHaveLength(1);
  });

  it('never lets a broken sink surface as a failure of its own', () => {
    FailureReporter.setEventSink(() => {
      throw new Error('analytics is down');
    });

    expect(() => FailureReporter.report(new UnknownFailure('boom'), 'FeedScreen')).not.toThrow();
    // The crash still went out: one broken sink must not silence the other.
    expect(crashes).toHaveLength(1);
  });
});
