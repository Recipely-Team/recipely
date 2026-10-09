import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { RegexConstants, ValueConstants } from '@core/constants';
import { isString } from '@core/guards/type-guards';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * A recipe opened from a creator's Instagram DM (`/recipes/<id>?dm=<sendId>`):
 * reports the open once and remembers the arrival, so a save that follows —
 * even after signing in — counts for the creator's stats. Anything that is
 * not a UUID is ignored.
 */
export const useDmArrival = (recipeId: string): void => {
  const { dm } = useLocalSearchParams<{ dm?: string }>();
  const { dmArrivalStore } = useStores();
  const sendId = isString(dm) && RegexConstants.uuid.test(dm) ? dm : null;

  useEffect(() => {
    if (sendId !== null && recipeId.length > ValueConstants.zero) dmArrivalStore.getState().arrive(recipeId, sendId);
  }, [dmArrivalStore, recipeId, sendId]);
};
