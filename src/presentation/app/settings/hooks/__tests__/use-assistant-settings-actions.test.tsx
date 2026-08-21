import { act } from 'react-test-renderer';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { useAssistantSettingsActions } from '@presentation/app/settings/hooks/use-assistant-settings-actions';

function harness() {
  const registry = new AssistantActionRegistry();
  const spies = {
    onSetLanguage: jest.fn(),
    onSetThemePreference: jest.fn(),
    onRequestSignOut: jest.fn(),
  };

  const Probe = (): null => {
    useAssistantSettingsActions(spies);
    return null;
  };

  renderComponent(
    <StoresProvider value={{ assistantActionRegistry: registry } as unknown as Stores}>
      <Probe />
    </StoresProvider>,
  );

  return { registry, spies };
}

describe('useAssistantSettingsActions', () => {
  it('sets a language the app actually ships', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.SetPreference, 'language=tr');
    });

    expect(spies.onSetLanguage).toHaveBeenCalledWith('tr');
  });

  // Arabic has a complete catalogue but is deliberately not offered — the app
  // has no RTL layout, so selecting it leaves the interface harder to read
  // than before. Only the offered list knows that.
  it('refuses a locale the app carries but does not offer', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.SetPreference, 'language=ar')).resolves.toEqual({
        ok: false,
        error: 'unknown_language',
      });
    });

    expect(spies.onSetLanguage).not.toHaveBeenCalled();
  });

  it('refuses a locale that does not exist at all', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.SetPreference, 'language=elvish')).resolves.toEqual({
        ok: false,
        error: 'unknown_language',
      });
    });

    expect(spies.onSetLanguage).not.toHaveBeenCalled();
  });

  it('sets each theme preference, including following the device', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.SetPreference, 'theme=dark');
      await registry.run(AssistantAction.SetPreference, 'theme=system');
    });

    expect(spies.onSetThemePreference).toHaveBeenNthCalledWith(1, 'dark');
    expect(spies.onSetThemePreference).toHaveBeenNthCalledWith(2, 'system');
  });

  it('refuses a theme that is not one', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.SetPreference, 'theme=neon')).resolves.toEqual({
        ok: false,
        error: 'unknown_theme',
      });
    });

    expect(spies.onSetThemePreference).not.toHaveBeenCalled();
  });

  it('needs the preference named, not guessed', async () => {
    const { registry } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.SetPreference, 'dark')).resolves.toEqual({
        ok: false,
        error: 'expected_key_equals_value',
      });
      await expect(registry.run(AssistantAction.SetPreference, 'colour=dark')).resolves.toEqual({
        ok: false,
        error: 'unknown_preference',
      });
    });
  });

  // Signing out ends the session and everything behind it, and "çıkış" is a
  // short word for a microphone to mishear.
  it('asks before signing out rather than signing out', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.SignOut)).resolves.toMatchObject({
        ok: true,
        awaiting: true,
      });
    });

    expect(spies.onRequestSignOut).toHaveBeenCalled();
  });
});
