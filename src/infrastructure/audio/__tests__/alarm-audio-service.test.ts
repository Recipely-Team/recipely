/**
 * Contract test for `AlarmAudioService`. It must conform to the
 * `IAlarmAudioService` port, be a no-op on web, and on native start a single
 * looping player (idempotent while already playing) and release it on stop.
 * `expo-audio` is mocked so no real audio subsystem is touched.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

jest.mock('expo-audio', () => {
  const player = {
    loop: false,
    volume: 0,
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
  };
  return {
    __player: player,
    setAudioModeAsync: jest.fn((): Promise<void> => Promise.resolve()),
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
  };
  setAudioModeAsync: jest.Mock;
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
  });
});
