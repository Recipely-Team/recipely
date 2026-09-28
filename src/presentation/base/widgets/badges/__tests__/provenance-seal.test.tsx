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

  it.each([ProvenanceMark.Facebook, ProvenanceMark.YouTube])('draws the %s mark and names it', (mark) => {
    const { root } = renderComponent(<ProvenanceSeal marks={[mark, ProvenanceMark.Ai]} surface={SealSurface.Photo} size={SIZE} />);
    expect(glyphsOf(root)).toEqual([mark, ProvenanceMark.Ai]);
    const base = mark === ProvenanceMark.Facebook ? t().recipes.originFacebookA11y : t().recipes.originYoutubeA11y;
    expect(labelsOf(root)).toContain(`${base}${t().recipes.originEditedByAiSuffix}`);
  });

  it('hides a decorative row of marks from assistive tech', () => {
    const { root } = renderComponent(
      <ProvenanceSeal marks={[ProvenanceMark.Instagram, ProvenanceMark.Web]} surface={SealSurface.Page} size={SIZE} decorative />,
    );
    expect(labelsOf(root)).toEqual([]);
    expect(root.findAll((n) => n.props['importantForAccessibility'] === 'no-hide-descendants').length).toBeGreaterThan(0);
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

  it('opens the video itself when its address is known, still named by the account', () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const VIDEO = 'https://www.instagram.com/reel/Cx1y2z3/';
    const { root } = renderComponent(<ProvenanceNote marks={[ProvenanceMark.Instagram]} sourceHandle={HANDLE} sourceUrl={VIDEO} />);

    expect(textOf(root)).toContain(`@${HANDLE}`);
    const link = root.findAll((n) => n.props['accessibilityRole'] === 'link' && typeof n.props['onPress'] === 'function')[0];
    (link?.props['onPress'] as () => void)();
    expect(open).toHaveBeenCalledWith(VIDEO);
    open.mockRestore();
  });

  it('still says where an import came from when the handle is unknown', () => {
    const { root } = renderComponent(<ProvenanceNote marks={[ProvenanceMark.Instagram]} />);
    expect(textOf(root)).toContain(t().recipes.originInstagramA11y);
    expect(textOf(root)).not.toContain('@');
  });

  // Facebook and YouTube imports had no words: the sentence fell through to
  // nothing, and an import a model rewrote said "edited by" in one place and
  // "written" in another. Every import says "edited"; only a prompt says "written".
  describe('the note sentence for each platform, both created and edited', () => {
    const VIDEO = 'https://example.com/video/1';
    const words = (): Record<string, { mark: (typeof ProvenanceMark)[keyof typeof ProvenanceMark]; sentence: string; shown: string }> => ({
      instagram: { mark: ProvenanceMark.Instagram, sentence: t().recipes.originInstagramDetailLabel, shown: `@${HANDLE}` },
      tiktok: { mark: ProvenanceMark.TikTok, sentence: t().recipes.originTiktokDetailLabel, shown: `@${HANDLE}` },
      facebook: { mark: ProvenanceMark.Facebook, sentence: t().recipes.originFacebookDetailLabel, shown: HANDLE },
      youtube: { mark: ProvenanceMark.YouTube, sentence: t().recipes.originYoutubeDetailLabel, shown: HANDLE },
      web: { mark: ProvenanceMark.Web, sentence: t().recipes.originWebDetailLabel, shown: HANDLE },
    });

    it.each(['instagram', 'tiktok', 'facebook', 'youtube', 'web'])('%s: imported, then edited with AI, and the name opens the video', (key) => {
      const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
      const w = words()[key];
      if (w === undefined) throw new Error(key);
      const plain = w.sentence.replace('{handle}', w.shown);

      const imported = renderComponent(<ProvenanceNote marks={[w.mark]} sourceHandle={HANDLE} sourceUrl={VIDEO} />);
      expect(textOf(imported.root)).toContain(plain);
      expect(textOf(imported.root)).not.toContain(t().recipes.originEditedByAiSuffix);

      const edited = renderComponent(
        <ProvenanceNote marks={[w.mark, ProvenanceMark.Ai]} sourceHandle={HANDLE} sourceUrl={VIDEO} />,
      );
      expect(textOf(edited.root)).toContain(`${plain}${t().recipes.originEditedByAiSuffix}`);
      expect(glyphsOf(edited.root)).toEqual([w.mark, ProvenanceMark.Ai]);

      const link = edited.root.findAll((n) => n.props['accessibilityRole'] === 'link' && typeof n.props['onPress'] === 'function')[0];
      (link?.props['onPress'] as () => void)();
      expect(open).toHaveBeenCalledWith(VIDEO);
      open.mockRestore();
    });

    it('reads the English copy the prototype wrote', () => {
      expect(t().recipes.originYoutubeDetailLabel).toBe('Imported from the {handle} channel on YouTube');
      expect(t().recipes.originFacebookDetailLabel).toBe('Imported from {handle} on Facebook');
      expect(t().recipes.originEditedByAiSuffix).toBe(', edited with AI');
    });

    it('calls a recipe a model wrote from a prompt "written", never "edited"', () => {
      const { root } = renderComponent(<ProvenanceNote marks={[ProvenanceMark.Ai]} />);
      expect(textOf(root)).toContain(t().recipes.originAiDetailLabel);
      expect(textOf(root)).not.toContain(t().recipes.originEditedByAiSuffix);
    });

    it('names a channel without a link when the video address is unknown', () => {
      const { root } = renderComponent(<ProvenanceNote marks={[ProvenanceMark.YouTube]} sourceHandle={HANDLE} />);
      expect(textOf(root)).toContain(t().recipes.originYoutubeDetailLabel.replace('{handle}', HANDLE));
      expect(root.findAll((n) => n.props['accessibilityRole'] === 'link')).toHaveLength(0);
    });
  });

  it('draws nothing for a hand-written recipe', () => {
    const { root } = renderComponent(<ProvenanceNote marks={[]} sourceHandle={HANDLE} />);
    expect(glyphsOf(root)).toEqual([]);
    expect(textOf(root)).not.toContain(HANDLE);
  });
});
