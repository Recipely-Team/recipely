/**
 * The strip the tab bar vacates on a tab-less route stays visible for the
 * length of the stack transition. Unpainted it showed whatever sits behind the
 * app — black on Android — which is what "weird things happen moving between
 * screens" turned out to be.
 */

import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { useWindowBackground } from '@presentation/navigation/use-window-background';
import * as SystemUI from 'expo-system-ui';

jest.mock('expo-system-ui', () => ({ setBackgroundColorAsync: jest.fn() }));

const setBackgroundColorAsync = SystemUI.setBackgroundColorAsync as jest.MockedFunction<
  typeof SystemUI.setBackgroundColorAsync
>;

const Probe = ({ background }: { background: string }): null => {
  useWindowBackground(background);
  return null;
};

const mount = (background: string): ReactTestRenderer => {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(<Probe background={background} />);
  });
  return renderer;
};

const repaint = (renderer: ReactTestRenderer, background: string): void => {
  act(() => {
    renderer.update(<Probe background={background} />);
  });
};

describe('useWindowBackground', () => {
  beforeEach(() => jest.clearAllMocks());

  it('paints the native window in the theme background', () => {
    mount('#101010');

    expect(setBackgroundColorAsync).toHaveBeenCalledWith('#101010');
  });

  // The window colour is native state — it does not re-derive when the user
  // picks another theme, it has to be pushed again.
  it('repaints when the theme changes', () => {
    const renderer = mount('#101010');

    repaint(renderer, '#FFFFFF');

    expect(setBackgroundColorAsync).toHaveBeenLastCalledWith('#FFFFFF');
  });

  it('does not repaint when nothing changed', () => {
    const renderer = mount('#101010');

    repaint(renderer, '#101010');

    expect(setBackgroundColorAsync).toHaveBeenCalledTimes(1);
  });
});
