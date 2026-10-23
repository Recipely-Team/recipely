import type { AssistantPlayer, AssistantSession } from '@live-assistant/core';
import type { LiveSessionCredentials } from '@domain/assistant/session/live-session-credentials';

interface MeterHooks {
  /** False during teardown: frames captured then are dropped from the waveform. */
  isCapturing(): boolean;
  /** Samples that really went out or were really queued. */
  publish(samples: Float32Array<ArrayBuffer>): void;
  /** Playback was cut; the waveform drops to silence. */
  onFlush(): void;
}

/**
 * The session and player the controller drives, wrapped so the waveform sees what really moves.
 *
 * @remarks
 * - **Frames after gating.** `sendAudio` is called only for frames that pass
 *   mute and the echo gate, so the waveform follows what the model hears.
 * - **Everything else passes through** unchanged; the wrappers add metering
 *   and nothing more.
 */
export const meteredAssistantIo = (
  session: AssistantSession<LiveSessionCredentials>,
  player: AssistantPlayer,
  hooks: MeterHooks,
): { session: AssistantSession<LiveSessionCredentials>; player: AssistantPlayer } => ({
  session: {
    audioFormat: session.audioFormat,
    connect: (credentials) => session.connect(credentials),
    sendAudio: (samples) => {
      session.sendAudio(samples);
      if (hooks.isCapturing()) hooks.publish(samples);
    },
    sendText: (text) => session.sendText(text),
    respondToTool: (call, response) => session.respondToTool(call, response),
    subscribe: (listener) => session.subscribe(listener),
    close: () => session.close(),
  },
  player: {
    level: () => player.level(),
    remainingSeconds: () => player.remainingSeconds(),
    prepare: (sampleRate) => player.prepare(sampleRate),
    enqueue: (samples) => {
      player.enqueue(samples);
      hooks.publish(samples);
    },
    flush: () => {
      player.flush();
      hooks.onFlush();
    },
    stop: () => player.stop(),
  },
});
