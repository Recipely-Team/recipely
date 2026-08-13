/**
 * Behavior tests for `useRefineProposal` — refinement as a proposal.
 *
 * What is being pinned: a refinement used to rewrite the working recipe the
 * moment it arrived, so a vague instruction destroyed work with no way back.
 * Every test here fails against that version, because every one of them asks
 * what the recipe looks like BEFORE a decision is made.
 *
 * Harness: the hook is driven through a probe component with the REAL Zustand
 * store wired to `FakeRecipeRepository`, exercising hook -> store -> use case
 * -> repository end to end.
 */

import { useState } from 'react';
import { act } from 'react-test-renderer';
import type { BoundStore } from '@application/store/bound-store';
import { UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import { ChatRole } from '@domain/drafts/chat-role';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';
import { FakeRecipeRepository } from '@application/__fixtures__/fake-recipe-repository';
import { RefineRecipeUseCase } from '@application/recipes/refine/refine-recipe-use-case';
import { configureCreatedRecipesStore } from '@application/recipes/my-recipes/created-recipes-store';
import type { GenerateRecipeUseCase } from '@application/recipes/generate/generate-recipe-use-case';
import type { CreateRecipeUseCase } from '@application/recipes/create/create-recipe-use-case';
import type { ImportInstagramRecipeUseCase } from '@application/recipes/import/import-instagram-recipe-use-case';
import type { ListMyRecipesUseCase } from '@application/recipes/my-recipes/list-my-recipes-use-case';
import type { DeleteRecipeUseCase } from '@application/recipes/delete/delete-recipe-use-case';
import type { RecipeDetailStoreState } from '@application/recipes/detail/recipe-detail-store-state';
import type { RecipeListStoreState } from '@application/recipes/list/recipe-list-store-state';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useRefineProposal } from '@presentation/app/create-recipe/hooks/use-refine-proposal';
import { emptyEditable } from '@presentation/app/create-recipe/model/drafting/empty-editable';

import type { ChatMessage } from '@domain/drafts/chat-message';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';

jest.mock('@presentation/base/feedback/show-toast', () => ({
  showSuccessToast: jest.fn(),
  showErrorToast: jest.fn(),
}));

// ─── fixtures ────────────────────────────────────────────────────────────────

// Cuisine and category are set to what the fixtures below map to, so a test
// that means "servings and ingredients changed" is not also reporting the two
// fields `emptyEditable()` happens to leave unset.
const original = (): EditableRecipe => ({
  ...emptyEditable(),
  name: 'Garlic Pasta',
  cuisine: CuisineKey.Italian,
  category: RecipeCategory.Dinner,
  ingredients: ['pasta', 'garlic'],
  instructions: ['boil', 'toss'],
  servings: 2,
});

/** The recipe the assistant would write: same dish, four servings, more garlic. */
const refinedEntity = (): RecipeEntity => {
  const result = RecipeEntity.create({
    id: 'r-refined',
    name: 'Garlic Pasta',
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    ingredients: ['pasta', 'garlic', 'chili flakes'],
    instructions: ['boil', 'toss'],
    prepTimeMinutes: 0,
    cookTimeMinutes: 0,
    servings: 4,
    caloriesPerServing: 0,
    image: '',
    media: [],
    rating: 0,
    tags: [],
    mealType: [],
    ownerId: 'owner-1',
    likeCount: 0,
    likedByMe: false,
    viewCount: 0,
    moderationStatus: 'approved',
    commentCount: 0,
  });
  if (!result.ok) throw new Error('failed to build RecipeEntity fixture');
  return result.value;
};

const unusedUseCase = <T,>(): T =>
  ({ execute: () => Promise.resolve(fail(new UnknownFailure('not used'))) }) as unknown as T;

const noopCacheStore = <T,>(): T =>
  ({ getState: () => ({ replace: () => undefined, remove: () => undefined }) }) as unknown as T;

