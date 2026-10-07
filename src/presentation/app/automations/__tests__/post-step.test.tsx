import { act } from 'react-test-renderer';
import { ok } from '@core/result/result-helpers';
import type { InstagramMedia } from '@domain/instagram/instagram-media';
import { configureAutomationsStore } from '@application/instagram/automations-store';
import { ListDmRulesUseCase } from '@application/instagram/rules/list-dm-rules-use-case';
import { GetDmRuleUseCase } from '@application/instagram/rules/get-dm-rule-use-case';
import { SaveDmRuleUseCase } from '@application/instagram/rules/save-dm-rule-use-case';
import { SetDmRuleEnabledUseCase } from '@application/instagram/rules/set-dm-rule-enabled-use-case';
import { DeleteDmRuleUseCase } from '@application/instagram/rules/delete-dm-rule-use-case';
import { ListInstagramMediaUseCase } from '@application/instagram/rules/list-instagram-media-use-case';
import { ListDmSendsUseCase } from '@application/instagram/activity/list-dm-sends-use-case';
import { SearchRecipeGroupUseCase } from '@application/diary/foods/search/search-recipe-group-use-case';
import { fakeFoodCatalogRepository, pageOf } from '@application/diary/foods/__fixtures__/food-fixtures';
import { fakeInstagramRepository } from '@application/instagram/__fixtures__/instagram-fixtures';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { PostStep } from '@presentation/app/automations/edit/body/post-step';

const post = (id: string, thumbnailUrl: string | null, mediaType: InstagramMedia['mediaType'] = 'IMAGE'): InstagramMedia => ({
  id, mediaType, thumbnailUrl, caption: null, permalink: null,
});

const scrollable = { ref: () => undefined, onScroll: () => undefined, scrollEventThrottle: 16 };

const setup = () => {
  const repo = fakeInstagramRepository();
  repo.listMedia.mockResolvedValue(ok(pageOf([post('a', null), post('b', null, 'CAROUSEL_ALBUM'), post('c', 'https://cdn.test/c.jpg', 'VIDEO')], 1, 3, 9)));
  const automationsStore = configureAutomationsStore({
    listRules: new ListDmRulesUseCase(repo),
    getRule: new GetDmRuleUseCase(repo),
    saveRule: new SaveDmRuleUseCase(repo),
    setEnabled: new SetDmRuleEnabledUseCase(repo),
    deleteRule: new DeleteDmRuleUseCase(repo),
    listMedia: new ListInstagramMediaUseCase(repo),
    listSends: new ListDmSendsUseCase(repo),
    searchMyRecipes: new SearchRecipeGroupUseCase(fakeFoodCatalogRepository()),
  });
  const mount = async () => {
    const view = renderComponent(<PostStep scrollable={scrollable} handle="@mert" selected={null} onSelect={jest.fn()} />, {
      automationsStore,
    } as unknown as Partial<ApplicationStores>);
    await act(async () => undefined);
    return view;
  };
  return { repo, mount };
};

const tiles = (view: Awaited<ReturnType<ReturnType<typeof setup>['mount']>>) =>
  view.root.findAll((n) => n.props.accessibilityRole === 'radio' && typeof n.props.onPress === 'function');

// On a device the picker was empty on first open, and showed one post after reopening.
describe('PostStep', () => {
  it('shows every post of the first page on first open, a post without a cover as a glyph tile', async () => {
    const { repo, mount } = setup();
    const view = await mount();
    expect(repo.listMedia).toHaveBeenCalledWith(1, 9);
    expect(tiles(view)).toHaveLength(3);
    const glyphs = view.root.findAll((n) => n.props.name === 'image-outline' || n.props.name === 'albums-outline');
    expect(glyphs.length).toBeGreaterThanOrEqual(2);
  });

  it('shows them all again when the picker is opened a second time', async () => {
    const { repo, mount } = setup();
    (await mount()).renderer.unmount();
    const again = await mount();
    expect(repo.listMedia).toHaveBeenCalledTimes(2);
    expect(tiles(again)).toHaveLength(3);
  });
});
