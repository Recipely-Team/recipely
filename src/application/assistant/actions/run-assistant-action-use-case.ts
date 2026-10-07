import { actionDetail } from '@application/assistant/session/assistant-transcript-lines';
import { AssistantTranscriptLineKind } from '@application/assistant/session/assistant-transcript-line-kind';
import type { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import { isAssistantAction } from '@domain/assistant/actions/is-assistant-action';
import type { AssistantTextReply } from '@domain/assistant/session/assistant-text-reply';
import { CharConstants } from '@core/constants';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Failure } from '@core/failure/failure';
import { UnknownFailure } from '@core/failure/kinds/unknown-failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';

/** The transcript line an action that ran leaves behind. */
interface ActionLine {
  readonly kind: typeof AssistantTranscriptLineKind.Action;
  readonly action: AssistantActionType;
  readonly detail?: string;
}

/**
 * **Run the action a typed answer asked for** — through the screens' registry.
 *
 * @remarks
 * - **A line only for an action the app knows**: one that ran but has no
 *   transcript name answers `null`.
 * - **An action that could not run is a failure**: the user was told it was
 *   happening, so its not happening is news.
 */
export class RunAssistantActionUseCase {
  constructor(private readonly registry: AssistantActionRegistry) {}

  async execute(action: NonNullable<AssistantTextReply['action']>): Promise<Result<ActionLine | null, Failure>> {
    const result = await this.registry.run(action.name, action.arg);
    if (!result.ok) {
      return fail(new UnknownFailure(DiagnosticMessage.assistant.actionFailed(result.error ?? CharConstants.empty)));
    }
    if (!isAssistantAction(action.name)) return ok(null);
    const detail = actionDetail(action.arg, { ...result });
    return ok({
      kind: AssistantTranscriptLineKind.Action,
      action: action.name,
      ...(detail !== undefined ? { detail } : {}),
    });
  }
}