const makeStores = (repo: FakeRecipeRepository): Stores => {
  const createdRecipesStore = configureCreatedRecipesStore({
    createRecipeUseCase: unusedUseCase<CreateRecipeUseCase>(),
    listMyRecipesUseCase: unusedUseCase<ListMyRecipesUseCase>(),
    generateRecipeUseCase: unusedUseCase<GenerateRecipeUseCase>(),
    refineRecipeUseCase: new RefineRecipeUseCase(repo),
    importInstagramRecipeUseCase: unusedUseCase<ImportInstagramRecipeUseCase>(),
    deleteRecipeUseCase: unusedUseCase<DeleteRecipeUseCase>(),
    recipeListStore: noopCacheStore<BoundStore<RecipeListStoreState>>(),
    recipeDetailStore: noopCacheStore<BoundStore<RecipeDetailStoreState>>(),
  });
  return { createdRecipesStore } as unknown as Stores;
};

// ─── probe ───────────────────────────────────────────────────────────────────

interface Probe {
  recipe: () => EditableRecipe;
  chatHistory: () => readonly ChatMessage[];
  proposal: () => ReturnType<typeof useRefineProposal>['proposal'];
  submit: (instruction: string) => void;
  accept: () => void;
  reject: () => void;
}

const mountProbe = (repo: FakeRecipeRepository, seedHistory: ChatMessage[] = []): Probe => {
  // Holds the LATEST render's values. The facade below reads through it rather
  // than closing over one render, which is what makes an assertion made after
  // an update actually see that update.
  let latest: Probe | undefined;

  const Component = (): null => {
    const [recipe, setRecipe] = useState<EditableRecipe>(original());
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>(seedHistory);
    const refine = useRefineProposal({
      recipe,
      setRecipe,
      chatHistory,
      setChatHistory,
      chatExpanded: true,
      refining: false,
    });
    latest = {
      recipe: () => recipe,
      chatHistory: () => chatHistory,
      proposal: () => refine.proposal,
      submit: refine.onSubmitRefine,
      accept: refine.onAcceptProposal,
      reject: refine.onRejectProposal,
    };
    return null;
  };

  renderComponent(
    <StoresProvider value={makeStores(repo)}>
      <Component />
    </StoresProvider>,
  );

  const current = (): Probe => {
    if (latest === undefined) throw new Error('probe did not mount');
    return latest;
  };

  return {
    recipe: () => current().recipe(),
    chatHistory: () => current().chatHistory(),
    proposal: () => current().proposal(),
    submit: (instruction) => current().submit(instruction),
    accept: () => current().accept(),
    reject: () => current().reject(),
  };
};

/**
 * Submits and lets the whole hook -> store -> use case -> repository chain
 * settle. One microtask is not enough: draining the queue is what makes
 * "the recipe is untouched" an assertion about a completed refinement rather
 * than one about a request still in flight.
 */
const flush = async (probe: Probe, instruction: string): Promise<void> => {
  await act(async () => {
    probe.submit(instruction);
    await new Promise((resolve) => setImmediate(resolve));
  });
};

const successRepo = (): FakeRecipeRepository =>
  new FakeRecipeRepository({ refineRecipeResult: ok({ recipe: refinedEntity(), summary: 'Added chili.' }) });

// ─── tests ───────────────────────────────────────────────────────────────────

describe('useRefineProposal — nothing is applied until the cook accepts', () => {
  it('leaves the recipe untouched when the refinement arrives', async () => {
    const probe = mountProbe(successRepo());

    await flush(probe, 'make it spicier');

    expect(probe.recipe().servings).toBe(2);
    expect(probe.recipe().ingredients).toEqual(['pasta', 'garlic']);
  });

  it('offers the change as a proposal describing what would differ', async () => {
    const probe = mountProbe(successRepo());

    await flush(probe, 'make it spicier');

    expect(probe.proposal()?.changes.map((c) => c.field)).toEqual(['servings', 'ingredients']);
  });

  it('applies the recipe only on accept, and clears the proposal', async () => {
    const probe = mountProbe(successRepo());
    await flush(probe, 'make it spicier');

    act(() => probe.accept());

    expect(probe.recipe().servings).toBe(4);
    expect(probe.recipe().ingredients).toEqual(['pasta', 'garlic', 'chili flakes']);
    expect(probe.proposal()).toBeNull();
  });

  it('leaves the recipe as it was on decline', async () => {
    const probe = mountProbe(successRepo());
    await flush(probe, 'make it spicier');

    act(() => probe.reject());

    expect(probe.recipe().servings).toBe(2);
    expect(probe.proposal()).toBeNull();
  });
});

