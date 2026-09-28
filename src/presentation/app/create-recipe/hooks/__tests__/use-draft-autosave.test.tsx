import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { useDraftAutosave } from '@presentation/app/create-recipe/hooks/use-draft-autosave';
import { emptyEditable } from '@presentation/app/create-recipe/model/drafting/empty-editable';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';

/**
 * The bug behind `cancel`: "leave without saving" appeared to do nothing — the
 * draft was still in My Recipes afterwards. The delete was racing the debounced
 * autosave. The user's last keystroke had armed a 500ms timer; tapping discard
 * within that window sent the delete, and the timer then fired and upserted the
 * draft straight back into the list it had just been removed from.
 */

const withContent = (): EditableRecipe => ({ ...emptyEditable(), name: 'Garlic Pasta' });

interface Driver {
  cancel: () => void;
  flush: () => Promise<void>;
  upsert: jest.Mock;
}

// Rendered bare rather than through `renderComponent`: this hook needs no
// theme or safe-area provider, and mounting the theme one under fake timers
// leaves its async hydration unresolved past the end of the test.
const drive = (recipe: EditableRecipe = withContent()): Driver => {
  const upsert = jest.fn().mockResolvedValue(undefined);
  let autosave!: ReturnType<typeof useDraftAutosave>;

  const Probe = (): null => {
    autosave = useDraftAutosave({
      enabled: true,
      draftId: 'draft-1',
      prompt: 'a quick garlic pasta',
      recipe,
      carried: undefined,
      chatHistory: [],
      upsertDraft: upsert,
    });
    return null;
  };

  act(() => {
    renderer = create(<Probe />);
  });

  return { cancel: () => autosave.cancel(), flush: () => autosave.flush(), upsert };
};

let renderer: ReactTestRenderer | null = null;

describe('useDraftAutosave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    renderer = null;
  });

  afterEach(() => {
    act(() => {
      renderer?.unmount();
    });
    jest.useRealTimers();
  });

  it('persists the draft once the edits settle', () => {
    const { upsert } = drive();

    act(() => {
      jest.runAllTimers();
    });

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'draft-1' }));
  });

  it('does not persist a draft with nothing in it', () => {
    const { upsert } = drive(emptyEditable());

    act(() => {
      jest.runAllTimers();
    });

    expect(upsert).not.toHaveBeenCalled();
  });

  it('cancel stops a save that was already pending', () => {
    const { cancel, upsert } = drive();

    // Exactly the discard case: the timer is armed and has not fired yet.
    cancel();
    act(() => {
      jest.runAllTimers();
    });

    expect(upsert).not.toHaveBeenCalled();
  });

  it('cancel is permanent, so a later re-arm cannot resurrect the draft either', () => {
    const { cancel, upsert } = drive();

    cancel();
    act(() => {
      jest.runAllTimers();
    });
    // The screen stays mounted until the delete resolves and the route pops;
    // any re-render in between must not start saving again.
    act(() => {
      jest.runAllTimers();
    });

    expect(upsert).not.toHaveBeenCalled();
  });

  /**
   * The Save race: tapping Save inside the 500ms window sent the create with
   * `fromDraftId` pointing at a draft that did not exist yet, so the server
   * could not tell a model wrote it (no AI mark); the timer then fired AFTER
   * the save had retired the draft and put a ghost copy back in the list.
   */
  it('flush writes a pending save now, and only once', async () => {
    const { flush, upsert } = drive();

    await act(async () => {
      await flush();
    });
    act(() => {
      jest.runAllTimers();
    });

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'draft-1', prompt: 'a quick garlic pasta' }));
  });

  it('flush does nothing when no save is pending', async () => {
    const { flush, upsert } = drive(emptyEditable());

    await act(async () => {
      await flush();
    });

    expect(upsert).not.toHaveBeenCalled();
  });
});
