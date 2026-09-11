/**
 * The two Gemini addresses a Live token involves, each measured against the
 * live API rather than read from the documentation:
 *
 * - The resource is **`auth_tokens`**, snake_case, on **v1alpha**; the
 *   camelCase `authTokens` the docs use answers 404 with an empty body.
 * - A token opens only **`BidiGenerateContentConstrained`**. The ordinary
 *   method answers "API key not valid" (as `key=`) or "Method doesn't allow
 *   unregistered callers" (as `access_token=`).
 */
export const GeminiEndpoints = {
  mint: 'https://generativelanguage.googleapis.com/v1alpha/auth_tokens',
  liveSocket:
    'wss://generativelanguage.googleapis.com/ws/' +
    'google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained',
} as const;
