/**
 * The badge says where a recipe's text came from, and the interesting cases are
 * the ones where it says nothing or says only half.
 */

import { Linking } from 'react-native';
import { ProvenanceBadge } from '@presentation/base/widgets/badges/provenance-badge';
import { ProvenanceBadgeVariant } from '@presentation/base/widgets/badges/provenance-badge-variant';
import { RecipeOrigin } from '@domain/recipes/recipe-origin';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';

const HANDLE = 'birseyler_pisiyor';

const labelsOf = (root: { findAll: (m: (n: { props: Record<string, unknown> }) => boolean) => { props: Record<string, unknown> }[] }): string[] =>
  root
    .findAll((n) => typeof n.props['accessibilityLabel'] === 'string')
    .map((n) => String(n.props['accessibilityLabel']));

/** Every string the tree renders, including the pieces of a split sentence. */
const textOf = (root: { findAll: (m: (n: { props: Record<string, unknown> }) => boolean) => { props: Record<string, unknown> }[] }): string => {
  const strings: string[] = [];
  const walk = (child: unknown): void => {
    if (typeof child === 'string') strings.push(child);
    else if (Array.isArray(child)) child.forEach(walk);
  };
  root.findAll(() => true).forEach((n) => walk(n.props['children']));
  return strings.join(' ');
};

describe('ProvenanceBadge — the ordinary case is silence', () => {
  // Most recipes are written by a person. A marker on every one of them is
  // noise, not provenance.
  it.each([ProvenanceBadgeVariant.Compact, ProvenanceBadgeVariant.Detailed])(
    'draws nothing at all for a hand-written recipe (%s)',
    (variant) => {
      const { root } = renderComponent(
        <ProvenanceBadge origin={RecipeOrigin.User} variant={variant} />,
      );

      expect(labelsOf(root)).toHaveLength(0);
    },
  );

  // `toRecipeOrigin` already answers `User` for a value it does not know, so a
  // server that grows a fourth kind must reach this same silence.
  it('draws nothing for an origin it has no words for', () => {
    const { root } = renderComponent(
      <ProvenanceBadge
        origin={'SOMETHING_NEW' as never}
        variant={ProvenanceBadgeVariant.Detailed}
      />,
    );

    // It is not `User`, so it does not return early — this asserts the badge
    // still does not invent a label for it.
    expect(labelsOf(root)).not.toContain(t().recipes.originAiA11y);
  });
});

describe('ProvenanceBadge — compact, on a feed card', () => {
  it('names the AI case for a screen reader', () => {
    const { root } = renderComponent(
      <ProvenanceBadge origin={RecipeOrigin.Ai} variant={ProvenanceBadgeVariant.Compact} />,
    );

    expect(labelsOf(root)).toContain(t().recipes.originAiA11y);
  });

  // The list endpoint sends `origin` and not `sourceHandle`, so the card's
  // accessible name has to stop at "imported from Instagram" — it must not
  // promise an account the feed never received.
  it('says only what a card actually knows about an import', () => {
    const { root } = renderComponent(
      <ProvenanceBadge
        origin={RecipeOrigin.Import}
        variant={ProvenanceBadgeVariant.Compact}
        sourceHandle={HANDLE}
      />,
    );

    expect(labelsOf(root)).toContain(t().recipes.originImportA11y);
    expect(textOf(root)).not.toContain(HANDLE);
  });
});

describe('ProvenanceBadge — detailed, on the recipe screen', () => {
  it('spells out the AI case as visible copy, not just a glyph', () => {
    const { root } = renderComponent(
      <ProvenanceBadge origin={RecipeOrigin.Ai} variant={ProvenanceBadgeVariant.Detailed} />,
    );

    expect(textOf(root)).toContain(t().recipes.originAiDetailLabel);
  });

  it('shows the account an import came from, written the way Instagram writes it', () => {
    const { root } = renderComponent(
      <ProvenanceBadge
        origin={RecipeOrigin.Import}
        variant={ProvenanceBadgeVariant.Detailed}
        sourceHandle={HANDLE}
      />,
    );

    expect(textOf(root)).toContain(`@${HANDLE}`);
  });

  // A screen reader landing on the handle has to hear what it DOES, not just
  // the visible "@name".
  it('tells a screen reader the handle opens Instagram', () => {
    const { root } = renderComponent(
      <ProvenanceBadge
        origin={RecipeOrigin.Import}
        variant={ProvenanceBadgeVariant.Detailed}
        sourceHandle={HANDLE}
      />,
    );

    expect(labelsOf(root)).toContain(
      t().recipes.originImportHandleA11y.replace('{handle}', `@${HANDLE}`),
    );
  });

  it('opens the account when the handle is pressed', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { root } = renderComponent(
      <ProvenanceBadge
        origin={RecipeOrigin.Import}
        variant={ProvenanceBadgeVariant.Detailed}
        sourceHandle={HANDLE}
      />,
    );

    const link = root.findAll((n) => n.props['accessibilityRole'] === 'link')[0];
    (link?.props['onPress'] as () => void)();

    expect(openURL).toHaveBeenCalledWith(`https://instagram.com/${HANDLE}`);
    openURL.mockRestore();
  });

  // `RecipeEntityProps.sourceHandle` is optional even though an IMPORT is
  // expected to carry one. Half a sentence beats "@undefined".
  it('still says it was imported when no handle came with it', () => {
    const { root } = renderComponent(
      <ProvenanceBadge origin={RecipeOrigin.Import} variant={ProvenanceBadgeVariant.Detailed} />,
    );

    expect(textOf(root)).not.toContain('undefined');
    expect(textOf(root)).toContain(t().recipes.originImportA11y);
    expect(root.findAll((n) => n.props['accessibilityRole'] === 'link')).toHaveLength(0);
  });
});
