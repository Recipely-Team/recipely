import { act } from 'react-test-renderer';
import { NavigationContext } from 'expo-router/react-navigation';
import type { NavigationProp, ParamListBase } from 'expo-router/react-navigation';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';

/**
 * Reported from production: the assistant refused to create a recipe, saying
 * over and over that an open draft would be lost. There was no draft on screen,
 * `readScreen` answered with the feed, and asked to delete the draft it
 * answered that it could not find one. The user could not get out of the loop.
 *
 * The cause was underneath: expo-router leaves the screen below a push mounted,
 * so the create screen — which deliberately shadows `generateRecipe` while its
 * editor is open, to stop a second create screen being pushed over the draft —
 * went on answering from under the feed. Registration was scoped to mount, and
 * mount is not the same as being the screen the user is looking at.
 */
describe('a screen that is mounted but not looked at', () => {
  const screen = () => {
    const listeners: Record<string, (() => void)[]> = { focus: [], blur: [] };
    let focused = true;
    const navigation = {
      isFocused: () => focused,
      addListener: (event: string, listener: () => void) => {
        (listeners[event] ??= []).push(listener);
        return () => undefined;
      },
    } as unknown as NavigationProp<ParamListBase>;

    return {
      navigation,
      blur: (): void => {
        focused = false;
        act(() => {
          for (const listener of listeners.blur ?? []) listener();
        });
      },
    };
  };

  it('stops answering for the draft it is holding once the user is elsewhere', async () => {
    const registry = new AssistantActionRegistry();
    const { navigation, blur } = screen();

    // The app's real shape, and why the order matters: the pill is mounted at
    // the root and registers first, so a screen's handler sits above it and
    // wins. The create screen shadows `generateRecipe` on purpose, to stop a
    // second create screen being pushed over the draft being edited.
    const Pill = (): null => {
      useAssistantAction(AssistantAction.GenerateRecipe, async () => ({ ok: true, created: 'yes' }));
      return null;
    };
    const CreateScreen = (): null => {
      useAssistantAction(AssistantAction.GenerateRecipe, async () => ({ ok: false, error: 'draft_open_would_be_lost' }));
      return null;
    };
    renderComponent(
      <StoresProvider value={{ assistantActionRegistry: registry } as unknown as Stores}>
        <Pill />
        <NavigationContext.Provider value={navigation}>
          <CreateScreen />
        </NavigationContext.Provider>
      </StoresProvider>,
    );

    // While the user is on it, the shadow is right: it protects the draft.
    await act(async () => {
      await expect(registry.run(AssistantAction.GenerateRecipe)).resolves.toMatchObject({
        error: 'draft_open_would_be_lost',
      });
    });

    blur();

    // Once they are looking at something else, it must not speak for the app.
    await act(async () => {
      await expect(registry.run(AssistantAction.GenerateRecipe)).resolves.toMatchObject({ ok: true, created: 'yes' });
    });
  });

  it('does not read out the screen the user left behind', async () => {
    const registry = new AssistantActionRegistry();
    const left = screen();

    const LeftBehind = (): null => {
      useAssistantScreenReading(() => 'draft: yumurta, un');
      return null;
    };
    renderComponent(
      <StoresProvider value={{ assistantActionRegistry: registry } as unknown as Stores}>
        <NavigationContext.Provider value={left.navigation}>
          <LeftBehind />
        </NavigationContext.Provider>
      </StoresProvider>,
    );
    expect(registry.screenReading).toContain('draft');

    left.blur();

    expect(registry.screenReading).not.toContain('draft');
  });

  // The pill and the timers bar are rendered beside the navigator, not inside a
  // screen, so there is no route for them to be focused or blurred by. Their
  // handlers are global on purpose, and this is what stops the fix from
  // silencing them.
  it('leaves the always-mounted chrome registered, having no screen to be blurred with', async () => {
    const registry = new AssistantActionRegistry();
    const Pill = (): null => {
      useAssistantAction(AssistantAction.Stop, async () => ({ ok: true }));
      return null;
    };

    renderComponent(
      <StoresProvider value={{ assistantActionRegistry: registry } as unknown as Stores}>
        <Pill />
      </StoresProvider>,
    );

    await act(async () => {
      await expect(registry.run(AssistantAction.Stop)).resolves.toMatchObject({ ok: true });
    });
  });
});
