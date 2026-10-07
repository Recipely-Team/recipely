/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
const mockDraftRenders = jest.fn();
// Memoised like the real card: `FlatList` (outside `strictMode`) calls `renderItem` for every
// visible cell on each of its renders, so only stable props let a row bail out.
jest.mock('@presentation/app/my-recipes/items/draft-card', () => {
  const { memo } = jest.requireActual<typeof import('react')>('react');
  return {
    DraftCard: memo((props: unknown) => {
      mockDraftRenders(props);
      return null;
    }),
  };
});

import { useState } from 'react';
import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { MyRecipesList, type MyRecipesListProps } from '@presentation/app/my-recipes/body/my-recipes-list';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';

/**
 * **Render storm: every re-render of My Recipes re-rendered every draft row.** Each row got
 * fresh `onOpen` / `onDelete` arrows (and the list an inline `ItemSeparatorComponent`, which
 * remounted), so no row could bail out. Rows are memoised now and take the screen's stable
 * id handlers.
 */
const draftOf = (id: string): RecipeDraft => ({
  id,
  ownerId: 'u1',
  prompt: 'a quick pasta',
  snapshot: { name: `Draft ${id}`, ingredients: ['pasta'] },
  chatHistory: [],
  createdAt: new Date('2026-07-01T10:00:00.000Z'),
  updatedAt: new Date('2026-07-02T10:00:00.000Z'),
});

const props: MyRecipesListProps = {
  scrollable: { ref: () => undefined, onScroll: () => undefined, scrollEventThrottle: 100 },
  tab: TabType.Drafts,
  drafts: [draftOf('d1'), draftOf('d2')],
  items: [],
  gridColumns: 1,
  isExpanded: false,
  isSaved: () => false,
  onToggleSave: jest.fn(),
  onOpenRecipe: jest.fn(),
  onOpenDraft: jest.fn(),
  onDeleteDraft: jest.fn(),
  isRefreshing: false,
  onRefresh: jest.fn(),
  onDraftsEndReached: jest.fn(),
  isFirstLoad: false,
  loadFailure: null,
  isLoadingMoreDrafts: false,
};

describe('MyRecipesList — re-renders', () => {
  it('does not re-render the draft rows when the screen re-renders with the same data', () => {
    const screen: { bump: () => void } = { bump: () => undefined };
    const Screen = (): React.JSX.Element => {
      const [, setTick] = useState(0);
      screen.bump = () => setTick((n) => n + 1);
      return <MyRecipesList {...props} />;
    };
    renderComponent(<Screen />);
    mockDraftRenders.mockClear();

    act(() => screen.bump());
    act(() => screen.bump());

    expect(mockDraftRenders).not.toHaveBeenCalled();
  });
});
