import { useState } from 'react';
import { act } from 'react-test-renderer';
import type { Stores } from '@presentation/bootstrap/stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useFoodSearchQuery } from '@presentation/base/hooks/diary/use-food-search-query';
import { ADD_FOOD_SEARCH_DEBOUNCE_MS } from '@presentation/base/widgets/diary/add-food/list/search-debounce';

describe('useFoodSearchQuery', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  // The debounced value lagged: after clearing "a" and typing "b", "a" was sent again.
  it('sends only the query the box settled on, and a cleared box at once', () => {
    const search = jest.fn(async () => undefined);
    const foodSearchStore = { getState: () => ({ search }) };
    let type: (text: string) => void = () => undefined;
    const Probe = (): null => {
      const [query, setQuery] = useState('');
      type = setQuery;
      useFoodSearchQuery(query);
      return null;
    };
    renderComponent(<Probe />, { foodSearchStore } as unknown as Partial<Stores>);
    expect(search.mock.calls).toEqual([['']]);
    act(() => type('a'));
    act(() => jest.advanceTimersByTime(ADD_FOOD_SEARCH_DEBOUNCE_MS));
    act(() => type(''));
    // Cleared and retyped inside the debounce window: the lagging value is still "a".
    act(() => type('b'));
    expect(search.mock.calls).toEqual([[''], ['a'], ['']]);
    act(() => jest.advanceTimersByTime(ADD_FOOD_SEARCH_DEBOUNCE_MS));
    expect(search.mock.calls).toEqual([[''], ['a'], [''], ['b']]);
  });
});
