import { container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { AlarmAudioServiceInterface } from '@domain/audio/alarm-audio-service-interface';
import { noopAlarmAudioService } from '@application/audio/noop-alarm-audio-service';

/**
 * Resolves the alarm-audio service from the DI container, falling back to an
 * inert no-op service when none is registered (DI-less unit test mounts). This
 * keeps presentation/application code off a concrete `@infrastructure` import.
 */
export const getAlarmAudioService = (): AlarmAudioServiceInterface =>
  container.has(TOKENS.AlarmAudioService)
    ? container.resolve<AlarmAudioServiceInterface>(TOKENS.AlarmAudioService)
    : noopAlarmAudioService;
