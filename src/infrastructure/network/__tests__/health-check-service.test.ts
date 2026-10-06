import { HealthCheckService } from '@infrastructure/network/health-check-service';
import { HealthStatus } from '@domain/network/health-status';

describe('HealthCheckService', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it.each([
    ['an ok response', () => Promise.resolve({ ok: true }), HealthStatus.Connected],
    ['an error status', () => Promise.resolve({ ok: false }), HealthStatus.Disconnected],
    ['a network error', () => Promise.reject(new Error('offline')), HealthStatus.Disconnected],
  ])('answers %s', async (_label, fetchImpl, expected) => {
    global.fetch = jest.fn(fetchImpl) as unknown as typeof fetch;
    await expect(new HealthCheckService().check()).resolves.toBe(expected);
  });
});
