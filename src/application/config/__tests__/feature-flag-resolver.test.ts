import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { FeatureFlagResolver } from '@application/config/feature-flag-resolver';
import type { FeatureFlagRepositoryInterface } from '@domain/flags/feature-flag-repository-interface';

const repoOf = (...answers: Awaited<ReturnType<FeatureFlagRepositoryInterface['fetchOverrides']>>[]) => {
  const fetchOverrides = jest.fn();
  for (const answer of answers) fetchOverrides.mockResolvedValueOnce(answer);
  return { fetchOverrides };
};

// instagramAutomations is DevOnly in FeatureFlags: on in dev builds, off in production.
describe('FeatureFlagResolver', () => {
  it('lets an admin override win over the build value, both ways', async () => {
    expect(await new FeatureFlagResolver(repoOf(ok({ instagramAutomations: true })), false).isOn('instagramAutomations')).toBe(true);
    expect(await new FeatureFlagResolver(repoOf(ok({ instagramAutomations: false })), true).isOn('instagramAutomations')).toBe(false);
  });

  it('keeps the build value for a flag the admin left on default', async () => {
    expect(await new FeatureFlagResolver(repoOf(ok({})), true).isOn('instagramAutomations')).toBe(true);
    expect(await new FeatureFlagResolver(repoOf(ok({})), false).isOn('instagramAutomations')).toBe(false);
  });

  it('falls back to the build value offline and retries on the next question', async () => {
    const repo = repoOf(fail(new NetworkFailure('offline')), ok({ instagramAutomations: true }));
    const resolver = new FeatureFlagResolver(repo, false);
    expect(await resolver.isOn('instagramAutomations')).toBe(false);
    expect(await resolver.isOn('instagramAutomations')).toBe(true);
    expect(await resolver.isOn('instagramAutomations')).toBe(true);
    expect(repo.fetchOverrides).toHaveBeenCalledTimes(2);
  });
});
