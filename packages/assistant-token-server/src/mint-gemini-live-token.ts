import { fail, ok } from '@live-assistant/core';
import type { Result } from '@live-assistant/core';
import { buildLiveSetup } from './build-live-setup';
import { GeminiEndpoints } from './gemini-endpoints';
import type { MintGeminiLiveTokenOptions } from './mint-gemini-live-token-options';
import type { MintedGeminiToken } from './minted-gemini-token';
import type { TokenFailure } from './token-failure';
import { TokenFailureCode } from './token-failure-code';

const SESSION_LIFETIME_MS = 30 * 60 * 1000;
const START_WINDOW_MS = 60 * 1000;
const REQUEST_TIMEOUT_MS = 10_000;
const SINGLE_USE = 1;
const DETAIL_CHARS = 500;

function readTokenName(payload: string): string | null {
  try {
    const parsed: unknown = JSON.parse(payload);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const name = (parsed as { name?: unknown }).name;
    return typeof name === 'string' && name.length > 0 ? name : null;
  } catch {
    return null;
  }
}

/**
 * Mints a single-use Gemini Live token — call it from your own endpoint, after
 * your own auth and quota checks, and return the result to the client's
 * `getConnection`.
 *
 * @remarks
 * - **Two lifetimes, two jobs.** `expireTime` bounds the SESSION;
 *   `newSessionExpireTime` bounds how long the client has to START one, which
 *   is what makes a leaked token worthless a minute later.
 * - **Never throws.** A Gemini outage is a `TokenFailure` your endpoint turns
 *   into its own status code; `detail` carries Google's message for your logs.
 */
export async function mintGeminiLiveToken(
  options: MintGeminiLiveTokenOptions,
): Promise<Result<MintedGeminiToken, TokenFailure>> {
  const now = options.now?.() ?? Date.now();
  const expiresAt = new Date(now + (options.sessionLifetimeMs ?? SESSION_LIFETIME_MS)).toISOString();
  const body = {
    uses: SINGLE_USE,
    expireTime: expiresAt,
    newSessionExpireTime: new Date(now + (options.startWindowMs ?? START_WINDOW_MS)).toISOString(),
    bidiGenerateContentSetup: buildLiveSetup(options),
  };

  let response: Response;
  try {
    response = await (options.fetch ?? fetch)(`${GeminiEndpoints.mint}?key=${options.apiKey}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeoutMs ?? REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    return fail({ code: TokenFailureCode.Unreachable, ...(error instanceof Error ? { detail: error.message } : {}) });
  }

  const text = await response.text();
  if (!response.ok) {
    return fail({ code: TokenFailureCode.Rejected, status: response.status, detail: text.slice(0, DETAIL_CHARS) });
  }

  const token = readTokenName(text);
  if (token === null) return fail({ code: TokenFailureCode.Malformed, detail: text.slice(0, DETAIL_CHARS) });

  return ok({ token, model: options.model, wsUrl: GeminiEndpoints.liveSocket, expiresAt });
}
