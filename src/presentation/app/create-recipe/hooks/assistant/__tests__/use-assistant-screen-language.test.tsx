import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { ApplicationStores } from '@application/di/application-stores';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useAssistantScreenLanguage } from '@presentation/app/create-recipe/hooks/assistant/use-assistant-screen-language';

/** The edit screen's language combo is voice-reachable: by code or by the language's own name. */
describe('useAssistantScreenLanguage', () => {
  const mount = (onChange: (locale: string) => void): AssistantActionRegistry => {
    const registry = new AssistantActionRegistry();
    const Host = (): null => {
      useAssistantScreenLanguage(onChange);
      return null;
    };
    renderComponent(<Host />, { assistantActionRegistry: registry } as Partial<ApplicationStores>);
    return registry;
  };

  it('picks a language by code or by its own name', async () => {
    const onChange = jest.fn();
    const registry = mount(onChange);
    await expect(registry.run(AssistantAction.SetScreenLanguage, 'de')).resolves.toMatchObject({ ok: true, title: 'Deutsch' });
    await expect(registry.run(AssistantAction.SetScreenLanguage, 'türkçe')).resolves.toMatchObject({ ok: true });
    expect(onChange.mock.calls).toEqual([['de'], ['tr']]);
  });

  it('says not_found for a language the app does not have', async () => {
    const onChange = jest.fn();
    await expect(mount(onChange).run(AssistantAction.SetScreenLanguage, 'klingon')).resolves.toMatchObject({ ok: false, error: AssistantActionError.NotFound });
    expect(onChange).not.toHaveBeenCalled();
  });
});
