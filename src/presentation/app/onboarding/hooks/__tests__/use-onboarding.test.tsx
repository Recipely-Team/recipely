/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
const mockDismiss = jest.fn(async () => undefined);
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));
jest.mock('@application/onboarding/onboarding-store', () => ({ onboardingStore: { getState: () => ({ dismiss: mockDismiss }) } }));
jest.mock('@presentation/navigation/enter-app', () => ({ enterApp: jest.fn() }));

import { act } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useOnboarding } from '@presentation/app/onboarding/hooks/use-onboarding';
import type { UseOnboardingResult } from '@presentation/app/onboarding/model/use-onboarding-result';

const probe = (): UseOnboardingResult => {
  const box: { value: UseOnboardingResult | null } = { value: null };
  const Probe = (): null => {
    box.value = useOnboarding();
    return null;
  };
  renderComponent(<Probe />);
  if (box.value === null) throw new Error('not rendered');
  return box.value;
};

describe('useOnboarding', () => {
  beforeEach(() => jest.clearAllMocks());

  // --- regression: the welcome carousel came back on every cold launch for a guest who had tapped "Explore".
  it('records the dismissal when a guest chooses to explore', () => {
    const vm = probe();
    act(() => vm.onExplore());
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not dismiss when the guest goes to sign up instead', () => {
    const vm = probe();
    act(() => vm.onSignUp());
    expect(mockDismiss).not.toHaveBeenCalled();
  });
});
