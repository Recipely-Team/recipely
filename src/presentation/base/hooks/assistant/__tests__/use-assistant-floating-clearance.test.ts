import { usePathname } from 'expo-router';
import { useAssistantFloatingClearance } from '@presentation/base/hooks/assistant/use-assistant-floating-clearance';
import { RoutePaths } from '@presentation/base/constants';

jest.mock('expo-router', () => ({ usePathname: jest.fn() }));

const useAt = (path: string): number => {
  jest.mocked(usePathname).mockReturnValue(path);
  // The hook's only hook is the mocked usePathname, so it can be called directly.
  return useAssistantFloatingClearance();
};

describe('useAssistantFloatingClearance', () => {
  it('lifts the assistant off the automation editor so it does not cover Next', () => {
    expect(useAt(RoutePaths.automationEdit)).toBeGreaterThan(0);
  });

  it('leaves an ordinary screen alone', () => {
    expect(useAt(RoutePaths.automations)).toBe(0);
  });
});
