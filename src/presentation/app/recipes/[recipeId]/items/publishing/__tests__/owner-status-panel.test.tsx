/**
 * The owner's status panel: one state per moderation answer, the website
 * import checklist, and the rule the backend enforces — a rejected recipe is
 * never offered for publishing again.
 */

import { act } from 'react-test-renderer';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { OwnerStatusPanel } from '@presentation/app/recipes/[recipeId]/items/publishing/owner-status-panel';
import { configureRecipeDetailStore } from '@application/recipes/detail/recipe-detail-store';
import { configureRecipePublishingStore } from '@application/recipes/publishing/recipe-publishing-store';
import { GetRecipeUseCase } from '@application/recipes/detail/get-recipe-use-case';
import { AddRecipePhotoUseCase } from '@application/recipes/photos/add-recipe-photo-use-case';
import { RemoveRecipePhotoUseCase } from '@application/recipes/photos/remove-recipe-photo-use-case';
import { RemoveRecipeCoverUseCase } from '@application/recipes/photos/remove-recipe-cover-use-case';
import { PublishRecipeUseCase } from '@application/recipes/publishing/publish-recipe-use-case';
import { UnpublishRecipeUseCase } from '@application/recipes/publishing/unpublish-recipe-use-case';
import { EditRecipeUseCase } from '@application/recipes/edit/edit-recipe-use-case';
import { FakeRecipeRepository } from '@application/__fixtures__/fake-recipe-repository';
import { recipeEntityOf } from '@application/__fixtures__/recipe-entity-of';
import type { RecipeEntityProps } from '@domain/recipes/recipe-entity-props';
import { t } from '@presentation/i18n';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return { Ionicons: Icon, MaterialCommunityIcons: Icon };
});

jest.mock('@presentation/base/feedback/show-toast', () => ({
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
  showWarningToast: jest.fn(),
  showDangerToast: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

const render = (overrides: Partial<RecipeEntityProps> = {}) => {
  const recipe = recipeEntityOf(overrides);
  const repo = new FakeRecipeRepository();
  const publish = jest.spyOn(repo, 'publishRecipe');
  const recipeDetailStore = configureRecipeDetailStore({
    getRecipe: new GetRecipeUseCase(repo),
    addRecipePhoto: new AddRecipePhotoUseCase(repo),
    removeRecipePhoto: new RemoveRecipePhotoUseCase(repo),
    removeRecipeCover: new RemoveRecipeCoverUseCase(repo),
  });
  recipeDetailStore.getState().put(recipe);
  const recipePublishingStore = configureRecipePublishingStore({
    publishRecipe: new PublishRecipeUseCase(repo),
    unpublishRecipe: new UnpublishRecipeUseCase(repo),
    editRecipe: new EditRecipeUseCase(repo),
    recipeDetailStore,
  });
  const onAddPhoto = jest.fn();
  const result = renderComponent(<OwnerStatusPanel recipe={recipe} onAddPhoto={onAddPhoto} />, {
    recipeDetailStore,
    recipePublishingStore,
  });
  return { ...result, publish, onAddPhoto };
};

const button = (root: RenderResult['root'], label: string) =>
  root.findAll((n) => n.props['accessibilityRole'] === 'button' && n.props['accessibilityLabel'] === label)[0];

beforeEach(() => jest.clearAllMocks());

describe('OwnerStatusPanel — one panel per state', () => {
  it('private: says only you can see it, offers Publish and Edit', () => {
    const { root } = render();
    const texts = textContent(root);

    expect(texts).toContain(t().publishing.privateNote);
    expect(button(root, t().publishing.publish)).toBeDefined();
    expect(button(root, t().publishing.edit)).toBeDefined();
  });

  it('in review: offers Make private and nothing else', () => {
    const { root } = render({ moderationStatus: 'pending' });

    expect(textContent(root)).toContain(t().publishing.inReviewNote);
    expect(button(root, t().publishing.makePrivate)).toBeDefined();
    expect(button(root, t().publishing.publish)).toBeUndefined();
  });

  it('published: says everyone can see it and offers Unpublish', () => {
    const { root } = render({ isPublished: true, moderationStatus: 'approved' });

    expect(textContent(root)).toContain(t().publishing.publishedNote);
    expect(button(root, t().publishing.unpublish)).toBeDefined();
  });

  it('rejected: stays private, and never offers to publish again', () => {
    const { root } = render({ moderationStatus: 'rejected' });
    const texts = textContent(root);

    expect(texts).toContain(t().publishing.rejectedTitle);
    expect(texts).toContain(t().publishing.rejectedNote);
    expect(button(root, t().publishing.publish)).toBeUndefined();
    expect(button(root, t().publishing.edit)).toBeUndefined();
  });
});

describe('OwnerStatusPanel — website import checklist', () => {
  it('lists what is still needed and keeps Publish disabled, saying how many are left', () => {
    const { root } = render({ publishBlockers: ['photo', 'ingredients'] });
    const texts = textContent(root);

    expect(texts).toContain(t().publishing.checklistIntro);
    expect(texts).toContain(t().publishing.needPhoto);
    expect(texts).toContain(t().publishing.needIngredients);
    expect(texts).not.toContain(t().publishing.needInstructions);
    const publish = button(root, t().publishing.thingsLeft.replace('{n}', '2'));
    expect(publish?.props['disabled']).toBe(true);
    expect(button(root, t().publishing.removeSitePhoto)).toBeDefined();
  });

  it("the photo row's add action opens the gallery's photo flow", () => {
    const { root, onAddPhoto } = render({ publishBlockers: ['photo'] });

    act(() => (button(root, t().publishing.addPhoto)?.props['onPress'] as () => void)());

    expect(onAddPhoto).toHaveBeenCalled();
  });

  it('a wording row opens the editor on this recipe', () => {
    const { root } = render({ publishBlockers: ['instructions'] });

    const edits = root.findAll(
      (n) => n.props['accessibilityRole'] === 'button' && n.props['accessibilityLabel'] === t().publishing.edit,
    );
    act(() => (edits[0]?.props['onPress'] as () => void)());

    expect(mockPush).toHaveBeenCalledWith('/create-recipe?editRecipeId=recipe-1');
  });
});

describe('OwnerStatusPanel — publishing asks first', () => {
  it('Publish opens the confirmation, and only its confirm sends the request', async () => {
    const { root, publish } = render();

    act(() => (button(root, t().publishing.publish)?.props['onPress'] as () => void)());
    expect(publish).not.toHaveBeenCalled();
    expect(textContent(root)).toContain(t().assistant.publishTitle);

    // The sheet's confirm is drawn after the panel's own Publish, which shares the word.
    const confirms = root.findAll(
      (n) =>
        n.props['accessibilityRole'] === 'button' &&
        n.props['accessibilityLabel'] === t().assistant.publishConfirm &&
        typeof n.props['onPress'] === 'function',
    );
    await act(async () => {
      (confirms[confirms.length - 1]?.props['onPress'] as () => void)();
    });

    expect(publish).toHaveBeenCalledWith('recipe-1');
  });
});
