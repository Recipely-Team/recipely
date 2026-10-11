/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

import { act } from 'react-test-renderer';
import { create } from 'zustand';
import { FridgeAvailability, type FridgeAvailabilityType } from '@application/fridge/fridge-availability';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { RoutePaths } from '@presentation/base/constants';
import { PromptModeCards } from '@presentation/app/create-recipe/items/prompt/prompt-mode-cards';

const storesWith = (availability: FridgeAvailabilityType): Partial<ApplicationStores> =>
  ({ fridgeStore: create(() => ({ availability, checkAvailability: async () => undefined })) }) as unknown as Partial<ApplicationStores>;

describe('PromptModeCards', () => {
  it('draws nothing while "Cook from my fridge" is off, so the AI screen is unchanged', () => {
    const { root } = renderComponent(<PromptModeCards />, storesWith(FridgeAvailability.Off));
    expect(root.findAll((node) => node.props.accessibilityRole === 'tab')).toHaveLength(0);
  });

  it('opens the fridge flow from its card when the flag is on', () => {
    const { root } = renderComponent(<PromptModeCards />, storesWith(FridgeAvailability.On));
    const tabs = root.findAll((node) => node.props.accessibilityRole === 'tab' && typeof node.props.onPress === 'function');
    const fridge = tabs.find((node) => node.props.disabled === false);
    act(() => (fridge?.props as { onPress: () => void }).onPress());
    expect(mockPush).toHaveBeenCalledWith(RoutePaths.fridge);
  });
});
