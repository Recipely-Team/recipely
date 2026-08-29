import { act } from 'react-test-renderer';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { FailureReporter } from '@presentation/base/errors/failure-reporter';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { useAssistantReportActions } from '@presentation/base/hooks/assistant/actions/use-assistant-report-actions';

/**
 * A publish failed; the user said "bunu geliştiriciye bildir"; the assistant
 * told them which screen the feedback form was on. It was holding the failure,
 * the screen and the user's own sentence at that moment — everything the report
 * needed — and handed them a form to retype all three into.
 */

const submitted: { subject: string; message: string }[] = [];
let accepts = true;

function harness() {
  const registry = new AssistantActionRegistry();
  const feedbackStore = {
    getState: () => ({
      submit: async (input: { subject: string; message: string }) => {
        submitted.push(input);
        return accepts;
      },
    }),
  } as unknown as Stores['feedbackStore'];

  const Probe = (): null => {
    useAssistantReportActions();
    return null;
  };

  renderComponent(
    <StoresProvider value={{ assistantActionRegistry: registry, feedbackStore } as unknown as Stores}>
      <Probe />
    </StoresProvider>,
  );

  return registry;
}

beforeEach(() => {
  submitted.length = 0;
  accepts = true;
});

describe('reporting a problem', () => {
  it('sends the report itself instead of describing where the form is', async () => {
    const registry = harness();

    const result = await act(async () =>
      registry.run(AssistantAction.ReportProblem, 'tarifi kaydedemedim'),
    );

    expect(result).toEqual({ ok: true });
    expect(submitted).toHaveLength(1);
    expect(submitted[0]?.message).toContain('tarifi kaydedemedim');
  });

  // The user's sentence is the half a person can give; the other half is why
  // it is worth sending at all.
  it('attaches the screen and the failure the user could not have quoted', async () => {
    const registry = harness();
    registry.setScreenDescriber(() => 'screen=/create-recipe');
    registry.register(AssistantAction.PublishDraft, async () => ({ ok: false, error: 'server' }));

    await act(async () => {
      await registry.run(AssistantAction.PublishDraft);
      await registry.run(AssistantAction.ReportProblem, 'kaydedemedi');
    });

    expect(submitted[0]?.message).toContain('screen=/create-recipe');
    expect(submitted[0]?.message).toContain('error=server');
  });

  // The report is itself recorded as a failure, so reading the last one after
  // writing it would make every report after the first quote the previous
  // report instead of the bug.
  it('quotes the bug, not the report before it', async () => {
    const registry = harness();
    FailureReporter.report(
      { code: 'server', message: 'publish rejected' } as never,
      'CreateRecipe.publish',
    );

    await act(async () => {
      await registry.run(AssistantAction.ReportProblem, 'ilk');
      await registry.run(AssistantAction.ReportProblem, 'ikinci');
    });

    expect(submitted[1]?.message).toContain('publish rejected');
  });

  it('says so when the report did not go out', async () => {
    accepts = false;
    const registry = harness();

    await expect(registry.run(AssistantAction.ReportProblem, 'olmadı')).resolves.toEqual({
      ok: false,
      error: 'report_not_sent',
    });
  });
});
