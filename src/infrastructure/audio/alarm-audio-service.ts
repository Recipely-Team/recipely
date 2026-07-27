import { Platform } from 'react-native';
import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioMode,
  type AudioPlayer,
  type AudioSource,
  type AudioStatus,
} from 'expo-audio';
import { ValueConstants } from '@core/constants';
import type { IAlarmAudioService } from '@domain/audio/i-alarm-audio-service';
import { ALARM_SOUND_ASSET } from '@infrastructure/constants/assets';

const ALARM_SOURCE: AudioSource = ALARM_SOUND_ASSET;

/** The session an alarm needs: exclusive focus, audible through the silent switch. */
const ALARM_AUDIO_MODE: Partial<AudioMode> = {
  allowsRecording: false,
  shouldPlayInBackground: true,
  playsInSilentMode: true,
  interruptionMode: 'doNotMix',
  shouldRouteThroughEarpiece: false,
};

/**
 * Restored once the alarm stops. `doNotMix` keeps every other app's audio
 * paused for as long as it is in force, so holding it after the alarm is over
 * would leave the user's music dead until the app was restarted.
 */
const IDLE_AUDIO_MODE: Partial<AudioMode> = {
  shouldPlayInBackground: false,
  interruptionMode: 'mixWithOthers',
};

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
  private statusSubscription: { remove: () => void } | null = null;
  /**
   * Bumped by every start and stop. `start()` awaits the audio session before
   * it owns a player, so a dismiss landing inside that gap used to leave the
   * player created afterwards ringing with nothing left to stop it.
   */
  private generation = ValueConstants.zero;

  async start(): Promise<void> {
    if (Platform.OS === 'web') return;
    if (this.player !== null) return;

    this.generation += ValueConstants.one;
    const generation = this.generation;

    // Configuring the session and playing the tone are separate failures. A
    // device that rejects the audio mode can still ring at whatever session the
    // app already has, and a silent alarm is the worst possible outcome — so a
    // failure here must never skip the playback below.
    try {
      await setAudioModeAsync(ALARM_AUDIO_MODE);
      await setIsAudioActiveAsync(true);
    } catch {
      // Keep going with the session the app already has.
    }

    if (generation !== this.generation) return;

    try {
      const player = createAudioPlayer(ALARM_SOURCE);
      player.loop = true;
      player.volume = ValueConstants.one;
      player.play();

      // The source loads asynchronously, so the `play()` above can land before
      // there is anything to play — on iOS that is silence, with no error and
      // no retry. Re-issue play as soon as the player reports itself loaded.
      this.statusSubscription = player.addListener(
        'playbackStatusUpdate',
        (status: AudioStatus) => {
          if (generation !== this.generation) return;
          if (status.isLoaded && !status.playing) player.play();
        },
      );

      this.player = player;
    } catch {
      // Audio subsystem unavailable — haptics remain the fallback.
    }
  }

  async stop(): Promise<void> {
    this.generation += ValueConstants.one;
    this.statusSubscription?.remove();
    this.statusSubscription = null;

    const player = this.player;
    if (player === null) return;
    this.player = null;

    try {
      player.pause();
      player.remove();
    } catch {
      // Best-effort cleanup.
    }

    try {
      await setAudioModeAsync(IDLE_AUDIO_MODE);
    } catch {
      // The session is the OS's problem from here.
    }
  }
}
