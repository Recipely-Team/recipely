import { act, create } from 'react-test-renderer';
import { useEffect, useRef, useState } from 'react';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { parseTabParam } from '@presentation/app/my-recipes/model/parse-tab-param';

/**
 * "Asistan taslaklar listeniz burada dedi ama gitmedi."
 *
 * My Recipes is a tab, so it stays mounted. The tab was seeded from the route
 * param with a `useState` INITIALISER, which runs once — so every navigation
 * after the first left the user on whichever tab they already had, while the
 * assistant's navigate had genuinely succeeded and reported so.
 *
 * The screen itself needs the whole store graph to render, so this pins the
 * rule that was wrong rather than the screen: a changed param moves the tab, a
 * user's own tap is not dragged back.
 */
const useTabFromParam = (tabParam: string | undefined) => {
  const [tab, setTab] = useState<TabType>(() => parseTabParam(tabParam));
  const last = useRef(tabParam);
  useEffect(() => {
    if (tabParam === last.current) return;
    last.current = tabParam;
    if (tabParam !== undefined) setTab(parseTabParam(tabParam));
  }, [tabParam]);
  return [tab, setTab] as const;
};

const mount = (initial: string | undefined) => {
  const box: { tab: TabType | null; setTab: ((t: TabType) => void) | null } = { tab: null, setTab: null };
  const Probe = ({ tabParam }: { tabParam: string | undefined }): null => {
    const [tab, setTab] = useTabFromParam(tabParam);
    box.tab = tab;
    box.setTab = setTab;
    return null;
  };
  let renderer!: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Probe tabParam={initial} />);
  });
  return {
    box,
    rerender: (next: string | undefined) => act(() => renderer.update(<Probe tabParam={next} />)),
  };
};

describe('My Recipes tab, seeded from the route param', () => {
  it('moves to drafts when a later navigation changes the param', () => {
    const { box, rerender } = mount(TabType.Saved);
    expect(box.tab).toBe(TabType.Saved);

    // Exactly what `router.navigate('/my-recipes?tab=drafts')` produces on an
    // already-mounted screen. Before the fix this stayed on Saved.
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
});
