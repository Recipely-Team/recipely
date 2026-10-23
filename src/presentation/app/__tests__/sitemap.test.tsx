import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { Sitemap } from '@presentation/app/_sitemap';
import { RoutePaths } from '@presentation/base/constants';

const mockRedirect = jest.fn((_props: { href: string }) => null);
jest.mock('expo-router', () => ({ Redirect: (props: { href: string }) => mockRedirect(props) }));

describe('the app-owned _sitemap route', () => {
  // The symptom: a fatal "Cannot read property 'origin' of undefined" thrown
  // from SystemInfo — a component of expo-router's development sitemap, which
  // the router ships whenever the app provides no `_sitemap` of its own. It
  // reads `window.location.origin`, and a device has no `window.location`.
  // This file exists only to keep that screen out of the build, so what is
  // worth pinning is that it renders a redirect and nothing else: the moment
  // it returns anything renderable, the crashing screen is back.
  it('sends anyone who reaches it to the feed', () => {
    let view!: ReactTestRenderer;
    act(() => {
      view = create(<Sitemap />);
    });

    expect(mockRedirect).toHaveBeenCalledWith({ href: RoutePaths.recipes });
    expect(view.toJSON()).toBeNull();
    act(() => view.unmount());
  });
});
