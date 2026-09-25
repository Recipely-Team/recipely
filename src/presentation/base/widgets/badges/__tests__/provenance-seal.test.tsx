/**
 * The seal replaced a grey glyph in the rating row that the owner said
 * "doesn't really stand out" — and that could only say one fact at a time,
 * while the ordinary import is two: a video from an account, written up by a
 * model.
 */
import { Linking } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { ProvenanceSeal } from '@presentation/base/widgets/badges/provenance-seal';
import { ProvenanceNote } from '@presentation/base/widgets/badges/provenance-note';
import { ProvenanceGlyph } from '@presentation/base/widgets/badges/provenance-glyph';
import { SealSurface } from '@presentation/base/widgets/badges/seal-surface';
import { ProvenanceMark } from '@domain/recipes/provenance/provenance-mark';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';

const HANDLE = 'mutfaktaki_hayat';
const SIZE = 27;

type Root = ReactTestInstance;

const labelsOf = (root: Root): string[] =>
  root
    .findAll((n) => typeof n.props['accessibilityLabel'] === 'string')
    .map((n) => String(n.props['accessibilityLabel']));

/** The sentence as a reader sees it: nested link text stays where it sits. */
const textOf = (root: Root): string => {
  const walk = (child: unknown): string => {
    if (typeof child === 'string') return child;
    if (Array.isArray(child)) return child.map(walk).join('');
    if (child !== null && typeof child === 'object' && 'props' in child) {
      return walk((child as { props: { children?: unknown } }).props.children);
    }
    return '';
  };
  return root
    .findAll((n) => (n.props as Record<string, unknown>)['children'] !== undefined)
    .map((n) => walk((n.props as Record<string, unknown>)['children']))
    .join(' | ');
};

const glyphsOf = (root: Root): unknown[] =>
  root.findAllByType(ProvenanceGlyph).map((n) => n.props.mark);

describe('ProvenanceSeal', () => {
  it('draws nothing at all for a hand-written recipe', () => {
    const { root } = renderComponent(<ProvenanceSeal marks={[]} surface={SealSurface.Photo} size={SIZE} />);
    expect(glyphsOf(root)).toEqual([]);
    expect(labelsOf(root)).toEqual([]);
  });

  it('carries both facts of an AI-written TikTok import in one capsule, platform first', () => {
    const { root } = renderComponent(
      <ProvenanceSeal marks={[ProvenanceMark.TikTok, ProvenanceMark.Ai]} surface={SealSurface.Photo} size={SIZE} />,
    );
    expect(glyphsOf(root)).toEqual([ProvenanceMark.TikTok, ProvenanceMark.Ai]);
    expect(labelsOf(root)).toContain(`${t().recipes.originTiktokA11y}${t().recipes.originEditedByAiSuffix}`);
  });

  it('names an AI-only recipe without inventing a platform', () => {
    const { root } = renderComponent(
      <ProvenanceSeal marks={[ProvenanceMark.Ai]} surface={SealSurface.Photo} size={SIZE} />,
    );
    expect(labelsOf(root)).toContain(t().recipes.originAiA11y);
  });
});

describe('ProvenanceNote', () => {
  it('tells the whole truth in one sentence, with the handle as the only link', () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { root } = renderComponent(
      <ProvenanceNote marks={[ProvenanceMark.TikTok, ProvenanceMark.Ai]} sourceHandle={HANDLE} />,
    );

    const expected = `${t().recipes.originTiktokDetailLabel.replace('{handle}', `@${HANDLE}`)}${t().recipes.originEditedByAiSuffix}`;
    expect(textOf(root)).toContain(expected);

    const links = root.findAll((n) => n.props['accessibilityRole'] === 'link' && typeof n.props['onPress'] === 'function');
    expect(links.length).toBeGreaterThan(0);
    (links[0]?.props['onPress'] as () => void)();
    expect(open).toHaveBeenCalledWith(`https://www.tiktok.com/@${HANDLE}`);
    open.mockRestore();
  });

  it('still says where an import came from when the handle is unknown', () => {
    const { root } = renderComponent(<ProvenanceNote marks={[ProvenanceMark.Instagram]} />);
    expect(textOf(root)).toContain(t().recipes.originInstagramA11y);
    expect(textOf(root)).not.toContain('@');
  });

  it('draws nothing for a hand-written recipe', () => {
    const { root } = renderComponent(<ProvenanceNote marks={[]} sourceHandle={HANDLE} />);
    expect(glyphsOf(root)).toEqual([]);
    expect(textOf(root)).not.toContain(HANDLE);
  });
});
