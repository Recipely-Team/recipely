/**
 * Why an assistant operation failed, as a code an app can switch on.
 *
 * @remarks
 * Codes, not messages: the words a user reads belong to the app (its language,
 * its tone), so the package never writes them.
 */
export const AssistantFailureCode = {
  /** The session never reached "ready" within its timeout. */
  ConnectTimedOut: 'connect_timed_out',
  /** The transport reported an error while connecting. */
  SocketFailed: 'socket_failed',
  /** The transport closed before the provider accepted the session. */
  ClosedBeforeReady: 'closed_before_ready',
  /** The user refused the microphone, or the platform cannot ask. */
  MicrophoneDenied: 'microphone_denied',
  /** Capture could not start: no input device, or the platform refused to open one. */
  MicrophoneUnavailable: 'microphone_unavailable',
  /** The output graph could not be opened. */
  PlayerUnavailable: 'player_unavailable',
  /** The app's `getConnection` threw: no token, a refusal, a network error. `cause` carries what it threw. */
  ConnectionRefused: 'connection_refused',
  /** An open session dropped and could not be continued. */
  ConnectionLost: 'connection_lost',
  /** The user finished speaking and nothing came back in time. The session stays open. */
  NoAnswer: 'no_answer',
} as const;

export type AssistantFailureCodeType = (typeof AssistantFailureCode)[keyof typeof AssistantFailureCode];
