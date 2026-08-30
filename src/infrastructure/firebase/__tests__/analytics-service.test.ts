/**
 * Firebase Analytics wrapper tests — the native module is mocked so no native
 * code is touched. Verifies arguments are forwarded and errors are swallowed.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

jest.mock('@react-native-firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({ id: 'analytics' })),
  logEvent: jest.fn(async () => undefined),
  logScreenView: jest.fn(async () => undefined),
  setAnalyticsCollectionEnabled: jest.fn(async () => undefined),
}));

import { analyticsService } from '@infrastructure/firebase/analytics-service';
import {
  logEvent,
  logScreenView,
  setAnalyticsCollectionEnabled,
} from '@react-native-firebase/analytics';

const ANALYTICS = { id: 'analytics' };

describe('analytics-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setEnabled', () => {
    it('forwards the flag to Firebase', async () => {
      await analyticsService.setEnabled(true);
      expect(setAnalyticsCollectionEnabled).toHaveBeenCalledWith(ANALYTICS, true);
    });

    it('swallows errors from the native module', async () => {
      jest.mocked(setAnalyticsCollectionEnabled).mockRejectedValueOnce(new Error('no native module'));
      await expect(analyticsService.setEnabled(false)).resolves.not.toThrow();
    });
  });

  describe('logEvent', () => {
    it('forwards the event name and params', async () => {
      await analyticsService.logEvent('recipe_view', { recipeId: 'r1' });
      expect(logEvent).toHaveBeenCalledWith(ANALYTICS, 'recipe_view', { recipeId: 'r1' });
    });

    it('works without params', async () => {
      await analyticsService.logEvent('app_open');
      expect(logEvent).toHaveBeenCalledWith(ANALYTICS, 'app_open', undefined);
    });

    it('swallows errors', async () => {
      jest.mocked(logEvent).mockRejectedValueOnce(new Error('fail'));
      await expect(analyticsService.logEvent('x')).resolves.not.toThrow();
    });
  });

  describe('logScreen', () => {
    it('defaults screen_class to the screen name', async () => {
      await analyticsService.logScreen('Recipes');
      expect(logScreenView).toHaveBeenCalledWith(ANALYTICS, {
        screen_name: 'Recipes',
        screen_class: 'Recipes',
      });
    });

    it('uses an explicit screen class when provided', async () => {
      await analyticsService.logScreen('Detail', 'RecipeDetailScreen');
      expect(logScreenView).toHaveBeenCalledWith(ANALYTICS, {
        screen_name: 'Detail',
        screen_class: 'RecipeDetailScreen',
      });
    });
  });
});
