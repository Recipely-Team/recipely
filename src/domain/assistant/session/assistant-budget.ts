import { BaseValueObject } from '@core/value-object/base-value-object';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import type { AssistantUsageReportType } from '@domain/assistant/session/assistant-usage-report';

/**
 * **Assistant budget** — the voice seconds an account has left today, as the
 * backend last reported them.
 *
 * @remarks
 * - **Unlimited is a floor, not a balance.** An unmetered account's number is
 *   never counted down, so it is neither exhausted nor ever warned about.
 * - **Exhausted at zero or below**: the live session ends there.
 * - **The warning threshold is the caller's**: it depends on the heartbeat
 *   cadence, which is a session concern, not the budget's.
 * - **A non-number is refused**: it neither ends a session nor warns.
 */
export class AssistantBudget extends BaseValueObject<number> {
  private constructor(
    remainingSeconds: number,
    private readonly unlimited: boolean,
  ) {
    super(remainingSeconds);
  }

  static create(report: AssistantUsageReportType): Result<AssistantBudget, ValidationFailure> {
    if (Number.isNaN(report.remainingSeconds)) {
      return fail(new ValidationFailure(DiagnosticMessage.assistant.budgetUnreadable));
    }
    return ok(new AssistantBudget(report.remainingSeconds, report.isUnlimited));
  }

  get remainingSeconds(): number {
    return this._value;
  }

  get isUnlimited(): boolean {
    return this.unlimited;
  }

  isExhausted(): boolean {
    return !this.unlimited && this._value <= ValueConstants.zero;
  }

  /** Low enough to say so out loud, but not yet gone. */
  needsWarning(thresholdSeconds: number): boolean {
    return !this.unlimited && !this.isExhausted() && this._value <= thresholdSeconds;
  }

  override equals(other: BaseValueObject<number>): boolean {
    return other instanceof AssistantBudget && super.equals(other) && other.unlimited === this.unlimited;
  }
}
