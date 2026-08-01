/**
 * `getAlarmAudioService` accessor tests: it must return the container-registered
 * service when the composition root wired one, and fall back to the inert no-op
 * service (never throw) when nothing is registered.
 */
import { container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import { getAlarmAudioService } from '@application/audio/get-alarm-audio-service';
import { noopAlarmAudioService } from '@application/audio/noop-alarm-audio-service';
import { FakeAlarmAudioService } from '@application/__fixtures__/fake-alarm-audio-service';

describe('getAlarmAudioService', () => {
  beforeEach(() => {
    container.reset();
  });

  it('returns the container-registered service when one is registered', () => {
    const fake = new FakeAlarmAudioService();
    container.register(TOKENS.AlarmAudioService, () => fake);

    const resolved = getAlarmAudioService();

    expect(resolved).toBe(fake);
  });

  it('returns the no-op service when the container has no registration', () => {
    expect(container.has(TOKENS.AlarmAudioService)).toBe(false);

    const resolved = getAlarmAudioService();

    expect(resolved).toBe(noopAlarmAudioService);
  });

  it('falls back to a service whose start and stop are inert', async () => {
    const service = getAlarmAudioService();

    await expect(service.start()).resolves.toBeUndefined();
    await expect(service.stop()).resolves.toBeUndefined();
  });
});
