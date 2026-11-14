import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { PHOTO_NOTE_MAX_CHARS } from '@domain/common/photo-note';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useAssistantPhotoNote } from '@presentation/base/hooks/assistant/actions/use-assistant-photo-note';
import type { ApplicationStores } from '@application/di/application-stores';

/** "Tell it to ignore the sauces": the note under the photos is voice-reachable (feature reach rule). */
describe('useAssistantPhotoNote', () => {
  const mount = (onChangeNote: (note: string) => void): AssistantActionRegistry => {
    const registry = new AssistantActionRegistry();
    const Host = (): null => {
      useAssistantPhotoNote(onChangeNote);
      return null;
    };
    renderComponent(<Host />, { assistantActionRegistry: registry } as Partial<ApplicationStores>);
    return registry;
  };

  it('writes the spoken note into the field, cut at the limit', async () => {
    const onChangeNote = jest.fn();
    const registry = mount(onChangeNote);
    const result = await registry.run(AssistantAction.SetPhotoNote, 'y'.repeat(PHOTO_NOTE_MAX_CHARS + 5));
    expect(result.ok).toBe(true);
    expect(onChangeNote).toHaveBeenCalledWith('y'.repeat(PHOTO_NOTE_MAX_CHARS));
  });

  it('clears the note when nothing is said', async () => {
    const onChangeNote = jest.fn();
    await mount(onChangeNote).run(AssistantAction.SetPhotoNote);
    expect(onChangeNote).toHaveBeenCalledWith('');
  });
});
