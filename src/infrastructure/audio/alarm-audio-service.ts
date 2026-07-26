import { Platform } from 'react-native';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioSource,
} from 'expo-audio';
import { ValueConstants } from '@core/constants';
import type { IAlarmAudioService } from '@domain/audio/i-alarm-audio-service';
import { ALARM_SOUND_ASSET } from '@infrastructure/constants/assets';

const ALARM_SOURCE: AudioSource = ALARM_SOUND_ASSET;

/**
 * Plays a looping alarm tone while the timer-complete overlay is visible.
 *
 * - On iOS the tone plays through the silent switch so the alarm fires even in
 *   vibrate mode (same behaviour as the Clock app).
 * - `interruptionMode: 'doNotMix'` takes exclusive audio focus rather than
 *   ducking, so the alarm is never reduced to background volume.
 * - Every method is a no-op on web.
 */
export class AlarmAudioService implements IAlarmAudioService {
  private player: AudioPlayer | null = null;

  async start(): Promise<void> {
    if (Platform.OS === 'web') return;
    if (this.player !== null) return;

    try {
      await setAudioModeAsync({
        allowsRecording: false,
        shouldPlayInBackground: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldRouteThroughEarpiece: false,
      });

      const player = createAudioPlayer(ALARM_SOURCE);
      player.loop = true;
      player.volume = ValueConstants.one;
      player.play();

      this.player = player;
    } catch {
      // Audio subsystem unavailable — haptics remain the fallback.
    }
  }

  async stop(): Promise<void> {
    if (this.player === null) return;
    const player = this.player;
    this.player = null;
    try {
      player.pause();
      player.remove();
    } catch {
      // Best-effort cleanup.
    }
  }
}
