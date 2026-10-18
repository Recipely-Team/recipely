jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 24, bottom: 48, left: 0, right: 0 }),
}));

/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
import { useScrollEndPadding } from '@presentation/base/hooks/interaction/use-scroll-end-padding';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { spacing } from '@presentation/base/theme';

/**
 * "Küçük ekranlarda Google ve Apple butonları görünmüyor": the login screen's
 * last buttons scrolled down under Android's 3-button navigation bar (48 dp),
 * where they could not be seen or tapped.
 */
describe('useScrollEndPadding', () => {
  it('keeps the last row above a 48 dp navigation bar, with the usual gap', () => {
    let padding = 0;
    const Probe = (): null => {
      padding = useScrollEndPadding();
      return null;
    };
    renderComponent(<Probe />);

    expect(padding).toBe(48 + spacing.lg);
  });
});