describe('useRefineProposal — the transcript stays honest', () => {
  // WHY: the summary rides back to the backend as history on the next turn.
  // Unmarked, it reads there as an account of a change that never landed.
  it('marks the declined assistant turn so the replay does not claim it happened', async () => {
    const probe = mountProbe(successRepo());
    await flush(probe, 'make it spicier');

    act(() => probe.reject());

    const assistantTurns = probe.chatHistory().filter((m) => m.role === ChatRole.Assistant);
    expect(assistantTurns.at(-1)?.rejected).toBe(true);
  });

  it('leaves an accepted turn unmarked', async () => {
    const probe = mountProbe(successRepo());
    await flush(probe, 'make it spicier');

    act(() => probe.accept());

    const assistantTurns = probe.chatHistory().filter((m) => m.role === ChatRole.Assistant);
    expect(assistantTurns.at(-1)?.rejected).toBeUndefined();
  });

  // WHY: the next instruction is answered against the recipe as it stands —
  // which is the un-accepted one. Leaving the old card up would offer to apply
  // an answer to a question that has moved on.
  it('supersedes a pending proposal when the cook asks for something else', async () => {
    const repo = successRepo();
    const probe = mountProbe(repo);
    await flush(probe, 'make it spicier');

    await flush(probe, 'actually make it vegetarian');

    expect(probe.chatHistory().filter((m) => m.rejected === true)).toHaveLength(1);
    expect(probe.recipe().servings).toBe(2);
  });
});

describe('useRefineProposal — what reaches the backend', () => {
  it('sends the turns leading up to the instruction, excluding the instruction itself', async () => {
    const repo = successRepo();
    const seeded: ChatMessage[] = [
      { role: ChatRole.User, content: 'make it vegetarian' },
      { role: ChatRole.Assistant, content: 'Swapped the beef.' },
    ];
    const probe = mountProbe(repo, seeded);

    await flush(probe, 'and spicier too');

    expect(repo.lastRefineCall?.instruction).toBe('and spicier too');
    expect(repo.lastRefineCall?.history).toEqual(seeded);
  });

  it('does not call the backend for a blank instruction', async () => {
    const repo = successRepo();
    const probe = mountProbe(repo);

    await flush(probe, '   ');

    expect(repo.refineCallCount).toBe(0);
  });
});

describe('useRefineProposal — an answer with nothing in it', () => {
  it('offers no proposal when the assistant returns the recipe unchanged', async () => {
    const unchanged = RecipeEntity.create({
      id: 'r-same',
      name: 'Garlic Pasta',
      cuisine: CuisineKey.Italian,
      category: RecipeCategory.Dinner,
      difficulty: Difficulty.Easy,
      ingredients: ['pasta', 'garlic'],
      instructions: ['boil', 'toss'],
      prepTimeMinutes: 0,
      cookTimeMinutes: 0,
      servings: 2,
      caloriesPerServing: 0,
      image: '',
      media: [],
      rating: 0,
      tags: [],
      mealType: [],
      ownerId: 'owner-1',
      likeCount: 0,
      likedByMe: false,
      viewCount: 0,
      moderationStatus: 'approved',
      commentCount: 0,
    });
    if (!unchanged.ok) throw new Error('fixture');
    const repo = new FakeRecipeRepository({
      refineRecipeResult: ok({ recipe: unchanged.value, summary: 'Nothing to change.' }),
    });
    const probe = mountProbe(repo);

    await flush(probe, 'make it exactly the same');

    expect(probe.proposal()).toBeNull();
    expect(probe.chatHistory().at(-1)?.content).toContain('Nothing to change.');
  });
});
