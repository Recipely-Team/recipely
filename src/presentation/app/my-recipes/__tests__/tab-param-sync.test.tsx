/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
const mockParams: { tab?: string } = {};
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams }));

import { act, create } from 'react-test-renderer';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { useMyRecipesTab } from '@presentation/app/my-recipes/hooks/use-my-recipes-tab';

/**
 * "Asistan taslaklar listeniz burada dedi ama gitmedi."
 *
 * My Recipes is a tab, so it stays mounted. The tab was seeded from the route
 * param with a `useState` INITIALISER, which runs once — so every navigation
 * after the first left the user on whichever tab they already had, while the
 * assistant's navigate had genuinely succeeded and reported so.
 *
 * The screen itself needs the whole store graph to render, so this drives the
 * real `useMyRecipesTab` with a stubbed route param: a changed param moves the
 * tab, a user's own tap is not dragged back.
 */
const mount = (initial: string | undefined) => {
  mockParams.tab = initial;
  const box: { tab: TabType | null; setTab: ((t: TabType) => void) | null } = { tab: null, setTab: null };
  const Probe = (): null => {
    const [tab, setTab] = useMyRecipesTab();
    box.tab = tab;
    box.setTab = setTab;
    return null;
  };
  let renderer!: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Probe />);
  });
  return {
    box,
    rerender: (next: string | undefined) => {
      mockParams.tab = next;
      act(() => renderer.update(<Probe />));
    },
  };
};

describe('My Recipes tab, seeded from the route param', () => {
  it('opens on the tab the route names, and on Saved for an unknown one', () => {
    expect(mount(TabType.Liked).box.tab).toBe(TabType.Liked);
    expect(mount('nonsense').box.tab).toBe(TabType.Saved);
  });

  it('moves to drafts when a later navigation changes the param', () => {
    const { box, rerender } = mount(TabType.Saved);
    expect(box.tab).toBe(TabType.Saved);

    // Exactly what `router.navigate('/my-recipes?tab=drafts')` produces on an already-mounted screen.
    rerender(TabType.Drafts);

    expect(box.tab).toBe(TabType.Drafts);
  });

  it('does not drag the user back when they tap a tab themselves', () => {
    const { box, rerender } = mount(TabType.Drafts);

    act(() => box.setTab?.(TabType.Saved));
    expect(box.tab).toBe(TabType.Saved);

    // A re-render with the SAME param must not undo the tap.
    rerender(TabType.Drafts);
    expect(box.tab).toBe(TabType.Saved);
  });

  it('keeps the current tab when the param is dropped from the route', () => {
    const { box, rerender } = mount(TabType.Created);

    rerender(undefined);

    expect(box.tab).toBe(TabType.Created);
  });
});
