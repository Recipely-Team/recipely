import { Linking } from 'react-native';
import { act, type ReactTestInstance } from 'react-test-renderer';
import { CreatorTag } from '@domain/creators/creator-tag';
import { creatorSummaryOf } from '@application/__fixtures__/creator-summary-of';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { CreatorCard } from '@presentation/base/widgets/creators/creator-card';
import { CreatorCardSize } from '@presentation/base/widgets/creators/creator-card-size';
import { CreatorTagChip } from '@presentation/base/widgets/creators/creator-tag-chip';
import { creatorGridColumns } from '@presentation/base/widgets/creators/creator-grid-columns';
import { t } from '@presentation/i18n';

const pressable = (root: ReactTestInstance, role: string): ReactTestInstance =>
  root.find((node) => node.props.accessibilityRole === role && typeof node.props.onPress === 'function');

const tagOf = (platform: string, handle: string): CreatorTag => {
  const tag = CreatorTag.create(platform, handle);
  if (!tag.ok) throw new Error('fixture tag invalid');
  return tag.value;
};

describe('CreatorTagChip', () => {
  it('shows the @handle and opens the Instagram account', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { root } = renderComponent(<CreatorTagChip tag={tagOf('instagram', 'aysemutfakta')} />);

    expect(textContent(root)).toContain('@aysemutfakta');
    act(() => (pressable(root, 'link').props.onPress as () => void)());

    expect(openURL).toHaveBeenCalledWith('https://instagram.com/aysemutfakta');
    openURL.mockRestore();
  });

  it('opens a TikTok account at its @ address and says it is verified', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { root } = renderComponent(<CreatorTagChip tag={tagOf('tiktok', 'sefkerem')} />);

    const link = pressable(root, 'link');
    act(() => (link.props.onPress as () => void)());

    expect(openURL).toHaveBeenCalledWith('https://www.tiktok.com/@sefkerem');
    expect(link.props.accessibilityLabel).toContain(t().creators.verified);
    openURL.mockRestore();
  });
});

describe('CreatorCard', () => {
  it('shows name, handle and recipe count, and opens the creator', () => {
    const onOpen = jest.fn();
    const { root } = renderComponent(<CreatorCard creator={creatorSummaryOf('9')} size={CreatorCardSize.Compact} onOpen={onOpen} />);

    expect(textContent(root)).toEqual(
      expect.arrayContaining(['Creator 9', '@chef_9', t().creators.recipeCount.replace('{n}', '1')]),
    );
    act(() => (pressable(root, 'button').props.onPress as () => void)());
    expect(onOpen).toHaveBeenCalledWith('9');
  });
});

describe('creatorGridColumns', () => {
  it('keeps two columns on a phone and six on a desktop column', () => {
    expect(creatorGridColumns(288, 12)).toBe(2);
    expect(creatorGridColumns(1184, 16)).toBe(6);
    expect(creatorGridColumns(3000, 16)).toBe(6);
  });
});
