import { moveScrollTo } from '@presentation/base/hooks/assistant/args/scrolling/move-scroll-to';

/**
 * "Ana sayfada aşağı kaydır dediğimde kaydırmıyor" — and the assistant said it
 * had. The feed attaches its scroll handle in only one of five branches, so in
 * the wide layout, in search results, while loading and on the error state the
 * handle was null; the old helper returned `void` and the optional chain
 * swallowed it, leaving the action free to report success over a list that had
 * not moved a pixel.
 */
describe('moveScrollTo', () => {
  it('reports failure when no list is attached, rather than pretending it scrolled', () => {
    expect(moveScrollTo(null, 400)).toBe(false);
  });

  it('reports failure for a handle that can do none of the three', () => {
    expect(moveScrollTo({}, 400)).toBe(false);
  });

  it('moves a FlatList by offset', () => {
    const scrollToOffset = jest.fn();
    expect(moveScrollTo({ scrollToOffset }, 400)).toBe(true);
    expect(scrollToOffset).toHaveBeenCalledWith({ offset: 400, animated: true });
  });

  it('moves a ScrollView by coordinate', () => {
    const scrollTo = jest.fn();
    expect(moveScrollTo({ scrollTo }, 400)).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ y: 400, animated: true });
  });

  it('moves a SectionList through the responder underneath', () => {
    const scrollTo = jest.fn();
    expect(moveScrollTo({ getScrollResponder: () => ({ scrollTo }) }, 400)).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ y: 400, animated: true });
  });
});
