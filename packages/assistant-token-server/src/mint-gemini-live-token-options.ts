import type { ToolDefinition } from '@live-assistant/core';

/**
 * How the session a token opens is configured. Everything here is fixed at
 * mint time: with a token that carries a setup, whatever the client sends in
 * its own setup frame is discarded.
 */
export interface MintGeminiLiveTokenOptions {
  /** Your Gemini API key. Server-side only. */
  readonly apiKey: string;
  /** e.g. `models/gemini-live-2.5-flash-preview`. A listed model is not always callable — verify it. */
  readonly model: string;
  readonly systemInstruction?: string;
  /** The tools the model may call; the same definitions your client registers handlers for. */
  readonly tools?: readonly ToolDefinition[];
  /** A prebuilt voice such as `Aoede`. Pin one: left unset, the voice can change between sessions. */
  readonly voiceName?: string;
  /** BCP-47 with a region, e.g. `tr-TR`, `en-US`. */
  readonly languageCode?: string;
  /** Continues a session the provider handed over (`goAway`). */
  readonly resumptionHandle?: string;
  /** How long the session may run. Default 30 minutes. */
  readonly sessionLifetimeMs?: number;
  /** How long the client has to START the session; a short window keeps a leaked token worthless. Default 60 s. */
  readonly startWindowMs?: number;
  /** Default 10 s. */
  readonly timeoutMs?: number;
  /** Injected for tests; defaults to the global `fetch`. */
  readonly fetch?: typeof fetch;
  /** Injected for tests; milliseconds. */
  readonly now?: () => number;
}
