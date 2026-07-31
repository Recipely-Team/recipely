import type { AlarmAudioServiceInterface } from '@domain/audio/alarm-audio-service-interface';
import { ValueConstants } from '@core/constants';

/**
 * Recording test double for `AlarmAudioServiceInterface`. It plays no audio but tracks
 * how many times the alarm was started/stopped and whether it is currently
 * "playing", so tests can assert overlay start/stop wiring without the platform
 * audio subsystem.
 */
export class FakeAlarmAudioService implements AlarmAudioServiceInterface {
  startCount = ValueConstants.zero;
  stopCount = ValueConstants.zero;
  isPlaying = false;

  start(): Promise<void> {
    this.startCount += 1;
    this.isPlaying = true;
    return Promise.resolve();
  }

  stop(): Promise<void> {
    this.stopCount += 1;
    this.isPlaying = false;
    return Promise.resolve();
  }
}
