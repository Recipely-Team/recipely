import type { BoundStore } from '@application/store/bound-store';
/**
 * Regression tests for the failure path of `useRecipeGeneration.runGenerate`.
 *
 * The bug: when `/recipes/generate` failed, the hook dropped back to the prompt
 * phase silently — the failure only ever landed in `chatHistory`, which the
 * prompt phase does not render. The user tapped "Generate", watched the
 * checklist, and was returned to an unchanged screen with no explanation. A
 * prompt refused by the backend (422 -> ValidationFailure) was the worst case:
 * nothing told the user that rephrasing was the fix.
 *
 * Note on the copy: the backend now NAMES its errors (`failure.messageKey`), so a
 * 4xx no longer reads as one blanket sentence. A refused prompt
 * (`errors.ai.prompt_rejected`) says "reword it"; an unusable AI response
 * (`errors.ai.invalid_response`) says "your prompt was fine, generate again" —
 * both arrive as `unprocessable` → ValidationFailure, and only the key tells them
 * apart. The `createRecipe.aiPromptFailed` blanket copy survives for exactly one
 * case: a 4xx carrying NO key we recognise (an older backend, a brand-new server
 * key). The tests below pin down all three.
 *
 * Harness: the repo has no @testing-library/react-native — presentation hooks are
 * driven through a probe component rendered with `renderComponent` (react-test-
 * renderer + theme/safe-area providers), exactly as use-save-recipe.test.tsx does.
 * The stores are the REAL Zustand stores wired to the `FakeRecipeRepository`
 * fixture, so these tests exercise hook -> store -> use case -> repository end to
 * end. Only `show-toast` is module-mocked, since it is the observable effect
 * under test.
 */

import { useState } from 'react';
import { act } from 'react-test-renderer';
import { ErrorMessageKey, NetworkFailure, UnknownFailure, ValidationFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import { Difficulty } from '@domain/recipes/difficulty';
import { FakeRecipeRepository } from '@application/__fixtures__/fake-recipe-repository';
import type { FakeRecipeRepositoryConfig } from '@application/__fixtures__/fake-recipe-repository-config';
import { GenerateRecipeUseCase } from '@application/recipes/generate/generate-recipe-use-case';
import { configureCreatedRecipesStore } from '@application/recipes/my-recipes/created-recipes-store';
import { configureDraftsStore } from '@application/drafts/drafts-store';
import type { CreateRecipeUseCase } from '@application/recipes/create/create-recipe-use-case';
import type { ListMyRecipesUseCase } from '@application/recipes/my-recipes/list-my-recipes-use-case';
import { RefineRecipeUseCase } from '@application/recipes/refine/refine-recipe-use-case';
import type { ImportInstagramRecipeUseCase } from '@application/recipes/import/import-instagram-recipe-use-case';
import type { DeleteRecipeUseCase } from '@application/recipes/delete/delete-recipe-use-case';
import type { ListDraftsUseCase } from '@application/drafts/list/list-drafts-use-case';
import type { GetLatestDraftUseCase } from '@application/drafts/read/get-latest-draft-use-case';
import type { GetDraftUseCase } from '@application/drafts/read/get-draft-use-case';
import type { UpsertDraftUseCase } from '@application/drafts/write/upsert-draft-use-case';
import type { DeleteDraftUseCase } from '@application/drafts/write/delete-draft-use-case';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { showDangerToast, showErrorToast } from '@presentation/base/feedback/show-toast';
import { useRecipeGeneration } from '@presentation/app/create-recipe/hooks/use-recipe-generation';
import { emptyEditable } from '@presentation/app/create-recipe/model/drafting/empty-editable';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { en } from '@presentation/i18n/locales/en';
import { RoutePaths } from '@presentation/base/constants';
import type { RecipeDetailStoreState } from '@application/recipes/detail/recipe-detail-store-state';
import type { RecipeListStoreState } from '@application/recipes/list/recipe-list-store-state';

// ─── module mocks ────────────────────────────────────────────────────────────

jest.mock('@presentation/base/feedback/show-toast', () => ({
  showDangerToast: jest.fn(),
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
}));

// A STABLE router object, so a test can assert on the navigation a flow
// performs — `useRouter` handing back a fresh mock per render made that
// impossible to observe.
const mockRouter = {
  replace: jest.fn(),
  back: jest.fn(),
  // Default: there IS somewhere to go back to. The screen opened by a
  // share intent on a cold start is the case where there is not.
  canGoBack: jest.fn(() => true),
};

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => mockRouter),
}));

