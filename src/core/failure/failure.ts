import type { FailureCode } from '@core/failure/failure-code';
/**
 * Base of the failure hierarchy. Every failing operation resolves to a
 * `Result<T, Failure>` carrying one of these — failures are values, never
 * thrown exceptions.
 *
 * Three orthogonal pieces of information:
 * - `code` — the client-side discriminator of the subtype (`'validation'`,
 *   `'unauthorized'`, …). Coarse: many distinct server errors share one code.
 * - `message` — a human sentence, usually the server's. Safe for logs, but too
 *   coarse (and unlocalised) to be the only thing a user is shown.
 * - `messageKey` — the stable machine key from the backend error catalogue
 *   (e.g. `errors.ai.prompt_rejected`). The ONLY way to tell apart two errors
 *   that share a `code`: `errors.ai.prompt_rejected` and
 *   `errors.ai.invalid_response` are both `unprocessable` → `ValidationFailure`
 *   yet mean entirely different things to the user. Presentation should prefer
 *   it over `code` when picking copy.
 *
 * `messageKey` is `undefined` whenever no server produced one: failures the
 * client raises locally (domain validation, JWT decoding, storage), transport
 * -level failures (connection down, timeout), and responses from a backend
 * older than the error-catalogue rollout. Consumers must always tolerate
 * `undefined` and fall back to `code`.
 */
export abstract class Failure {
  abstract readonly code: FailureCode;
  abstract readonly message: string;

  /**
   * @param messageKey stable server-side error key; omitted for client-raised
   * and transport-level failures. Declared once here rather than per subtype so
   * the whole hierarchy shares a single definition.
   */
  constructor(readonly messageKey?: string) {}
}
