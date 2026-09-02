/**
 * @jest-environment jsdom
 */
/**
 * A page that names itself must beat the site default — and the thing that
 * decides that is RENDER ORDER, which nothing else checks.
 *
 * @remarks
 * - **The bug this was written for.** `<PageTitle />` was rendered as a sibling
 *   AFTER `</Stack>` in the root layout. react-helmet-async resolves a title by
 *   taking the last instance in its array, and instances are pushed during
 *   render — so a screen inside the Stack pushed first and the root pushed
 *   last, and every recipe page came out titled "Recipely". Moving one line
 *   above `<Stack>` fixed it.
 * - **Why the artifact guard cannot see this.** `assert-page-titles.mjs` checks
 *   that every exported page has exactly one non-empty `<title>`. A recipe page
 *   silently wearing the site's title passes that perfectly: it is one title,
 *   and it is not empty. Only precedence tells the two apart.
 * - **Against the real vendored helmet**, not a stub — the ordering rule being
 *   tested is helmet's, so a fake would only assert my belief about it.
 */
import { act, create } from 'react-test-renderer';
import { HelmetProvider, type HelmetServerState } from 'expo-router/vendor/react-helmet-async/lib/index';

import { PageTitle } from '@presentation/base/widgets/head/page-title';
import { SiteMetadata } from '@presentation/base/constants/site-metadata';

/**
 * On web, `expo-router/head` IS this helmet — `ExpoHead.web` re-exports it.
 * Jest resolves the package to its iOS build, which pulls expo-router's global
 * state and cannot load here; swapping in the vendored helmet keeps the exact
 * ordering semantics under test rather than a stand-in for them.
 */
jest.mock('expo-router/head', () => ({
  __esModule: true,
  default: jest.requireActual('expo-router/vendor/react-helmet-async/lib/index').Helmet,
}));

/**
 * Renders a tree and returns the title helmet settled on.
 *
 * `canUseDOM = false` puts helmet in its server mode, which is helmet's own
 * documented switch for this and is what the static web export runs through
 * anyway. It resolves synchronously into `context`; the client path defers its
 * DOM write to a `requestAnimationFrame`, so asserting on `document.title`
 * would be asserting on a flush rather than on precedence.
 */
HelmetProvider.canUseDOM = false;

const resolvedTitle = (tree: React.ReactElement): string => {
  const context: { helmet?: HelmetServerState } = {};
  act(() => {
    create(<HelmetProvider context={context}>{tree}</HelmetProvider>);
  });
  // `toString()` yields the whole `<title …>text</title>` element, with the
  // text HTML-escaped — the site title contains an `&`.
  const rendered = context.helmet?.title.toString() ?? '';
  const text = /<title[^>]*>([\s\S]*?)<\/title>/.exec(rendered)?.[1] ?? '';
  return text.replace(/&amp;/g, '&');
};

describe('PageTitle', () => {
  it('falls back to the site title when a page has no name yet', () => {
    expect(resolvedTitle(<PageTitle />)).toBe(SiteMetadata.title);
  });

  it('names a page after its subject', () => {
    expect(resolvedTitle(<PageTitle subject="Mercimek Çorbası" />)).toBe(
      `Mercimek Çorbası${SiteMetadata.titleSuffix}`,
    );
  });

  it('lets a page that names itself beat the root default', () => {
    // The regression, in the order the root layout renders them: the default
    // first, the screen's own title second. Reversed — which is how it
    // shipped — the site title wins and every recipe page is called "Recipely".
    expect(
      resolvedTitle(
        <>
          <PageTitle />
          <PageTitle subject="Kısır" />
        </>,
      ),
    ).toBe(`Kısır${SiteMetadata.titleSuffix}`);
  });

  it('keeps the site title when the inner page has nothing to say', () => {
    expect(
      resolvedTitle(
        <>
          <PageTitle />
          <PageTitle />
        </>,
      ),
    ).toBe(SiteMetadata.title);
  });
});
