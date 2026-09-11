import { AssistantFailureCode, AssistantStatus, EndReason } from '@live-assistant/core';
import type { AssistantStrings } from './assistant-strings';

export const defaultStrings: AssistantStrings = {
  start: 'Start voice assistant',
  stop: 'End',
  mute: 'Mute',
  unmute: 'Unmute',
  send: 'Send',
  composerPlaceholder: 'Type a message',
  status: {
    [AssistantStatus.Idle]: 'Tap to talk',
    [AssistantStatus.Connecting]: 'Connecting…',
    [AssistantStatus.Listening]: 'Listening',
    [AssistantStatus.Thinking]: 'Thinking…',
    [AssistantStatus.Speaking]: 'Speaking',
    [AssistantStatus.Working]: 'Working on it…',
  },
  ended: {
    [EndReason.Silence]: 'Ended after a quiet spell',
  },
  errors: {
    [AssistantFailureCode.MicrophoneDenied]: 'Microphone access is off',
    [AssistantFailureCode.MicrophoneUnavailable]: 'The microphone could not start',
    [AssistantFailureCode.ConnectionRefused]: 'The assistant is not available right now',
    [AssistantFailureCode.ConnectionLost]: 'The connection dropped',
    [AssistantFailureCode.NoAnswer]: 'No answer came — try saying it again',
  },
  genericError: 'Something went wrong',
  toolRunning: (name) => `Running ${name}…`,
  toolFailed: (name) => `${name} did not work`,
};
