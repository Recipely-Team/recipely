/**
 * The symptom: "webde fotoğraf ekleme butonu yok."
 *
 * It was not hidden, it was never there. Adding and removing a photo live in
 * `MediaGallery`, which only the MOBILE layout renders — the web detail draws
 * its own hero from `RecipeImage`, so the owner of a recipe got exactly one
 * action on the web: delete. The feature was finished on one surface and the
 * second was never asked about.
 *
 * These assert the control exists for an owner and does not for anyone else,
 * on the layout that did not have it.
 */

/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

// The layout reads the router only to word its back link; a unit test about the
// owner's photo controls has no navigator and does not need one.
jest.mock('expo-router', () => ({
  useRootNavigationState: () => ({ index: 0, routes: [{ name: 'recipes' }] }),
  usePathname: () => '/recipes/r1',
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  Link: ({ children }: { children?: unknown }) => children,
}));

// The page reads the taxonomy store to word cuisine/category labels. A test
// about the owner's photo controls does not need the catalogue, only a store
// shaped like one.
jest.mock('@presentation/bootstrap/use-stores', () => ({
  useStores: () => ({
    taxonomyStore: (select: (s: unknown) => unknown) => select({ cuisines: [], categories: [] }),
    // The owner also gets the status panel, which reads these two.
    recipeDetailStore: (select: (s: unknown) => unknown) =>
      select({ removePhoto: jest.fn(), isPhotoBusy: false }),
    recipePublishingStore: (select: (s: unknown) => unknown) => select({ isBusy: false }),
  }),
}));

import { WebRecipeDetail } from '@presentation/app/recipes/[recipeId]/body/web-recipe-detail';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { GalleryOwnerControls } from '@presentation/app/recipes/[recipeId]/model/gallery-owner-controls';

/** Every accessibility label the layout put on screen. */
const labelsOf = (root: { findAll: (m: (n: { props: Record<string, unknown> }) => boolean) => { props: Record<string, unknown> }[] }): string[] =>
  root
    .findAll((n) => typeof n.props['accessibilityLabel'] === 'string')
    .map((n) => String(n.props['accessibilityLabel']));

const media = [
  { id: 'm1', type: 'IMAGE' as const, url: 'https://cdn.example.com/1.jpg' },
  { id: 'm2', type: 'IMAGE' as const, url: 'https://cdn.example.com/2.jpg' },
];

/** A real entity, so the page's getters answer the way they do in the app. */
const built = RecipeEntity.create({
  id: 'r1',
  name: 'Fırında Sütlaç',
  cuisine: 'TURKISH',
  category: 'DESSERT',
  difficulty: 'EASY',
  ingredients: ['1 litre süt'],
  instructions: ['Pişir.'],
  prepTimeMinutes: 15,
  cookTimeMinutes: 60,
  servings: 6,
  caloriesPerServing: 240,
  image: 'https://cdn.example.com/1.jpg',
  rating: 0,
  tags: [],
  mealType: [],
  media: [],
  ownerId: 'u1',
  isPublished: true,
  moderationStatus: 'approved',
  viewCount: 0,
  likeCount: 0,
  likedByMe: false,
  commentCount: 0,
  createdAt: new Date('2026-09-18T00:00:00.000Z'),
  updatedAt: new Date('2026-09-18T00:00:00.000Z'),
} as never);
if (!built.ok) throw new Error('fixture recipe did not build');
const recipe = built.value;

/** Everything the layout needs to draw; only `photos` is under test. */
const baseProps = {
  recipe,
  media,
  authorState: { status: 'loaded', author: { id: 'u1', displayName: 'Cook', recipeCount: 1 } },
  liked: false,
  likeCount: 0,
  isNutritionCalculating: false,
  userId: 'u1',
  isSaved: false,
  saveDisabled: false,
  onBack: jest.fn(),
  onToggleLike: jest.fn(),
  onToggleSave: jest.fn(),
  onCopyToDraft: jest.fn(),
  onDelete: jest.fn(),
  checkedIngredients: [],
  onToggleIngredient: jest.fn(),
  completedSteps: [false],
  onToggleStep: jest.fn(),
  commentState: undefined,
  commentInput: '',
  submitError: null,
  onChangeCommentInput: jest.fn(),
  onAddComment: jest.fn(),
  onLoadMoreComments: jest.fn(),
  onToggleCommentLike: jest.fn(),
  onDeleteComment: jest.fn(),
  commentHighlight: { highlightedId: null, register: jest.fn(), onLayout: jest.fn() },
};

const render = (photos?: GalleryOwnerControls) =>
  renderComponent(
    <WebRecipeDetail
      {...(baseProps as unknown as React.ComponentProps<typeof WebRecipeDetail>)}
      isOwner={photos !== undefined}
      {...(photos !== undefined ? { photos } : {})}
    />,
  );

const owner = (): GalleryOwnerControls => ({ onAdd: jest.fn(), onRemove: jest.fn(), isBusy: false });

describe('the web recipe detail offers its owner the photo controls', () => {
  it('shows the add-photo control to the owner', () => {
    const { root } = render(owner());

    expect(labelsOf(root)).toContain(t().recipes.addPhoto);
  });

  it('shows the remove control for the photo on screen', () => {
    const { root } = render(owner());

    expect(labelsOf(root)).toContain(t().recipes.removePhoto);
  });

  // Absent rather than disabled, the same call the mobile gallery makes: a
  // control nobody may press is a question the screen answers by looking broken.
  it('offers neither to someone who does not own the recipe', () => {
    const labels = labelsOf(render().root);

    expect(labels).not.toContain(t().recipes.addPhoto);
    expect(labels).not.toContain(t().recipes.removePhoto);
  });

  it('reaches the handler the screen passed in', () => {
    const controls = owner();
    const { root } = render(controls);

    const add = root.findAll(
      (n) => n.props['accessibilityLabel'] === t().recipes.addPhoto && typeof n.props['onPress'] === 'function',
    )[0];
    (add?.props['onPress'] as () => void)();

    expect(controls.onAdd).toHaveBeenCalledTimes(1);
  });
});
