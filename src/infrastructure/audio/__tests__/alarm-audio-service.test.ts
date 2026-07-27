/**
 * Contract test for `AlarmAudioService`. It must conform to the
 * `IAlarmAudioService` port, be a no-op on web, and on native start a single
 * looping player (idempotent while already playing) and release it on stop.
 * `expo-audio` is mocked so no real audio subsystem is touched.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

jest.mock('expo-audio', () => {
  const subscription = { remove: jest.fn() };
  const player = {
    loop: false,
    volume: 0,
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
    addListener: jest.fn((): typeof subscription => subscription),
  };
  return {
    __player: player,
    __subscription: subscription,
    setAudioModeAsync: jest.fn((): Promise<void> => Promise.resolve()),
    setIsAudioActiveAsync: jest.fn((): Promise<void> => Promise.resolve()),
    createAudioPlayer: jest.fn((): typeof player => player),
  };
});

import { Platform } from 'react-native';
import * as ExpoAudio from 'expo-audio';
import { AlarmAudioService } from '@infrastructure/audio/alarm-audio-service';

type AudioMock = {
  __player: {
    loop: boolean;
    volume: number;
    play: jest.Mock;
    pause: jest.Mock;
    remove: jest.Mock;
    addListener: jest.Mock;
  };
  __subscription: { remove: jest.Mock };
  setAudioModeAsync: jest.Mock;
  setIsAudioActiveAsync: jest.Mock;
  createAudioPlayer: jest.Mock;
};
const audio = ExpoAudio as unknown as AudioMock;
const platform = Platform as { OS: string };
const originalOS = platform.OS;

describe('AlarmAudioService', () => {
  let service: AlarmAudioService;

  beforeEach(() => {
    jest.clearAllMocks();
    audio.__player.loop = false;
    audio.__player.volume = 0;
    service = new AlarmAudioService();
  });

  afterEach(() => {
    platform.OS = originalOS;
  });

  it('exposes the IAlarmAudioService port shape', () => {
    expect(typeof service.start).toBe('function');
    expect(typeof service.stop).toBe('function');
  });

  describe('on web', () => {
    beforeEach(() => {
      platform.OS = 'web';
    });

    it('does not touch the audio subsystem on start or stop', async () => {
      await service.start();
      await service.stop();

      expect(audio.createAudioPlayer).not.toHaveBeenCalled();
      expect(audio.setAudioModeAsync).not.toHaveBeenCalled();
    });
  });

  describe('on native', () => {
    beforeEach(() => {
      platform.OS = 'ios';
    });

    it('configures audio and creates one player on start', async () => {
      await service.start();

      expect(audio.setAudioModeAsync).toHaveBeenCalledTimes(1);
      expect(audio.createAudioPlayer).toHaveBeenCalledTimes(1);
      expect(audio.__player.play).toHaveBeenCalledTimes(1);
    });

    it('plays the alarm looping at full volume', async () => {
      await service.start();

      expect(audio.__player.loop).toBe(true);
      expect(audio.__player.volume).toBe(1);
    });

    it('takes exclusive audio focus and plays through the iOS silent switch', async () => {
      await service.start();

      expect(audio.setAudioModeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          interruptionMode: 'doNotMix',
          playsInSilentMode: true,
          shouldPlayInBackground: true,
        }),
      );
    });

    it('is idempotent while already playing', async () => {
      await service.start();
      await service.start();

      expect(audio.createAudioPlayer).toHaveBeenCalledTimes(1);
    });

    it('pauses and releases the player on stop', async () => {
      await service.start();

      await service.stop();

      expect(audio.__player.pause).toHaveBeenCalledTimes(1);
      expect(audio.__player.remove).toHaveBeenCalledTimes(1);
    });

    it('is a safe no-op when stop is called with nothing playing', async () => {
      await service.stop();

      expect(audio.__player.remove).not.toHaveBeenCalled();
    });

    it('can restart after a stop', async () => {
      await service.start();
      await service.stop();

      await service.start();

      expect(audio.createAudioPlayer).toHaveBeenCalledTimes(2);
    });

    it('activates the audio session so the tone is actually routed', async () => {
      await service.start();

      expect(audio.setIsAudioActiveAsync).toHaveBeenCalledWith(true);
    });

    /**
     * The reported bug: the alarm screen appeared with no sound. Session setup
     * and playback used to share one try block, so a device that rejected the
     * audio mode skipped the tone entirely instead of ringing with whatever
     * session it already had.
     */
    it('still plays when the audio session cannot be configured', async () => {
      audio.setAudioModeAsync.mockRejectedValueOnce(new Error('session busy'));

      await service.start();

      expect(audio.createAudioPlayer).toHaveBeenCalledTimes(1);
      expect(audio.__player.play).toHaveBeenCalledTimes(1);
    });

    /**
     * `createAudioPlayer` loads asynchronously, so the first `play()` can land
     * before there is anything to play — silence, with no error raised.
     */
    it('re-issues play once the source reports itself loaded', async () => {
      await service.start();
      const onStatus = audio.__player.addListener.mock.calls[0][1] as (s: {
        isLoaded: boolean;
        playing: boolean;
      }) => void;

      onStatus({ isLoaded: true, playing: false });

      expect(audio.__player.play).toHaveBeenCalledTimes(2);
    });

    it('does not fight the player once it is playing', async () => {
      await service.start();
      const onStatus = audio.__player.addListener.mock.calls[0][1] as (s: {
        isLoaded: boolean;
        playing: boolean;
      }) => void;

      onStatus({ isLoaded: true, playing: true });

      expect(audio.__player.play).toHaveBeenCalledTimes(1);
    });

    it('drops the status listener and releases exclusive focus on stop', async () => {
      await service.start();

      await service.stop();

      expect(audio.__subscription.remove).toHaveBeenCalledTimes(1);
      expect(audio.setAudioModeAsync).toHaveBeenLastCalledWith(
        expect.objectContaining({ interruptionMode: 'mixWithOthers' }),
      );
    });

    /**
     * Dismiss lands while `start()` is still awaiting the audio session: the
     * player created afterwards had nothing left to stop it and rang forever.
     */
    it('leaves nothing ringing when dismissed mid-start', async () => {
      let releaseSession = (): void => undefined;
      audio.setAudioModeAsync.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          releaseSession = () => {
            resolve();
          };
        }),
      );

      const starting = service.start();
      await service.stop();
      releaseSession();
      await starting;

      expect(audio.createAudioPlayer).not.toHaveBeenCalled();
      expect(audio.__player.play).not.toHaveBeenCalled();
    });
  });
});
