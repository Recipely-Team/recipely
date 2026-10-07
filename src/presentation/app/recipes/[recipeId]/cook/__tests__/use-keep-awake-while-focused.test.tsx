import { act } from 'react-test-renderer';
import { NavigationContext } from 'expo-router/react-navigation';
import type { NavigationProp, ParamListBase } from 'expo-router/react-navigation';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useKeepAwakeWhileFocused } from '@presentation/app/recipes/[recipeId]/cook/hooks/use-keep-awake-while-focused';

jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn(() => Promise.resolve()),
  deactivateKeepAwake: jest.fn(() => Promise.resolve()),
}));

const screen = (initiallyFocused: boolean) => {
  const listeners: Record<string, (() => void)[]> = { focus: [], blur: [] };
  let focused = initiallyFocused;
  const navigation = {
    isFocused: () => focused,
    addListener: (event: string, listener: () => void) => {
      (listeners[event] ??= []).push(listener);
      return () => undefined;
    },
  } as unknown as NavigationProp<ParamListBase>;
  const fire = (event: 'focus' | 'blur'): void => {
    focused = event === 'focus';
    act(() => {
      for (const listener of listeners[event] ?? []) listener();
    });
  };
  return { navigation, fire };
};

const Probe = (): null => {
  useKeepAwakeWhileFocused();
  return null;
};

describe('useKeepAwakeWhileFocused — the phone stays awake only while cook mode is in front', () => {
  beforeEach(() => jest.clearAllMocks());

  it('holds the lock while focused and lets go on blur', () => {
    const { navigation, fire } = screen(true);
    renderComponent(
      <NavigationContext.Provider value={navigation}>
        <Probe />
      </NavigationContext.Provider>,
    );
    expect(activateKeepAwakeAsync).toHaveBeenCalledTimes(1);
    expect(deactivateKeepAwake).not.toHaveBeenCalled();

    fire('blur');
    expect(deactivateKeepAwake).toHaveBeenCalledTimes(1);

    fire('focus');
    expect(activateKeepAwakeAsync).toHaveBeenCalledTimes(2);
  });

  it('never takes the lock for a mounted screen under another one', () => {
    const { navigation } = screen(false);
    renderComponent(
      <NavigationContext.Provider value={navigation}>
        <Probe />
      </NavigationContext.Provider>,
    );
    expect(activateKeepAwakeAsync).not.toHaveBeenCalled();
  });

  it('lets go when the screen unmounts', () => {
    const { navigation } = screen(true);
    const { renderer } = renderComponent(
      <NavigationContext.Provider value={navigation}>
        <Probe />
      </NavigationContext.Provider>,
    );
    act(() => renderer.unmount());
    expect(deactivateKeepAwake).toHaveBeenCalledTimes(1);
  });
});
