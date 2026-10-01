import type { LayoutChangeEvent } from 'react-native';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useSectionScroll } from '@presentation/app/edit-profile/hooks/use-section-scroll';

let mockSection: string | undefined;
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ section: mockSection }) }));

const layoutAt = (y: number): LayoutChangeEvent => ({ nativeEvent: { layout: { x: 0, y, width: 0, height: 0 } } }) as LayoutChangeEvent;

/** Mounts the hook against a fake scroll view, returning its callbacks and the scroll spy. */
const drive = () => {
  const scrollTo = jest.fn();
  const assistantRef = jest.fn();
  let latest!: ReturnType<typeof useSectionScroll>;
  const Probe = (): null => {
    latest = useSectionScroll(assistantRef);
    return null;
  };
  renderComponent(<Probe />);
  latest.ref({ scrollTo });
  return { latest, scrollTo, assistantRef };
};

describe('useSectionScroll', () => {
  it('scrolls once to the creator section when opened with ?section=creator', () => {
    mockSection = 'creator';
    const { latest, scrollTo, assistantRef } = drive();

    latest.onCreatorSectionLayout(layoutAt(420));
    latest.onCreatorSectionLayout(layoutAt(500));

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ y: 420, animated: true });
    expect(assistantRef).toHaveBeenCalled();
  });

  it('stays put without the section param', () => {
    mockSection = undefined;
    const { latest, scrollTo } = drive();

    latest.onCreatorSectionLayout(layoutAt(420));

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
