import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useGoBackOrHome } from '@presentation/base/hooks/navigation/use-go-back-or-home';

const mockRouter = { canGoBack: jest.fn(), back: jest.fn(), replace: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const pressBack = (fallback?: string): void => {
  let goBack: () => void = () => undefined;
  const Default = (): null => {
    goBack = useGoBackOrHome();
    return null;
  };
  const WithFallback = ({ to }: { to: string }): null => {
    goBack = useGoBackOrHome(to);
    return null;
  };
  renderComponent(fallback === undefined ? <Default /> : <WithFallback to={fallback} />);
  act(() => goBack());
};

/**
 * Reported as: "back does nothing on a recipe I opened from a link." A page
 * opened cold is the whole stack, so a bare `router.back()` dead-ended on iOS
 * and the web and closed the app on Android.
 */
describe('useGoBackOrHome', () => {
  beforeEach(() => jest.clearAllMocks());

  it('goes back when there is somewhere to go', () => {
    mockRouter.canGoBack.mockReturnValue(true);
    pressBack();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('lands on the feed when the page was opened cold', () => {
    mockRouter.canGoBack.mockReturnValue(false);
    pressBack();
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/recipes');
  });

  it("lands on the screen's own fallback when it names one", () => {
    mockRouter.canGoBack.mockReturnValue(false);
    pressBack('/profile');
    expect(mockRouter.replace).toHaveBeenCalledWith('/profile');
  });
});
