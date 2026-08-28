import { Redirect } from 'expo-router';
import { Sitemap } from '@presentation/app/_sitemap';
import { RoutePaths } from '@presentation/base/constants';

describe('the app-owned _sitemap route', () => {
  // The symptom: a fatal "Cannot read property 'origin' of undefined" thrown
  // from SystemInfo — a component of expo-router's development sitemap, which
  // the router ships whenever the app provides no `_sitemap` of its own. It
  // reads `window.location.origin`, and a device has no `window.location`.
  // This file exists only to keep that screen out of the build, so what is
  // worth pinning is that it renders a redirect and nothing else: the moment
  // it returns anything renderable, the crashing screen is back.
  it('sends anyone who reaches it to the feed', () => {
    const element = Sitemap();

    expect(element.type).toBe(Redirect);
    expect(element.props).toEqual({ href: RoutePaths.recipes });
  });
});
