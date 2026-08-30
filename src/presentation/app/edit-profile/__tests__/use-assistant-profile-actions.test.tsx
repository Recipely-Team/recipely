import { act } from 'react-test-renderer';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { EditProfileSaveOutcome } from '@presentation/app/edit-profile/model/edit-profile-save-outcome';
import type { EditProfileSaveOutcomeType } from '@presentation/app/edit-profile/model/edit-profile-save-outcome';
import { useAssistantProfileActions } from '@presentation/app/edit-profile/hooks/use-assistant-profile-actions';

/**
 * The assistant could write into this form and not save it: "kaydet" answered
 * `unavailable_here` on the one screen whose whole job is a Save button. The
 * user watched it fill the field, say it was done, and leave the change
 * sitting there — on a screen built for someone whose hands are busy.
 */

function harness(outcome: EditProfileSaveOutcomeType, isDirty = true) {
  const registry = new AssistantActionRegistry();
  const spies = {
    onChangeName: jest.fn(),
    onChangeBio: jest.fn(),
    onSave: jest.fn(async () => outcome),
  };

  const Probe = (): null => {
    useAssistantProfileActions({ displayName: 'Ali', bio: '', isDirty, ...spies });
    return null;
  };

  renderComponent(
    <StoresProvider value={{ assistantActionRegistry: registry } as unknown as Stores}>
      <Probe />
    </StoresProvider>,
  );

  return { registry, spies };
}

describe('useAssistantProfileActions', () => {
  // The theme provider hydrates from async storage on mount; let those promises
  // settle inside act so a late re-render cannot fire after the test body.
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it('presses save when told to', async () => {
    const { registry, spies } = harness(EditProfileSaveOutcome.Saved);

    await act(async () => {
      await expect(registry.run(AssistantAction.Save)).resolves.toMatchObject({ ok: true });
    });

    expect(spies.onSave).toHaveBeenCalled();
  });

  // The model asks "kaydedeyim mi?" because writing a field answers `awaiting`;
  // the answer to that question is `confirm`, and it has to reach the same
  // button.
  it('takes a spoken yes as the save', async () => {
    const { registry, spies } = harness(EditProfileSaveOutcome.Saved);

    await act(async () => {
      await registry.run(AssistantAction.Confirm);
    });

    expect(spies.onSave).toHaveBeenCalled();
  });

  it('leaves the form alone on a spoken no', async () => {
    const { registry, spies } = harness(EditProfileSaveOutcome.Saved);

    await act(async () => {
      await expect(registry.run(AssistantAction.Cancel)).resolves.toMatchObject({ ok: true });
    });

    expect(spies.onSave).not.toHaveBeenCalled();
  });

  // With nothing changed there is no question pending, and a "yes" said to
  // something else must not reach this screen.
  it('does not answer yes or no while the form is untouched', async () => {
    const { registry, spies } = harness(EditProfileSaveOutcome.Saved, false);

    await act(async () => {
      await expect(registry.run(AssistantAction.Confirm)).resolves.toMatchObject({ ok: false });
    });

    expect(spies.onSave).not.toHaveBeenCalled();
  });

  // The reason comes from the save itself. Reading `saveEnabled` here would
  // describe the form as it was BEFORE the field this same turn just wrote.
  it('reports why nothing was saved', async () => {
    const { registry } = harness(EditProfileSaveOutcome.NameRequired);

    await act(async () => {
      await expect(registry.run(AssistantAction.Save)).resolves.toMatchObject({
        ok: false,
        error: EditProfileSaveOutcome.NameRequired,
      });
    });
  });

  // Without this the model is told the route and nothing else, so it cannot
  // know there is an unsaved change to offer to save.
  it('says on the screen line whether there is anything unsaved', async () => {
    const { registry } = harness(EditProfileSaveOutcome.Saved);

    await act(async () => {
      const result = await registry.run(AssistantAction.Save);
      expect(result.ctx).toContain('unsaved=yes');
    });
  });
});
