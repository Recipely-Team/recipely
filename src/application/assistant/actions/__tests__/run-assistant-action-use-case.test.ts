import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { RunAssistantActionUseCase } from '@application/assistant/actions/run-assistant-action-use-case';
import { AssistantTranscriptLineKind } from '@application/assistant/session/assistant-transcript-line-kind';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';

describe('RunAssistantActionUseCase', () => {
  it('answers the transcript line of an action that ran, named after what it produced', async () => {
    const registry = new AssistantActionRegistry();
    registry.register(AssistantAction.GenerateRecipe, async () => ({ ok: true, title: 'Menemen' }));

    const ran = await new RunAssistantActionUseCase(registry).execute({ name: AssistantAction.GenerateRecipe });

    expect(ran).toEqual({
      ok: true,
      value: { kind: AssistantTranscriptLineKind.Action, action: AssistantAction.GenerateRecipe, detail: 'Menemen' },
    });
  });

  it('fails with the handler reason when the action could not run, since the user was told it would', async () => {
    const registry = new AssistantActionRegistry();
    registry.register(AssistantAction.Save, async () => ({ ok: false, error: 'not_signed_in' }));

    const ran = await new RunAssistantActionUseCase(registry).execute({ name: AssistantAction.Save });

    expect(ran.ok).toBe(false);
    if (!ran.ok) expect(ran.failure.message).toBe(DiagnosticMessage.assistant.actionFailed('not_signed_in'));
  });
});
