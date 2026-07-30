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

/**
 * The session an alarm needs: exclusive focus, audible through the silent switch.
 *
 * `shouldPlayInBackground` is false because the app has no background-audio
 * capability to back it — App Review rejects that entitlement without a feature
 * that plays audible content while backgrounded (CLAUDE.md §23c), so neither
 * platform is configured for it. Asking the session for background playback
 * anyway would claim something the build cannot do. An alarm that comes due
 * while the app is backgrounded is delivered by the local notification
 * `NotificationService` schedules alongside the timer, not by this player.
 */
const ALARM_AUDIO_MODE: Partial<AudioMode> = {
  allowsRecording: false,
  shouldPlayInBackground: false,
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
/**
 * How many times a loaded-but-silent player is nudged back into `play()`.
 * Capped so a source that can never play (lost route, unusable asset) cannot
 * turn the status stream into a hot loop for as long as the overlay is up.
 */
const MAX_PLAY_ATTEMPTS = 3;

export class AlarmAudioService implements IAlarmAudioService {
  private player: AudioPlayer | null = null;
  private statusSubscription: { remove: () => void } | null = null;
  /** True once the alarm session is in force and still has to be handed back. */
  private holdsAlarmSession = false;
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
      this.holdsAlarmSession = true;
      // Left active on stop: `false` disables the audio subsystem app-wide, so
      // handing back the exclusive mode is what releases other apps, not this.
      await setIsAudioActiveAsync(true);
    } catch {
      // Keep going with the session the app already has.
    }

    if (generation !== this.generation) {
      // Dismissed while the session was being configured: hand the exclusive
      // mode back here, because `stop()` already ran and saw nothing to undo.
      await this.releaseSession();
      return;
    }

    try {
      const player = createAudioPlayer(ALARM_SOURCE);
      player.loop = true;
      player.volume = ValueConstants.one;
      player.play();

      // The source loads asynchronously, so the `play()` above can land before
      // there is anything to play — on iOS that is silence, with no error and
      // no retry. Re-issue play as soon as the player reports itself loaded.
      let attempts = ValueConstants.zero;
      this.statusSubscription = player.addListener(
        'playbackStatusUpdate',
        (status: AudioStatus) => {
          if (generation !== this.generation) return;
          if (!status.isLoaded || status.playing) return;
          if (attempts >= MAX_PLAY_ATTEMPTS) return;
          attempts += ValueConstants.one;
          player.play();
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
    this.player = null;

    if (player !== null) {
      try {
        player.pause();
        player.remove();
      } catch {
        // Best-effort cleanup.
      }
    }

    // Runs even when there was no player: a dismiss can land while `start()` is
    // still awaiting the session, and the exclusive mode it already applied
    // would otherwise keep every other app's audio paused indefinitely.
    await this.releaseSession();
  }

  /** Hands the exclusive audio mode back, if this service still holds it. */
  private async releaseSession(): Promise<void> {
    if (!this.holdsAlarmSession) return;
    this.holdsAlarmSession = false;
    try {
      await setAudioModeAsync(IDLE_AUDIO_MODE);
    } catch {
      // The session is the OS's problem from here.
    }
  }
}