// ─── fixtures ────────────────────────────────────────────────────────────────

const PROMPT = 'a quick garlic pasta';

const makeRecipe = (): RecipeEntity => {
  const result = RecipeEntity.create({
    id: 'r-generated',
    name: 'Garlic Pasta',
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    ingredients: ['pasta', 'garlic'],
    instructions: ['boil', 'toss'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 2,
    caloriesPerServing: 0,
    image: 'https://cdn.example.com/r1.webp',
    media: [{ type: 'image', url: 'https://cdn.example.com/r1.webp' }],
    rating: 4.5,
    tags: [],
    mealType: [],
    ownerId: 'owner-1',
    likeCount: 0,
    likedByMe: false,
    viewCount: 0,
    moderationStatus: 'approved',
    commentCount: 0,
  });
  if (!result.ok) throw new Error('failed to build Recipe fixture');
  return result.value;
};

// What the backend prompt moderator returns as a 422: `message` is the server's
// own sentence, `messageKey` the stable catalogue key the client selects copy from.
const rejectedPrompt = (): FakeRecipeRepositoryConfig => ({
  generateRecipeResult: fail(
    new ValidationFailure(
      'Your prompt was flagged as inappropriate.',
      undefined,
      ErrorMessageKey.aiPromptRejected,
    ),
  ),
});

// The other 422 that used to be indistinguishable from the moderation one: the AI
// answered with something unusable. Nothing is wrong with the prompt — retrying is
// the fix, and the copy must say so.
const unusableAiResponse = (): FakeRecipeRepositoryConfig => ({
  generateRecipeResult: fail(
    new ValidationFailure(
      'The AI returned an unexpected response.',
      undefined,
      ErrorMessageKey.aiInvalidResponse,
    ),
  ),
});

// A 4xx with no key at all — an older backend, or a server key this build does not
// know. This is the ONLY case that still gets the blanket "rephrase" copy, and the
// backend's raw sentence must never reach the user.
const genericBadRequest = (): FakeRecipeRepositoryConfig => ({
  generateRecipeResult: fail(new ValidationFailure('HTTP 400')),
});

const offline = (): FakeRecipeRepositoryConfig => ({
  generateRecipeResult: fail(new NetworkFailure('axios ECONNREFUSED')),
});

// Refine hits the same AI endpoint and the same prompt moderator as generate, so
// it can fail the same two ways — and `refineRecipe` collapses both to `null`.
// These pin that the reason still reaches the transcript.
const refineRefused = (): FakeRecipeRepositoryConfig => ({
  generateRecipeResult: ok(makeRecipe()),
  refineRecipeResult: fail(
    new ValidationFailure(
      'Your instruction was flagged as inappropriate.',
      undefined,
      ErrorMessageKey.aiPromptRejected,
    ),
  ),
});

const refineUnusable = (): FakeRecipeRepositoryConfig => ({
  generateRecipeResult: ok(makeRecipe()),
  refineRecipeResult: fail(
    new ValidationFailure(
      'The AI returned an unexpected response.',
      undefined,
      ErrorMessageKey.aiInvalidResponse,
    ),
  ),
});

const generated = (): FakeRecipeRepositoryConfig => ({
  generateRecipeResult: ok(makeRecipe()),
});

// Refine succeeded and the AI narrated what it changed: the RefinedRecipe read
// model carries the preview recipe plus optional `summary` / `suggestion`.
const refineSucceeded = (
  commentary: { summary?: string; suggestion?: string } = {},
): FakeRecipeRepositoryConfig => ({
  generateRecipeResult: ok(makeRecipe()),
  refineRecipeResult: ok({ recipe: makeRecipe(), ...commentary }),
});

// The generate flow never touches these — stubs that satisfy the stores'
// construction-time dependency lists without exercising the sibling flows.
const unusedUseCase = <T,>(): T =>
  ({ execute: () => Promise.resolve(fail(new UnknownFailure('not used'))) }) as unknown as T;

const noopCacheStore = <T,>(): T =>
  ({ getState: () => ({ replace: () => undefined, remove: () => undefined }) }) as unknown as T;

/**
 * Real createdRecipesStore + draftsStore, with the generate path wired through
 * the real `GenerateRecipeUseCase` down to a `FakeRecipeRepository` reading
 * `config` on every call.
 */
const makeStores = (
  config: FakeRecipeRepositoryConfig,
  getDraft?: RecipeDraft,
  hold?: Promise<void>,
): Stores => {
  const createdRecipesStore = configureCreatedRecipesStore({
    createRecipeUseCase: unusedUseCase<CreateRecipeUseCase>(),
    listMyRecipesUseCase: unusedUseCase<ListMyRecipesUseCase>(),
    generateRecipeUseCase: new GenerateRecipeUseCase(new FakeRecipeRepository(config)),
    refineRecipeUseCase: new RefineRecipeUseCase(new FakeRecipeRepository(config)),
    importInstagramRecipeUseCase: unusedUseCase<ImportInstagramRecipeUseCase>(),
    deleteRecipeUseCase: unusedUseCase<DeleteRecipeUseCase>(),
    recipeListStore: noopCacheStore<BoundStore<RecipeListStoreState>>(),
    recipeDetailStore: noopCacheStore<BoundStore<RecipeDetailStoreState>>(),
  });

  const draftsStore = configureDraftsStore({
    listDraftsUseCase: unusedUseCase<ListDraftsUseCase>(),
    // The prompt phase asks for a "resume your draft" card on mount; there is none.
    getLatestDraftUseCase: {
      execute: () => Promise.resolve(ok(null)),
    } as unknown as GetLatestDraftUseCase,
    getDraftUseCase: {
      execute: async () => {
        if (hold !== undefined) await hold;
        return getDraft === undefined ? fail(new UnknownFailure('no draft')) : ok(getDraft);
      },
    } as unknown as GetDraftUseCase,
    upsertDraftUseCase: unusedUseCase<UpsertDraftUseCase>(),
    deleteDraftUseCase: unusedUseCase<DeleteDraftUseCase>(),
  });

  return { createdRecipesStore, draftsStore } as unknown as Stores;
};

type Generation = ReturnType<typeof useRecipeGeneration>;

interface HookDriver {
  /** The hook's latest return value (re-read after every act). */
  latest: () => Generation;
  /** Types a prompt into the input and taps Generate. */
  generate: (text?: string) => Promise<void>;
  /** Sends a refine instruction from the preview phase. */
  refine: (instruction: string) => Promise<void>;
  /** Edits the recipe the way the form fields do on the real screen. */
  setRecipe: (update: (prev: EditableRecipe) => EditableRecipe) => void;
}

/** Resuming an existing draft, as `?draftId=` does on the real route. */
interface ResumeOptions {
  draftId: string;
  /** Omitted for a draft that cannot be read — `getDraft` then answers null. */
  getDraft?: RecipeDraft;
  /** Held open to inspect the screen WHILE the draft is still being fetched. */
  hold?: Promise<void>;
}

/**
 * Mounts the hook behind a probe that owns the editable-recipe state (the job
 * `useEditableRecipe` does on the real screen).
 */
const driveHook = (config: FakeRecipeRepositoryConfig, resume?: ResumeOptions): HookDriver => {
  let latest!: Generation;
  let setRecipe!: (update: (prev: EditableRecipe) => EditableRecipe) => void;

  const Probe = (): null => {
    const [recipe, setRecipeState] = useState<EditableRecipe>(emptyEditable());
    setRecipe = setRecipeState;
    latest = useRecipeGeneration({
      recipe,
      setRecipe: setRecipeState,
      activeDraftId: resume?.draftId ?? 'draft-1',
      draftId: resume?.draftId,
    });
    return null;
  };

  renderComponent(
    <StoresProvider value={makeStores(config, resume?.getDraft, resume?.hold)}>
      <Probe />
    </StoresProvider>,
  );

  const generate = async (text: string = PROMPT): Promise<void> => {
    await act(async () => {
      latest.onChangePrompt(text);
    });
    await act(async () => {
      latest.onGenerate();
    });
  };

  const refine = async (instruction: string): Promise<void> => {
    await act(async () => {
      latest.onSubmitRefine(instruction);
    });
  };

  return {
    latest: () => latest,
    generate,
    refine,
    setRecipe: (update) => setRecipe(update),
  };
};

afterEach(() => {
  jest.clearAllMocks();
});

// ─── the regression: a failed generate must reach the user ────────────────────

describe('useRecipeGeneration.runGenerate — the backend refuses the prompt (422 + key)', () => {
  it('sets generateError to the copy written for the failure’s messageKey', async () => {
    const { latest, generate } = driveHook(rejectedPrompt());

    await generate();

    expect(latest().generateError).toBe(en.errors.aiPromptRejected.short);
  });

  it('surfaces the failure through showErrorToast, which derives copy from the same key', async () => {
    const { generate } = driveHook(rejectedPrompt());

    await generate();

    expect(showErrorToast).toHaveBeenCalledTimes(1);
    expect(showDangerToast).not.toHaveBeenCalled();
  });

  it('returns to the prompt phase so the user can rephrase', async () => {
    const { latest, generate } = driveHook(rejectedPrompt());

    await generate();

    expect(latest().phase).toBe('prompt');
  });

  it('never surfaces the backend’s raw sentence', async () => {
    const { latest, generate } = driveHook(rejectedPrompt());

    await generate();

    expect(latest().generateError).not.toContain('flagged as inappropriate.');
  });
});

// The whole point of the key channel: these two 422s used to be one message.
describe('useRecipeGeneration.runGenerate — an unusable AI response (422 + key)', () => {
  it('tells the user to generate again instead of blaming the prompt', async () => {
    const { latest, generate } = driveHook(unusableAiResponse());

    await generate();

    expect(latest().generateError).toBe(en.errors.aiInvalidResponse.short);
    expect(latest().generateError).not.toBe(en.errors.aiPromptRejected.short);
    expect(latest().generateError).not.toBe(en.createRecipe.aiPromptFailed);
  });
});

describe('useRecipeGeneration.runGenerate — a 4xx with no recognised key (older backend)', () => {
  it('falls back to the blanket aiPromptFailed copy', async () => {
    const { latest, generate } = driveHook(genericBadRequest());

    await generate();

    expect(latest().generateError).toBe(en.createRecipe.aiPromptFailed);
    expect(showDangerToast).toHaveBeenCalledWith(en.createRecipe.aiPromptFailed);
  });

  it('never surfaces the backend’s raw message', async () => {
    const { latest, generate } = driveHook(genericBadRequest());

    await generate();

    expect(latest().generateError).not.toContain('HTTP 400');
  });
});

describe('useRecipeGeneration.runGenerate — infrastructure failure', () => {
  it('passes the failure itself to showErrorToast so the copy is selected from its class', async () => {
    const failure = new NetworkFailure('axios ECONNREFUSED');
    const { generate } = driveHook({ generateRecipeResult: fail(failure) });

    await generate();

    expect(showErrorToast).toHaveBeenCalledTimes(1);
    expect(showErrorToast).toHaveBeenCalledWith(failure);
  });

  it('keeps a non-null inline generateError on the prompt phase after a NetworkFailure', async () => {
    const { latest, generate } = driveHook(offline());

    await generate();

    expect(latest().generateError).toBe(en.errors.network.short);
    expect(latest().phase).toBe('prompt');
  });

  it('does not raise the blanket danger toast for a non-validation failure', async () => {
    const { generate } = driveHook(offline());

    await generate();

    expect(showDangerToast).not.toHaveBeenCalled();
  });
});

// ─── the happy path must stay quiet ──────────────────────────────────────────

describe('useRecipeGeneration.runGenerate — success', () => {
  it('moves to the preview phase and leaves generateError null', async () => {
    const { latest, generate } = driveHook(generated());

    await generate();

    expect(latest().phase).toBe('preview');
    expect(latest().generateError).toBeNull();
  });

  it('shows no toast at all when the recipe is generated', async () => {
    const { generate } = driveHook(generated());

    await generate();

    expect(showDangerToast).not.toHaveBeenCalled();
    expect(showErrorToast).not.toHaveBeenCalled();
  });
});

// ─── a failed run must not corrupt the transcript ────────────────────────────

describe('useRecipeGeneration.runGenerate — chat transcript on failure', () => {
  it('leaves the existing transcript intact when a regenerate from preview fails', async () => {
    const config = generated();
    const { latest, generate } = driveHook(config);
    await generate();
    const transcript = latest().chatHistory;
    expect(transcript).toHaveLength(2);

    config.generateRecipeResult = rejectedPrompt().generateRecipeResult;
    await act(async () => {
      latest().onRegenerate();
    });

    // The failure is surfaced by the toast + inline error, NOT by overwriting the
    // transcript the user built in preview.
    expect(latest().chatHistory).toEqual(transcript);
    expect(latest().generateError).toBe(en.errors.aiPromptRejected.short);
  });
});

// ─── the error must not outlive the condition that caused it ─────────────────

// ─── the same regression, on the refine path ─────────────────────────────────
//
// `refineRecipe` returns `RefinedRecipe | null`, so the failure is collapsed at
// the store boundary. The hook has to read it back off `refineState` — otherwise
// a refused instruction and an unusable AI response, the exact pair the
// messageKey channel exists to separate, both read as one flat "couldn't do
// that" in the transcript.

const lastBubble = (history: readonly { content: string }[]): string =>
  history[history.length - 1]?.content ?? '';

describe('useRecipeGeneration.handleRefine — the backend refuses the instruction', () => {
  it('says the instruction was refused, not that the AI misbehaved', async () => {
    const { latest, generate, refine } = driveHook(refineRefused());
    await generate();
    await refine('add horse meat');

    expect(lastBubble(latest().chatHistory)).toBe(en.errors.aiPromptRejected.short);
  });

  it('surfaces the failure through showErrorToast, as generate and import do', async () => {
    const { generate, refine } = driveHook(refineRefused());
    await generate();
    await refine('add horse meat');

    expect(showErrorToast).toHaveBeenCalledTimes(1);
  });

  it('marks the assistant bubble as an error so the transcript renders it as one', async () => {
    const { latest, generate, refine } = driveHook(refineRefused());
    await generate();
    await refine('add horse meat');

    expect(latest().chatHistory[latest().chatHistory.length - 1]?.error).toBe(true);
  });
});

describe('useRecipeGeneration.handleRefine — an unusable AI response', () => {
  it('reads differently from a refused instruction, though both are 422s', async () => {
    const { latest, generate, refine } = driveHook(refineUnusable());
    await generate();
    await refine('make it spicier');

    expect(lastBubble(latest().chatHistory)).toBe(en.errors.aiInvalidResponse.short);
    expect(lastBubble(latest().chatHistory)).not.toBe(en.errors.aiPromptRejected.short);
  });

  it('never puts the backend’s raw sentence in the transcript', async () => {
    const { latest, generate, refine } = driveHook(refineUnusable());
    await generate();
    await refine('make it spicier');

    expect(lastBubble(latest().chatHistory)).not.toContain('unexpected response');
  });
});

// ─── the successful refine must speak in the AI's own words ──────────────────
//
// The backend now narrates each refinement (`summary` + `suggestion` on the
// RefinedRecipe read model). The assistant bubble must carry that narration —
// the canned "Updated!" survives only for an older backend that sends neither.

describe('useRecipeGeneration.handleRefine — success with AI commentary', () => {
  it('puts the summary in the assistant bubble instead of the canned aiUpdated copy', async () => {
    const { latest, generate, refine } = driveHook(
      refineSucceeded({ summary: 'Doubled the garlic.' }),
    );
    await generate();
    await refine('add more garlic');

    expect(lastBubble(latest().chatHistory)).toBe('Doubled the garlic.');
  });

  it('joins summary and suggestion with a blank line', async () => {
    const { latest, generate, refine } = driveHook(
      refineSucceeded({ summary: 'Doubled the garlic.', suggestion: 'Roast it first.' }),
    );
    await generate();
    await refine('add more garlic');

    expect(lastBubble(latest().chatHistory)).toBe('Doubled the garlic.\n\nRoast it first.');
  });

  it('falls back to the aiUpdated copy when the response has no summary', async () => {
    const { latest, generate, refine } = driveHook(refineSucceeded());
    await generate();
    await refine('add more garlic');

    expect(lastBubble(latest().chatHistory)).toBe(en.createRecipe.aiUpdated);
  });

  it('does not mark the commentary bubble as an error and raises no toast', async () => {
    const { latest, generate, refine } = driveHook(
      refineSucceeded({ summary: 'Doubled the garlic.' }),
    );
    await generate();
    await refine('add more garlic');

    expect(latest().chatHistory[latest().chatHistory.length - 1]?.error).toBeUndefined();
    expect(showErrorToast).not.toHaveBeenCalled();
    expect(showDangerToast).not.toHaveBeenCalled();
  });
});

describe('useRecipeGeneration — clearing a stale generateError', () => {
  it('drops the inline error as soon as the user edits the prompt', async () => {
    const { latest, generate } = driveHook(rejectedPrompt());
    await generate();
    expect(latest().generateError).toBe(en.errors.aiPromptRejected.short);

    await act(async () => {
      latest().onChangePrompt('a wholesome family dinner');
    });

    expect(latest().generateError).toBeNull();
  });

  // Tapping an idea chip edits the prompt just as typing does, so it must clear
  // the error too — otherwise the red border outlives the text that caused it.
  it('drops the inline error when the user appends an idea chip', async () => {
    const { latest, generate } = driveHook(rejectedPrompt());
    await generate();
    expect(latest().generateError).toBe(en.errors.aiPromptRejected.short);

    await act(async () => {
      latest().onAppendChip('Vegetarian');
    });

    expect(latest().generateError).toBeNull();
    expect(latest().prompt).toContain('vegetarian');
  });

  it('does not leave a stale error behind when a retry succeeds', async () => {
    // The fake reads `config` on every call, so re-pointing it mid-test is what
    // "the network came back" looks like to the hook.
    const config = offline();
    const { latest, generate } = driveHook(config);
    await generate();
    expect(latest().generateError).toBe(en.errors.network.short);

    config.generateRecipeResult = ok(makeRecipe());
    await act(async () => {
      latest().onRegenerate();
    });

    expect(latest().generateError).toBeNull();
    expect(latest().phase).toBe('preview');
  });
});

// ─── leaving a draft: only ask when there is something to decide ──────────────

/**
 * The bug: opening a saved draft, reading it, and backing out still asked "shall
 * we keep this draft?", and its only non-destructive answer re-saved a draft
 * that was already saved. It asked on every single exit, whether or not the
 * user had touched anything.
 */
describe('useRecipeGeneration.onClose — a draft that was only opened', () => {
  const SNAPSHOT: DraftRecipeSnapshot = {
    name: 'Garlic Pasta',
    ingredients: ['pasta', 'garlic'],
    instructions: ['boil', 'toss'],
  };

  const savedDraft = (): RecipeDraft => ({
    id: 'draft-1',
    ownerId: 'owner-1',
    prompt: PROMPT,
    snapshot: SNAPSHOT,
    chatHistory: [],
    createdAt: new Date(0),
    updatedAt: new Date(0),
  });

  /** Mounts the hook resuming `draft-1`, and settles the load. */
  const driveResumed = async (): Promise<HookDriver> => {
    const driver = driveHook(generated(), {
      draftId: 'draft-1',
      getDraft: savedDraft(),
    });
    await act(async () => {
      await Promise.resolve();
    });
    return driver;
  };

  it('leaves straight away when nothing was changed', async () => {
    const { latest } = await driveResumed();
    // Guards the assertion below from passing for the wrong reason: an empty
    // editor would also skip the dialog, so the draft has to have loaded.
    expect(latest().phase).toBe('preview');
    expect(latest().prompt).toBe(PROMPT);

    act(() => {
      latest().onClose();
    });

    expect(latest().exitOpen).toBe(false);
  });

  it('asks once the draft has actually been edited', async () => {
    const { latest, setRecipe } = await driveResumed();

    act(() => {
      setRecipe((prev) => ({ ...prev, name: 'Garlic Pasta with chilli' }));
    });
    act(() => {
      latest().onClose();
    });

    expect(latest().exitOpen).toBe(true);
  });

  /**
   * THE REGRESSION: "app kapandı" — closing the screen quit the app.
   *
   * `router.back()` on the only screen in the stack closes the app on Android,
   * and this screen IS the whole stack when it was opened by a share intent or
   * a notification tap on a cold start. The X button, and every exit-dialog
   * answer, walked the user out of Recipely instead of back into it.
   */
  it('goes home rather than out of the app when there is nothing to go back to', async () => {
    mockRouter.canGoBack.mockReturnValueOnce(false);
    const { latest } = await driveResumed();

    act(() => {
      latest().onClose();
    });

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith(RoutePaths.recipes);
  });

  it('goes back normally when there is a screen behind it', async () => {
    const { latest } = await driveResumed();

    act(() => {
      latest().onClose();
    });

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('still asks for a recipe started here, which is in no drafts list yet', async () => {
    const { latest, generate } = driveHook(generated());
    await generate();

    act(() => {
      latest().onClose();
    });

    expect(latest().exitOpen).toBe(true);
  });
});

/**
 * THE REGRESSION: tapping a draft "opened the AI screen and sat there".
 *
 * The hook started every mount in the `prompt` phase and only moved to
 * `preview` once `getDraft` came back. So opening a draft — from the My Recipes
 * drafts tab, or from the "pick up where you left off" card — showed the
 * AI-generate prompt screen for the length of that request. It read as the wrong
 * screen having opened, or as the tap not having registered at all; on a slow
 * connection it lasted seconds.
 *
 * What must hold: a mount that carries a `draftId` NEVER renders the prompt
 * phase. It waits in `resuming` (the editor's skeleton) and moves to `preview`
 * with the draft in hand — or back to `prompt` if the draft cannot be read, so
 * the wait always ends.
 */
describe('useRecipeGeneration — opening a draft', () => {
  const savedDraft = (): RecipeDraft => ({
    id: 'draft-1',
    ownerId: 'owner-1',
    prompt: PROMPT,
    snapshot: { name: 'Garlic Pasta', ingredients: ['pasta'], instructions: ['boil'] },
    chatHistory: [],
    createdAt: new Date(0),
    updatedAt: new Date(0),
  });

  /** A resume whose fetch is held open until the returned `release` is called. */
  const driveHeldResume = ({ draft }: { draft?: RecipeDraft } = { draft: savedDraft() }) => {
    let release!: () => void;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    const driver = driveHook(generated(), {
      draftId: 'draft-1',
      getDraft: draft,
      hold,
    });
    const settle = async (): Promise<void> => {
      release();
      await act(async () => {
        await hold;
        await Promise.resolve();
      });
    };
    return { ...driver, settle };
  };

  it('waits in the resuming phase instead of showing the AI prompt screen', async () => {
    const { latest, settle } = driveHeldResume();

    // The frame the user actually saw while the draft was in flight.
    expect(latest().phase).toBe('resuming');
    expect(latest().phase).not.toBe('prompt');

    await settle();
  });

  it('lands on the preview with the draft once the fetch returns', async () => {
    const { latest, settle } = driveHeldResume();

    await settle();

    expect(latest().phase).toBe('preview');
    expect(latest().prompt).toBe(PROMPT);
  });

  it('drops the draft param on failure, so autosave cannot overwrite the draft that failed to load', async () => {
    // `activeDraftId` is `draftId ?? newDraftId`. Staying on a draft whose read
    // failed — an offline read leaves it intact on the server — pointed the
    // autosave at it, and the next thing typed here would have overwritten it.
    const { settle } = driveHeldResume({});

    await settle();

    expect(mockRouter.replace).toHaveBeenCalledWith(RoutePaths.createRecipe);
  });

  it('falls back to the prompt phase and says so when the draft cannot be read', async () => {
    // `getDraft` collapses a failure to null — a draft deleted on another
    // device, or an offline read. The wait has to END, not shimmer forever.
    const { latest, settle } = driveHeldResume({});

    await settle();

    expect(latest().phase).toBe('prompt');
    expect(showDangerToast).toHaveBeenCalledWith(en.drafts.openFailed);
  });
});
