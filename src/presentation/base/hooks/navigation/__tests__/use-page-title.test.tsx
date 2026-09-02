import { act, type ReactTestRenderer } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { usePageTitle } from '@presentation/base/hooks/navigation/use-page-title';
import { SiteMetadata } from '@presentation/base/constants/site-metadata';

/**
 * The site rendered a blank browser tab, and handed a rendering crawler an
 * empty `<title>`.
 *
 * @remarks
 * - **The symptom.** `+html.tsx` writes a real `<title>` into the exported
 *   shell, and it survives exactly until the app mounts: React Navigation
 *   reassigns `document.title` on every navigation as `options.title ??
 *   route.name`, and no screen set `title`. Measured on the live site, the
 *   `<title>` element's own `textContent` was `""` on a page with 23 images
 *   and a full recipe feed under it — a page with no name however much content
 *   it has, which is the shape of the "low value content" judgement the
 *   AdSense notice turns on.
 * - **Why nothing caught it.** Every routed screen sets `headerShown: false`
 *   and draws its own chrome, so `title` is invisible on a phone. The whole
 *   suite runs against the native renderer, where the property this bug is
 *   about does not exist.
 * - **What is locked in here.** That a page with a name says it, and that a
 *   page without one yet says the site's name rather than decorating a blank
 *   (`" · Recipely"` is worse than the product's own title).
 */

/** The `mock` prefix is required: jest forbids a mock factory from closing
 *  over anything else. */
const mockSetOptions = jest.fn();

jest.mock('expo-router', () => ({
  useNavigation: () => ({ setOptions: mockSetOptions }),
}));

/** The tree each case mounted, so it can be taken down again. */
let mounted: ReactTestRenderer | null = null;

/** Mounts the hook with a subject and returns what it asked the navigator for. */
const titleFor = (subject: string): unknown => {
  const Probe = (): null => {
    usePageTitle(subject);
    return null;
  };
  // `renderComponent` wraps its own `act`; wrapping it in another leaves the
  // renderer unmounted by the time `.root` is read.
  const { renderer } = renderComponent(<Probe />);
  mounted = renderer;
  const lastCall = mockSetOptions.mock.calls.at(-1);
  return (lastCall?.[0] as { title?: unknown } | undefined)?.title;
};

afterEach(() => {
  act(() => {
    mounted?.unmount();
  });
  mounted = null;
  jest.clearAllMocks();
});

describe('usePageTitle', () => {
  it('names the page after its subject', () => {
    expect(titleFor('Mercimek Çorbası')).toBe(`Mercimek Çorbası${SiteMetadata.titleSuffix}`);
  });

  it('never leaves the title empty', () => {
    // The regression: an unnamed page must fall back to the site, not to ''.
    expect(titleFor('')).toBe(SiteMetadata.title);
  });

  it('treats a whitespace-only subject as no subject', () => {
    // A recipe whose name has not loaded can arrive as a padded blank; that is
    // still nothing to call the page.
    expect(titleFor('   ')).toBe(SiteMetadata.title);
  });

  it('does not decorate the site title with its own suffix', () => {
    // Guards the shape rather than the string: `"" · Recipely` was the obvious
    // wrong answer here and reads as a bug in the tab.
    expect(titleFor('')).not.toContain(SiteMetadata.titleSuffix.trim());
  });
});
