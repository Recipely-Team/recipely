import { Linking } from 'react-native';
import { act, type ReactTestInstance } from 'react-test-renderer';
import { CreatorTag } from '@domain/creators/creator-tag';
import { creatorSummaryOf } from '@application/__fixtures__/creator-summary-of';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { CreatorCard } from '@presentation/base/widgets/creators/creator-card';
import { CreatorTagChip } from '@presentation/base/widgets/creators/creator-tag-chip';
import { CreatorBadge } from '@presentation/base/widgets/creators/creator-badge';
import { t } from '@presentation/i18n';

const pressable = (root: ReactTestInstance, role: string): ReactTestInstance =>
  root.find((node) => node.props.accessibilityRole === role && typeof node.props.onPress === 'function');

const tagOf = (platform: string, handle: string): CreatorTag => {
  const tag = CreatorTag.create(platform, handle);
  if (!tag.ok) throw new Error('fixture tag invalid');
  return tag.value;
};

// AppThemeProvider hydrates its preference asynchronously; let it settle inside act.
afterEach(async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
});

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
    expect(link.props.accessibilityLabel).toBe(
      t().creators.verifiedAccount.replace('{platform}', 'TikTok').replace('{handle}', '@sefkerem'),
    );
    openURL.mockRestore();
  });
});

describe('CreatorCard', () => {
  it('shows name, handle, recipes and followers, and opens the creator', () => {
    const onOpen = jest.fn();
    const creator = creatorSummaryOf('9');
    const { root } = renderComponent(<CreatorCard creator={creator} onOpen={onOpen} />);

    const caption = t()
      .creators.cardCaption.replace('{recipes}', String(creator.recipeCount))
      .replace('{followers}', String(creator.followerCount));
    expect(textContent(root)).toEqual(expect.arrayContaining(['Creator 9', '@chef_9', caption]));
    act(() => (pressable(root, 'button').props.onPress as () => void)());
    expect(onOpen).toHaveBeenCalledWith('9');
  });
});

describe('CreatorBadge', () => {
  it('names itself an approved creator', () => {
    const { root } = renderComponent(<CreatorBadge size={22} />);

    expect(root.findAll((n) => n.props.accessibilityLabel === t().creators.approvedBadge).length).toBeGreaterThan(0);
  });
});
